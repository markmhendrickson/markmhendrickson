---
title: "The markdown memory ceiling"
excerpt: "Three independent AI agent platforms worth billions converged on plain text files for memory. The convergence validates the problem. The failure modes they share define what comes next."
published: true
publishedDate: "2026-04-15"
category: "Agent Architecture"
tags: ["agent memory", "markdown", "state integrity", "convergent evolution", "file-based memory"]
read_time: 8
heroImage: "the-markdown-memory-ceiling-hero.png"
heroImageSquare: "the-markdown-memory-ceiling-hero-square.png"
heroImageStyle: "keep-proportions"
---

## The convergence nobody planned

Manus is a consumer-facing AI agent. Claude Code is Anthropic's coding assistant. OpenClaw is an open-source personal AI. Different teams, different codebases, different business models.

All three store agent memory in markdown files.

Manus uses a `todo.md` checklist that rewrites itself after each step. OpenClaw uses `MEMORY.md` plus dated files in a `memory/` directory. Claude Code uses hierarchical `CLAUDE.md` files scoped to directories, with a 200-line cap on always-loaded content.

None appeared to copy the others. [Yaohua Chen on DEV Community](https://dev.to/imaginex/ai-agent-memory-management-when-markdown-files-are-all-you-need-5ekk) called this "convergent evolution." When three independent systems under different constraints arrive at the same architecture, the architecture is telling you something about the problem.

Micheal Lanham [documented this convergence](https://medium.com/@Micheal-Lanham/the-markdown-file-that-beat-a-50m-vector-database-38e1f5113cbe) in March 2026. His analysis of all three systems is the most thorough public comparison of production agent memory architectures I have seen. The data is worth engaging with directly.

## Why files won: ergonomics and economics

Two forces make files the default. Both are load-bearing.

The ergonomics are obvious. Files are human-readable, git-trackable, grep-able, and diff-able. Developers inspect them with `cat`, version them with git, and edit them with the same tools they use for code. No schema to learn, no query language, no API to integrate. When something goes wrong, you open the file and read it. Debugging is `less MEMORY.md`. Agents read files the same way humans do, through plain text I/O. That interface matters more than most architectural writeups admit.

The economics are less obvious and equally load-bearing.

Manus co-founder Yichao "Peak" Ji published the numbers. Manus processes 100 input tokens for every 1 output token. On Claude Sonnet, cached tokens cost roughly $0.30 per million. Uncached tokens cost $3 per million. That 10x spread means input cost dominates. Anything that increases KV-cache hit rates saves real money.

File-based memory is stable, predictable text that plays well with KV-cache prefixes. Append-only context that rarely changes between calls means the model can reuse cached computations. A database-backed RAG system that assembles different context fragments each time defeats this optimization.

Manus's `todo.md` pattern is the clearest example. The agent rewrites the checklist after each step. This places the current plan in the most recent context window position. Information in the middle of long contexts gets ignored. A freshly rewritten plan file at the end of context fixes that with no retrieval infrastructure.

The economic argument extends beyond Manus. Claude Code caps always-loaded memory at 200 lines because memory files consume tokens every session. The constraint is not storage. It is attention budget. Files let you control what the model sees and where it appears in context.

These are not accidental choices. They are cost-aware architecture.

## Where files break

Lanham's article is honest about the failure modes. That honesty is the most valuable part of the analysis.

**Context budget pressure.** Claude Code warns that large `CLAUDE.md` files reduce model adherence. Files work until they get bloated and internally contradictory. A 200-line cap is a pragmatic fix, not a solution. As agent use scales, the file grows, contradicts itself, and nobody knows which version of a fact is current.

**Concurrency.** Multiple agents writing to the same memory file corrupt state. Lanham states it directly: "The moment multiple agents or users need to touch the same memory, concurrent file writes can corrupt data." The single-agent ceiling is real. Most agentic workflows [will not stay single-agent](/posts/when-agents-share-state-everything-breaks) forever.

**No versioning.** Files get overwritten. OpenClaw's memory compaction triggers a silent agent turn that writes durable memories before truncation. What was in the file before compaction? Unknown. If the compacted version dropped a fact, it is gone. No observation log. No rollback.

**No provenance.** When an agent writes a memory entry, there is no record of what source produced it, when, or whether it contradicts something written last week. The file is a summary. Summaries obscure their ingredients.

**No entity resolution.** "Acme Corp" in one session and "ACME CORP" in the next. The agent re-infers identity each time from the context window. No stable IDs. No merge rules. No canonical entities. Every session is session-scoped inference.

**No schema constraints.** Any agent or tool can write anything to a memory file. No validation. No type checking. No enforcement of what a memory entry should contain. Bad writes propagate as truth.

These failures are not hypothetical. They are documented by the teams building these systems. They are the operational ceiling of file-based memory.

## The gap in the equilibrium

Lanham proposes an "equilibrium architecture" with four layers. Files as primary interface. Aggressive offloading to disk. Derived retrieval layers (vector index over files). Clear escalation to databases when concurrency and correctness demand it.

The first three layers are well-documented. The fourth is left as an exercise for the reader.

"Escalate to a database" assumes the database solves the integrity problems. Postgres does not give you versioned observations by default. It does not give you provenance chains. It does not give you deterministic entity resolution across documents. It does not give you schema constraints on agent-written state. Moving from a markdown file to a database table does not solve "no versioning." It solves "no concurrent access." Those are different problems.

The equilibrium has a gap between layers three and four. Between "markdown files that work for one agent" and "full database infrastructure" there is a missing layer. Structured state with integrity guarantees. No custom database schema required.

OpenClaw's architecture hints at this. Its hybrid retrieval, sqlite-vec with configurable vector/text weighting, temporal decay, MMR diversification, is more sophisticated than simple file search. But it still treats the markdown files as source of truth. The index is a read optimization, not a state integrity layer.

The missing primitives are the same ones I identified [running my own agentic stack](/posts/agentic-search-and-the-truth-layer):

- **Versioned observations.** Every write appended, nothing overwritten. Reconstruct state at any point in time.
- **Provenance.** Every fact traceable to a source, a timestamp, and the agent or human that wrote it.
- **Deterministic entity resolution.** Canonical IDs based on stable rules, not per-session inference.
- **Schema constraints.** Validation on writes. Bad data rejected before it enters the store.

These are not database features. They are state integrity features. You can build them on top of a database. Postgres will not give them to you out of the box. And you cannot get them from a markdown file at all.

## Files are the real incumbent

The most important strategic insight from Lanham's analysis is not about files vs databases. It is about what the actual competitive landscape looks like.

Memory infrastructure companies raised tens of millions positioning against retrieval problems. [Mem0](https://mem0.ai) raised $24M. [Letta](https://www.letta.com) closed a $10M seed at a $70M valuation. [Zep](https://www.getzep.com)'s [Graphiti](https://github.com/getzep/graphiti) project crossed 20K GitHub stars. [MemPalace](https://github.com/MemPalace/mempalace) hit 46K stars in its first two weeks with a local-first, verbatim-storage approach. They solve real problems: durability across deployments, personalization, retrieval at scale, and structured recall.

But the systems handling the most agent interactions are not using vector databases for memory. They are using text files. Production evidence from three billion-dollar-scale platforms confirms that the real default is not an existing database product. It is a file.

This changes the displacement story. The upgrade path is not from vector databases to something better. It is from markdown files to structured state. The people who need state integrity guarantees are not currently using Mem0 or Zep. They are currently writing to `MEMORY.md`.

## Migration, not replacement

Lanham's closing advice is correct in spirit: "Start with a Markdown file. You can always add a database later." Files are a rational starting architecture. The economics support them. The inspectability is real. The simplicity matters.

The question is what "later" looks like.

I am building [Neotoma](https://github.com/markmhendrickson/neotoma) as that upgrade path. Structured state with the integrity guarantees files lack: versioning, provenance, entity resolution, schema constraints.

The cost efficiency question matters. If the upgrade path sacrifices the KV-cache economics that made files rational, it is not a real upgrade. Neotoma's read path is designed around this constraint. Agents access it via MCP. The response is structured text injected into the context window, the same format a model would see from reading a file. Entity snapshots are stable between calls. The same entity queried twice returns the same text unless an observation changed it. Stable text means stable token sequences. Stable token sequences mean KV-cache hits.

The ergonomics question matters equally, and is where the trade-offs get real. Some file ergonomics survive the move to structured state. Some do not. The agent-facing interface stays plain text: MCP tool calls return text that reads like a file, and agents query by identifier or type rather than by writing a query language. Inspection survives: `neotoma entities search` and `neotoma entities get` occupy the same shape as `grep` and `cat`. Local-first operation survives: the store is a SQLite file you can back up, version, or inspect with `sqlite3`. Versioning and provenance are strictly better than files can offer, because observations are append-only and every fact is traceable to a source.

What does not survive today is the "open the file and edit" workflow. Correcting a stored value goes through a `correct()` action, not a text editor. There is also an install step that files do not have. Those are real costs for anyone who debugs by editing state directly.

The write path is where the economics differ, and where they should. Writing an observation to a structured store with schema validation costs more than appending a line to a markdown file. That overhead is the price of versioning, provenance, and conflict detection. The question is whether that overhead is worth paying. If you have never needed to answer "what did my agent know last Tuesday" or "which write corrupted this entity," then no. Markdown is correct. If you have needed those answers and could not get them, the write-path cost is the cheapest part of the problem.

The migration story is straightforward. You started with `MEMORY.md` because it was the right default. You hit the ceiling when you needed versioning, or concurrent access, or provenance, or entity resolution across sessions. The next step is not "set up Postgres and build a custom schema." It is a structured layer that gives you those guarantees while preserving what worked about files: inspectability, simplicity, local-first operation.

## Files as a view, not the source of truth

The remaining ergonomic gap is not inherent to structured state. It is an artifact of how the store currently exposes the data. `cat`, `git diff`, and editor-open can come back as a view.

The enhancement path I am building toward inverts the relationship. Files stop being canonical and become a generated mirror of structured state:

- A directory tree of markdown files, one per entity, regenerated on every observation write. `cat person/mark-hendrickson.md` works the same as it always did. The file is read-only with a header noting that edits go through `neotoma correct`.
- The mirror directory is a git repo. `git log entity.md` shows the full history, with commit messages derived from observation metadata (who wrote the fact, when, from what source). This is strictly more than file-level git history gives you today.
- `neotoma edit <id>` opens the snapshot in `$EDITOR` and translates the diff into `correct()` calls on save. The "open, edit, save" workflow survives, and the integrity layer still arbitrates what lands in the store.
- A bounded `MEMORY.md` export for agents that expect a single file. The agent does not have to know it is reading a materialized view. This is a transitional affordance for teams moving off file-based memory without rewriting their agent harness.

This is not the current architecture. It is the next one. None of it exists in Neotoma today. Bidirectional editing in particular has design questions I have not answered yet: how to handle conflicts between mirror edits and concurrent observation writes, how to reject unparseable diffs without losing work, how to surface rejected edits back to the developer. Those are real design problems, not implementation details.

The point is that files as canonical were a local maximum. Files as a view of structured state is a larger one. The same interface developers already know, backed by the integrity guarantees files cannot provide.

## The next layer

The convergent evolution Lanham documented validates the problem. Three teams worth billions in aggregate arrived at the same architecture and hit the same walls. The walls define the next layer.
