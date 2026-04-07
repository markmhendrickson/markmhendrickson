# GBrain: Adding observation history to compiled_truth

A suggested schema addition to the [GBrain spec](https://gist.github.com/garrytan/49c88e83cf8d7ae95e087426368809cb). The compiled truth + timeline architecture is the right split. This addresses one gap: compiled_truth has no version history when agents rewrite it.

## The problem

The GBrain ingest skill says: *"State section gets REWRITTEN, not appended to."*

The timeline is append-only (good — the evidence survives). But compiled_truth is a destructive overwrite. When an agent rewrites a page and gets the merge wrong — drops a nuance, confuses two people, merges stale data over fresh — the previous compiled_truth is gone. No diff. No undo. No way to know what changed.

With 7,471 pages and AI agents doing the rewriting, this will happen. Not as an edge case, but as a regular failure mode. I ran a similar architecture and [wiped my production knowledge base](https://markmhendrickson.com/posts/how-i-lost-and-recovered-6000-memories) — 6,174 observations, one wrong command. Recovery was possible because observations were append-only and entity state was derived. If compiled_truth itself had been the source of truth, that data would have been permanently lost.

## Option A: Version history (minimal change)

Add one table. Snapshot compiled_truth before every rewrite. Preserves the existing architecture entirely.

```sql
-- ============================================================
-- page_versions: compiled_truth history
-- ============================================================
CREATE TABLE page_versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id     INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  compiled_truth TEXT NOT NULL,     -- the previous compiled_truth content
  changed_by  TEXT    NOT NULL DEFAULT '',  -- "ingest/meeting-123", "enrich/crustdata", "manual"
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_page_versions_page ON page_versions(page_id);
CREATE INDEX idx_page_versions_date ON page_versions(created_at);
```

### Modified ingest step (one line added)

The existing `brain_put` tool gets a pre-write hook:

```
Before overwriting compiled_truth:
  1. INSERT current compiled_truth into page_versions  ← new
  2. UPDATE pages SET compiled_truth = <new>, updated_at = now()
```

### What this gives you

- `gbrain diff <slug>` — compare current compiled_truth against any previous version
- `gbrain rollback <slug> [--version N]` — restore a previous compiled_truth
- `gbrain history <slug>` — list all versions with timestamps and what triggered the change
- Audit trail for the maintain skill: the contradiction checker can compare the current page against its previous version, not just against other pages
- Disaster recovery: if an agent corrupts a page, the previous version is one query away

### What it costs

Minimal. Each version is one TEXT row. At 7,471 pages with an average of 5 rewrites each, that's ~37K rows of text. A few hundred MB at most for the full history. SQLite handles this without blinking.

## Option B: Observation log (structural change)

Instead of versioning the output, version the inputs. Every fact the agent would write into compiled_truth first enters as an immutable observation. Compiled_truth becomes a derived view, recomputed from observations.

```sql
-- ============================================================
-- page_observations: append-only fact log
-- ============================================================
CREATE TABLE page_observations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id     INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  field       TEXT    NOT NULL,     -- "title", "location", "role", "assessment", etc.
  value       TEXT    NOT NULL,     -- the observed fact
  source      TEXT    NOT NULL,     -- "meeting/2026-04-05", "crustdata", "manual"
  observed_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  supersedes  INTEGER REFERENCES page_observations(id)  -- optional: which observation this corrects
);

CREATE INDEX idx_observations_page ON page_observations(page_id);
CREATE INDEX idx_observations_field ON page_observations(page_id, field);
CREATE INDEX idx_observations_date ON page_observations(observed_at);
```

### Modified ingest flow

```
Current:
  1. gbrain get <slug>
  2. Rewrite compiled_truth with new info
  3. gbrain put <slug>

Proposed:
  1. gbrain get <slug>
  2. For each new fact: gbrain observe <slug> --field "role" --value "CEO of Brex" --source "meeting/123"
  3. gbrain recompute <slug>  (derives compiled_truth from all observations)
```

### What this gives you (beyond Option A)

- **Provenance**: every fact in compiled_truth traces to a specific source. "Where did we record that Pedro left Brex?" → observation from meeting/456 on 2026-03-15.
- **Conflict resolution**: two observations say different things about the same field → surface the conflict instead of silently picking one.
- **Self-healing recovery**: merge observations from backups, recompute, and the correct entity state falls out deterministically. No need to figure out which backup has "the right version."
- **Cross-page consistency**: the maintain skill can check whether observations across linked pages agree, not just whether compiled_truth sections agree.

### What it costs

More architectural change. The agent can't just rewrite a markdown blob — it needs to decompose facts into observations first. The `recompute` step needs a reducer that assembles compiled_truth from the observation set (latest observation per field wins, with conflict detection). This is more work upfront but pays back every time something goes wrong.

## Recommendation

**Ship Option A on day one.** It's one table, one pre-write hook, and it gives you undo and audit trail with zero changes to the existing ingest workflow. The agent still rewrites compiled_truth the same way — you just snapshot the previous version first.

**Consider Option B for v2**, especially if you find agents making mistakes that are hard to diagnose. The observation log makes the system self-healing: the evidence survives independently of the compiled view, and entity state can always be rebuilt from the raw facts.

Both options preserve the compiled truth + timeline split. The timeline stays append-only. The compiled_truth stays the intelligence assessment. The only change is that rewrites leave a trail.
