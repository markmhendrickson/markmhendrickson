# Social share material: Fat skills need a foundation they can't corrupt

Source: https://markmhendrickson.com/posts/fat-skills-need-a-foundation-they-cant-corrupt
Generated: 2026-04-13

## Top pick: copy and post

### 1. Conversation starter (post first, Monday 3-5 PM CEST)

> Garry Tan's best agent architecture example: a skill that rewrites itself from NPS feedback. 12% bad ratings → 4%.
>
> Nobody asked the obvious question: what happens when the rewrite is wrong?
>
> You need version history, observation provenance, and deterministic replay.
>
> The architecture doesn't provide them.

**Self-reply with link:**

> I wrote about the unnamed layer in Tan's three-layer architecture and what it takes to actually build it.
>
> https://markmhendrickson.com/posts/fat-skills-need-a-foundation-they-cant-corrupt

### Why this one

Opens with Tan's own data (12% → 4%), which his audience already trusts. The question ("what happens when the rewrite is wrong?") is one every builder of self-improving systems has personal experience with. Targets reply chains from people who have lived the failure mode.

## Shareable units extracted

1. **Concrete specific** — 777K views in 48 hours, 6,000 founders, 12% → 4% OK ratings, 20K-line CLAUDE.md → 200 lines of resolvers.
2. **Framework/distinction** — Three-layer architecture (fat skills / thin harness / deterministic foundation) with unnamed bottom layer.
3. **Story beat** — Skill rewrite regression scenario across five events. The improvement that becomes corruption.
4. **Provocative reframe** — "The skill rewrites itself" → "The skill corrupted itself and you can't trace when."
5. **Disagreement surface** — Tan treats the bottom layer as a solved problem (four tool names). It needs four architectural guarantees.
6. **Insider phrase** — "When a skill rewrites itself, you need receipts."
7. **New evidence (expansion)** — Tan's "deterministic is where trust lives" validates the thesis from YC's own president. The convergence angle: same diagram from opposite starting points.
8. **Reference takeaway** — Four requirements for taking the latent/deterministic split seriously: immutable observations, versioned snapshots, provenance chains, deterministic reducers.
9. **New evidence (expansion)** — MCP latency critique reframed. The protocol is not the bottleneck. The operation is. Entity queries are microseconds, not 15-second browser cycles.
10. **Provocative reframe** — "The real question is whether state lives inside the harness or beneath it."

## Scheduled drafts (4)

### Draft 1: Conversation starter (X + Bluesky)
**Type: Conversation starter | Platform: X + Bluesky | Suggested slot: Monday 3-5 PM CEST**

> Garry Tan's best agent architecture example: a skill that rewrites itself from NPS feedback. 12% bad ratings → 4%.
>
> Nobody asked the obvious question: what happens when the rewrite is wrong?
>
> You need version history, observation provenance, and deterministic replay.
>
> The architecture doesn't provide them.

**Self-reply (X):**
> I wrote about the unnamed layer in Tan's three-layer architecture and what it takes to actually build it.
>
> https://markmhendrickson.com/posts/fat-skills-need-a-foundation-they-cant-corrupt

**Bluesky version (300 char):**
> Garry Tan's best agent example: a skill that rewrites itself from NPS feedback. 12% bad → 4%. Nobody asked what happens when the rewrite is wrong. You need version history. Provenance. Replay. The architecture doesn't provide them.
>
> https://markmhendrickson.com/posts/fat-skills-need-a-foundation-they-cant-corrupt

### Draft 2: Punchy take (X + Bluesky)
**Type: Punchy take | Platform: X + Bluesky | Suggested slot: Tuesday 4 PM CEST**

> "The skill rewrites itself" is one rewrite away from "the skill corrupted itself."

(83 characters)

### Draft 3: Bookmark bait (X)
**Type: Bookmark bait | Platform: X | Suggested slot: Wednesday 3 PM CEST**

> Four requirements for a deterministic agent foundation (per Garry Tan's own latent/deterministic split):
>
> 1. Immutable observations — nothing overwritten
> 2. Versioned snapshots — state at any point in time
> 3. Provenance chains — every fact traceable to source
> 4. Deterministic reducers — same inputs, same output
>
> Which of these does your agent stack actually provide?

### Draft 4: Insight post (LinkedIn)
**Type: Insight post | Platform: LinkedIn | Suggested slot: Wednesday 7 AM CEST**

> Garry Tan just published the most-read piece on AI agent architecture in 2026. 777K views in 48 hours. His three-layer model is right: fat skills on top, thin harness in the middle, deterministic foundation at the bottom.
>
> He named two of the three layers. The third got four tool names. But his own best example, a skill that rewrites itself from NPS feedback (12% bad ratings to 4%), is the best proof that the bottom layer is not a solved problem.
>
> When skills rewrite themselves, you need version history, provenance, and replay. Otherwise "the skill rewrites itself" is one rewrite away from "the skill corrupted itself and you can't trace when."
>
> I wrote about what it takes to build the layer his architecture assumes but never names.
>
> https://markmhendrickson.com/posts/fat-skills-need-a-foundation-they-cant-corrupt

## Reserves (for future weeks / opportunistic use)

### Punchy take (reserve)
> Garry Tan: "Deterministic is where trust lives."
>
> Then his bottom layer is four tool names and a bullet list.

### Conversation starter (reserve)
> Garry Tan replaced a 20,000-line CLAUDE.md with 200 lines of pointers.
>
> Good. That fixes the context problem.
>
> But when those pointers resolve to state that multiple agents have written, which version do you get? The one from Tuesday's skill rewrite or Thursday's?
>
> Context routing ≠ state integrity.

### Link-in-reply pair (reserve)
**Main tweet:**
> Garry Tan described three layers of agent architecture. Fat skills. Thin harness. Deterministic foundation.
>
> He named the first two. The third got a bullet list.
>
> 777K people just learned why the bottom layer matters. The question is whether it's a grab bag of CLI tools or first-class infrastructure.

**Reply:**
> I think it's first-class infrastructure. Here's why.
>
> https://markmhendrickson.com/posts/fat-skills-need-a-foundation-they-cant-corrupt

### Bluesky link post (reserve)
> Garry Tan's three-layer agent architecture names two layers. The third — "where trust lives" — gets a bullet list. His own best example (self-improving skills) proves it needs to be a first-class layer.
>
> https://markmhendrickson.com/posts/fat-skills-need-a-foundation-they-cant-corrupt

## Reactive QT drafts

### Topic: Self-improving agent systems / skill files
**Target accounts:** @garrytan, accounts discussing the thin-harness-fat-skills thread
**Trigger:** When someone tweets about self-improving skills, skill files rewriting themselves, or Tan's architecture specifically.

**Draft:**
> Right about the three layers. Right that "deterministic is where trust lives."
>
> The question is whether QueryDB and ReadDoc is enough when skills rewrite themselves across sessions and agents.
>
> When a self-improving skill produces a regression, can you diff the versions? Can you trace which observation drove the rewrite?

### Topic: MCP latency / tool performance
**Target accounts:** Accounts discussing MCP performance, referencing Tan's "2-5 second round trips"
**Trigger:** When someone criticizes MCP latency using Tan's framing.

**Draft:**
> The Chrome MCP is slow because browser automation is slow. Tan's right about that specific comparison.
>
> Entity lookup and state retrieval are microseconds locally. Low milliseconds through a server.
>
> The question isn't whether MCP is fast enough. It's whether state lives inside the harness or beneath it.

## Language audit notes

**Phrases on cooldown (avoided):**
- "truth layer" — replaced with "state integrity layer" and "deterministic foundation"
- "append-only observations" — replaced with "immutable observations"
- "durable state" — replaced with "versioned state" and "state underneath"
- "silently overwritten" — replaced with "corrupted itself and you can't trace when"
- "two failure modes" — not used; deployed specific failure scenario instead

**Fresh vocabulary introduced:**
- "receipts" (colloquial provenance)
- "diarization" (from Tan's post, bridge concept)
- "grab bag" (for Tan's unnamed bottom layer)
- "skill rewrite regression" (specific failure mode)
- "convergence" (two approaches arriving at same architecture from opposite directions)
- "context routing ≠ state integrity" (new distinction)

**Repetition caught and rewritten:**
- Draft 1 initially opened with "I agree with Tan's architecture" — too close to April 10 post opening ("I agree with half of Sarah Wooders' framing"). Rewritten to open with Tan's specific data point instead.
- "The layer beneath the harness" — too close to April 10 post's "beneath every harness." Replaced with "the unnamed layer" and "the bottom layer."
