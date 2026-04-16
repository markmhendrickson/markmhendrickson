# Social: OP tweet @longevityboris (2043008879156756975)

**Source:** https://x.com/longevityboris/status/2043008879156756975
**Generated:** 2026-04-15
**OP text (summary):** "Every AI Memory Benchmark Is Lying to You. Here's the Data." Long-form X article by Boris Djordjevic. Runs 3,000 questions across AI memory benchmarks. Finds 99% retrieval scores produce 28-40% end-to-end accuracy. 52-point score swing from changing the LLM judge. 6.4% of gold answers wrong (Penfield Labs audit). Five systemic problems: judge variance, retrieval/answer gap, under-specified protocols, ignored complexity spectrum, headline-number optimization.

## Top pick: copy and post

### 1. QT 1 (POSTED 2026-04-15)

> Boris found 99% retrieval scores produce 28-40% correct answers with a 52-point swing just from changing the judge model. 6.4% of "gold" answers are wrong.
>
> He surfaces five flaws in benchmark methodology. All five still inside the retrieval paradigm. Zero about whether stored data changed.
>
> What would the scores look like if a single benchmark tested whether stored facts survive a week of agent writes unchanged?

**Self-reply with link:**

> I designed WRIT for exactly this. Drift rate and detectability are the two scores no AI memory benchmark reports today.
>
> https://github.com/markmhendrickson/writ
> https://markmhendrickson.com/posts/no-ai-memory-benchmark-tests-what-actually-breaks

### Why this one

Opens with Boris's strongest data (three numbers the audience hasn't seen synthesized). The structural reframe -- "All five about evaluating reads" -- lands above the 280-character fold and recontextualizes his entire article in one line. The closing question is one every AI memory builder can answer from personal experience: they know their systems don't test write survival, and the question forces the admission. Self-reply connects to the author's published WRIT benchmark without putting the link in the main tweet.

## Triage

**Recommendation:** QT
**Why:** Boris's article provides independent empirical data that validates the author's April 8 post thesis from a different angle (evaluation methodology vs write integrity). His audience (AI memory builders, benchmark-aware practitioners) overlaps the author's target. The tweet's modest engagement (627 views) means a QT adds signal rather than piling onto a viral thread. QT is better than reply here because the reframe (reads vs writes) is a thesis that stands on its own and reaches the author's followers, not just Boris's.

## Quote-tweet drafts

### QT 1 (POSTED 2026-04-15)

> Boris found 99% retrieval scores produce 28-40% correct answers with a 52-point swing just from changing the judge model. 6.4% of "gold" answers are wrong.
>
> He surfaces five flaws in benchmark methodology. All five still inside the retrieval paradigm. Zero about whether stored data changed.
>
> What would the scores look like if a single benchmark tested whether stored facts survive a week of agent writes unchanged?

**Self-reply:**

> I designed WRIT for exactly this. Drift rate and detectability are the two scores no AI memory benchmark reports today.
>
> https://github.com/markmhendrickson/writ
> https://markmhendrickson.com/posts/no-ai-memory-benchmark-tests-what-actually-breaks

### QT 2

> "A good system says 'I don't know.' A bad system hallucinates with confidence."
>
> Boris is right. There's a worse failure mode: the system retrieves the correct passage, and the passage mutated since it was written.
>
> That one passes every retrieval benchmark. None of the five problems he identified would catch it.

**Self-reply:**

> The distinction between hallucination and memory corruption is the most underexplored gap in agent reliability.
>
> https://markmhendrickson.com/posts/no-ai-memory-benchmark-tests-what-actually-breaks

## Reserves

### QT reserve -- convergence angle

> Boris proves memory benchmarks are broken from the evaluation side: judge variance, gold answer errors, retrieval-answer gap.
>
> I've been arguing they're broken from the data side: no benchmark tests whether stored facts change after agents write to them.
>
> Same conclusion from different angles. The category needs write-integrity metrics, not better retrieval scores.

### QT reserve -- Penfield Labs angle

> Penfield Labs audited LoCoMo benchmark gold answers. 6.4% were wrong.
>
> Boris uses this to argue for standardized evaluation. I'd go further: if you can't trace an answer back to its source observation, you can't catch when the benchmark itself is wrong.
>
> Provenance isn't a feature. It's how you debug the evaluation.

## Language audit notes

**Phrases on cooldown (avoided):**
- "silently overwritten" -- replaced with "mutated since it was written"
- "truth layer" -- not used
- "append-only observations" -- not used
- "same question, different answer" -- not used
- "the architecture assumes but never names" -- not used (specific to Garry Tan context)
- "three audits" -- not used (from April 8 social material)

**Fresh vocabulary introduced:**
- "evaluating reads" vs "testing writes" (new binary for the benchmark debate)
- "passage mutated since it was written" (specific failure mode language)
- "write-integrity metrics" (fresh compound)
- "debug the evaluation" (Penfield Labs angle)
- "drift rate and detectability" (from WRIT, not yet used in social)

**Repetition caught and rewritten:**
- Initial QT 1 draft opened with "Every memory benchmark is lying" which is Boris's headline verbatim. Rewritten to lead with his data instead.
- Initial QT 2 closed with "How many hallucinations are actually corrupted memory?" which echoes the April 8 post's "two failure modes" framing too closely. Rewritten to focus on what Boris's five problems DON'T catch, which is fresher.
- "Nobody asked: do stored facts survive a week of agent writes unchanged?" appeared in the April 8 social material. QT 1 uses the same concept but reframes as a question about benchmark scores rather than a standalone statement, and pairs it with Boris's specific numbers for new context.
