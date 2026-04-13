# Reddit post draft: r/AIMemory

**Target subreddit:** r/AIMemory
**Flair:** Discussion
**Generated:** 2026-04-10
**Context:** Problem-first post introducing write-integrity gap, WRIT benchmark, and Neotoma. Follows comment on PenfieldLabs "What an AI Memory System Should Look Like in 2026" thread.

---

## Title

No AI memory benchmark tests what actually breaks

## Body

Every widely used AI memory benchmark tests retrieval: can the system find a stored fact? [LoCoMo](https://github.com/snap-research/locomo) tests multi-session QA. [LongMemEval](https://github.com/xiaowu0162/LongMemEval) tests information extraction and temporal reasoning. [BEAM](https://openreview.net/pdf?id=y59hf5lrMn) scales to 10 million tokens. [AMB](https://agentmemorybenchmark.ai/) aggregates them all.

None test what happens to stored data after agents write to it.

**The blind spot**

All four benchmarks share a design assumption: the corpus is fixed. Conversations go in, questions come out. Facts don't change between ingestion and query. The system never writes to its own memory in a way that could corrupt what was already there.

This matched the world when context windows were small and retrieval was the bottleneck. It doesn't match how memory fails in production, where agents write state across sessions, corrections overwrite previous values, and summarization merges records.

**What breaks in practice**

Three weeks ago, Hermes Agent [issue #2670](https://github.com/NousResearch/hermes-agent/issues/2670) documented this failure precisely: a flush agent silently overwrites live memory on session restart. The agent curates its memory during a session. The gateway restarts. A temporary agent reverts everything based on stale context. No timestamps, no conflict resolution, no awareness of concurrent writes.

The reporter's comment: "My agent doesn't remember writing this now, 5 minutes later."

That's not a Hermes-specific bug. It's the failure mode of any last-write-wins memory system without versioning, provenance, or conflict detection. Most memory systems work this way.

Miles K wrote about the same class of problem as ["memory rot"](https://medium.com/@milesk_33/how-i-fixed-memory-rot-in-long-running-ai-agents-263a7a014dda): agents that work fine for 20-30 turns, then gradually lose coherence. Confident answers, no exceptions, wrong data. "The first time I noticed something was off, there wasn't a failure."

**Why this is worse than hallucination**

A hallucination guardrail checks whether the model's output is grounded in retrieved context. If the model invents something, the guardrail catches it.

Memory corruption means the stored data itself is wrong. The model retrieves it faithfully. The answer looks correct because the retrieval was correct. What was retrieved had changed underneath. The guardrail passes.

BEAM's contradiction resolution scores are the canary. The [paper's own results](https://openreview.net/pdf?id=y59hf5lrMn): at 100K tokens, vanilla models score 0.025-0.050 (out of 1.0). RAG scores 0.017-0.037. At 10M tokens, most systems hit 0.000-0.025. An [independent MemPalace evaluation](https://github.com/milla-jovovich/mempalace/issues/125) reached 40% with dedicated architecture, but noted: "There's no architectural mechanism for contradiction detection."

Contradiction resolution is the one BEAM ability that approaches write integrity. Everything else (preference following at 80%, information extraction at 58%) tests whether you can find the right chunk and read from it. The one test where stored state might have changed gets near-zero scores from almost every system.

**What no benchmark measures**

- **Drift rate**: Did values change without explicit user correction?
- **Detectability**: When something drifted, can the system show when, what, and the previous value?
- **Temporal replay**: Can the system reconstruct state as of a past date?
- **Provenance**: Can the system trace a fact back to its source session and input?
- **Update fidelity**: When a fact changes, does the system use the current value consistently?
- **Selective forgetting**: Does the system correctly drop information that shouldn't persist?

You can score 95%+ on LongMemEval and fail all six of these if your system overwrites values on update, loses history, or can't trace provenance.

**WRIT: a benchmark for write integrity**

I started building [WRIT](https://github.com/markmhendrickson/writ) (Write Integrity Test) to fill this gap. Each scenario runs 5-20 sessions with temporal gaps, tracks facts as they're introduced, updated, contradicted, and retracted, then probes whether stored state is still correct.

Scenarios run in three modes: no memory (baseline), native memory (production behavior), and oracle memory (perfect ground truth). Comparing them isolates whether the failure is in the memory system or the model.

The adapter interface is open. If you're building a memory system and want to see how it holds up under writes, [contributions welcome](https://github.com/markmhendrickson/writ).

I'm also building [Neotoma](https://neotoma.io), a structured memory layer designed around these properties from the ground up: append-only observations (writes don't destroy history), schema-first typed entities (queries are deterministic), full provenance (every fact traces to its source), and cross-tool access via MCP. WRIT is how I test whether my own claims hold up.

**What's your failure mode?**

For anyone running agents with persistent memory: what breaks first for you? Is it finding the right fact, or trusting that the fact you found is still correct?

---

## Language audit notes

**Phrases on cooldown (avoided):**
- "truth layer" as standalone (used "structured memory layer" instead)
- "silently overwritten" (used "silently overwrites" once in the Hermes context, attributed to the issue report)
- "same question, different answer next week" (not used)
- "append-only observations" (used once in Neotoma description, varied context)
- "three questions / three audits" (not used)

**Fresh vocabulary introduced:**
- "memory rot" (Miles K, March 2026)
- "guardrail-passing failure" (implied, not used as a label)
- "flush agent" / "stale context reverts" (Hermes #2670)
- "static corpus assumption" / "blind spot" (new framing for the benchmark gap)
- "contradiction detection" (from MemPalace evaluation)

**Evidence sources (all named, none recycled from prior Reddit engagement):**
- BEAM paper: OpenReview, contradiction resolution tables (0.025-0.050 vanilla, 0.017-0.037 RAG)
- MemPalace issue #125: independent 100K evaluation, 40% contradiction resolution
- Hermes Agent issue #2670: flush agent overwrites live memory, March 23 2026
- Miles K: "How I fixed memory rot in long-running AI agents," Medium, March 2026
- AMB: agentmemorybenchmark.ai (Vectorize meta-benchmark)

**Hooks and closers:**
- Hook: "Every widely used AI memory benchmark tests retrieval" — fresh structure, no person/product/I-statement lead
- Closer: open question about reader's own failure mode — different from recent closers (which asked about trust or architectural choices)

**Repetition caught:**
- Initial draft used "the thing that keeps breaking is not intelligence, it's trust" (used in 2 prior posts). Removed entirely. The post leads with benchmark culture and data, not the trust framing.
- Initial draft used "personal data becomes state" (used in 2 prior posts). Removed. The post assumes the reader already operates agents with persistent memory.
