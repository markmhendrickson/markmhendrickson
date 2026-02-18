---
title: "Six agentic trends I'm betting on (and how I might be wrong)"
excerpt: "The structural pressures that underpin my work, and what would invalidate them as the AI industry evolves."
published: true
published_date: "2026-02-18"
---

Everyone involved in AI right now is, implicitly or explicitly, trying to predict where things are going and how those changes will reshape our lives and work. The volume of speculation is enormous, and much of it is contradictory. That is unavoidable. No one can know with confidence what the next couple of years will bring. The space is moving too quickly, the interactions between technologies are too complex, and second-order effects dominate in ways that are difficult to model ahead of time.

Still, if you are operating in this space, especially if you are building something with AI or for AI, it is not enough to remain agnostic. You have to choose a set of core theses about how the world is likely to evolve and build coherently around them, knowing that some will be wrong and others will matter more than expected. These theses are less about precise prediction and more about identifying structural pressures that seem unlikely to reverse.

What follows are the central assumptions I am currently operating under. They are not claims about inevitability, and they are not meant to cover every possible future. They are the trends that, if they continue even partially, shape how I think AI systems will be used, where friction will accumulate, and what kinds of infrastructure will become necessary. My work ([Neotoma](/posts/truth-layer-agent-memory), a truth layer) is best understood as a response to these assumptions. It is not the reason for them, but it is built in anticipation of the world they imply.

---

## 1. Agents will become stateful economic actors

Over the next two years, agents are likely to move beyond assistive, prompt-centric interactions and become meaningfully stateful actors. No breakthrough in general intelligence is required. Cheaper inference, more capable tool APIs, and broader tolerance for agents running unattended are enough.

The societal shift is real. We are used to tools that do nothing until we act. When agents persist goals, coordinate with each other, and take irreversible actions over time, the question of who is responsible becomes harder to answer. More work is delegated to non-human actors; [the boundary](/posts/we-are-all-centaurs-now) between "I did this" and "my agent did this" softens. Norms around trust, liability, and dependency will have to adapt. The technology enables the change; society has to decide how to live with it.

Why is this trend likely? The marginal cost of keeping agents alive is collapsing faster than the cost of rebuilding context. As inference gets cheaper and orchestration matures, it is more efficient to persist an agent's state than to reconstruct it from scratch. Tool APIs increasingly assume continuity: credentials, caches, intermediate artifacts. Persistence is rewarded over statelessness.

In that world, memory ceases to be a convenience feature. It becomes part of the system's state, comparable to a database rather than a chat log. When that state is proper and trustworthy, new things become possible at scale: long-horizon plans that span days or weeks, coordination across many agents and tools, and delegated work that is only feasible when state can be trusted and extended over time.

Neotoma is built for that. It treats memory as explicit system state: typed entities, events, and relationships in a deterministic graph, not prompt residue or embedding similarity. An agent's history can be replayed, inspected, and reasoned about as part of the system itself.

What to watch over the next year:
1. Agent frameworks advertising long-running, background, or resumable execution as a core feature.
2. Teams discussing agent state corruption or drift as a distinct bug class rather than restarting agents as a fix.
3. Product interfaces exposing agent history as something inspectable rather than ephemeral.
4. Teams running multiple agents that need a single source of truth for entities and decisions.

---

## 2. Agentic errors will become economically visible

As AI output increasingly flows directly into billing, compliance, client deliverables, and automated workflows, the cost of errors is likely to shift. What is currently a diffuse inconvenience becomes explicit economic impact.

When errors start to show up in postmortems, contracts, and court filings, society gains a sharper picture of who bears the cost and who gets blamed. Organizations will face pressure to prove how decisions were made and what the system knew at the time. That pressure will ripple into professional norms, insurance, and regulation. Individuals and small teams may be held to standards that were originally designed for large institutions with audit trails. The upside is more accountability and fewer silent failures. The downside is that the bar for "explainable" and "auditable" may rise faster than many are ready for.

The structural reason this trend is likely is that AI is moving closer to decision-making edges, not just advisory layers. As AI output becomes embedded downstream in systems that trigger payments, commitments, or external communication, errors inherit the cost structure of those systems. Organizations cannot continue treating failures as "model quirks" once they propagate into irreversible actions.

Today, mistakes are often shrugged off with regeneration or prompt tweaks. Tomorrow, those same mistakes will waste money, damage reputation, or create legal exposure.

When errors become priced, organizations stop asking whether outputs were helpful. They start asking how those outputs were produced, what information they relied on, and whether the process can be replayed or audited.

As a corollary, tolerance for approximate or ambiguous memory erodes. The bar for what counts as good enough rises first where harm is visible, then that standard drifts outward. Once mistakes are costly, memory that you can correct and trace becomes infrastructure, not a convenience.

Neotoma aligns with this shift by enforcing provenance at the memory layer. Facts are stored with source attribution, timestamps, and ingestion events. Corrections are additive rather than destructive, allowing teams to reconstruct exactly what an agent knew at the time of a decision instead of guessing based on partial logs.

What to watch over the next year:
1. AI-related failures appearing in postmortems, client disputes, or legal contexts.
2. Teams explicitly asking "what did the agent know at the time?" after mistakes.
3. Traceability or audit requirements being added to AI workflows retroactively.
4. Public incidents attributed to AI memory errors; language shifting from "hallucination" to "system failure" in postmortems.
5. Teams asking for "undo this fact" or "revert what the agent believes" without full resets.
6. "What does the system believe and how has it evolved?" framed as a query over a consistent graph rather than a RAG call.

---

## 3. Audit and compliance will drift down-market

A related trend: the pressure to prove how work was produced and what the system knew will not stay confined to large enterprises. Wherever errors carry a real cost—economic, legal, or reputational—the demand for defensibility and record-keeping follows. As AI becomes embedded in professional work, consultants, agencies, regulated freelancers, and small AI-native teams will face the same expectations.

The structural reason is liability diffusion. As AI use becomes normalized, responsibility does not disappear. It spreads. Clients, insurers, and regulators respond by seeking compensating controls. Audit pressure moves down-market not because small teams want it, but because risk follows usage.

Once questions about how work was produced become routine, memory without provenance becomes a liability rather than a convenience. Structured timelines, entity-level recall, and source attribution start to function as defensive infrastructure.

Neotoma aligns with this shift by treating memory as something that can be reconstructed in time rather than inferred retrospectively. Entity resolution, temporal ordering, and provenance are not add-ons. They are core to the model.

What to watch over the next year:
1. AI usage disclosures appearing in contracts, statements of work, or professional guidelines.
2. Requests for documentation of AI-assisted decisions from clients or insurers.
3. Individuals or small teams proactively storing AI interaction records defensively.
4. Regulation that explicitly requires record-keeping or explainability for certain AI uses.

---

## 4. Platform memory will remain opaque

Large AI platforms are likely to continue shipping memory features that are useful but fundamentally opaque. Their incentives favor engagement, retention, and model optimization rather than user-controlled provenance or guarantees of correctness.

The societal effect is a split between those who can afford to care and those who cannot. People and organizations that need strong guarantees (audit, correctness, portability) will either pay for alternatives, build their own, or accept risk. Everyone else will rely on platform memory and live with the trust gap. That divide can reinforce existing inequalities. The well-resourced get transparent, portable memory; everyone else gets convenience with opaque terms. Over time, norms about what "my data" and "my history" mean may diverge by context and by who you are. Civic and professional expectations (e.g. that you can show your work or export your records) may apply only to some.

The structural reason this persists is incentive misalignment. Platforms optimize for aggregate outcomes across millions of users, not for the correctness guarantees required by any individual workflow. Exposing memory semantics, correction rules, or replay guarantees constrains iteration speed and increases liability. Opaqueness is not accidental. It is protective.

Memory may improve, but it will remain difficult to inspect, export, replay, or reason about formally, especially across tools. Corrections will often be silent, implicit, or model-specific.

This creates a growing trust gap. Users may rely on platform memory for convenience while simultaneously distrusting it in contexts where consequences matter.

Data sovereignty adds a separate pressure: enterprises and individuals are increasingly insisting that agent memory stay in their environment, either on-prem, in their tenant, or under their control, rather than in a vendor's cloud.

Neotoma is built for that gap. Its local, inspectable, user-controlled design is the alternative for workflows where correctness and provenance matter. You own the data and the semantics; you can export, correct, and reason about what the system knows.

What to watch over the next year:
1. Memory features that improve recall but stay undocumented or non-exportable.
2. Users asking what the system actually knows – such as a comprehensive view of what it believes, remembers, and has inferred, not just raw chat or exports – and getting no clear answer.
3. Workarounds (e.g. exports, third-party sync, manual replication) growing rather than shrinking.
4. RFPs or requirements specifying that agent memory must stay on-prem or in the user's tenant.

---

## 5. Tool fragmentation will persist

Despite recurring narratives about consolidation into a single AI platform or workspace, knowledge work is likely to remain fragmented. Professionals already operate across multiple models, editors, copilots, document systems, and agent frameworks.

The structural reason is that AI tools are complements, not substitutes. Each optimizes for a different part of the workflow: ideation, execution, coding, retrieval, communication. Marginal improvements do not collapse the stack. Low switching costs and rapid model iteration further discourage consolidation.

As tool sprawl increases, the core problem shifts from interface fragmentation to state fragmentation. Context lives in too many places at once, and no single surface can realistically own it.

Neotoma sits beneath this fragmentation rather than trying to resolve it. By exposing memory through a protocol interface rather than a single UI, it allows multiple tools and agents to read from and write to the same underlying state without forcing convergence on a single workflow or vendor.

What to watch over the next year:
1. Professionals switching models or tools mid-task without migrating context cleanly.
2. Repeated complaints about "losing context" between tools.
3. Teams standardizing workflows that explicitly span multiple AI products.

---

## 6. Agentic usage will become metered

Agent execution is also likely to become increasingly constrained by cost. The structural reason is straightforward: compute is becoming a visible line item. No radical economic restructuring is required.

As AI spend grows, organizations introduce budgeting, attribution, and optimization. Once costs are visible, metering follows naturally.

When usage is priced, inefficiency and drift stop being abstract concerns. Recomputing context, misremembering prior decisions, or repeating work becomes visible waste.

Neotoma's deterministic memory model becomes relevant here because it separates durable memory from transient context. By enabling replay instead of regeneration, it treats memory as an optimization surface rather than a side effect of inference.

What to watch over the next year:
1. Teams tracking agent or model usage costs per task or workflow.
2. Budget-aware agents that alter behavior based on remaining spend.
3. Optimization efforts focused on reducing redundant inference rather than improving prompts.

---

## How these trends impact key demographics

These trends act as activation conditions for distinct impacted demographics. Neotoma does not become important through persuasion. It becomes important when reality removes alternatives.

**AI-native individual operators and high-context knowledge workers** are the first: founders, consultants, researchers, and solo builders using AI deeply across thinking and execution. Adoption is gated by stateful agents, economically visible errors, and dissatisfaction with opaque platform memory. Once outputs matter externally (to clients, collaborators, or revenue), the inability to answer "what did the system know when this was produced?" becomes untenable. Neotoma becomes attractive as a personal system of record that can coexist with multiple tools.

**AI-native small teams and hybrid product or operations teams** are the second. Individuals can compensate for fuzzy memory. Teams cannot. Once each person's agents remember slightly different facts or assumptions, coordination costs compound. Tool fragmentation accelerates this, audit pressure legitimizes shared memory, and metered usage converts drift into budget waste. In this environment, Neotoma functions less as a productivity layer and more as shared cognitive infrastructure.

**Developer integrators and AI tool builders** who embed agents into products or platforms are the third. For them, memory failure is a production failure. As agents become autonomous, opaque recall becomes untestable and unacceptable. When memory errors are reframed as system failures rather than quirks, builders begin looking for memory primitives that behave like databases rather than conversations. Neotoma becomes relevant here as a substrate, not a feature.

Across all these demographics, adoption is conditional and stepwise, not hype-driven.

---

## What would falsify this view

Any serious vision of the future should be falsifiable. Without clear signals that would prove it wrong, it is not a thesis but a belief. This matters directly for product strategy, because building toward a future that does not materialize leads to elegant irrelevance rather than adoption.

The most significant falsifier would be large AI platforms delivering memory that is genuinely portable, inspectable, replayable, and trusted across tools. Not memory in a marketing sense, but memory that is user-owned, exportable, semantically explicit, and stable across contexts. If platform-native memory becomes authoritative in practice (meaning users and organizations trust it as the canonical record of what was known and when), the need for an external truth layer collapses. In that world, Neotoma's core differentiation erodes rather than compounds.

A second falsifier would be meaningful consolidation into a single dominant AI workspace that owns execution, memory, and tooling end-to-end. If fragmentation pressure disappears because one surface successfully absorbs the stack, the leverage of shared memory substrates declines sharply.

A third falsifier would be agents remaining short-lived, tightly supervised, and cheap to reset, with failures continuing to be handled primarily by restarting rather than diagnosing state. If long-running agents do not materialize and resetting remains the dominant recovery strategy, deterministic memory remains optional rather than necessary.

Finally, if audit and liability pressure fail to move down-market (if AI remains advisory rather than consequential for most professionals), then provenance-heavy memory remains overkill for longer than anticipated.

Watching for these counter-signals is as important as watching for confirmation. They provide early warning that the assumptions driving adoption are weakening and that strategy should adapt accordingly. A vision that cannot be falsified cannot be corrected, and a product built on such a vision risks becoming well-designed for a world that never arrives.

---

## Memory as critical, open infrastructure

This is not a prediction that the world becomes more philosophically committed to truth or correctness.

It is a prediction that agents become stateful, errors become expensive, platforms remain opaque, tools remain fragmented, audit pressure spreads, and usage becomes priced.

If even part of this trajectory holds, memory stops being a UX feature and becomes infrastructure that is necessarily open. In that world, systems that treat memory as deterministic, inspectable state are no longer visionary. They are simply the cheapest way to keep complex systems from failing in opaque and irrecoverable ways.

Neotoma is not the driver of that change. It is one plausible response to it.
