# Social share material: Plancast wasn't a timing problem, it was a substrate problem

Source: https://markmhendrickson.com/posts/the-substrate-plancast-needed
Generated: 2026-04-27
Slug: `the-substrate-plancast-needed`

**Note:** This post sits adjacent to (not inside) the agent-memory series. The audience bridge is founder-FOMO + agent-builder. Drafts deliberately avoid the recent memory-series hooks (BEAM/WRIT, markdown ceiling, harness-vs-truth, write-integrity-vs-retrieval). The repeatable insider phrase here is "an invitation is a typed write to durable state."

---

## Top pick and timing

### 1. Founder confession + substrate reframe long-form (post first — today or tomorrow, 4-6 PM CEST / 10 AM-12 PM US Eastern)

**Main tweet (no link):**

> A Plancast postmortem I wrote in 2012 listed seven reasons the startup failed: plans get made too rarely to sustain a feed, vanity is weak, plans expire, most are local, awareness without invitation feels like exclusion, nobody wants to broadcast every plan, manual invites layered on what your subscribers could already see.
>
> Reading it 14 years later, those weren't seven problems. They were one problem in seven costumes.
>
> A feed is the wrong primitive for plan-sharing. Plans need addressed audiences, scopes, and invitations as a typed entity — not metadata on top of a broadcast.
>
> The substrate that expresses any of that didn't exist in 2012. It does now.
>
> What's the product you tried to ship that needed a different substrate to work?

**Self-reply with link:**

> Full breakdown: why a feed is the wrong substrate for plans, what an invitation looks like as a typed write to durable state, and why the original Plancast mission becomes tractable on this substrate.
>
> https://markmhendrickson.com/posts/the-substrate-plancast-needed

**Why this one:** Leads with founder lived experience (3 years, postmortem, specific failure list) before the structural turn — "they were one problem in seven costumes" is the insider phrase that makes the rest of the argument click. The closing question targets the exact audience this post bridges (founders who have shipped failed products + agent builders thinking about substrates), and 5 different readers can give 5 different real answers. Distinct hook from any recent piece (the memory series leads with benchmarks, harnesses, or markdown).

**Timezone:** 3-5 PM CEST = 9-11 AM US Eastern. Seeds into US founder/builder morning.

---

## Shareable units extracted

1. **Founder confession** — Wrote a Plancast postmortem in 2012 after three years on the startup. Reading it 14 years later, every "product mechanic" failure was a substrate problem in different clothes.
2. **Insider phrase (post thesis)** — "Plancast wasn't a timing problem. It was a substrate problem."
3. **Insider phrase (graph inversion)** — "Feeds make the graph the input and the activity the output. This substrate makes the activity the input and the graph the output."
4. **Insider phrase (typed write)** — "An invitation is a typed write to durable state, not an ambient feed event."
5. **Insider phrase (substrate-refuses-substitutes)** — "The substrate cannot manufacture personal social currency. It can refuse to deliver substitutes."
6. **Reference-worthy list** — Six reasons a feed is the wrong primitive for plan-sharing (no stream shape, broadcast vs addressed, one collapse function vs many queries, no scopes, consumption-only surface, centralized mediation).
7. **Named primitive** — Quorum predicate. "I'll go to X if Aaron and Diwaker also commit." Substrate watches the predicate and resolves it. No coordinator role, no group chat thread, no flake.
8. **Named primitive** — Slot budgets per event. The substrate, not willpower, enforces "don't fire-hose your address book."
9. **Named primitive** — Decline is silent and unattributed. Recipients reply accept, pass, or pencil. Only accept is visible to the sender.
10. **Named primitive** — Personal note as type-level requirement. `note_to_recipient` and `relationship_basis` are required fields. Empty is not a valid state.
11. **Provocative reframe** — Discovery is a query, not a feed. "Who in my trust mesh is going where in the next two weeks." Each query is computed at retrieval time. There is no feed.
12. **Disagreement surface** — "Resurrect Plancast as an app for the AI age" gets the answer wrong. The answer is not another app. It is invitations, attendance, and trust scopes as primitives on a sovereign personal-state layer.
13. **Stack** — Two pieces, neither of which existed in 2012: durable append-only per-user state (Neotoma) plus a sovereign mesh of address books and trust scopes (Darkmesh, fork of Anand Iyer's project).
14. **Behavior-shaped graph** — A year of silence costs visibility before it costs the relationship itself. The graph is an output of behavior, not a static follow list from 2014.
15. **Composability** — When an invite is accepted, the agent writes the canonical RSVP on the platform that owns it (Luma, Eventbrite, calendar). Two records, one source of truth per concern, linked.

Canonical terms reinforced (light): "Truth Layer" (implicit, via durable per-user state), "Replayable Memory" (relationship history retained even after edge weight decays).

---

## Scheduled drafts (3-4 for this week; interlace with other posts)

### Draft A — Punchy take: graph inversion (X + Bluesky)

**Type:** Punchy take | **Slot:** Wed AM (US audience window)

> Feeds make the graph the input and activity the output. Substrates with typed writes make activity the input and the graph the output. The follow button hides the difference. The substrate cannot.

*(266 chars on X. Fits Bluesky under 300.)*

---

### Draft B — Punchy take: typed-write reframe (X + Bluesky)

**Type:** Punchy take | **Slot:** Mon or Fri AM

> An invitation is supposed to be a typed write to durable state. Plancast made it metadata on top of a broadcast every subscriber could already see. So did Facebook Events. So does every "tag your friends" feature.

*(234 chars on X. Screenshot-share quality.)*

---

### Draft C — Bookmark bait: six reasons feeds are wrong for plans (X)

**Type:** Bookmark bait | **Slot:** Tue PM or Thu PM

> Six reasons a feed is the wrong primitive for plan-sharing:
>
> 1. Plans don't arrive as a steady stream.
> 2. Feeds reward broadcast. Plans need addressed audiences.
> 3. Feeds have one collapse function. Plans need many query functions, most of them not chronological.
> 4. Feeds make every post visible to all followers. Plans need scopes.
> 5. Feeds treat consumption as the surface. Plans need composition with calendars, RSVPs, transit, weather.
> 6. Feeds centralize mediation. Plans are inherently between people.
>
> Build invitations as a typed write to durable state, and most of these dissolve.
>
> Which one bit you hardest the last time you tried to share a plan?

**Self-reply with link:**

> Full argument on why each item is structural, not a UI fix:
>
> https://markmhendrickson.com/posts/the-substrate-plancast-needed

---

### Draft D — Conversation starter: substrate test (X + Bluesky, no link)

**Type:** Conversation starter | **Slot:** Tue or Wed AM

> Most failed products were the right idea on the wrong substrate.
>
> Plancast (2012) didn't need better mechanics. It needed a feed to not be the primitive — invitations as typed writes to durable state, scopes at the network edge, queries instead of streams. None of that existed yet.
>
> What's the product you'd ship today if the substrate had finally caught up?

*(approx 410 chars. Fits Bluesky if you trim "(2012)" and the parenthetical example.)*

**Bluesky variant (~290 chars):**

> Most failed products were the right idea on the wrong substrate. Plancast in 2012 didn't need better mechanics — it needed a feed to not be the primitive. Invitations as typed writes, scopes at the network edge, queries instead of streams. None of that existed yet.
>
> What would you ship today?

---

## Link-in-reply pair (alternate top pick — quorum angle)

**Main tweet:**

> "I'll go to X if Aaron and Diwaker also commit."
>
> That's a quorum predicate. The substrate watches the condition and resolves it. No coordinator role, no group chat thread, no flake at 6 PM Friday.
>
> Half of failed plans aren't a coordination failure. They're a substrate that doesn't have quorum as a first-class type.

**Reply with link:**

> Full breakdown of invitations as typed writes (note, relationship basis, slot budget, scope, expiry, conditional quorum) — and why this is the substrate Plancast needed in 2012:
>
> https://markmhendrickson.com/posts/the-substrate-plancast-needed

---

## LinkedIn — insight post (~1,250 chars)

> In 2012 I wrote a postmortem for Plancast, a startup I'd spent three years on. The premise: a feed of upcoming events from people you trust. The piece walked through why it didn't work.
>
> Reading it 14 years later, every failure I named was the same problem in different costumes.
>
> Plans don't arrive as a steady stream. Most people will not broadcast every plan to their whole network — the wrong people show up, or the room stops feeling controllable. Plans need addressed audiences, not feeds. They need scopes. They need many queries (who in my trust graph is going, what fits this Thursday), not one chronological sort. They need invitations as a typed entity, not metadata layered on a broadcast every subscriber could already see.
>
> A feed is the wrong primitive for plan-sharing. The substrate that expresses anything else didn't exist in 2012.
>
> It does now. Two pieces: durable append-only state per user (an AI agent's memory layer) plus a sovereign mesh of address books and trust scopes. An invitation becomes a typed write to that state — required note, relationship basis, slot budget, expiry, optional quorum — and the recipient's own mesh node admits or refuses it at the network edge.
>
> Some products fail because the team is wrong. Some fail because the substrate is. Plancast was the second kind.
>
> What's the product you tried to ship on a substrate that didn't exist yet?
>
> https://markmhendrickson.com/posts/the-substrate-plancast-needed

---

## Bluesky — link post (~280 chars)

> Twelve years ago I wrote a Plancast postmortem listing seven product failures. Reading it now, they were one substrate problem in seven costumes. A feed is the wrong primitive for plan-sharing — plans need scopes, addressed audiences, and invitations as a typed write.
>
> https://markmhendrickson.com/posts/the-substrate-plancast-needed

---

## Bluesky — conversation starter (~250 chars)

> Most failed products were the right idea on the wrong substrate. The Plancast postmortem I wrote in 2012 listed seven reasons it failed. Reading it 14 years later, they were one problem in seven costumes.
>
> What would you ship today if the substrate had finally caught up?

---

## Reactive QT drafts

### Topic: Plan-sharing / event-aggregation / "Plancast for AI agents"

**Target accounts:** Anyone proposing a Luma alternative, AI-agent-driven event tool, or "rebuild Plancast for AI" thread.

**Draft:**

> Resurrecting Plancast as an app rebuilds the failure. The answer is to make invitations, attendance, and trust scopes primitives on a sovereign personal-state layer, then let agents do the routing. The social mechanic emerges from the typed write, not from a feed event.

### Topic: Luma / Eventbrite / Partiful / RSVP platforms as "the social layer"

**Target accounts:** Founders or builders positioning event platforms as primary social infrastructure.

**Draft:**

> Event platforms own the canonical RSVP. They're the wrong place to own who-trusts-who-is-going-where. Two records, one source of truth per concern, linked: platform handles the venue and the door, durable per-user state handles the trust graph.

### Topic: "AI agents will recommend you what to do this weekend"

**Target accounts:** Anyone framing personal AI agents as a recommendation feed.

**Draft:**

> Discovery should be a query, not a feed. "Who in my trust mesh is going where in the next two weeks." "Which of those events fits my Thursday." Each query computed at retrieval time, against state that user owns. There is no central ranker. There is no feed.

### Topic: Static follow graphs / "we should rethink follows"

**Target accounts:** Anyone discussing the limits of follow-based social graphs.

**Draft:**

> Feeds make the graph the input and activity the output. Typed writes invert that — every invite, accept, or attendance moves the edge, and silence decays it. The graph stops being a static follow list from 2014 and starts being an output of behavior.

---

## Reserves (future weeks / opportunistic use)

- **Punchy take (substrate refuses substitutes):** "The substrate cannot manufacture personal social currency. It can refuse to deliver substitutes. That is the actual job." (~145 chars.)
- **Punchy take (slot budgets):** "Per-event invite budgets force selectivity. The substrate, not willpower, enforces 'don't fire-hose your address book.'" (~130 chars.)
- **Punchy take (silent decline):** "Decline is silent and unattributed. The recipient retains private provenance. You can audit your own social load without exposing it." (~140 chars.)
- **Conversation starter (decline mechanics):** "Every social platform punishes silent declines — read receipts, last-active dots, who-saw-this metadata. What does it look like to design declines as a private, unattributed primitive on the substrate level instead of an emergent shame mechanic?"
- **Conversation starter (six reasons reverse):** "If a feed is the wrong primitive for plan-sharing, what else has been smuggled into a feed because the substrate was the only thing on offer? Hiring? Lending? Group decisions?"
- **Bookmark bait (invitation type):** "An invitation as a typed entity has six required fields: sender, recipient, event, scope, mandatory note, relationship basis. Optional: quorum predicate, slot budget, expiry. Most platforms call this a row in an events table. The shape matters more than the storage."
- **Reactive QT (for agent-routing or personal AI inbox threads):** "Routing personal AI traffic through a substrate that admits scope at the network edge, refuses untyped writes, and keeps the relationship graph as an output of behavior is a different category than 'better assistant.'"
- **Insider one-liner (founder bridge):** "Some products fail because the team is wrong. Some fail because the substrate is. The first is louder. The second is more common."

---

## Language audit notes

**Phrases deliberately avoided (on cooldown from recent social files):**

- "silently overwritten" / "nothing gets silently overwritten"
- "truth layer" (used "durable per-user state" instead in long-form copy)
- "right instinct"
- "transcripts are drafts"
- "what did I believe on [date]"
- "two failure modes" / retrieval vs write integrity framing (memory-series language)
- "BEAM" / "WRIT" / "contradiction resolution" (no benchmark-anchored hooks; this post is a substrate piece, not a benchmark piece)
- "markdown ceiling" / "MEMORY.md" / "local maximum / larger one" (markdown-ceiling vocabulary)
- "harness owns context not truth" / "human sync layer" / "five harnesses" (harness-series vocabulary)
- "state drift" / "token accumulation rates" / "heartbeat files" / "markdown CRMs"
- "append-only observations" as a hook (concept appears once in long-form LinkedIn copy as "append-only per-user state," not as a punchy hook)

**Fresh vocabulary introduced in this batch:**

- "substrate problem" / "right idea on the wrong substrate" (founder-bridge framing)
- "one problem in seven costumes" (insider phrase, post thesis compression)
- "addressed audiences" / "scopes at the network edge"
- "typed write to durable state" (the canonical reframe of an invitation)
- "quorum predicate" (substrate-level coordination primitive)
- "slot budget" (substrate-enforced selectivity)
- "decline is silent and unattributed" (private provenance)
- "permission-gated index" (the alternative to a feed)
- "graph as output of behavior, not a static follow list from 2014"
- "feeds make the graph the input… typed writes invert that" (graph-inversion line)
- "the substrate cannot manufacture personal social currency"
- "two records, one source of truth per concern, linked" (composability with platform RSVPs)
- "sovereign mesh" (Darkmesh framing)

**Repetition caught and rewritten:**

- Initial main-tweet hook opened on "An invitation is a typed write to durable state" (insider phrase first). Demoted because the founder-confession opener creates more immediate authority and matches the post's actual narrative arc (lived 2012 experience → substrate reframe). Insider phrase moved to Draft B as a standalone punchy take so it still gets distribution.
- Initial LinkedIn close reused the "What's the product you tried to ship on a substrate that didn't exist yet?" question from the X main tweet. Kept it because cross-platform readers appreciate the parallel close, and the LinkedIn opener is different enough that the close isn't redundant.
- Considered "two failure modes" framing for invitations vs feed posts. Demoted because it would echo the memory-series two-failure-modes framework. Replaced with "one problem in seven costumes" which is post-native and uses the seven-failure-list as evidence rather than a parallel framework.

**Evidence freshness:** Every substantive claim is anchored — the 2012 postmortem (lived experience + named URL), the seven failure modes (post body), the invitation type definition (post body), Anand Iyer's Darkmesh attribution (post body), Oo Nwoye's nudge (post body). No recycled benchmarks or product names from the memory series.
