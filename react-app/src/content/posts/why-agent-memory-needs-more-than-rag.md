[RAG (retrieval-augmented generation)](https://en.wikipedia.org/wiki/Retrieval-augmented_generation) augments an LLM by retrieving relevant passages from an external corpus, often via embeddings and similarity search, then feeding them as context so the model can answer from up-to-date or domain-specific data.

It works well for document search. For agent memory, it falls apart.

A new paper, "Beyond RAG for Agent Memory: Retrieval by Decoupling and Aggregation" (Hu et al., Feb 2026; [see paper](https://arxiv.org/abs/2602.02007)), from King's College London and the Alan Turing Institute, explains why and points to a better approach.

## Why RAG falls short for agent memory

Standard RAG assumes a large, mixed corpus: embed text, retrieve [top-k](https://en.wikipedia.org/wiki/Nearest_neighbor_search) by similarity, concatenate as context.

Agent memory is the opposite: a bounded, coherent stream where the same fact appears in many phrasings. Applying RAG here creates three problems:

1. **Redundant top-k.** You ask "When did I last see the dentist?" In a document corpus, top-k might return a few relevant paragraphs from different sources. In agent memory, many chunks say almost the same thing ("Scheduled dentist March 15," "Dentist appointment March 15," "Booked dentist for March 15"). Top-k fills with repetition. The paper calls this "collapse into a single dense region." Similarity fails to separate what is *needed* from what is merely *similar*.
2. **Pruning breaks evidence chains.** You ask "Did we resolve the invoice dispute?" The answer depends on a chain: "Invoice #123 was disputed," then "We agreed to a partial refund," then "Paid the agreed amount." Post-hoc pruning might keep "Paid invoice #123" and drop the earlier turns. The model then answers "Yes, resolved" without knowing there was a dispute. Pruning fragments temporally linked evidence and produces wrong answers.
3. **Similarity ignores structure.** You ask "What's the status of the Barcelona trip?" You need the project, the task (e.g. book flights), and the outcome. Similarity returns chunks that mention "Barcelona" or "trip": maybe a random mention, a past trip, a task from a different project. You needed a structural path (this project, these tasks, these outcomes). Similarity doesn't encode that. Structure does.

## Structure over similarity

A better approach is to use structure to drive what gets loaded, not similarity. Type entities (tasks, contacts, transactions, events) and retrieve by schema, entity IDs, relationships, and timelines. Keep observations and derived outputs as whole units; don't prune inside evidence blocks. Same input and same schema yield same output. No LLM in the critical path.

## What the paper shows

The paper's system (xMemory) builds a four-level hierarchy (messages to episodes to semantics to themes) with embeddings and LLM summaries. It beats five other systems (Naive RAG[^1], A-Mem[^2], MemoryOS[^3], LightMem[^4], Nemori[^5]) on LoCoMo and PerLTQA, the benchmark datasets for long-conversation memory and personal long-term question answering. The paper doesn't require embeddings or LLMs; it requires structure. You can get there with a learned hierarchy (xMemory) or with deterministic, schema-first design. The paper also documents fragility in LLM-generated structure (A-Mem, MemoryOS): formatting deviations, failed updates. Deterministic, schema-first structure is a more reliable base.

## xMemory vs Neotoma

Neotoma is the [structured memory layer](/posts/truth-layer-agent-memory) I'm building: schema-first, deterministic, built for provenance and replay. Both systems move beyond RAG; they differ in how they build structure.

**xMemory** builds a four-level hierarchy (messages to episodes to semantics to themes) with embeddings and LLM summaries. Episodes are contiguous blocks; semantics are reusable facts; themes group semantics for high-level access. A sparsity-semantics objective balances theme size. Too large causes redundant retrieval; too small fragments evidence. Retrieval is top-down: select a compact set of themes and semantics, then expand to intact episodes (and optionally messages) only when that reduces the reader model's uncertainty. No pruning inside units. On those benchmarks it beats the five baselines on quality and token use. The paper notes that LLM-generated structure (e.g. in A-Mem, MemoryOS) is brittle: formatting deviations, failed updates. Because xMemory builds its hierarchy with LLM summaries, it adopts the same brittleness.

**Neotoma** builds structure without LLMs in the critical path. Entities are typed; relationships and timelines are explicit; retrieval uses schema, entity IDs, relationships, and time ranges. Same input and schema yield the same output. Schemas still evolve. Unknown fields land in a preservation layer. A deterministic pipeline can promote high-confidence fields to the schema. An LLM can suggest new fields or types as pending recommendations, applied only via tooling or human approval. Inference stays advisory: schema changes go through tooling or human approval; extraction and reduction stay deterministic; the schema remains source of truth. The paper's critique applies when the model *drives* structure, not when it suggests and humans or tooling apply. Ingest-to-retrieve stays deterministic.

### Comparison

| | xMemory | Neotoma |
|--|--------|--------|
| Structure source | Embeddings + LLM summaries (episodes, semantics, themes) | Schema-first, deterministic extraction and reducers |
| Hierarchy | Four levels (messages, episodes, semantics, themes), guided by sparsity-semantics objective | Typed entities, relationships, timelines (no fixed "levels") |
| Retrieval | Top-down: representative selection on graph, then uncertainty-gated expansion to intact episodes/messages | By schema, entity IDs, relationships, timelines |
| Redundancy control | Representative selection + expand only when uncertainty drops | Structural queries return what you ask for; no similarity collapse |
| Intact units | Yes (no pruning inside episodes/messages) | Yes (observations and entities kept whole) |
| Determinism | No (LLM-generated structure varies) | Yes (same input, same schema, same output) |
| Brittleness | Paper cites LLM formatting deviations, failed updates in similar systems | Schema and code are explicit; no LLM in the critical path |

### Relative advantages

**xMemory** excels when the input is a conversation stream and you want structure without defining schemas. Example: long-running chat with an assistant where you ask "what did we decide about the trip?" or "when did I last mention the budget?" xMemory builds episodes, semantics, and themes; retrieval is token-efficient. It also fits fast prototypes (support tickets, meeting notes) where you don't want to author schemas yet. You accept hierarchy drift and don't need auditability or first-class query by entity.

**Neotoma** excels when you need traceability or your data is already structured. Example: auditable decisions (payments, agreements, task outcomes) where same inputs and schema must yield the same snapshot. Schema changes are versioned and applied deterministically; no LLM in the path. It is also the right fit for typed entities (tasks, contacts, transactions, events) with relationships and timelines. Query by entity type, ID, relationship, or time range. Neotoma treats those as native; xMemory would require serializing to text and loses first-class access.

## Iterative structuring in conversation

Structure often emerges in dialogue: "add a task for that," "record that we agreed to pay 500," and the agent acts. The two systems handle that differently.

**xMemory:** The conversation is the primary object. What the agent does (e.g. "I've created a task for the dentist") stays in the message stream and flows into episodes, semantics, and themes. You get a better learned hierarchy but no separate, queryable entity graph. Structure lives inside the hierarchy.

**Neotoma:** The conversation is one source of observations. When the agent creates or updates a task, contact, or transaction, those operations produce observations and entity snapshots. New fields from the dialogue can land in a preservation layer and be promoted to the schema when confidence is high. The dialogue and the structured graph stay in sync because both write into the same store.

**Differing retrieval.** xMemory supports semantic retrieval over the hierarchy. Natural-language questions ("what did we decide about the dentist?") return themes, semantics, or intact episodes. It does not support structural retrieval (no entity types with IDs and relationships). That leads to expected failures in three kinds of cases:

- **Evidence spread across turns.** "Did we resolve the invoice dispute?" The dispute, the negotiation, and the payment may live in different episodes or themes; retrieval can surface one or two and miss the rest, so the model answers incorrectly or incompletely.
- **Set queries.** "What tasks are due before Friday?" or "Show all payments to contact X." There are no task or transaction entities to filter; you get semantic matches (messages that mention "task" and "Friday" or "contact X"), not a definitive list, so results are partial or noisy.
- **Relationship traversal.** "Which tasks in project Y are still pending?" Without a project-task graph, retrieval returns conversation snippets that may omit some tasks or projects; you cannot reliably enumerate by relationship.

Neotoma supports both. You can ask semantic-style questions when the data lives in the store. You also get structural retrieval by entity type, ID, relationship, and time window, so set queries and relationship traversal return complete, first-class results. The tradeoff is that you need schemas and a store that accept those observations.

## Structure over similarity, schema-first over brittleness

For agent memory, similarity over raw text fails. Retrieval has to be driven by structure: how you decompose and organise the stream, not how many chunks match a query. The paper shows that a learned hierarchy (xMemory) beats naive RAG and that LLM-generated structure is brittle.

However, a deterministic, schema-first path gives you the same structural advantage without that brittleness. I'm building [Neotoma](https://github.com/markmhendrickson/neotoma) on the latter so ingest and retrieval stay reproducible and the schema stays source of truth.

[^1]: **Naive RAG:** embed memories, retrieve fixed top-k by similarity, no hierarchy. No separate project; baseline defined in the [paper](https://arxiv.org/abs/2602.02007).
[^2]: **A-Mem:** agentic memory for LLM agents; Zettelkasten-style links and agent-driven updates to a memory network. [Project](https://github.com/agiresearch/A-mem).
[^3]: **MemoryOS:** hierarchical short/mid/long-term storage with update, retrieval, and generation modules for personalized agents. [Project](https://github.com/BAI-LAB/MemoryOS).
[^4]: **LightMem:** lightweight memory inspired by Atkinson-Shiffrin stages; topic-aware consolidation and offline long-term updates. [Project](https://github.com/zjunlp/LightMem).
[^5]: **Nemori:** self-organizing episodic memory with event segmentation and predict-calibrate for adaptive knowledge. [Project](https://github.com/nemori-ai/nemori).
