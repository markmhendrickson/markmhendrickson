---
title: Neotoma is now available as developer release
excerpt: Structured agent memory you can inspect, replay, and trust. Open-source, local-first, available via npm for ChatGPT, Claude, and Cursor.
published: true
published_date: "2026-02-26"
---
The Neotoma is a structured memory layer for AI agents. It treats personal data the way production systems treat state: typed entities, stable IDs, full provenance, deterministic queries. This developer release is available now. Install via npm, connect your AI tools via MCP, and run it on your machine.

Docs and setup: [neotoma.io](https://neotoma.io). Repo: [github.com/markmhendrickson/neotoma](https://github.com/markmhendrickson/neotoma).

## The problem

I've spent the past year running workflows through AI agents: email, tasks, finance, contacts, content. The agents are capable. The problem is trust.

Memory changes implicitly. Context drifts. The agent gives a different answer to the same question in a new session. It overwrites a contact and the previous state is gone. I can't trace a wrong number back to its source. I can't use the same records from a different tool.

These aren't edge cases. They show up as soon as agents handle ongoing state: tasks, transactions, commitments, relationships. The more I delegate, the sharper the limits get.

The thing that keeps breaking is not intelligence. It's trust. I first wrote about this in [Building a truth layer for persistent agent memory](/posts/truth-layer-agent-memory).

## Where current memory falls short

Most agent memory today is retrieval: RAG, agentic search, embedding similarity, provider-controlled memory. Retrieval works for exploration and one-off questions. It falls apart for ongoing state.

[RAG fills with redundant results](/posts/why-agent-memory-needs-more-than-rag) when agent memory is a bounded, coherent stream. Top-k returns repetition instead of what you need. Pruning fragments evidence chains. Similarity ignores structure.

Provider memory (ChatGPT Memory, Claude Projects) is conversation-only and platform-bound. It's opaque, has no provenance or rollback, and doesn't work across tools. You can't query it deterministically or trace a fact to its source.

[Agentic search](/posts/agentic-search-and-the-truth-layer) re-infers each session. No persistent canonical identity, no guarantee the same question yields the same result. It works for coding and exploration. For tasks, contacts, transactions, and events, you need the same answer next week, full sets, and audit trails. Retrieval doesn't deliver that.

The [useful split](/posts/agent-memory-truth-problem) is retrieval versus structured state, not graph versus markdown. Retrieval optimizes for relevance and discovery. Structured state optimizes for consistency, completeness, and provenance. The major projects (Zep, Mem0, Letta, LangMem) are adding structure, but full convergence faces architectural barriers. When agents act on your behalf, you need the latter.

I've written separately about the [six structural trends](/posts/six-agentic-trends-betting-on) that make this gap wider over time: agents becoming stateful, errors becoming priced, platforms staying opaque, tools staying fragmented.

## What Neotoma is

Neotoma is a truth layer: the memory substrate that sits under your agents. Agents keep doing what they do (browsing, writing, calling tools). Neotoma owns the state they read and write.

You upload documents or share information in agent conversations. Neotoma resolves entities across sources. People, companies, tasks, invoices, events get stable IDs. Every fact traces to its origin. Timelines come from date fields. Corrections preserve history instead of overwriting it.

The graph is execution-agnostic. It models what exists, not how work gets done. The same data is available from Cursor, ChatGPT, Claude, or any MCP client. When you [switch tools](/posts/openclaw-and-the-truth-layer), the memory doesn't drift.

It's not a note-taking app or "second brain." Not provider-controlled memory. Not a vector store or RAG layer. Not an autonomous agent. It's schema-first structured state you control.

## What this release includes

This developer release exposes the core contract:

- **CLI** for humans.
- **MCP** for agents (ChatGPT, Claude, Cursor, Claude Code); agents use MCP as backup.
- **OpenAPI** as the single source of truth.

Concrete functionality:

- **Dual-path storing.** Upload files or write structured data from agent conversations into one graph.
- **Entity resolution.** Hash-based canonical IDs unify the same entity across all sources.
- **Schema registry.** Typed entities and typed relationships. Schemas evolve as data does.
- **Timelines.** Automatic timeline generation from date fields across entities.
- **Full provenance.** Every record traces to its source. Corrections create new observations, not overwrites.
- **Structural retrieval.** Query by entity type, ID, relationship, or time range. Graph neighborhood for cross-entity reasoning.

There is no web app. This is infrastructure, not a product. The interfaces are CLI, MCP, and API.

## Principles and why local-first

Three foundations shape the design:

**Privacy-first.** Your data stays on your machine. Local storage only: SQLite and local files. No cloud dependency. Never used for training. You control what goes in and what stays.

**Deterministic.** Same input, same output. Hash-based entity IDs. Schema-first extraction. No LLM in the critical path for storage or retrieval. Full provenance on every record.

**Cross-platform.** One memory layer across tools. ChatGPT, Claude, Cursor, and Claude Code connect via MCP. No provider lock-in. Switch tools and the memory stays the same.

This release is local-only by design. Trust starts with control. Before adding remote infrastructure, the contract and the guarantees need to be solid. Local-only means you can verify everything the system does. That's the right starting point for a layer that claims to be trustworthy.

## Who this is for

Developers and agent builders comfortable with CLI-first workflows. People building or operating agentic systems who need persistent memory across sessions and tools. Anyone who treats personal data like production infrastructure.

Not for (yet): UI-first users, casual note-taking, or anyone expecting stability guarantees today. Breaking changes should be expected. This release exists to pressure-test the foundations.

## Install and connect

```bash
npm install -g neotoma # install
neotoma init # initialize
neotoma # start interactive session
```

Full setup, API docs, MCP configuration, and schema reference: [neotoma.io](https://neotoma.io).

Repo: [github.com/markmhendrickson/neotoma](https://github.com/markmhendrickson/neotoma).

## Takeaways

- **Privacy-first.** Your data on your machine; local-only, no cloud, never used for training.
- **CLI, MCP, OpenAPI.** One contract for humans and agents.
- **Schema-first structured state.** Typed entities, full provenance, deterministic queries.

## Try it, break it, tell me

I'd like your help hardening this. Run it. Hit edge cases. Report bugs, confusing behavior, or missing pieces.

Feedback I value most: where the guarantees fail, where the contract gets in the way, where the design makes the wrong tradeoff. Open issues on GitHub, submit patches, or start a discussion.

This release is rough on purpose. Reliability comes from real usage and real feedback, not from polishing in isolation.
