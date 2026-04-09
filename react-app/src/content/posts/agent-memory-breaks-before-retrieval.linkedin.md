# LinkedIn share (draft)

A new AI memory benchmark (BEAM) tests retrieval at 500K to 10M tokens. At 10M, context-stuffing fails and real memory architecture wins by 2.5x over standard RAG.

Buried in the same paper: contradiction resolution scores near zero at every tier, including 100K tokens. The systems BEAM evaluated — structured retrieval architectures and vanilla RAG alike — all struggle to maintain consistent state when agents write conflicting values. The benchmark tests whether you can find the right fact. Not whether the fact survived the last write.

The people I talk to who build with agents are not operating at 10 million tokens. They are at 500K to 2M. A daily Claude Code session burns 50K to 200K tokens. A power user processes 300K to 2M per day. They hit the state integrity wall in days. They're running markdown CRMs and heartbeat files because no memory layer handles their pipeline without drift.

Retrieval and state integrity are two failure modes that activate at different scales. Better search at 10M does not fix a correction that drifted at 500K. Better state integrity at 500K does not help you find the right entity across 10M tokens of history.

At production scale, agents need both. A new benchmark proved the first problem. I started building the benchmark for the second: WRIT tests drift rate, detectability, temporal replay, and provenance. Open source, adapter interface for any memory system.

I'm using it to harden Neotoma's own guarantees via TDD. If the claims aren't quantifiable against a public benchmark, they're marketing.

Link: https://medium.com/@markymark/agent-memory-breaks-at-500k-tokens-not-10-million-9148883c2efc?postPublishedType=initial
Benchmark: https://github.com/markmhendrickson/writ
