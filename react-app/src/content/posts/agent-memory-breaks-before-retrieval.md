---
title: "Agent memory breaks at 500K tokens, not 10 million"
excerpt: "BEAM tests retrieval at 10 million tokens. State integrity degrades at 500K. The two failure modes activate at different scales, and nobody benchmarks the earlier one."
published: true
publishedDate: "2026-04-08"
---

Nicolò Boschi published a post in April 2026 arguing that [10 million tokens is the only memory benchmark that matters](https://medium.com/@nicoloboschi/why-10-million-tokens-is-the-only-memory-benchmark-that-matters-c8c9fb7553d4). His argument is specific. When context windows hit 1 million tokens, brute-force context-stuffing passed existing memory benchmarks without any retrieval pipeline. You just dump everything into the context window. The benchmarks were testing context window size, not memory architecture.

The [BEAM benchmark](https://arxiv.org/abs/2504.01076) fixes that. It tests at 500K to 10M tokens. At 10M, no production model has that context window. Context-stuffing cannot work. Real memory architecture is required.

Boschi's system, [Hindsight](https://vectorize.io), scores 64.1% at the 10M tier. Second place (Honcho) scores 40.6%. The standard RAG baseline scores 24.9%. The gap comes from multi-strategy retrieval: semantic search, keyword matching, graph traversal, and temporal filtering, merged through reciprocal rank fusion. Add pre-computed observations and entity resolution across millions of tokens and the compound effect is significant.

The retrieval results are real. At 10M tokens, you need architecture, not a bigger context window. BEAM proves it.

I wrote recently about [why no AI memory benchmark tests what actually breaks](/posts/no-ai-memory-benchmark-tests-what-actually-breaks): the industry benchmarks retrieval but not write integrity. BEAM is the best retrieval benchmark I have seen. It still only tests one of the two failure modes. It asks whether you can find the right fact. It does not ask whether the fact you found is still correct.

This post is about when each failure mode activates, and why the answer matters for what you build first.

## The threshold question

BEAM asks: at what token scale does memory architecture matter for retrieval?

Answer: 10 million tokens.

There is a second question BEAM does not ask: at what scale does state integrity matter for trust?

That answer is different. State integrity degrades at 500K to 2M tokens. Roughly one-fifth to one-tenth the scale where retrieval architecture becomes critical.

## Four tiers

At 100K to 500K tokens, a few days of heavy agent use, retrieval architecture does not help. Boschi says it himself: "at BEAM's 500K tier, the gap between systems shrinks dramatically. Context-stuffing competes with real memory architectures." The numbers confirm it. At 500K, RAG scores 33.0%, almost identical to its 100K score of 32.3%. Scores are low across the board, but adding retrieval architecture on top of a 1M context window does not meaningfully improve them. The bottleneck is not retrieval.

But dumping raw conversation history into a context window does not prevent state drift. Seeing all 500K tokens does not give the model a mechanism to decide that "Acme Corp" and "ACME CORP" and "Acme Corporation" are the same entity, or which of three contradictory values is canonical. Preventing drift requires structure applied before the data reaches the model: entity resolution at write time, version ordering, conflict rules. A context window full of unstructured history cannot provide those. A context window full of pre-resolved, versioned entities can.

State integrity is already degrading at this scale. Entity variants accumulate as separate entries. Corrections get silently overwritten. The BEAM paper found contradiction resolution scores near zero at every tier, including 100K. All models struggle to maintain globally consistent state. This is not a scale problem. It starts with the first conflicting write.

At 500K to 2M tokens, the state integrity wall hits. A single Claude Code session consumes 50,000 to 200,000 tokens. A daily power user processes 300K to 2M per day. Most heavy agent users reach this tier in days, not months.

Entity variants produce genuine confusion across hundreds of references. Corrections from last week may or may not persist. The same entity has different representations in Claude, Cursor, and ChatGPT. Platform memory has silently reverted or overwritten state with no audit trail.

Users start building workarounds. The OpenClaw ecosystem documents the pattern: SOUL.md for identity, MEMORY.md for curated state, HEARTBEAT.md for consolidation schedules. People run markdown CRMs for pipelines with 100 contacts. They maintain heartbeat files so agents know what changed between sessions. These workarounds exist because the infrastructure does not preserve history.

At 2M to 10M tokens, both problems compound. BEAM shows the retrieval gap widening: RAG drops from 30.7% at 1M to 24.9% at 10M. Honcho drops from 63.1% to 40.6%. Standard RAG returns chunks about three different "Alices."

Even when retrieval finds the right entity, you cannot confirm it is the latest version. Was the correction from March 15 applied? What is the provenance chain? BEAM addresses this tier for retrieval. Nobody benchmarks it for state integrity.

At 10M tokens and beyond, context-stuffing is impossible. Only real memory architecture survives. Hindsight scores 64.1%. RAG scores 24.9%. That 2.5x gap is structural. But without structured state, retrieval has 10M tokens of noise to search through. Every overwritten value and unresolved entity variant is still in there.

## The scale gap

State integrity has no safe threshold below which it does not exist. The first conflicting observation is the first integrity problem. The first last-write-wins overwrite is the first lost correction. These compound nonlinearly. By the time users reach 500K to 2M tokens of accumulated state, the workaround cost exceeds tolerance.

The people I talk to building with agents are not at 10M tokens. They are at 500K to 2M. They are managing 25 autonomous loops with a 112-person markdown CRM. They are running heartbeat pipelines for business development. Their agents have session amnesia between scheduled runs. The state integrity pain is already severe. The retrieval question has not activated yet.

## Convergent architecture

Hindsight's four winning capabilities at 10M tokens converge on the same structural primitives I'm building into [Neotoma](https://neotoma.io), from the opposite direction.

Pre-computed observations in Hindsight consolidate patterns across facts before query time. Neotoma's deterministic reducers compute canonical snapshots from observation history before query time. Both pre-compute rather than re-derive at query time. Neotoma adds a determinism guarantee: same observations in, same snapshot out.

Entity resolution in Hindsight maps "Alice," "Alice Chen," and "Alice C." to canonical entities with typed graph edges. Neotoma's hash-based entity resolution normalizes and hashes to canonical IDs with typed relationship edges. Both resolve variants. Neotoma's resolution is deterministic: same name always produces the same ID.

Graph traversal in Hindsight follows entity links to find causally related facts that embedding search misses. Neotoma's memory graph traverses entities, observations, and events with typed edges. Both use graph structure for retrieval that similarity search cannot do.

Temporal filtering in Hindsight scopes results to the right time window before semantic ranking. Neotoma's event timelines extract date fields into typed events for temporal ordering and filtering.

These parallels are not coincidental. At scale, both systems arrive at the same primitives: entities, relationships, temporal ordering, pre-computed summaries. They differ in what they optimize. Hindsight optimizes retrieval across 10M tokens of history. Neotoma ensures the facts are deterministic, versioned, and auditable when found.

## Complementary, not competing

Positioning retrieval-focused and state-focused memory systems against each other is a category error. They address failure modes that activate at different scales and compound independently.

Better retrieval at 10M tokens does not fix a correction that was silently overwritten at 500K. Better state integrity at 500K does not help you find the right entity across 10M tokens of conversation history.

At production scale agents need both: the ability to find relevant context, and confidence that the context is correct. BEAM proved the first problem. The second is where I am building.
