---
title: "OpenClaw plugin for Neotoma gives your agent memory it can't corrupt"
excerpt: "OpenClaw stores memory in markdown files. Neotoma v0.4.3 plugs in natively as a structured state layer underneath, giving OpenClaw agents provenance, entity resolution, and versioned history without replacing the agent."
published: true
publishedDate: "2026-04-15"
category: "Agent Architecture"
tags: ["neotoma", "openclaw", "plugin", "agent memory", "state integrity", "build-in-public"]
read_time: 7
---

## The memory ceiling

If you run OpenClaw today, your agent stores memory in `MEMORY.md` and dated files in a `memory/` directory. That works for single-agent, single-session use. The moment you rely on that memory for anything ongoing, you hit a ceiling. The failure modes are specific and predictable.

**Memory compaction drops facts.** OpenClaw triggers a silent agent turn that writes "durable memories" before truncating context. What was in the file before compaction is unknown. If the compacted version dropped a fact, it is gone. There is no observation log. No rollback.

**No entity identity across sessions.** "Acme Corp" in one session and "ACME CORP" in the next may or may not resolve to the same entity. The agent re-infers each time from the context window. There are no stable IDs. No merge rules.

**Concurrent writes corrupt state.** If you run multiple agents or plugins that touch the same memory files, you get data corruption. OpenClaw's own documentation acknowledges this. The single-agent ceiling is real, and most agentic workflows will not stay single-agent forever.

**No audit trail.** When the agent gives a wrong answer, you cannot trace it back to a specific observation. You cannot see what changed between Tuesday and Thursday. You cannot answer "what did my agent know when it made that decision?"

These are not edge cases. They show up as soon as the agent handles contacts, tasks, transactions, or any state that matters across sessions.

## What the plugin adds

Install the plugin (`openclaw plugins install clawhub:neotoma`) and the Gateway picks it up automatically. [Neotoma v0.4.3](https://github.com/markmhendrickson/neotoma/releases/tag/v0.4.3) registers its tools alongside your existing skills and plugins. No config changes to the agent loop.

Each failure mode above gets a structural fix.

**Compaction no longer loses state.** Observations are append-only. The compacted summary can still serve the context window, but the source observations persist in Neotoma with full history. Nothing gets silently dropped.

**Entity identity is deterministic.** Hash-based canonical IDs resolve "Acme Corp" and "ACME CORP" to one entity by rule, not by per-session inference. Same contact, same ID, every time.

**Concurrent writes are safe.** Two agents writing about the same entity produce two observations in an append-only store, not a file conflict. Schema constraints validate every write before it enters the store.

**The audit trail is built in.** Every observation traces to its source. Corrections create new observations, not overwrites. You can reconstruct state at any point in time.

Beyond fixing the ceiling, the plugin exposes capabilities that `MEMORY.md` cannot support at all:

- **Structured retrieval.** "All tasks linked to this contact" or "every transaction with vendor X" is a query, not a file grep.
- **Timeline queries.** Date fields across entities produce timelines. "What happened last week" hits a temporal index, not a context-window search.
- **Schema validation.** Entity types are checked on write. Bad data gets rejected before it enters the store.

The agent loop does not change. OpenClaw still manages intent interpretation, browsing, form-filling, and skill execution. Neotoma handles state. The plugin sits between the agent's writes and persistent storage.

## The overhead question

Markdown files are free. They cost nothing to set up, nothing to maintain, and the KV-cache economics actively reward them.

Neotoma adds overhead. Schema validation on writes. Observation storage. Entity resolution. A local server process. These are not free. But the overhead is designed to stay invisible: the agent installs Neotoma, configures it, and writes to it without requiring you to learn a new tool or change how you work.

The question is whether the overhead is worth paying. If your agent never needs to answer "what did I know last Tuesday" or "which write corrupted this contact record," then no. `MEMORY.md` is the correct architecture.

If your agent manages ongoing state, contacts, tasks, transactions, and vendor relationships, and you need consistency across sessions, the write-path overhead is the cheapest part of the problem. The expensive part is debugging state corruption after the fact, when the audit trail does not exist.

## What this does not do

The plugin does not replace OpenClaw's agent loop. It does not change how skills work. It does not require migrating existing `MEMORY.md` content (though import is supported).

It does not solve every agent memory problem. Retrieval quality, prompt engineering, skill design, and model selection still matter. Neotoma handles the state layer: what entities exist, how they are linked, where they came from, and how they changed. Everything above that layer stays the same.

It also does not claim production stability. Neotoma is in [developer release](/posts/neotoma-developer-release). Breaking changes should be expected. The plugin exists to pressure-test whether structured state underneath a real agent platform works in practice, not to promise reliability today.

## Try it, break it

I have been running Neotoma as the memory layer in [my own agentic stack](/posts/what-my-agentic-stack-actually-does). Multiple agents writing to the same store: email triage, task management, finance, and content. On the go through OpenClaw, at my desktop through Cursor and CLI agents, all reading and writing the same ground truth. The multi-agent state problems described above are not hypothetical for me. They are what I hit every week.

The plugin makes this available to OpenClaw users. Install it. Enable it. Run your agent with structured state underneath. See where it helps. See where the overhead is not worth it. See where the design breaks.

The feedback loop matters more than the architecture. Real agents writing real observations through a structured layer is where the claims hold or fail.

## Evaluate and install

The fastest way to find out if Neotoma fits your OpenClaw workflow is to let your agent evaluate it for you. Paste this into your OpenClaw session:

```copy
Read https://neotoma.io/evaluate. Before you answer, inspect any broader tool, workspace, and configuration context you can access so you assess my real workflow rather than just this chat. Then tell me whether Neotoma is a real fit for my workflow, what data would be highest value to persist first, and what I should do next.
```

Your agent reads the page, checks your local context (tools, configs, memory files, and workspace), and tells you whether the problems described in this post apply to your setup. If they do, it walks you through installation, activation with your own data, and plugin configuration. If they do not, it tells you that too.

If you already want Neotoma and prefer to skip [the evaluation step](https://neotoma.io/evaluate), use the agent-assisted install from [neotoma.io/install](https://neotoma.io/install). Paste this into OpenClaw. Your agent reads the full install-first sequence on that page, installs only if needed, runs activation with your data, then configures your current tool for ongoing use, including the OpenClaw integration steps on that same page:

```copy
Read https://neotoma.io/install and carry me through the install-first Neotoma flow. Install, activate it with my data, and configure my current tool for robust ongoing use.
```

If you prefer manual commands: `openclaw plugins install clawhub:neotoma` adds the plugin directly from ClawHub. Or install the npm package globally with `npm install -g neotoma` then `neotoma init`, with optional pin to this release (`npm install -g neotoma@0.4.3`). Full options, MCP config, Docker, and reset behavior stay on [neotoma.io/install](https://neotoma.io/install).

Repo: [github.com/markmhendrickson/neotoma](https://github.com/markmhendrickson/neotoma). Release notes: [v0.4.3](https://github.com/markmhendrickson/neotoma/releases/tag/v0.4.3).

For the deeper architectural reasoning behind structured agent memory, see [OpenClaw and the truth layer](/posts/openclaw-and-the-truth-layer) and [The markdown memory ceiling](/posts/the-markdown-memory-ceiling).
