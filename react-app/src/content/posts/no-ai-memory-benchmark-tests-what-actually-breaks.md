---
title: "No AI memory benchmark tests what actually breaks"
excerpt: "The metrics that drive adoption in AI memory are almost all retrieval metrics. Good retrieval is necessary. No widely used benchmark tests what happens to stored data after agents write to it."
published: true
publishedDate: "2026-04-08"
---

I started tracking my workouts in ChatGPT. Reps, weights, how the session felt. After a few weeks I asked it to compare today's performance to previous sessions. It gave me a confident, detailed comparison. The numbers were wrong.

Not slightly off. Wrong. It cited sessions that didn't match what I'd actually logged. I went back through my conversation history. The data it was "comparing" to didn't exist in the form it claimed. Some of it looked like a lossy summary of what I'd told it weeks earlier. Some of it looked invented.

The natural diagnosis is hallucination. The model made things up. I could not confirm that. Had ChatGPT never stored the original data? Had it stored something and then summarized it away? Had the memory drifted between sessions? I had no way to see what the system believed on the date I logged those sessions, or whether it had ever held the actual numbers. I could not rule out hallucination. I could not rule out corruption either.

That inability to distinguish is the real problem. With most AI memory systems you cannot tell which failure mode you are seeing. The diagnostic tooling does not exist. Almost nobody is building it.

## Two failure modes, not one

The industry has one word for "the model said something wrong": hallucination. It is the catch-all for every incorrect output. When agents use persistent memory, there are two distinct failure modes. They need different fixes.

**Hallucination** is a model-level failure. The LLM generates content with no basis in its input. The retrieval was fine. The generation went wrong. The fixes are model-level: better grounding, retrieval-augmented generation, constrained decoding, verification chains.

**Memory corruption** is an infrastructure-level failure. The stored data is wrong. The model retrieves it faithfully. The answer looks correct because the retrieval was correct. What was retrieved had changed.

Memory corruption passes every check designed for hallucination. The passage matches the query. The model cites its source. The output is grounded in stored data. Every guardrail says the answer is based on real information. The information is wrong.

## Why corruption is the default

Every major category of agent memory stores mutable state by default.

Platform memory (ChatGPT, Claude, Gemini, Copilot) overwrites entries on update. There is no version trail. Retrieval systems (Mem0, Zep, LangChain Memory) merge or replace memories when they consolidate.

File-based systems (markdown, JSON) stay mutable unless you add git. Git gives you real history and diffs for small repos. It [scales poorly at gigabyte scale](https://x.com/garrytan/status/2040797478434549792) for agent-written data, and few teams treat it as a write-ahead log for memory.

Standard databases (SQLite, Postgres) can implement event sourcing, temporal tables, and audit triggers. Their default path is still overwrite: `UPDATE` replaces the row and the old value is gone.

None of these preserve [versioned history or prevent silent mutation](/memory-guarantees) out of the box. Any of them *could*. Almost none *do*.

Even thoughtful new designs can fall into the same trap. Garry Tan's [GBrain spec](https://gist.github.com/garrytan/49c88e83cf8d7ae95e087426368809cb) gets a lot right: SQLite, FTS5, vector search, MCP from day one. The spec still rewrites compiled truth instead of appending to it. Your agent rewrites 7,471 pages with a bad merge. The wrong version becomes canonical. No audit trail. Clean architecture, same mutation model.

This is not one bad launch. It is benchmark culture for the whole category. Adoption, stars, and funding track retrieval metrics: recall at k (often written R@k), precision, latency, compression ratio. Those metrics matter. Good retrieval is necessary. It is not sufficient when agents write to their own memory. No widely used benchmark tests what happens to stored data after it is written.

[MemPalace](https://github.com/milla-jovovich/mempalace) is a recent example. The project hit 19,000 GitHub stars in two days on "perfect benchmark scores." [Independent analysis](https://penfieldlabs.substack.com/p/milla-jovovich-just-released-an-ai) found the headline numbers were [retrieval recall metrics, not end-to-end accuracy](https://github.com/milla-jovovich/mempalace/issues/27). Misleading launch copy is a MemPalace problem. The incentive structure is the category's problem: 19,000 stars for retrieval scores, zero questions about write integrity. Supermemory, Mem0, and at least a dozen others I track compete on the same axis. None publish metrics on whether stored facts survive a week of agent writes unchanged.

For traditional apps, mutable state is fine. For agent memory it is a problem. Agents write often, across sessions, sometimes with conflicts. Two sessions write different values for the same field. Last write wins. The first value vanishes. Nobody is notified. There is no record it was ever different.

LLM-driven summarization makes this worse. Systems merge old records into new summaries. The summary replaces the originals. If the merge was wrong (two people merged into one, a detail dropped, an ambiguity resolved badly), the originals are gone. You cannot compare the summary to what it replaced. What it replaced no longer exists.

This is not theoretical. When I [recovered my production database](/posts/how-i-lost-and-recovered-6000-memories) after wiping it, I had backups from different dates. I could compare entity state across time. Some entities differed between the March 3 and March 9 backups. In an append-only system, both values survive as timestamped observations. In a mutable system, only the latest survives. You would never know the earlier value existed.

## The audit nobody runs

Most teams check for hallucination. They verify the model's output is grounded in retrieved context. They test whether the model invents facts.

Almost nobody checks whether stored facts have changed. Ask:

**Can you see what changed?** If a value differs from last week, can you see both values? When did it change, and what triggered it?

**Can you replay past state?** Can you reconstruct what the agent believed on a specific date, not just today's snapshot?

**Can you trace the source?** For any stored fact, can you name the agent, session, and input that created or changed it?

If any answer is no, corruption can be undetectable. Not impossible. Undetectable. It could be happening now. You would not know until something downstream breaks and someone asks where that number came from.

## What prevents it

Memory corruption is structural, not a model problem. Better prompts and smarter retrieval do not fix it. The fix is architectural.

**Immutability.** Observations do not change after write. New information is a new observation. Old ones stay. Entity state is derived from full history, not a single mutable row.

**Provenance.** Each fact carries metadata: which agent wrote it, when, from what input, in what session. When a value looks wrong, you trace custody. When two agents conflict, you see both and choose.

**Temporal replay.** State comes from an observation log, not one current row. You can reconstruct belief at any past time. Corruption becomes visible when current and past states diverge.

These properties cost something. Append-only logs grow. Recomputing state from history costs more than reading one row. Systems that consolidate are trading storage and latency against full history. Immutability trades simple writes and tight storage for auditability. That trade is worth it when agents write memory that affects real outcomes. For many production cases, it already is.

I built these properties into [Neotoma](https://neotoma.io). I did not predict every corruption scenario. I kept hitting mutable state that produced wrong answers with no way to diagnose them. Neotoma needs install time. It is not zero-setup. You do not edit memory as a plain file. Those are real costs. The bet is that versioned history, provenance, and replay matter more than convenience once agents write state that drives decisions.

## The compound risk

Corruption compounds in a way hallucination usually does not. A hallucinated answer often dies when someone reads it and says "that is wrong." One conversation, one error.

A corrupted memory entry persists. It gets retrieved again. It shapes later decisions. My workout comparisons did not fail once. Every later comparison sat on the same drifted or missing data. Each answer looked fine alone. The error was invisible unless I cross-checked my own records, which defeats the point of an agent tracker.

Scale that to real stakes. Wrong email in memory means every send goes to the wrong person until someone notices. Wrong dollar amount means more than one bad invoice.

Corruption lives in the memory layer, not the model. Normal debugging misses it. The model works. The retrieval works. The stored data is wrong, or was never stored correctly. You cannot prompt-engineer past infrastructure that drops its own history.

## What to check

If you use agent memory, try this. Pick five entities your agent stored more than two weeks ago. Retrieve them. Compare current values to what you believe you originally stored.

If you cannot do that comparison, your system does not preserve history. You are corruption-blind. That does not mean corruption happened. It means you would not know if it had. "We would not know" is not enough once agents spend money, touch clients, or trigger real-world actions.

A serious write-integrity benchmark would run like this. Seed N entities with known values. Run M agent sessions that read and write the same entities. Wait a week. Compare stored values to the originals.

Two scores matter. **Drift rate:** what share of values changed without an explicit user correction? **Detectability:** for each change, can the system show when it happened, what caused it, and the previous value? No widely used AI memory benchmark reports either today.

The industry is right to fight hallucination. The harder problem is already inside systems that look healthy, because almost nobody checks whether stored facts are still the facts that were stored.

## When the industry will start asking

Write integrity stops being optional when agent errors have a price tag. Today many mistakes get a regeneration or a prompt tweak. Agents are increasingly [paying, emailing, executing code, and acting in the real world](/posts/six-agentic-trends-betting-on). When a costly failure traces to drifted memory instead of model confabulation, the postmortem adds a second question after "did the model hallucinate?" Did the stored data change?

That pressure will not stay inside enterprises with compliance teams. [Audit pressure moves down-market](/posts/six-agentic-trends-betting-on) wherever errors cost money. Consultants, solo builders, and small teams will need the same answer: what did the system believe when it produced that output? If your memory layer cannot say, the memory layer is the liability.

The trigger is economic, not philosophical. The first public postmortem that blames silently corrupted memory, not hallucination, will change how the industry talks about reliability. That postmortem is a when, not an if.

## Postscript

I have started designing [WRIT](https://github.com/markmhendrickson/writ), an open write-integrity benchmark. It tests drift rate, detectability, temporal replay, provenance, and update fidelity across multi-session scenarios. Any memory system can plug in through an adapter interface. If you are building in this space, contributions and feedback are welcome.
