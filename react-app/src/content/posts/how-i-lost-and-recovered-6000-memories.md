---
title: How I lost and recovered 6,000 memories
excerpt: I accidentally overwrote my production Neotoma database and dropped from 6,174 observations to 84. I got nearly all of it back. The recovery worked because Neotoma's architecture stores observations as an append-only log and recomputes entity state from that log.
published: true
published_date: "2026-03-17"
hero_image: how-i-lost-and-recovered-6000-memories-hero.png
hero_image_style: keep-proportions
---
Last week I wiped my production database. My working [Neotoma](https://neotoma.io) instance went from 6,174 observations and 3,862 entities to 84 observations and 67 entities in one command. Months of contacts, tasks, conversations, feedback notes, transactions, and standing rules: gone.

I got it back. The final database has 6,296 observations and 3,951 entities spanning five weeks of activity. The recovery took about an hour. This post is about how it happened, why recovery was possible, and what the experience revealed about building a memory system you can actually trust.

## What happened

I was working on the Neotoma CLI, testing a development workflow. I ran a sequence of commands that reset the database state and reinitialized it. The intent was to clear test data from a dev environment. The target was the production database.

The mistake was mundane. I ran `neotoma reset` while `NEOTOMA_ENV` was set to production. I thought I was targeting dev. By the time I noticed, the active database had 84 fresh observations from the reinitialization process and nothing else.

## Finding the backups

The first thing I did was search for every Neotoma SQLite file on my machine. I found ten copies scattered across backup directories, data folders, and timestamped recovery artifacts from a previous close call in early March.

| Source file | Observations | Entities | Latest activity |
|---|---|---|---|
| `neotoma.prod.db.db` | 6,174 | 3,862 | Mar 9 |
| `neotoma.prod 2.db` | 4,406 | 3,073 | Mar 10 |
| Live target (post-wipe) | 84 | 67 | Mar 11 |
| `neotoma.prod.db.recovered-*` | 4,381 | 3,059 | Mar 3 |
| `data-backups/data copy/` | 4,158 | 2,955 | Mar 2 |
| Various older copies | 3,100 to 3,931 | 2,558 to 2,806 | Feb 17 to Feb 27 |

The backup copies existed because I had been manually copying the database file at irregular intervals. Not a formal backup system, just occasional `cp` commands when I remembered or felt nervous. One of those copies, `neotoma.prod.db.db`, held nearly everything up through March 9. A second copy, `neotoma.prod 2.db`, had data through March 10 that the first copy missed.

Between these two files and the surviving 84 observations in the live database, I had enough material to reconstruct the full timeline.

## How the merge worked

Neotoma has a built-in `merge-db` command for combining SQLite databases. The process:

1. Back up every file involved (both sources and the target) into a timestamped directory. No recovery attempt should risk the originals.
2. Stop the running Neotoma server to prevent concurrent writes.
3. Dry-run the merge to see what conflicts exist.
4. Execute the merge with `--mode keep-target`, which inserts rows from the source that the target is missing and preserves the target's version of any row both databases share.
5. Repeat for the second source.
6. Verify observation and entity counts.
7. Restart the server.

The primary merge brought 6,174 observations in from the largest backup. The secondary merge added roughly 100 more from the March 10 window. The final count: 6,296 observations, 3,951 entities, activity spanning February 9 through March 11.

After restart, I sampled entities through the Neotoma MCP to confirm everything was accessible. Contacts, tasks, conversations, feedback records: all present and correctly structured.

## Why this recovery was possible

The recovery worked because of three properties of Neotoma's architecture.

**Observations are the source of truth.** Neotoma does not store entities by overwriting a row when something changes. Every fact enters the system as an immutable observation: "Alice's email is alice@example.com, observed on March 3 from Gmail." Entity state is computed from the full set of observations. The observation log is append-only.

This means a database backup is a complete snapshot of every fact the system has ever seen, not just the latest state. When I merged the backup into the live database, I was not restoring "the last known state of each entity." I was replaying the full history.

**Entity snapshots are derived, not primary.** After merging observations, Neotoma recomputes entity snapshots from the observation log. The snapshot for each entity is deterministic: given the same observations, you always get the same entity state. This is why the merge command includes a snapshot recomputation step. Once the observations are in place, the entities rebuild themselves correctly.

**Primary-key merge with conflict detection.** The `merge-db` command walks every table, inserts rows that exist in the source but not the target, and handles conflicts by primary key. In `keep-target` mode, the target's version wins on any collision. The dry-run mode previews exactly what will be inserted and what will conflict before you commit. I ran dry-runs for both merges and reviewed the conflict reports before executing.

These three properties together make the database self-healing in a way that traditional row-level backups are not. You do not need to worry about which backup has "the right version" of an entity. You merge the observations, recompute, and the correct state falls out.

## What I learned

The experience reinforced a few things.

**Informal backups are better than no backups.** My habit of occasionally copying the database file saved months of work. But occasional manual copies are not a system. They leave gaps. If I had wiped the database on March 7 instead of March 11, I would have lost data from February 28 through March 7 because no copy covered that window completely. I am now setting up automated daily backups with Time Machine on my Mac.

**The env flag mistake is a classic.** Every system that operates across dev and prod environments carries this risk. The mitigation is confirmation prompts for destructive operations, color-coded terminal prompts, or separate credentials per environment. After this incident I added a forced confirmation to `neotoma reset` whenever it detects a production environment. The `-y` flag is ignored for prod. You see "Neotoma reset (PRODUCTION)" and a warning before anything happens.

**Event-sourced architecture pays off in recovery.** If Neotoma stored entities by overwriting rows in place, a database wipe would be a data loss event with no clean recovery path. Because observations are immutable and entity state is derived, recovery is a merge-and-recompute operation. The observation log is the ground truth. Everything else can be rebuilt from it.

**I tested the tools I was building.** I wrote the `merge-db` command months ago for a different use case: combining data from users running multiple Neotoma instances. I never expected to use it on my own production data. But because the tool existed and handled conflict resolution and snapshot recomputation, the recovery was mechanical rather than stressful.

## Your data should survive your mistakes

This incident exposed gaps that Neotoma should close so users never have to do what I did manually.

**Automatic snapshots.** Neotoma should snapshot the database on a schedule and before any destructive operation. A rotating set of timestamped copies, retained for 30 days. If you run a reset on prod by mistake, the pre-reset snapshot is right there. Recovery should not depend on whether you remembered to run `cp` that week.

**Anomaly detection.** A sudden drop from thousands of observations to near-zero is not normal. Neotoma could detect this pattern and confirm before committing. A simple heuristic, "this operation would remove more than 90% of observations, confirm?" would have prevented my wipe entirely.

**Agent-driven recovery.** Since agents are the primary UX for Neotoma, recovery should work through agents too. You tell your agent "my database looks wrong, I think I lost data." The agent checks observation counts, finds available snapshots, compares date ranges, and walks you through the merge via the MCP. No CLI spelunking required.

**Remote sync.** Local backups protect against accidental overwrites but not disk failure. Neotoma should support syncing the observation log to a remote location: a cloud bucket, a second machine, or a self-hosted server. Because observations are append-only, the sync model is simple. Ship new observations to the remote. Reconstruct entity state on either end.

The same architecture that made this recovery possible makes these features straightforward to build. Append-only observations, derived state, and deterministic recomputation are not just recovery properties. They are the foundation for backup, sync, and self-healing as first-class guarantees.

## The numbers

| Metric | Before wipe | After wipe | After recovery |
|---|---|---|---|
| Observations | 6,174 | 84 | 6,296 |
| Entities | 3,862 | 67 | 3,951 |
| Date range | Feb 9 to Mar 9 | Mar 10 to Mar 11 | Feb 9 to Mar 11 |

The final count is higher than the pre-wipe count because the merge combined observations from all three sources: the two backup files and the surviving post-wipe data. Some observations that existed only in the March 10 backup or only in the live database were not in the original largest backup.

If your memory system uses mutable state, a wipe is permanent. If it uses an append-only observation log with derived entity state, a wipe is a merge away from full recovery. That difference matters when the data is your contacts, your commitments, your history with agents across hundreds of sessions.

Neotoma is [open source on GitHub](https://github.com/neotoma-app/neotoma). If you want a memory layer where your data can survive your worst mistakes, [try it](https://neotoma.io/install).
