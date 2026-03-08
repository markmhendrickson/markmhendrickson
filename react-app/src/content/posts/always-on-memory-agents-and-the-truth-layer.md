A Google PM [open-sourced an Always-On Memory Agent](https://github.com/GoogleCloudPlatform/generative-ai/tree/main/gemini/agents/always-on-memory-agent) last week as part of the GCP generative-ai repo. It is a persistent memory system that runs 24/7 as a background process, ingesting files, consolidating on a timer, and answering queries. No vector database. No embeddings. Just an LLM that reads, thinks, and writes structured memory to SQLite.

The project validates something I have been building toward with [Neotoma](https://github.com/markmhendrickson/neotoma): persistent memory for agents is a real and growing need. But the two projects make opposite architectural choices. This post compares them.

## What the Always-On Memory Agent is

The project is a reference implementation built with Google ADK (Agent Development Kit) and Gemini 3.1 Flash-Lite. It runs as a lightweight background process with three specialist subagents: one for ingestion, one for consolidation, and one for query.

**Ingestion.** A file watcher monitors an inbox directory. Drop a file in and the agent picks it up. It also accepts input via HTTP POST. It handles text, images, audio, video, and PDF. The LLM extracts summaries, entities, topics, and importance scores.

**Consolidation.** On a timer, the consolidation agent reads all stored memories, finds connections and patterns across them, compresses related items, and writes new synthesized insights. This runs in the background without prompting.

**Query.** You ask a question. The query agent reads relevant memories and consolidated insights, synthesizes an answer, and returns it with citations to specific memory records.

Storage is SQLite. No vector database, no embedding index. The architecture bets that an LLM can handle retrieval directly over structured text records without needing similarity search.

## Where it excels

**Simplicity.** Clone the repo, set a Gemini API key, run it. File watcher, HTTP API, and a Streamlit dashboard. Minimal dependencies and no infrastructure to manage beyond the single process. For developers exploring agent memory with Gemini, it is the fastest path to a working demo.

**The "no vector DB" narrative.** Removing the vector database reduces operational and conceptual complexity. No embedding models to choose, no index to maintain, no retrieval tuning. For small-scale deployments this is a real simplification.

**Active consolidation.** The timer-based consolidation is the most distinctive part. Most memory systems are passive: store things, retrieve things. This one actively connects, compresses, and synthesizes. It finds patterns you did not ask about. That resonates with anyone who wants "memory that thinks" rather than memory that waits.

## Where the approaches diverge

The Always-On Memory Agent and Neotoma share a goal (persistent agent memory) but diverge on almost every design decision. The divergences are not incidental. They reflect different starting premises about what memory should optimize for.

**Automatic vs explicit ingestion.** The file watcher is automatic. Whatever lands in the inbox gets processed. There is no approval step, no schema-first validation, no user confirmation before the LLM extracts and stores. Neotoma takes the opposite approach: nothing enters the system unless an agent or user explicitly writes it through MCP. For personal notes, automatic ingestion is convenient. For anything with privacy or compliance requirements, explicit control is the safer default.

**LLM-driven vs deterministic extraction.** The Always-On Memory Agent uses the LLM for everything: extracting entities, assigning importance, generating summaries. Run the same extraction on the same file twice and the results may differ. Neotoma uses [schema-first deterministic extraction](/posts/truth-layer-agent-memory). Same input produces the same entities, the same canonical IDs, the same relationships. Optional LLM interpretation runs on top of that deterministic layer, not in place of it.

**Consolidation vs immutable truth.** The consolidation agent decides what to merge, what connections to draw, and what to compress. It mutates memory over time. Old memories get absorbed into new synthesized insights. Neotoma does not consolidate. It appends. Every observation is immutable. History is event-sourced. If you need to see what changed, when, and why, the full trail is there. Nothing is overwritten or compressed away.

**Single-platform vs cross-platform.** The project is built on Gemini and Google ADK. Memory lives in a local SQLite file accessible only through this specific agent stack. Neotoma exposes memory through MCP, which means the same entities are accessible from ChatGPT, Claude, Cursor, and any other MCP-compatible tool. One memory layer, multiple consumers.

**No provenance vs full lineage.** Memory records in the Always-On Memory Agent contain summaries and extracted entities but do not trace back to the specific file, line, or session that produced them. If a consolidated insight is wrong, there is no audit trail to follow. In Neotoma, every field on every entity traces to a source observation. You can audit any fact back to where it came from.

**Scale tradeoffs.** Without embeddings or a vector index, the system reads structured text records directly using the LLM. This works at small scale. As memory stores grow, the approach may not hold. Removing the vector DB does not remove retrieval design. It moves the complexity into the LLM context window. Neotoma uses structured queries over typed entities, which scale independently of LLM context limits.

## Substrate vs agent

The clearest distinction is role. The Always-On Memory Agent is an agent. It ingests automatically, consolidates on a schedule, and synthesizes answers. It has its own reasoning loop. It decides what to merge, what connections to draw, and when to compress.

Neotoma is not an agent. It is a substrate. It stores typed entities with canonical IDs. It maintains provenance. It answers deterministic queries. It does not decide anything on its own. No background ingestion. No automatic consolidation. No timer-based processing. Agents read from it and write to it through [MCP](/posts/agentic-search-and-the-truth-layer). The reasoning happens in the agent layer. The truth lives in the substrate.

This matters because of what happens when the agent is wrong. If the Always-On Memory Agent's consolidation produces a bad insight, that insight is now part of memory. There is no separate layer to verify against. The agent is the truth.

With a truth layer underneath, you can trace what the agent read, when it read it, and what it wrote back. If the new insight is wrong, you can revert. The consolidation agent's output is an observation on top of deterministic state, not a mutation of it.

A consolidation agent running on top of Neotoma via MCP is a valid pattern. The agent reads from the truth layer, finds connections, and writes new entities back. The difference is that the truth layer underneath maintains deterministic state, provenance, and rollback. The agent adds intelligence. The substrate maintains trust.

| Dimension | Always-On Memory Agent | Truth layer (Neotoma) |
|-----------|------------------------|------------------------|
| Role | Agent with reasoning loop | Substrate with no agent behavior |
| Ingestion | Automatic (file watcher, API) | Explicit only (MCP, CLI, upload) |
| Extraction | LLM-driven; probabilistic | Schema-first; deterministic |
| Consolidation | Timer-based LLM consolidation | None; immutable truth, event-sourced updates |
| Provenance | Basic (source/summary in records) | Full lineage; every field traces to source |
| Platform | Gemini/Google ADK only | Cross-platform via MCP (ChatGPT, Claude, Cursor) |
| Privacy | Not positioned as privacy-first | User-controlled; no provider access |
| Rollback | No; memory is mutated by consolidation | Yes; append-only, versioned, revertible |
| Scale model | LLM reads all records; bounded by context | Structured queries over typed entities |

## What this validates

The Always-On Memory Agent is a reference implementation, not a product. It matters less as competition and more as confirmation. The demand for persistent, dynamic agent memory is real. "Vector DB plus RAG" is not the only retrieval model. The project signals that the industry is moving toward always-on memory systems that go beyond simple storage and retrieval.

Where the two projects agree: passive memory is not enough. Where they disagree: whether the memory layer itself should reason, or whether reasoning should happen in a separate layer on top of deterministic state. That is the core question in agent memory architecture right now. The market will likely support both approaches. I expect the architecture converges on consolidation agents that think, running on top of truth layers you can trust.

## What I'm building

I'm building [Neotoma](https://github.com/markmhendrickson/neotoma) as the trust layer. Typed entities, canonical IDs, deterministic merge, provenance, cross-platform access via MCP. I use it daily across ChatGPT, Claude, and Cursor. The [developer release](/posts/neotoma-developer-release) is available now at [neotoma.io](https://neotoma.io).

Google's sample shows that the industry is converging on persistent agent memory. The open question is not whether agents will remember, but how. Capability or governance. Agent or substrate. Probabilistic consolidation or deterministic truth. I am betting on the latter.
