---
title: 'From "it works on my machine" to eleven npm releases'
excerpt: I shipped eleven Neotoma releases in the first five weeks after the developer release. The CLI now works on other machines, unblocking onboarding. The MCP server is stable enough for daily agent use. The database can survive operator mistakes. Here is what changed and why.
published: true
published_date: "2026-04-01"
hero_image: eleven-releases-in-five-weeks-hero.png
hero_image_style: keep-proportions
---

I shipped eleven Neotoma releases between February 26 and April 1, 2026. The initial [developer release](/posts/neotoma-developer-release) was functional but rough. It worked on my machine, in my workflows, with my assumptions baked in. Five weeks of evaluator feedback, daily dogfooding, and real-world usage surfaced where it broke for everyone else.

The biggest category of improvements is CLI reliability, because the CLI is the first thing a new user touches and the first thing that can fail during onboarding.

The second is MCP stability, because the MCP server is what agents call hundreds of times a day and silent failures there corrupt workflows without warning.

The third is data integrity under real conditions. This post covers what changed in the npm package, not the site or docs.

The pace was one release every three to four days. Some releases fixed a single pagination bug. Others bundled weeks of hardening across the CLI, HTTP actions, and MCP runtime. The common thread is that each release addressed something that broke or confused a real person trying to use Neotoma for the first time.

## The CLI stopped assuming it was me

The developer release CLI worked from a source checkout on my machine. That was the only context I had tested. The first wave of feedback made clear that this was not enough.

The first fix was path resolution. When you install Neotoma globally via npm and run it from an arbitrary directory, the CLI needs to find its own resources without a source checkout present. v0.3.3 added fallback resolution from the installed package location. v0.3.8 shipped `openapi.yaml` inside the npm tarball so the spec file was always available, not just when you cloned the repo.

Environment detection came next. The CLI now distinguishes between running from a source checkout and running from a global npm install. Features that require source (like tunnel mode) are gated with clear error messages instead of cryptic failures. The terminology in CLI output changed too: "Neotoma path" for the configured runtime location, "source checkout" for dev workflows. The previous language used "repo" for both, which confused people who installed via npm and had no repo.

The init flow improved across several releases. v0.3.6 through v0.3.9 progressively tightened the first-run experience: better environment targeting, clearer startup UX, stronger config path handling. By v0.3.10, the CLI could detect its own install context and adjust behavior without the user having to tell it anything.

v0.3.11 was the largest single CLI release. It added flexible search (`neotoma entities search` with positional identifiers, `--identifier`, and `--query` as aliases), a preferred structured input path for store (`--entities` and `--file` alongside the existing `--json=`), and `storage merge-db` for combining SQLite databases with conflict resolution modes. v0.4.0 made argument handling more reliable across node, bun, and deno wrappers.

The net effect: the CLI went from "works on my machine" to "works on a fresh npm install in an arbitrary directory on someone else's machine." That gap was larger than I expected.

## MCP became safe for daily agent use

The MCP server is how agents interact with Neotoma. It needs to be reliable in ways that are different from a CLI. Agents do not read error messages. They retry, misinterpret, or silently drop context.

The first MCP fix was trivial but important. v0.3.8 moved schema registry informational logs off stdout. MCP uses stdio for structured communication between the agent and server. Logging to the same stream corrupted the protocol. Agents would get garbled responses or hang. Moving logs to stderr fixed a class of silent failures that were hard to diagnose.

v0.3.11 included broader MCP runtime updates alongside the HTTP action layer and entity query handling. The retrieval paths became more reliable for list versus identifier-style queries. Lexical search integration got regression coverage. The MCP server and the HTTP API now share more behavior, so agents and direct API consumers see consistent results.

v0.4.0 continued this work with improvements to timeline generation, observation projection, snapshot computation, and schema registry behavior. These are the internal mechanisms that determine what agents see when they query entity state. Getting them right means agents get consistent, correct answers across sessions.

## Pagination and entity filtering got honest

v0.3.4 fixed a specific bug that exposed a broader problem. When you queried entities by type (say, all tasks), deleted entities were included in the result count but filtered from the visible results. Pagination offsets used the unfiltered count. The result: pages with fewer items than expected, inconsistent totals, and agents that thought they had retrieved everything when they had not.

The fix was to paginate after filtering, not before. The total now reflects visible entities. This sounds minor but it matters for any agent workflow that pages through results, which is most of them once you have more than a few dozen entities of any type.

## Database merge became a real tool

I [wrote about losing and recovering 6,000 memories](/posts/how-i-lost-and-recovered-6000-memories) in March. That experience motivated shipping `storage merge-db` as a proper CLI command in v0.3.11.

The command merges two SQLite databases with explicit conflict handling. Three modes: `safe` (default, fails on any conflict), `keep-target` (target wins on collision), `keep-source` (source wins). Dry-run mode previews what would be inserted and what would conflict before you commit. After merging, the command recomputes entity snapshots from the observation log so derived state stays correct.

This is not just a recovery tool. It handles combining data from multiple Neotoma instances, migrating between machines, and merging dev and production databases. The observation-based architecture makes all of these operations safe because observations are immutable and entity state is deterministic given the same observation set.

## Multi-tool support expanded

The developer release supported Cursor, Claude, and ChatGPT via MCP. v0.3.11 added explicit ChatGPT integration documentation and shipped `openapi_actions.yaml`, an OpenAPI-shaped surface for Custom GPT and HTTP Actions workflows. This means ChatGPT can consume Neotoma not just through MCP but through the native actions interface that Custom GPTs use.

The OpenAPI contract itself was updated across v0.3.11 and v0.4.0 to reflect changes in the action layer. If you consume Neotoma programmatically via the API, these releases require rechecking any generated clients.

## Old extraction path removed

v0.4.0 removed the `llm_extraction` code path. This was a legacy approach that used language models in the storage pipeline. Neotoma's design principle is that no LLM sits in the critical path for storage or retrieval. Extraction happens at the agent layer, not inside Neotoma. Removing the old path aligns the codebase with that principle and simplifies the internals.

This is the kind of change that is invisible to users but matters for the project's direction. Neotoma is a truth layer, not an inference layer. The extraction path blurred that line. Now it does not.

## What the pace taught me

Shipping eleven releases in five weeks was not planned. Each release responded to something specific: a bug report, a confusing first-run experience, a workflow that broke in production, an architectural inconsistency I could not ignore.

The pattern that emerged was: daily use surfaces issues, evaluator feedback confirms priorities, and small releases fix them before they compound. The alternative, batching changes into large releases, would have left real users stuck on broken behavior for weeks.

The developer release was positioned as "rough on purpose." That was honest. What I underestimated was how many of the rough edges were specific to my own setup. Path resolution, environment detection, stdio safety, pagination consistency: none of these were problems for me because I ran from source, in my terminal, with my data. Every one of them was a problem for someone installing via npm for the first time.

The next phase is different. The first five weeks answered "does it work for someone who is not me." The next stretch answers "why would someone switch from what they already built."

At least ten people in my [evaluator group](/posts/customer-research-through-agents) are building their own agent memory. Markdown files, SQLite, JSON heartbeats, flat-file CRMs. Same problem, different implementations. Several of them named the exact triggers for when their solution would break: concurrent writes from multiple agents, provenance questions they cannot answer, scale past a few dozen active entities. Those triggers are my roadmap.

The concrete next goals come from what evaluators asked for, not from a feature wishlist.

- **Trivial onboarding with an immediate payoff.** The CLI works on other machines now, but "works" is not the same as "five minutes to value." One evaluator spent an hour reading docs before getting set up on a VM. That needs to be five minutes, and the first thing that happens after install should not be an empty database. The agent-driven onboarding should scan your local files, populate Neotoma with real records, and surface a timeline or insight you did not have before. The aha moment is not "it installed." The aha moment is "it already knows something useful about my data."
- **A clear coexistence story.** Multiple evaluators asked whether Neotoma should live alongside Claude's auto-memory or ChatGPT's built-in memory, or replace them. The answer is alongside, and the product needs to make that obvious.
- **Depth in domains where provenance is non-negotiable.** Healthcare, compliance, financial audit: evaluators in those spaces said the language already fits. The work is making the schemas and guarantees concrete for those verticals.

The deeper architectural work comes from my own daily use, not evaluator requests. Running Neotoma as my primary memory layer for months surfaced structural problems that no one on the outside would notice yet.

- **Bounded convergence.** Agents are stochastic. The same user message can produce different entity types, field names, and relationship structures depending on model mood. My instance has 170 entity types, and some of that variety is drift, not real ontology. The next releases add write-time normalization: alias mappings so `purchase` and `transaction` resolve to the same canonical type, fuzzy field matching so `amount` and `amount_eur` do not fork the schema, and retrieval-augmented storing so the system checks for duplicates before the agent creates them.
- **Schema governance.** Right now any agent can invent a new entity type on first store. That freedom is useful early but creates a cleanup problem at scale. The planned governance layer adds alias registration, deprecation lifecycles, and diagnostic warnings when a store drifts from the canonical schema. The system stays permissive on write but gives feedback in the response so agents self-correct.
- **Progressive enforcement.** Schemas today are inferred once and never tightened. The next step is confidence tracking: after enough observations of a type, the schema crystallizes and the system can warn on missing common fields, type mismatches, and broken relationship patterns. Not blocking stores, just surfacing what looks wrong. Strict mode becomes opt-in for high-stakes types like financial records where extraction variance matters.

Neotoma is [open source on GitHub](https://github.com/markmhendrickson/neotoma). If you tried the developer release and hit rough edges, many of them have been addressed in these releases. If you have not tried it yet, the best starting point is to [ask your agent to evaluate whether Neotoma fits your workflow](https://neotoma.io/evaluate). The agent reads the page, inspects your setup, and tells you honestly whether it is a fit before you install anything.
