# Social share material: releases v0.4.0 → v0.4.5 (post-eleven-releases update)

Source: https://markmhendrickson.com/posts/eleven-releases-in-five-weeks/ (prior post, closes at v0.4.0)
Release range covered: v0.4.1 (Apr 9) + v0.4.2 (Apr 10) + v0.4.3 (Apr 15) + v0.4.5 (Apr 17) — v0.4.4 skipped in the public release train
Generated: 2026-04-17

## Prior-work audit (abbreviated)

- **Recent shipped (2026-04-17 X, @markymark):** The markdown-memory-ceiling convergence-opener thread shipped today. It names @ManusAI / @claudeai / @OpenClaw, uses the five-item failure list, and closes on "never supposed to be Postgres." This thread must not reuse that hook shape, that platform name list, or that close.
- **Recent shipped (2026-04-15 batch):** `neotoma-openclaw-plugin-share-material.md` led with "If you use @openclaw for anything beyond single-session chat…" and the symptom list (compaction, concurrent writes, Tuesday-task recognition). That hook is now audience-cooldown for OpenClaw-audience readers; this thread names v0.4.3 OpenClaw in one tweet without reusing the symptom list.
- **Cooldown vocabulary for this session:**
  - "silently overwritten" / "nothing gets silently overwritten" — on cooldown; rephrased as "writes that can't be stepped on."
  - "local maximum / larger one" — used in today's shipped markdown-ceiling thread; do not reuse in this thread's close. Tweet 6 closes on an integration-fit question instead.
  - "append-only observations" — use the concept, vary the phrasing. Used "write integrity" and "structured state" instead.
  - "Three AI agent platforms worth billions" — shipped today; do not reuse.
- **This thread's frontier:** Release-log narrative that picks up explicitly where the eleven-releases post ended (April 1, v0.4.0). No other piece has covered v0.4.1 → v0.4.5 as a range. The thesis is "the next stretch answered evaluator asks about onboarding and integration shape, plus shipped the architectural reframe" — an implication chain the prior post flagged but could not yet prove.

---

## Top pick: copy and post

### The thread — post as a chain

**Suggested timing:** Start Tweet 1 between 3–5 PM CEST (9–11 AM US Eastern) on a Tue / Wed / Thu. Post replies back-to-back within ~30 seconds of each other so the thread reads as one unit in the feed.

**Tweet 1/6 (hook):**

> The eleven-releases post ended April 1. I closed it saying the next stretch had to answer "why would someone switch from what they already built."
>
> Four releases later, here's what that answer looks like.

**Tweet 2/6 — v0.4.5, files-as-a-view:**

> v0.4.5 shipped a filesystem mirror. Files stopped being canonical and became a generated view of structured state — entities, relationships, timeline, schemas — regenerated on every write.
>
> `cat`, `grep`, `git diff` still work. Edits route through typed corrections.

**Tweet 3/6 — v0.4.5, onboarding surface:**

> Same release: `neotoma doctor` consolidates install/API/MCP diagnostics. `neotoma setup --tool cursor` replaces four setup commands with one. First-party hook packages for Cursor, Claude Code, Codex, OpenCode, and the Claude Agent SDK.
>
> Onboarding was the #1 evaluator ask.

**Tweet 4/6 — v0.4.3, OpenClaw + frontend narrow:**

> v0.4.3: OpenClaw plugin. Native integration via `openclaw.plugin.json`, not a sidecar. Schema validation, deterministic IDs, writes that can't be stepped on.
>
> The frontend narrowed to marketing-first in the same release. The in-repo app UI was never the product.

**Tweet 5/6 — v0.4.1 + v0.4.2 stability patches:**

> v0.4.1 + v0.4.2 were the stability patches. 4.1 added a SQLite recovery helper (integrity check → `.recover` → manual restore, never auto-swap) and pulled in `writ`, the Write Integrity benchmark. 4.2 fixed an MCP startup crash that was silently bricking fresh installs.

**Tweet 6/6 (close):**

> Four releases, 16 days. The eleven-releases post closed on "does it work for someone who isn't me." This stretch answered a different question: does the integration shape fit the way agents already work?
>
> Which piece of your agent's memory would you hand to structured state first?

**Reply to tweet 6 with link:**

> Full eleven-releases retrospective this thread picks up from:
>
> https://markmhendrickson.com/posts/eleven-releases-in-five-weeks

### Why this shape

- **Front-loads v0.4.5** because thread decay is steep and v0.4.5 carries both the architectural news (files-as-view) and the onboarding surface evaluators asked for.
- **Tweet 1 names the prior post without retelling it** and promises a payoff.
- **Tweet 6 ends with an open, personal-experience question.** Readers will name different memory surfaces (email triage, tasks, contacts, finance, code context) — the kind of question five readers give five different real answers to.
- **Link in reply, not in any main tweet body.**
- **Honors the 1-thread-per-week cap** from the skill; this is the week's thread allocation.

---

## Shareable units extracted

1. **Named release sequence** — v0.4.1, v0.4.2, v0.4.3, v0.4.5 (v0.4.4 skipped), April 9 → April 17 window. The eleven-releases post closed at v0.4.0.
2. **Architectural reframe** — files as canonical → files as a generated view of structured state (filesystem mirror regenerated on every write).
3. **Named CLI surfaces** — `neotoma doctor`, `neotoma setup --tool <tool>`, `neotoma hooks <status|install|uninstall>`, `neotoma mirror <enable|disable|rebuild|status>`.
4. **Named integration targets** — Cursor, Claude Code, Codex, OpenCode, Claude Agent SDK, ChatGPT (via MCP + OpenAPI actions), OpenClaw (v0.4.3 plugin).
5. **Named plugin surface** — `openclaw.plugin.json` for OpenClaw-native loading, TypeScript + Python client packages under `packages/`.
6. **Named benchmark** — `writ` submodule, Write Integrity benchmark for agent memory (added in v0.4.1).
7. **Concrete patch story** — v0.4.2 moved `tsconfig` to `NodeNext` to fix an MCP SDK import path; days of invisible breakage closed in one config change.
8. **Concrete recovery flow** — SQLite integrity check → `.recover` → manual restore. Never auto-swap the live DB.
9. **Concrete scope change** — frontend removed many previously bundled operational screens in v0.4.3, narrowed to marketing-first. The app UI was never the product.
10. **Insider phrase** — "writes that can't be stepped on" (fresh substitute for the on-cooldown "nothing gets silently overwritten").

---

## Scheduled drafts: standalone (non-thread) — reserves for week

### Draft A: Punchy take — files-as-a-view (no link, ~190 chars)

> `cat`, `grep`, `git diff` keep working. Edits route through typed corrections. Writes land in an observation log you can replay.
>
> You can have all three at once.

### Draft B: Conversation starter — onboarding friction (no link, ~260 chars)

> `neotoma doctor` was a feature I didn't want to ship. The right answer felt like "install should just work."
>
> Reality: agents need a diagnostic surface to read before acting, not after. One command that returns a JSON status is worth four that each return half an answer.
>
> What's the last install diagnostic your agent actually used?

**Self-reply with link:**

> Full retro on what changed between v0.4.0 and v0.4.5:
>
> https://markmhendrickson.com/posts/eleven-releases-in-five-weeks

### Draft C: Bookmark bait — what shipped in 16 days (~275 chars)

> v0.4.0 → v0.4.5 in 16 days:
>
> 1. Filesystem mirror (files as a view of structured state)
> 2. `neotoma doctor` / `setup` / `hooks` / `mirror`
> 3. OpenClaw native plugin
> 4. TS + Python client packages
> 5. Claude Agent SDK adapter
> 6. `writ` Write Integrity benchmark
> 7. MCP startup crash fixed
>
> Which one matters to you?

### Draft D: Link-in-reply — WRIT angle (~260 chars)

**Main:**

> If your agent memory layer claims write integrity, `writ` is the benchmark that makes the claim falsifiable. Concurrent writes, compaction, string-variant entity collisions, replayable audit trails. I pulled it in as a Neotoma submodule. The tests run against whatever you've built.

**Reply:**

> Release context and the rest of what shipped in April:
>
> https://markmhendrickson.com/posts/eleven-releases-in-five-weeks

### Draft E: Reactive QT seed — MCP stability

**Target accounts:** Anyone posting about an MCP server that won't start, install errors, or agent tools silently failing.

**Draft:**

> MCP startup failures are invisible to agents. They retry until the tool looks dead.
>
> We shipped v0.4.2 for exactly this — a missing SDK import path fixed in one tsconfig line. Fresh installs worked again. If your MCP server is "on" but the agent never reaches it, start there.

---

## LinkedIn variants

### LinkedIn L1: Insight post — release window (~1,150 characters)

In the eleven-releases post I wrote on April 1, I said the next stretch had to stop answering "does it work for someone who isn't me" and start answering "why would someone switch from what they already built."

Four releases later, here is what that looked like.

v0.4.5 shipped a filesystem mirror. Files stopped being canonical and became a generated view of structured state — entities, relationships, timeline, schemas — regenerated on every write. `cat`, `grep`, `git diff` still work. Edits route through typed corrections. `neotoma doctor` consolidates install / API / MCP diagnostics into one JSON-returning command. `neotoma setup --tool cursor` replaces four setup steps with one. First-party hook packages shipped for Cursor, Claude Code, Codex, OpenCode, and the Claude Agent SDK.

v0.4.3 added OpenClaw as a native plugin via openclaw.plugin.json, not a sidecar. The frontend narrowed to marketing-first in the same release because the in-repo app UI was never the product.

v0.4.1 and v0.4.2 were the stability patches: a SQLite recovery flow (integrity check, then `.recover`, then manual restore — never auto-swap), the `writ` Write Integrity benchmark pulled in as a submodule, and a one-line tsconfig fix for an MCP startup crash that was silently bricking fresh installs.

Evaluator feedback shaped the release order. Onboarding first, integration surface second, architectural reframe in the same window.

Which piece of your agent's memory would you hand to structured state first?

https://markmhendrickson.com/posts/eleven-releases-in-five-weeks

### LinkedIn L2: Lesson frame — the silent-failure story (~980 characters)

The most consequential fix between April 1 and April 17 was a single tsconfig line.

v0.4.2 moved `module` and `moduleResolution` to `NodeNext` because the packaged MCP SDK server import was failing on a path that no longer existed. Agents don't read error messages. They retry until the tool looks dead. Anyone installing Neotoma fresh was hitting a server that would not start.

One config line, days of invisible breakage closed in a patch.

That is the hidden failure mode in MCP: the agent does not surface it, the user does not see an error, and the server looks "on" from the process table. The only tell is that nothing works. Diagnostic tooling has to exist outside the agent loop.

v0.4.5 made that concrete with `neotoma doctor`, which returns a JSON status of install, API, MCP, hooks, CLI instructions, and permissions without asking the agent to improvise shell commands. The diagnostic surface is a product, not scaffolding.

https://markmhendrickson.com/posts/eleven-releases-in-five-weeks

---

## Bluesky

### Bluesky conversation starter (~285 chars)

> v0.4.5 of Neotoma shipped a filesystem mirror. Files stopped being the source of truth and became a generated view of structured state — regenerated on every write. `cat`, `grep`, `git diff` still work. Edits route through typed corrections.
>
> What's the read-workflow you'd miss first if you moved off MEMORY.md?

### Bluesky link post (~280 chars)

> Four Neotoma releases between April 1 and April 17. Onboarding (`neotoma doctor` / `setup` / `hooks`), OpenClaw plugin, `writ` Write Integrity benchmark, an MCP startup fix, and the filesystem mirror that makes files a view of structured state.
>
> https://markmhendrickson.com/posts/eleven-releases-in-five-weeks

---

## Reserves

- **Punchy take (reserve):** "A diagnostic surface is a product, not scaffolding. Agents don't read error messages." (use after a visible MCP failure thread)
- **Conversation starter (reserve):** "What's the last install diagnostic your agent actually used before acting? Not the one you wrote. The one it ran on its own." (use for an agent-ops audience)
- **Reactive QT seed — OpenClaw release:** If @openclaw posts about skills, memory, or compaction, QT with "Native plugin landed in Neotoma v0.4.3. Schema-validated writes, deterministic IDs, no sidecar. Plugs into the existing harness." Link in reply.
- **Reactive QT seed — agent benchmark:** If anyone posts a memory-layer benchmark or comparison, QT with "`writ` (Write Integrity benchmark) is what I've been running internally. Concurrent writes, compaction, string-variant collisions, replay audit. Submodule in Neotoma so the tests ship with the claim."

---

## Language audit notes

- **Cooldown substitutions this session:**
  - "silently overwritten" → "writes that can't be stepped on" (Tweet 4), "silently bricking" (Tweet 5, applied to install state, not writes — distinct domain, acceptable reuse of the adverb).
  - "local maximum / larger one" → intentionally omitted. Used in today's shipped markdown-ceiling thread; this close uses an integration-fit question instead.
  - "append-only observations" (as a standalone phrase) → "write integrity," "observation log you can replay," "Write Integrity benchmark." Concept preserved, phrasing rotated.
  - "three AI agent platforms worth billions" → not used; thread opens on a date-anchored release-log frame instead of the convergence data.
- **Fresh vocabulary introduced:** "filesystem mirror regenerated on every write," "integration shape," "diagnostic surface is a product, not scaffolding," "silently bricking fresh installs," "writes that can't be stepped on," "falsifiable claim" (in the WRIT reserve).
- **Repetition caught and rewritten:**
  - Tweet 4 initially read "Schema validation, deterministic IDs, no silent overwrites." Rewritten to "writes that can't be stepped on" to avoid the on-cooldown phrasing.
  - Tweet 6 initially closed on "Files as a view of structured state. Not Postgres. Not MEMORY.md." Rewritten to "Which piece of your agent's memory would you hand to structured state first?" because the earlier version restates the local-maximum thesis already shipped today.
  - Tweet 1 initially used "Here's the next chapter." Rewritten to "Four releases later, here's what that answer looks like." to avoid generic narrative framing and anchor on the release count.
- **Evidence discipline:** Every release tweet names the version and at least one concrete artifact (`openclaw.plugin.json`, `writ`, `NodeNext`, `neotoma doctor`, filesystem mirror scope). No claim sits on "research shows" or unnamed generalities.
- **Thread-arc check:** Hook → architectural news (Tweet 2) → onboarding surface (Tweet 3) → integration (Tweet 4) → stability patches (Tweet 5) → open question (Tweet 6). Each tweet advances; none restate. The close does not resolve the question.
