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

At 100K to 500K tokens (a few days of heavy agent use), retrieval is fine. A 1M context window covers it. No retrieval architecture needed. But state integrity is already degrading. "Acme Corp" and "ACME CORP" and "Acme Corporation" accumulate as separate entities. Corrections get silently overwritten. Users compensate manually. Annoying but manageable.

At 500K to 2M tokens (a few weeks of multi-tool agent use), the state integrity wall hits. Entity resolution variants produce genuine confusion across hundreds of references. Cross-session state drift means corrections from last week may or may not persist. Cross-tool fragmentation means the same entity has different representations in Claude, Cursor, and ChatGPT. Platform memory has silently reverted or overwritten state multiple times with no audit trail. This is where users start building workarounds: SOUL.md files, JSON heartbeat files, markdown CRMs. The cost of compensating exceeds tolerance.

At 2M to 10M tokens (months of agent use), both problems compound. Standard RAG returns chunks about three different "Alices." Even when retrieval finds the right entity, you cannot confirm it is the latest version. Was the correction from March 15 applied? What is the provenance chain? BEAM addresses this tier for retrieval. Nobody benchmarks it for state integrity.

At 10M tokens and beyond, context-stuffing is impossible. Only real memory architecture survives. This is where Hindsight's 64.1% versus RAG's 24.9% manifests. But without structured state, retrieval has 10M tokens of noise to search through.

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
