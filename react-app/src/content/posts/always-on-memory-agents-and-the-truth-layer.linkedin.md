# LinkedIn share (draft)

Last week, Google PM Shubham Saboo open-sourced an "always-on memory agent" as part of the GCP generative-ai repo. VentureBeat covered it as a signal about where agent infrastructure is headed. No vector database. No embeddings. Just an LLM that reads files, consolidates memories on a timer, and answers queries against structured text records in SQLite.

It validates that need for persistent agent memory with more reliability than pure semantic search, something I have been building toward with Neotoma. But the two projects make opposite architectural choices on every axis.

Who decides what to store: the always-on agent uses specialist subagents that ingest automatically. Neotoma requires explicit writes through MCP from the client agent. Extraction: LLM-driven and probabilistic vs schema-first and deterministic. Consolidation: the agent mutates memory over time, absorbing old records into new synthesized insights. Neotoma appends immutably with full provenance. Platform: Gemini-only vs cross-platform via MCP (ChatGPT, Claude, Cursor). Rollback: not possible when consolidation has mutated the original records vs revertible because every observation is preserved.

The clearest distinction is role. The always-on memory agent is an agent with its own reasoning loop. Neotoma is a substrate. When the agent is wrong, having a deterministic layer underneath lets you trace what it read, when it read it, and revert what it wrote.

The strongest agentic architecture may contain both. A consolidation agent reading from and writing to a stateful layer turns consolidation into a non-destructive operation. Agents that think, running on top of layers you can trust.

https://markmhendrickson.com/posts/always-on-memory-agents-and-the-truth-layer
