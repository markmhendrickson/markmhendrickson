[Ethan Lipnik asked](https://x.com/EthanLipnik/status/2017468578438709723) why Codex and Claude don't use cloud-based embeddings like Cursor. [Boris Cherny (creator of Claude Code at Anthropic) replied](https://x.com/bcherny/status/2007179832300581177) that Claude Code moved from RAG plus local vector DB to agentic search. It works better, he said, and is simpler, with fewer issues around security and privacy. Other tools take a different path. Cursor, for example, uses cloud-based embeddings to index the codebase and search by semantic similarity.

So we have at least two retrieval paradigms: embedding-based search (pre-indexed, vector similarity) and agentic search (on-demand tool use). They are not the same. Each has different tradeoffs. Both are retrieval strategies. A truth layer is something else. It persists canonical entities, maintains provenance, and supports deterministic queries. It's about state, not retrieval. This post compares a truth layer to both retrieval models. It also ties in the limits I've hit when relying on retrieval alone.

## Where I've hit limits

I use Cursor as my central interface for all of my digital workflows, not just coding. Email triage, task management, finance queries, content planning, transactions, contacts. They all run through the same agent with access to the same repo. Agentic search across files often works well. The agent finds context, infers connections, and gets things done.

But I've hit limits. The agent infers; it doesn't guarantee. Here's what that looks like:

- **Large datasets, incomplete recall.** On-demand search misses things or truncates across thousands of transactions or hundreds of contacts. Retrieval re-derives each time. There's no structured store to query for complete results.
- **Irrecoverable overwrites.** An agent overwrites a contact or task and the previous state is gone. No rollback. Writes are in-place. There's no versioning or append-only trail to trace and roll back.
- **No cross-tool access.** I can't use the same records from Claude.ai or ChatGPT. Retrieval is provider-bound.
- **Non-reproducible answers.** Same question, different answer. I can't reproduce a result for verification or debugging. Retrieval is non-deterministic.
- **No traceability.** When the agent gives a wrong number or claim, I can't trace it back to source files or records. Retrieval has no provenance.
- **Unstable canonical identity.** The agent may treat "Acme Corp" and "ACME CORP" as the same in one session and different in the next. Retrieval re-infers each time. There are no persistent canonical IDs or merge rules.

## Two retrieval paradigms, one state paradigm

Embedding-based search and agentic search both get information to an agent. They are not the same. Embedding-based search (e.g. Cursor) pre-indexes a corpus and answers via vector similarity. The index can be cloud-hosted and updated. Agentic search (e.g. Claude Code) skips a persistent index and uses tools to search and read on demand. Different implementations, different tradeoffs: privacy, staleness, simplicity.

What they share is retrieval. The agent finds things at query time. A truth layer is not retrieval. It is persistent, structured state: canonical entities, provenance, deterministic queries.

We're comparing one state paradigm (truth layer) to two retrieval paradigms (embedding-based and agentic). The table below lines up all three. Where both retrieval columns share a limit (e.g. no provenance), that's a similarity between them relative to a truth layer. It's not an equation of the two.

| Domain | Embedding-based search | Agentic search | Truth layer |
|--------|------------------------|----------------|-------------|
| Document retrieval | Pre-indexed similarity, semantic match | On-demand search, inference | Entity resolution, dedup, provenance |
| Multi-source aggregation | Index scope and freshness depend on build | Live search across sources | Unified graph, deterministic merge |
| Entity lookup | Similarity over embeddings; no canonical ID | Per-session inference | Canonical IDs, rule-based merge |
| Timeline queries | Only if indexed; no native time model | On-demand assembly | Pre-computed, schema-driven |
| Provenance and audit | None | None | Immutable audit trail |
| Cross-platform | Tied to provider/index | Provider-specific tools | Same data across tools |

Both retrieval approaches optimize for convenience and flexibility. A truth layer optimizes for consistency and verifiability.

## What a truth layer provides

A structured memory layer is built around different primitives:

1. **Persistent canonical identity.** Stable entity IDs across sessions and tools.
2. **Deterministic merge logic.** Rule-based combination of observations, not per-session LLM inference.
3. **Provenance and audit.** Traceable lineage from source to answer.
4. **Idempotence.** Same inputs yield same outputs.
5. **Cross-platform truth.** Same memory across ChatGPT, Claude, Cursor.
6. **Clear privacy model.** User control, no provider training use, clear data boundaries.

These are not incremental improvements over agentic search. They are a different design. Best-effort retrieval and orchestration versus verifiable, replayable state. The choice depends on what you need.

## What retrieval can approximate (agentic or embedding-based)

Three examples show retrieval (agentic or embedding-based) approximating the capabilities above. In each example, the agent gets something that looks right for the moment. In each, the same limits show up: no persistent canonical identity, no provenance, no guarantee that "same query" yields "same result" across sessions or index rebuilds. The examples below use agentic terms (tools, on-demand search). Embedding-based retrieval can approximate the same behaviors via semantic search over an index and hits the same limits.

**Example 1: Session-scoped entity resolution.** The agent has tools to search files, email, and cloud. It has instructions to treat mentions of the same entity as one. You ask: "What's my total spend with Acme Corp?" The agent searches bank exports, receipts, invoices. It finds "Acme Corp", "ACME CORP", "Acme Corporation", infers same entity, sums amounts. That looks like entity resolution for this query and session. What goes wrong: ask again tomorrow and the number may differ. The agent may miss a file (truncated search, wrong path) and undercount. Or it may treat "Acme Corp" and "Acme Industries" as the same and overcount. No way to verify. No audit trail, no stable IDs. Different sessions may disagree.

**Example 2: On-demand timeline assembly.** The agent has broad file and date access. You ask: "What were my major expenses in Q3 2024?" The agent searches, parses dates, assembles a chronological list, filters by "major." You get a timeline-like answer without a dedicated timeline system. What goes wrong: "Major" is inferred each time. One session excludes a €500 item. The next includes it. Documents with non-standard date formats get dropped or misordered. The agent may truncate ("here are the top 10") when there were 15. Same query, different results, every time.

**Example 3: Hybrid memory layer.** A provider ships agentic search plus lightweight memory. The agent extracts structured snippets, stores them, and retrieves them later. It processes a receipt, stores `{vendor: "Acme Corp", amount: 150, date: "2024-07-15"}`. A later session retrieves this and merges with live search results. That looks like structured memory. What goes wrong: a later extraction overwrites the snippet. No versioning, no rollback. The same vendor appears as "Acme Corp" in stored memory and "ACME CORP" in a fresh search. Duplicates accumulate. The provider changes the feature or schema and your stored snippets vanish. No way to trace a wrong number back to its source.

In each example, the behavior approximates what a truth layer provides. The limits are inherent to retrieval. Whether the agent uses embedding search or agentic search, you still get session scope and inference-based merge. You still get no provenance and no cross-platform guarantee. A truth layer addresses those by persisting state instead of re-retrieving it.

## When retrieval excels (agentic or embedding-based)

**Exploratory discovery.** "Find anything in my downloads or notes about the Barcelona apartment." You don't know where it lives or what it's called. Agentic search across files, folders, and formats surfaces relevant snippets. No schema required. The agent infers and assembles.

**Rapid cross-source summarization.** "What did we decide in the last three emails with the contractor?" Search inbox, extract thread, summarize. One session, one answer. You don't need that summary to persist or match exactly next time.

**Ad hoc code and docs traversal.** "Where do we handle Stripe webhooks?" Search codebase, README, internal docs. Layout varies by repo. Agentic search adapts. No unified graph needed.

**Single-document or single-thread triage.** "Summarize this PDF" or "What's the ask in this email?" Context is bounded. Inference is sufficient. No entity resolution or cross-session state.

## When a truth layer excels

**Complete recall over large datasets.** "List every transaction with vendor X in the last two years." With thousands of rows, agentic search may miss records, truncate, or hallucinate aggregates. A truth layer queries a structured store. You get all matching records or a precise count.

**Cross-session consistency.** The agent creates a follow-up task in session one. You open a new session tomorrow. The task must be there, linked to the right contact and email. Agentic search has no persistent graph. A truth layer does.

**Audit and provenance.** "Where did this number come from?" Trace it to source records, import dates, and derivation rules. Agentic search returns inferred answers. A truth layer returns answers with lineage.

**Entity resolution at scale.** Hundreds of contacts, some duplicates (name variations, merged companies). Thousands of transactions referencing the same vendor under different spellings. A truth layer maintains canonical IDs and merge rules. Agentic search re-infers each session and may disagree.

**Deterministic replay.** Same query, same result, every time. Critical for reporting, compliance, or debugging. Agentic search is non-deterministic. A truth layer is idempotent.

**Recoverability from bad writes.** An agent overwrites a contact, merges two tasks into one, or "corrects" a transaction based on wrong inference. With agentic search and direct file writes, the previous state is gone. No undo. A truth layer uses append-only or versioned writes. You can trace what changed and roll back. Mutations are explicit operations, not silent overwrites.

## Why the distinction matters

Retrieval (embedding-based or agentic) is session-bound. It doesn't by itself give you persistent identity, provenance, or cross-session consistency. Its value is flexible, on-demand access. A truth layer's value is persistent, cross-session truth. Deterministic, auditable entity resolution is hard. Neither embedding similarity nor ad hoc agentic search is equivalent. Provider-hosted agents face incentives that conflict with user-controlled, privacy-first memory. Their memory and tools tend to be product-specific.

The Cherny tweet reflects a real shift. RAG plus vector DB was complex and had privacy implications. Agentic search simplified retrieval for Claude Code. Cursor and others take a different retrieval path (cloud embeddings). Both retrieval paradigms solve "how does the agent find things?" Neither solves "how do we get stable identity, provenance, and verification?" A truth layer targets the latter. Retrieval and state layers will coexist. They solve different problems.

## What I'm building

I'm building [Neotoma](https://github.com/markmhendrickson/neotoma), a structured memory layer that takes the truth layer approach: entity resolution, timelines, provenance, determinism, cross-platform via MCP. I'm dogfooding it in my own agentic stack to see where these primitives matter in practice. Embedding-based search and agentic search are two retrieval strategies. Neither gives you persistent identity or verifiable state. A truth layer does. I'm building the latter.
