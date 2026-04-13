# Social share material: Agent memory breaks at 500K tokens, not 10 million

Source: https://markmhendrickson.com/posts/agent-memory-breaks-before-retrieval
Medium: https://medium.com/@markymark/agent-memory-breaks-at-500k-tokens-not-10-million-9148883c2efc?postPublishedType=initial
WRIT repo: https://github.com/markmhendrickson/writ
Generated: 2026-04-08 (updated 2026-04-09 with WRIT)
Slug: `agent-memory-breaks-before-retrieval`

---

## Top pick and timing

### 1. Conversation starter + link-in-reply (post first — today or tomorrow, 4-6 PM CEST / 10 AM-12 PM US Eastern)

**Main tweet (no link):**

> A new AI memory benchmark just tested retrieval at 10 million tokens. Buried in the same paper: contradiction resolution scored near zero at 100K.
>
> Nobody has benchmarked write integrity. So I started building a benchmark.
>
> WRIT tests drift rate, detectability, temporal replay, and provenance across multi-session scenarios. Open source, adapter interface for any memory system.
>
> Which problem activates first for you: finding the right fact or trusting that it's still correct?

**Self-reply with link:**

> I'm using WRIT to harden Neotoma's own write-integrity guarantees via TDD. If my claims aren't quantifiable, they might as well be just marketing.
>
> The post: https://medium.com/@markymark/agent-memory-breaks-at-500k-tokens-not-10-million-9148883c2efc?postPublishedType=initial
> The benchmark: https://github.com/markmhendrickson/writ

**Why this one:** Leads with the surprising data point (contradiction resolution near zero at 100K) without requiring readers to know what BEAM is, then pivots from "nobody benchmarks this" to "so I started building a benchmark." WRIT is a concrete artifact, not just an argument. The open-source + adapter-interface framing invites other memory system builders to participate, which drives replies. Closes on a question builders can answer from experience.

**Timezone:** Queue for US AI/builder audience (afternoon CEST = US morning/midday).

---

## Shareable units extracted

1. **Data point (surprising)** — BEAM contradiction resolution scores near zero at every tier, including 100K. All models, including structured memory systems, fail at maintaining consistent state.
2. **Named framework** — Two failure modes (retrieval vs state integrity) that activate at different scales. 10M for retrieval, 500K for state integrity.
3. **Concrete specifics** — Token accumulation rates: one Claude Code session = 50K-200K tokens. Daily power user = 300K-2M/day. You hit the state integrity wall in days.
4. **Provocative reframe** — "Context-stuffing competes with real memory architectures" at 500K (Boschi's own words used to frame when retrieval isn't the bottleneck).
5. **Story beat (lived workarounds)** — People running SOUL.md, MEMORY.md, HEARTBEAT.md, markdown CRMs for 100-contact pipelines, heartbeat files for session handoff. 25 autonomous loops, 112-person CRM.
6. **Insider phrase** — "A context window full of unstructured history cannot provide [entity resolution, version ordering, conflict rules]. A context window full of pre-resolved, versioned entities can."
7. **Data contrast** — Hindsight 64.1% vs RAG 24.9% at 10M. 2.5x structural gap.
8. **Convergent architecture** — Independent systems (Hindsight + Neotoma) arriving at the same four primitives from opposite directions: pre-computed observations, entity resolution, graph traversal, temporal filtering.
9. **Framework** — "Positioning retrieval-focused and state-focused memory systems against each other is a category error."
10. **Disagreement surface** — Direct response to Boschi's "10 million tokens is the only benchmark that matters." Both the number and the word "only" are wrong if you include state integrity.
11. **Artifact (new)** — WRIT: open write-integrity benchmark. Tests drift rate, detectability, temporal replay, provenance, update fidelity. Adapter interface so any memory system can plug in. Fills the gap the post identifies.

---

## Scheduled drafts (3-4 for this week; interlace with other posts)

### Draft A — Punchy take (X + Bluesky)

**Type:** Punchy take | **Slot:** Wed or Fri AM (US audience window)

> A daily Claude Code user burns 300K-2M tokens per day. By Friday, your agent has more state than it can keep straight. But the benchmarks don't test that until 10 million.

*(~180 chars on X. Fits Bluesky under 300.)*

---

### Draft B — Bookmark bait (X)

**Type:** Bookmark bait | **Slot:** Thu PM

> Two failure modes in agent memory. They activate at different scales.
>
> 1. Retrieval: can you find the right fact? Matters at 10M tokens. A new benchmark proves it — standard RAG drops to 24.9% while structured retrieval holds at 64.1%.
>
> 2. State integrity: is the fact still correct? Matters at 500K. The same benchmark's contradiction resolution is near zero at every tier, including 100K.
>
> The industry is building for #1. Users are feeling #2.
>
> Which one is breaking your workflow right now?

---

### Draft C — Conversation starter (X + Bluesky, no link)

**Type:** Conversation starter | **Slot:** Tue or Wed AM

> People building with agents right now are not at 10 million tokens. They're at 500K to 2M.
>
> They're running heartbeat files so their agent knows what changed overnight. They're keeping markdown CRMs because no memory layer handles 100-contact pipelines without drift.
>
> What's the jankiest workaround you've built because your agent forgets between sessions?

---

### Draft D — Link-in-reply pair (X)

**Type:** Link-in-reply pair | **Slot:** Thu or Fri AM

**Main tweet:**

> A new AI memory benchmark tested retrieval at 10M tokens. Standard RAG scored 24.9%. Structured retrieval scored 64.1%. Real architecture matters.
>
> But the same paper's contradiction resolution data is near zero at every tier. Even 100K. The benchmark tests whether you can find the fact. Not whether the fact survived the last write.
>
> Two failure modes. One benchmark. So I started building the second one.

**Reply with link:**

> WRIT tests write integrity: drift rate, detectability, temporal replay, provenance. Open source, adapter interface for any memory system: https://github.com/markmhendrickson/writ
>
> Full argument on when each failure mode activates: https://medium.com/@markymark/agent-memory-breaks-at-500k-tokens-not-10-million-9148883c2efc?postPublishedType=initial

---

### Draft E — Thread opener (X + Bluesky, max 1/week — use if no other thread scheduled)

**Tweet 1/4:**

> "10 million tokens is the only memory benchmark that matters."
>
> The retrieval part is true. The word "only" is not. Here's why.

**Tweet 2/4:**

> A new benchmark (BEAM) tests retrieval at 500K to 10M tokens. At 10M, context-stuffing fails and real architecture wins — structured retrieval scores 2.5x over standard RAG.
>
> But the same paper also tests contradiction resolution. Scores are near zero at every tier. Even the systems with structured memory can't maintain consistent state.

**Tweet 3/4:**

> A Claude Code power user burns 300K-2M tokens per day. Within a week, entity variants pile up. "Acme Corp" and "ACME CORP" and "Acme Corporation" are three entries. Corrections from Tuesday may not survive Thursday.
>
> Retrieval hasn't broken yet. State integrity has.

**Tweet 4/4:**

> The two systems people are building for these problems converge on the same primitives: entities, temporal ordering, pre-computed views, graph traversal.
>
> They diverge on what they optimize. You need both. Nobody benchmarked the second one — so I started: https://github.com/markmhendrickson/writ

**Self-reply with link:**

> Full breakdown with benchmark scores at each tier and where the workaround patterns appear: https://medium.com/@markymark/agent-memory-breaks-at-500k-tokens-not-10-million-9148883c2efc?postPublishedType=initial

---

## Reactive QT drafts

### Topic: BEAM benchmark discussion or Boschi/Hindsight/Vectorize promotion

**Target accounts:** @nicoloboschi, anyone sharing BEAM scores
**Note:** In reactive QTs of people already discussing BEAM, using the acronym is fine — the audience self-selects.
**Draft:**

> Strongest retrieval benchmark out there. 64.1% at 10M is real.
>
> The number nobody's quoting from the same paper: contradiction resolution near zero at every tier, including 100K. Finding the right fact and knowing the fact is still correct are different problems that break at different scales.
>
> Started building the write-integrity half: https://github.com/markmhendrickson/writ — adapter interface so any memory system can plug in.

### Topic: Context window size debates ("just use a bigger context window")

**Target accounts:** Anyone claiming 1M or 2M windows solve memory
**Draft:**

> A 1M context window holds everything at 500K tokens. Retrieval architecture doesn't help at that scale — new benchmark data confirms it.
>
> But the model still can't decide which of three contradictory values for the same entity is canonical. Visibility is not integrity.
>
> Bigger windows reveal drift. They don't prevent it.

### Topic: Agent workarounds / markdown-based memory / SOUL.md / OpenClaw

**Target accounts:** @garrytan, anyone sharing .md-based agent context files
**Draft:**

> Heartbeat files, SOUL.md, markdown CRMs. People keep rebuilding the same pattern: files that agents read at boot because no infrastructure layer remembers state across sessions.
>
> These workarounds exist because the infrastructure doesn't handle state drift at 500K tokens. The retrieval problem hasn't even activated yet.

---

## LinkedIn — insight post (~1,200 chars)

> A new AI memory benchmark (BEAM) tests retrieval at 500K to 10M tokens. At 10M, context-stuffing fails and real memory architecture wins by 2.5x over standard RAG.
>
> But the same paper surfaces a finding the industry isn't discussing. Contradiction resolution scores near zero at every tier, including 100K tokens. Models with structured memory. Models without. All near zero. Every system tested struggles to maintain consistent state across conflicting writes.
>
> The people I talk to who build with agents are not operating at 10 million tokens. They are at 500K to 2M. A daily Claude Code session burns 50K to 200K tokens. A power user processes 300K to 2M per day. They hit the state integrity wall in days. They're running markdown CRMs and heartbeat files because no memory layer handles their pipeline without drift.
>
> Retrieval and state integrity are two failure modes that activate at different scales. Better search at 10M does not fix a correction that drifted at 500K. Better state integrity at 500K does not help you find the right entity across 10M tokens of history.
>
> At production scale, agents need both. A new benchmark proved the first problem. I started building the benchmark for the second: WRIT tests drift rate, detectability, temporal replay, and provenance. Open source, adapter interface for any memory system.
>
> I'm using it to harden Neotoma's own guarantees via TDD. If the claims aren't quantifiable against a public benchmark, they're marketing.
>
> The argument: https://medium.com/@markymark/agent-memory-breaks-at-500k-tokens-not-10-million-9148883c2efc?postPublishedType=initial
> The benchmark: https://github.com/markmhendrickson/writ

---

## Bluesky — link post

> A new AI memory benchmark tested retrieval at 10M tokens. Real architecture matters — 2.5x over standard RAG.
>
> But contradiction resolution in the same paper is near zero at 100K. State integrity fails before retrieval does. So I started building the write-integrity benchmark: https://github.com/markmhendrickson/writ

---

## Bluesky — conversation starter

> People running agents right now aren't at 10M tokens. They're at 500K-2M, managing heartbeat files and markdown CRMs because state drifts across sessions.
>
> What's your ugliest agent-memory workaround?

---

## Reserves (future weeks / opportunistic use)

- **Punchy take:** "Contradiction resolution scores near zero at 100K tokens. Every model. Every architecture. The state integrity problem starts before you open the second session."
- **Punchy take:** "A 1M context window that holds all 500K tokens still can't decide which of three entity variants is canonical. Bigger windows reveal drift. They don't fix it."
- **Insider phrase:** "Visibility is not integrity." (Use standalone or as closer in a thread.)
- **Conversation starter:** "If you're running 25 autonomous agent loops, how many of them agree on the same set of facts right now? Not 'can find the same facts.' Actually agree on what's current."
- **Bookmark bait (convergent architecture):** "Two independent memory systems — one optimizing retrieval at 10M tokens, one optimizing state integrity at 500K — arrive at the same four primitives: entity resolution, temporal ordering, graph traversal, pre-computed views. The convergence is the signal."
- **Reactive QT (for RAG announcements):** "Better retrieval is real progress. But retrieved context that drifted since it was written produces a confident, well-cited wrong answer. Faster roads to a house that might not be there."
- **WRIT standalone (for benchmark or memory product announcements):** "Every AI memory benchmark tests retrieval. None test what happens after agents write. WRIT tests drift rate, detectability, temporal replay, provenance, and update fidelity. Open source, adapter interface. https://github.com/markmhendrickson/writ"
- **WRIT conversation starter:** "Run WRIT against your memory system. If update fidelity is high but detectability is low, your system handles changes but can't prove when they happened. That profile passes every retrieval benchmark and fails in production. What's your score? https://github.com/markmhendrickson/writ"
- **WRIT skin-in-the-game:** "I built a write-integrity benchmark and I'm running it against my own system. If the guarantees aren't quantifiable against a public test suite, they're marketing. What claims does your memory layer make that it can't prove? https://github.com/markmhendrickson/writ"

---

## Language audit notes

Phrases deliberately avoided (on cooldown from recent social files):
- "silently overwritten" / "nothing gets silently overwritten"
- "append-only observations"
- "6,174 observations" / production wipe story
- "what did I believe on March 15"
- "right instinct"
- "truth layer"
- "transcripts are drafts"
- "three questions" / "three audits"
- "same question, different answer next week"

Fresh vocabulary introduced in this batch:
- "state drift" (from the post itself)
- "contradiction resolution scores near zero" (BEAM data)
- "token accumulation rates" (300K-2M/day)
- "visibility is not integrity" (new insider phrase)
- "convergent primitives" (Hindsight + Neotoma parallel)
- "category error" (from the post's framing)
- "heartbeat files" / "markdown CRMs" (specific workaround names)
