# Social Share Material: Your agent harness owns context, not truth

Source: https://markmhendrickson.com/posts/your-agent-harness-owns-context-not-truth
Generated: 2026-04-10
Slug: `your-agent-harness-owns-context-not-truth`

**Handles to tag:**
- @sarahwooders (Sarah Wooders, Letta/MemGPT)
- @nicoloboschi (Nicolò Boschi, Hindsight/Vectorize)
- Ahmed Kidwai / @yursil (Virtual Context) — **verify handle before posting; check Twitter badge on VC GitHub README**

---

## Top pick and timing

### 1. QT of @sarahwooders (post first — today/tomorrow, 4-6 PM CEST / 10 AM-12 PM US Eastern)

QT of: https://x.com/sarahwooders/status/2040121230473457921

> @sarahwooders says memory is the harness, not a plugin. She's half right.
>
> Context management? Yes, the harness owns that. But I use four harnesses daily. Each makes its own invisible decisions about what to remember. None of them agree.
>
> Harness-embedded memory makes each tool smarter in isolation. It makes the user the sync layer across all of them.
>
> Who owns truth when you drive five cars?

**Self-reply with link:**

> Wrote up where the harness argument holds, where it breaks, and the three-layer architecture underneath — including how @nicoloboschi's hooks and @yursil's Virtual Context fit.
>
> https://markmhendrickson.com/posts/your-agent-harness-owns-context-not-truth

### Why this one

Directly engages the most-shared tweet in the thread with a structural disagreement ("half right"), which is the highest-distribution QT shape. The "four harnesses" line is a lived-experience hook that any multi-tool builder will recognize. Ends on an unresolved question. Tags all three people referenced in the post, surfacing it to Wooders' audience.

**Timezone:** Queue for US AI/builder audience (afternoon CEST = US morning/midday). Wooders' original thread is still being referenced in agent memory discussions, so the QT has shelf life.

---

## Shareable units extracted

1. **Provocative reframe** — "Wooders is right about context. She's wrong that context is the whole problem." Directly challenges the widely-shared Letta thesis.
2. **Story beat (personal + structural)** — Four harnesses daily (Cursor, Claude Code, ChatGPT, custom scripts). User becomes the human sync layer. Personal vulnerability + systemic critique.
3. **Named framework** — Three concerns collapsed into one word "memory": context window management, session state, durable state. Architecturally distinct.
4. **Technical surprise** — Virtual Context compresses a 937K-token payload to ~65K of curated signal. 95% accuracy vs 33% baseline at half cost. Context management can be externalized.
5. **Named framework** — Three layers, not two: harness, optional context proxy, durable state layer beneath everything.
6. **Disagreement surface** — Boschi says "MCP is hopeless." True for triggering. But his hooks still call an external API for storage. "Hooks solve the triggering problem. They do not solve the storage problem."
7. **Insider phrase** — "Who owns truth when you use five harnesses?"
8. **Insider phrase** — "Context management is driving. Durable state is the navigation data."
9. **Architectural distinction** — Neotoma keeps extraction agent-driven (zero marginal LLM cost) vs Hindsight runs a second server-side LLM per operation.
10. **Provocative reframe** — "Adding more harness-embedded memory makes this worse, not better. Each tool gets better internal memory. None of them agree."

---

## Scheduled drafts (3-4 for this week)

### Draft A — QT of @sarahwooders (X)

**Type:** Reactive QT | **Platform:** X | **Slot:** Today/tomorrow, 4-6 PM CEST

QT of: https://x.com/sarahwooders/status/2040121230473457921

> @sarahwooders says memory is the harness, not a plugin. She's half right.
>
> Context management? Yes, the harness owns that. But I use four harnesses daily. Each makes its own invisible decisions about what to remember. None of them agree.
>
> Harness-embedded memory makes each tool smarter in isolation. It makes the user the sync layer across all of them.
>
> Who owns truth when you drive five cars?

**Self-reply with link:**

> Wrote up where the harness argument holds, where it breaks, and the three-layer architecture underneath — including how @nicoloboschi's hooks and @yursil's Virtual Context fit.
>
> https://markmhendrickson.com/posts/your-agent-harness-owns-context-not-truth

---

### Draft B — QT of @nicoloboschi (X)

**Type:** Reactive QT | **Platform:** X | **Slot:** Day after Draft A, 4-6 PM CEST

QT of: https://x.com/nicoloboschi/status/2042145292632379598

> @nicoloboschi is right that hooks beat MCP for triggering reliability. But look where the hooks write.
>
> Hindsight's hooks call the Hindsight API. Not the harness's built-in memory. The hooks are the trigger. The external server is the storage.
>
> That separation IS the architecture. Hooks solve when memory fires. They don't solve where it lives.
>
> What's your storage layer?

**Self-reply with link:**

> Full breakdown of triggering vs storage, the three-layer model, and how hooks + MCP + durable state fit together:
>
> https://markmhendrickson.com/posts/your-agent-harness-owns-context-not-truth

---

### Draft C — Conversation starter (X + Bluesky)

**Type:** Conversation starter | **Platform:** X + Bluesky | **Slot:** 2 days after QTs, 5 PM CEST

> I use Cursor, Claude Code, ChatGPT, and custom scripts every day. Four different harnesses making four different decisions about what my agent remembers.
>
> Each one gets smarter about context in isolation. None of them share a single fact.
>
> I've become the human sync layer between my own tools. How many harnesses are you juggling?

---

### Draft D — Punchy take (X + Bluesky)

**Type:** Punchy take | **Platform:** X + Bluesky | **Slot:** End of week, 4 PM CEST

> Hooks solve when memory fires. They don't solve where it lives.

*(71 chars. Screenshot-share material.)*

---

## Link-in-Reply Pair

**Main tweet:**

> @sarahwooders: memory is the harness. @nicoloboschi: hooks beat MCP. @yursil: even context windows can be virtualized.
>
> They're all correct about their layer. None of them answers: who owns truth when you use five harnesses and each one makes different invisible decisions?
>
> Three layers, not two. The harness runs the agent. A context proxy manages what the model sees. A state layer manages what is actually true. No harness provides all three.

**Reply with link:**

> The full argument, with architecture for how hooks + MCP + durable state combine:
>
> https://markmhendrickson.com/posts/your-agent-harness-owns-context-not-truth

---

## LinkedIn — insight post (~1,250 chars)

> Sarah Wooders (Letta/MemGPT) argued that memory is not a plugin — it is the harness. The harness decides what survives compaction, how context loads, whether the agent can edit its own instructions. "Asking to plug memory into an agent harness is like asking to plug driving into a car."
>
> She is right about context management. But the argument assumes you operate inside one harness.
>
> I use four tools daily: Cursor, Claude Code, ChatGPT, custom scripts. Each makes its own invisible decisions about what to remember. Each compacts differently. None of them agree. The user becomes the human sync layer between all of them.
>
> The word "memory" collapses three distinct concerns: context window management (what fits in the prompt right now), session state (what persists within a conversation), and durable state (what persists across sessions, tools, and agents with provenance). The first two are harness concerns. The third is infrastructure.
>
> Meanwhile, a developer named Ahmed Kidwai built Virtual Context, a proxy between client and API that compresses a 937K-token payload to 65K of curated signal. Even context management can live outside the harness.
>
> The question none of these threads addresses: who owns truth when you use five harnesses? That answer has to live beneath all of them.
>
> https://markmhendrickson.com/posts/your-agent-harness-owns-context-not-truth

---

## Bluesky — link post

> Three builders, three arguments about agent memory. @sarahwooders: it's the harness. @nicoloboschi: hooks beat MCP. Ahmed Kidwai: even context can be virtualized.
>
> They're all right about their layer. None answers who owns truth across five tools. Wrote up where each argument holds and the three-layer architecture underneath.
>
> https://markmhendrickson.com/posts/your-agent-harness-owns-context-not-truth

*(295 chars with link. Fits Bluesky 300-char limit.)*

---

## Bluesky — conversation starter

> How many AI coding tools do you use daily? Each one makes different decisions about what your agent remembers. Each compacts differently.
>
> Who syncs the truth between them? Right now it's you.

*(199 chars. Fits Bluesky.)*

---

## Reserves (future weeks / opportunistic use)

- **Punchy take:** "Context management is driving. Durable state is the navigation data. They inform each other but don't belong in the same box."
- **Punchy take:** "Your agent remembers four different versions of the same fact depending on which tool you open."
- **Punchy take:** "A proxy compressed 937K tokens to 65K and scored 3x the accuracy. The harness still ran. The layer that decided what the model saw lived outside it."
- **Conversation starter:** "How do you handle the moment when Claude Code and Cursor disagree about a fact you stored yesterday? Do you even know when it happens?"
- **Bookmark bait (three layers):** "Three layers of agent memory, not two:\n\n1. Harness — runs the agent, manages the context window, compacts\n2. Context proxy — optionally sits between harness and API, manages what the model sees\n3. Durable state — persists truth across sessions, tools, agents, with provenance\n\nNo harness provides all three. Which layer is your stack missing?"
- **Reactive QT (for anyone sharing Wooders' thread):** "The driving analogy works for context. It breaks when you drive five cars and need the same map in all of them."
- **Reactive QT (for Hindsight announcements):** "Hindsight's hooks are the best triggering mechanism out there. But the hooks write to Hindsight's API, not to the harness. That separation — trigger inside, store outside — is the whole architecture. The question is whether the external store is portable."
- **Reactive QT (for Virtual Context announcements):** "VC shows that even context management can sit outside the harness. The harness sends 937K tokens. The proxy sends 65K to the model. Three layers emerge: harness, context proxy, durable state."

---

## Reactive QT drafts (post when relevant accounts tweet about these topics)

### Topic: Agent memory is a harness concern / memory-first harness

**Target accounts:** @sarahwooders, anyone sharing the "driving" analogy
**Draft:**

> The driving analogy works for one car. Most builders drive five — Cursor, Claude Code, ChatGPT, Codex, custom scripts.
>
> Each harness makes different invisible decisions about what the agent knows. No harness syncs with the others. The user fills the gap manually.
>
> Where does the shared map live?

### Topic: Hooks vs MCP for memory reliability

**Target accounts:** @nicoloboschi, anyone discussing hook-based memory
**Draft:**

> Hooks for triggering, yes. But watch where the hook writes.
>
> If it writes to the harness's built-in memory: ephemeral, non-portable. If it writes to an external API: you've just proven the storage layer lives outside the harness.
>
> The trigger mechanism and the storage destination are different design decisions.

### Topic: Context window size / "just use a bigger window"

**Target accounts:** Anyone arguing large windows solve memory
**Draft:**

> A proxy between client and API compressed 937K tokens to 65K of curated signal. Scored 95% accuracy vs 33% for the raw context. At half the cost.
>
> Bigger windows are not better memory. Better curation of what reaches the model is.

---

## Language audit notes

Phrases deliberately avoided (on cooldown from recent social files):
- "right instinct" — replaced with "half right" and "she's right about context"
- "append-only observations" — avoided in all hooks
- "silently overwritten" / "nothing gets silently overwritten"
- "6,174 observations" / production wipe story
- "what did I believe on March 15"
- "truth layer" — replaced with "durable state layer" and "who owns truth"
- "transcripts are drafts"
- "same question, different answer next week"
- "state drift" — used heavily in prior batch, avoided here
- "two failure modes" — prior batch's framework, not this post's

Fresh vocabulary introduced in this batch:
- "invisible decisions" (the post's core concept)
- "human sync layer" (specific pain, not architectural jargon)
- "three layers, not two" (harness, context proxy, durable state)
- "triggering vs storage" (the hooks distinction, fresh framing)
- "who owns truth when you drive five cars" (compressed thesis)
- "937K to 65K" (VC data point, new to social)
- "zero marginal LLM cost" (Neotoma vs Hindsight distinction)
