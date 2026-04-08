## Tweet

BEAM tests agent memory retrieval at 10M tokens. Hindsight scores 64%. RAG scores 25%. Real gap.

But state integrity breaks at 500K tokens. The two failure modes are orthogonal, and nobody benchmarks the earlier one.

https://markmhendrickson.com/posts/agent-memory-breaks-before-retrieval

## LinkedIn

The BEAM benchmark tests agent memory retrieval at 10 million tokens. At that scale, context-stuffing fails and real architecture is required. Hindsight scores 64.1%. RAG baseline scores 24.9%. The retrieval gap is real.

State integrity (trusting that stored facts are correct and versioned) degrades at 500K to 2M tokens. That is five to ten times earlier. Most builders I talk to are in that range already. Their agents have entity conflicts, cross-tool fragmentation, and corrections that silently disappear. Better retrieval does not fix that.

Hindsight and Neotoma converge on the same structural primitives (entities, graphs, temporal ordering, pre-computed summaries) but from opposite directions. One optimizes retrieval across massive history. The other ensures the facts are deterministic and auditable when found. They are complementary.

This is a companion piece to my earlier post on why no AI memory benchmark tests what actually breaks.

https://markmhendrickson.com/posts/agent-memory-breaks-before-retrieval
