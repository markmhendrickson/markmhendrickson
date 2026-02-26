For local and open agent memory, retrieval is the default: RAG pipelines, agentic search, embedding stores, and graph traversal are what most builders reach for first. A [2026 survey](https://arxiv.org/abs/2602.19320) concludes that memory design, not model capability, is now the limiting factor for long-lived agents.

Retrieval works well for coding and exploration, but it breaks when agents handle ongoing state. The major projects ([Zep](https://www.getzep.com/), [Mem0](https://mem0.ai/), [Letta](https://www.letta.com/), [LangMem](https://langchain-ai.github.io/langmem/)) are adding entity resolution, persistence, and graph structure, but full convergence onto a structured design faces barriers that are hard to retrofit: schema-first queries, deterministic identity, append-only provenance, and local-first control.

## Why retrieval dominates

Retrieval fits the use case that put agents on the map: coding. Codebases are exploratory, you often don't know where things live, and you want "where do we handle X?" rather than "list every function with provenance." Semantic search and ad hoc traversal are well suited to that.

Most people form their intuition about agent memory from coding, where retrieval is enough. The trouble is generalizing from that. For operational state like tasks, contacts, transactions, and commitments, you need the same answer next week, full sets, and audit trails.

Retrieval is also cheap to add. You can embed your docs, wire up a vector store, and have working memory in an afternoon, with no schema design, no entity resolution, and no provenance tracking. That is a real advantage, not just inertia.

## Where retrieval breaks

The breaks show up when you depend on agent memory for truth.

**Inconsistent answers.** Asking "list all tasks for project X" returns seven results one day and four the next. Retrieval re-infers each time. [Research confirms](https://arxiv.org/abs/2512.12818) that agents conflate information across sessions and produce temporally inconsistent answers as memory grows.

**Incomplete recall.** RAG systems with retrieval recall below 80% show [hallucination rates of 34%, compared to 20% for systems above 90% recall](https://www.ijmsrt.com/storages/download-paper/IJMSRT25SEP018). Embedding-based retrieval discards temporal and relational structure, and the more entities you have, the worse recall gets.

**No provenance.** When you ask "where did this number come from?" retrieval gives you an inferred answer from whatever chunks surfaced. There is no lineage from the answer back to source records.

**Unrecoverable writes.** When an agent overwrites a contact or merges tasks, the previous state is gone. There is no versioning and no rollback.

**Cross-tool drift.** A task created in ChatGPT can't reliably be queried in Cursor. Provider memory is [unpredictably inconsistent](https://www.datastudios.org/post/can-chatgpt-remember-previous-conversations-memory-behavior-session-limits-and-persistence), and open retrieval setups aren't cross-tool by default either.

## What structured state provides

Structured state means a store with typed entities, stable IDs, relationships, and timelines. The same query returns the same result every time, and you get provenance and rollback.

| Need | Structured store | Retrieval |
|------|------------------|-----------|
| Complete set ("all tasks in project X") | Yes, by schema and relationships | Partial or inferred |
| Same answer next week | Yes | No |
| Trace to source | Yes, provenance chain | No |
| Recover from bad write | Yes, if append-only | Usually no |
| Cross-tool consistency | Yes, if cross-platform | Only if all tools share the same backend |
| Explore the unknown | Possible but not its strength | Yes, this is where retrieval excels |
| One-off summarization | Overkill | Yes |

A structured store can be graph-shaped, and the one I'm building, [Neotoma](https://neotoma.io), is: a local, MCP-compatible memory layer that gives agents a single source of truth for entities, relationships, and lineage. What separates it from the "graph setups" common in retrieval is persistence, canonical IDs, and provenance. I've written more about [why agent memory needs a truth layer](/posts/truth-layer-agent-memory) elsewhere.

## Where the field is moving

The major projects are converging toward structured state from the retrieval side.

**[Zep](https://www.getzep.com/)/[Graphiti](https://www.getzep.com/)** builds a [temporal knowledge graph](https://arxiv.org/abs/2501.13956) that achieves an 18.5% accuracy gain over MemGPT and a 90% latency reduction, and ships an MCP server. It is the closest to structured state in the current ecosystem.

**Mem0** uses a [two-phase extraction and consolidation pipeline](https://mem0.ai/research) that reports 26% higher accuracy than OpenAI's memory, with a graph variant for entity relationships. It is still primarily retrieval-first, and the structured layer is additive.

**[Letta](https://www.letta.com/)** (formerly [MemGPT](https://docs.letta.com/guides/legacy/memgpt-agents-legacy)) [persists all state in a database](https://docs.letta.com/guides/agents/context-engineering) with editable memory blocks. It is the most explicitly "structured state" of the retrieval-origin projects.

**[LangMem](https://langchain-ai.github.io/langmem/)/[LangGraph](https://langchain-ai.github.io/langgraph/)** offers a [persistent memory SDK](https://blog.langchain.com/langmem-sdk-launch/) with semantic, episodic, and procedural types and memory consolidation. The persistence layer is real, but the primary access pattern is still embedding search.

**[Hindsight](https://arxiv.org/abs/2512.12818)** ([2025 research](https://arxiv.org/abs/2512.12818)) organizes memory into four logical networks and achieves 83-91% accuracy on long-horizon benchmarks. It shows the direction: structured memory with explicit entity networks outperforms flat retrieval.

## Can retrieval systems converge entirely?

Some things converge naturally, but others are structurally hard to retrofit.

**What is already converging.** Entity extraction and graph structure are real in Zep and [Mem0g](https://mem0.ai/). Database persistence is real in Letta and LangGraph. Temporal tracking is real in Graphiti. These are closing the gap.

**Similarity-first versus schema-first.** Retrieval's default access pattern is "find similar things." A structured store's default is "query by type, ID, relationship, or time." Making a retrieval system schema-first means changing the API surface and user expectations, not just adding a feature.

**Implicit versus explicit identity.** Retrieval treats two chunks as the same entity if their embeddings are close. Structured state treats two records as the same entity if they share a canonical ID. Retrofitting deterministic identity means changing every ingestion path.

**Upsert versus append-only.** Retrieval systems typically overwrite, while append-only storage preserves history. Letta uses mutable memory blocks, and Zep tracks temporal evolution, which is closer. Most retrieval systems have no concept of write history.

**Provenance through consolidation.** When Mem0 consolidates facts or LangMem merges related memories, provenance from the original sources is typically lost. Provenance that survives merging requires the storage model to support it from the start.

**Determinism.** Retrieval involves ranking, and results vary from run to run. Structured queries are deterministic: the same query returns the same result. Removing the ranking function undermines what makes retrieval useful. These are fundamentally different query contracts.

**Local-first control.** Making a system truly local, with no cloud dependency and no telemetry, conflicts with the business model of most memory companies. This is not a technical barrier; it is a structural incentive problem.

Retrieval systems can get partway to a structured store, but the last mile requires schema-first queries, deterministic identity, append-only provenance, deterministic results, and local-first defaults. Those choices run against the grain of retrieval-first architecture.

## What retrieval still does better

**Exploration.** When you want to find anything in your notes about the Barcelona apartment, you don't know the schema or entity type. Retrieval surfaces relevant bits without upfront modeling.

**Summarization.** When you ask what you decided with the contractor, retrieval can search, extract, and summarize in one session. You don't need that answer to persist or match exactly next time.

**Ad hoc traversal.** When you ask where Stripe webhooks are handled, layout varies across codebases and docs. Retrieval adapts without a unified graph.

**Low upfront cost.** You can have working memory in an afternoon. For anything that does not require completeness, consistency, or provenance, retrieval is sufficient and cheaper.

## Gaps in structured state and how Neotoma addresses them

**Schema overhead.** Neotoma uses an evolving schema registry where LLM-assisted extraction proposes types and relationships during ingestion. This lowers the upfront cost but does not eliminate it. In practice, the agent reviews and corrects extraction results over time as it encounters inconsistencies.

**Ingestion complexity.** Neotoma computes hash-based canonical IDs from identifying properties, so the same entity gets the same ID regardless of source. This is more predictable than embedding-based similarity, but it depends on extraction quality: "Mark" and "Mark Hendrickson" hash differently until you merge them.

**Cold start.** Neotoma supports dual-path ingestion: you can upload files for batch extraction or accumulate state incrementally through agent conversations. This is not instant, but it is faster than waiting for enough conversations to build a useful graph.

**Append-only cost.** Storage grows with every correction, which is what makes rollback and provenance possible. At personal and operational scale this is manageable, but it is a real tradeoff: queries to resolve current state are more complex.

**Not a replacement for retrieval.** Neotoma provides structural retrieval by type, ID, relationship, time range, and graph neighborhood, and expects retrieval tools like agentic search and embedding search to handle exploration. It is a complement, not a substitute.

## Why I'm building Neotoma

I hit retrieval limits in practice. Tasks, contacts, and transactions need canonical IDs, lineage, and cross-tool access. The design choices respond directly to the convergence barriers described above.

**Schema-first.** Queries are by entity type, ID, relationship, or time range. There is no embedding similarity in the query path, and results are deterministic.

**Hash-based identity.** The same entity gets the same ID regardless of which source or session introduced it.

**Append-only.** Every fact traces to its source. Corrections create new records, and rollback is possible.

**Cross-tool via MCP.** One memory layer is accessible from any MCP client: Cursor, ChatGPT, Claude, or Claude Code. The same data and the same IDs are available everywhere.

**Local-first.** All data lives in SQLite and local files. There is no cloud dependency and no telemetry. You can verify everything the system does.

[Neotoma](https://neotoma.io) is early. It is a [developer release](/posts/neotoma-developer-release): local-only, CLI-first, with heuristic entity resolution, manual schema evolution, and no web UI. What it provides is the contract, and the argument is that this contract is necessary for agents that handle ongoing state, and that retrieval alone cannot provide it.

The field is converging on structured memory. The question is who builds the layer you trust with your data and what guarantees it provides. I want that layer to be structured from the start, not bolted on after the fact. Local-first, open, inspectable, and under the user's control.
