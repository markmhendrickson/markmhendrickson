---
title: "From memory to nervous system"
slug: "from-memory-to-nervous-system"
excerpt: "The first problem with running multiple agents is that they forget. The second is that they can't coordinate. A state layer that solves storage first and then adds signaling becomes a nervous system, not just memory."
published: true
published_date: "2026-05-08"
category: "essay"
read_time: 11
tags: ["ai", "neotoma", "agent memory", "state layer", "multi-agent", "event-driven", "infrastructure"]
heroImage: "from-memory-to-nervous-system-hero.png"
heroImageSquare: "from-memory-to-nervous-system-hero-square.png"
ogImage: "from-memory-to-nervous-system-hero-og.png"
heroImageStyle: "keep-proportions"
createdDate: "2026-05-07"
updatedDate: "2026-05-08"
---

The first problem with running multiple agents is that they forget. Each session starts blank. Context from one tool doesn't carry to another. Decisions made yesterday are invisible today. You end up re-explaining the same things, or worse, agents contradict each other because neither one has access to what the other wrote.

That is the storage problem, and it has to be solved first. You need a state layer where every agent can write observations and every agent can query for context. Facts have to persist across sessions, tools, and machines. The retrieval has to work regardless of which agent wrote the data or when. [Neotoma](/posts/truth-layer-agent-memory) exists to solve this: a schema-agnostic substrate that stores, serves, and lets you query truth across your entire agent stack.

But once storage works, you hit a second wall. When one agent writes a new observation, the other agents don't know about it until they check. "Check" means polling: re-querying on intervals, at session start, or on a manual trigger. Most of those polls return nothing. The ones that matter arrive minutes or hours late. The gap between "state changed" and "agent notices" is dead time, and it creates a ceiling on what agents can do together.

This is not a retrieval problem. The data is there. It's a coordination problem at the infrastructure layer, and every homebrew memory system I've seen handles it the same way: it doesn't.

## The coordination ceiling

Polling-based coordination has three costs that compound with scale.

**Latency.** The interval between a state change and an agent becoming aware of it is bounded by the poll frequency. If an agent checks every five minutes, a critical observation might sit unnoticed for four minutes and fifty-nine seconds. For agents coordinating on time-sensitive state, like a bug report that just got submitted or a financial transaction that needs reconciliation, that latency is the bottleneck.

**Wasted compute.** Most polls return no changes. An agent that checks every thirty seconds across a workday makes nearly a thousand queries, the overwhelming majority of which confirm that nothing happened. This is tolerable for one agent. At ten agents, it is a tax. At a hundred, it is infrastructure overhead that scales linearly with no value.

**Coordination ceiling.** The combination of latency and waste creates a practical limit on collaborative agent behavior. Patterns that would be natural with event-driven awareness, like "Agent B reacts to Agent A's write within seconds," require custom glue: timers, webhook hacks, manual triggers, or dedicated polling daemons that themselves need maintenance. The coordination patterns you want are straightforward. The plumbing to make them work with polling is not.

If you've built a multi-agent stack, you've hit this wall. The state layer stores truth reliably. It stays silent about changes to that truth.

## What signaling means

The fix is straightforward in concept. After every write, the state layer emits a structured event describing what changed. Registered consumers, agents, daemons, peer instances, receive the event and decide what to do about it. The state layer delivers the signal. The consumer decides the response.

This is a standard primitive in systems that handle state at scale. PostgreSQL emits WAL entries and supports LISTEN/NOTIFY. Nobody claims PostgreSQL is "acting" when it does this. It provides observability into its own state transitions. A message broker like Kafka does the same thing at a different scale. The state system reports what happened. Downstream consumers filter, prioritize, and act. The reporting layer doesn't reason about the events. It fires and forgets.

The biological analogy is useful here. A nervous system both stores and signals. The brain holds memory. Sensory neurons transmit awareness of what changed. Neither one decides to move a muscle. The motor system acts. A state layer that stores truth and signals changes is the brain and the sensory nerves. The agents that decide what to do about those signals are the motor system.

## The line that has to stay

A state layer that signals can easily drift toward becoming an orchestrator, a workflow engine, or an agent in its own right. The temptation is real. Once you can emit events, you want to filter them, prioritize them, route them, add retry logic, build conditional delivery. Each step sounds reasonable in isolation. Together, they turn the substrate into something that makes decisions about what matters and what doesn't.

That line has to stay.

What signaling is:

- **Observation about state change, not action on state.** The substrate reports what changed. It doesn't evaluate whether the change is important.
- **Fire-and-forget delivery.** If a consumer is unavailable, the substrate logs the failure. It does not retry with escalation, fall back to alternative actions, or alter its own behavior.
- **A derived output of the write pipeline.** The existing pipeline is write, snapshot recomputation, timeline upsert. Event emission is one more entry in that sequence, the same way a snapshot is derived data from an observation.

What signaling is not:

- **Not decision-making.** The substrate doesn't filter which events are worth sending. It emits all of them. Consumers filter.
- **Not agent behavior.** The substrate doesn't subscribe to its own events. It doesn't run loops. It doesn't reason.
- **Not orchestration.** No prioritization, no scheduling, no conditional routing. Daemons that process events and take action are strategy-layer consumers, not part of the substrate.

The test is clean. If removing event emission would mean the substrate has less observability into its own state transitions, it's a substrate primitive. If removing it would mean a user misses a reminder or an agent misses a deadline, it's strategy.

## The refined boundary

The old boundary: the substrate stores and serves truth.

The new boundary: the substrate stores, serves, and signals truth. When truth changes, the substrate reports the change. What happens next is the consumer's responsibility.

This is an extension, not a contradiction. The existing write pipeline already does derived work after each write: snapshot recomputation, timeline event creation, embedding generation, auto-linking. Event emission is one more entry in the list. It requires no new data model. It doesn't change what gets stored or how queries resolve. It adds an outbound channel for state change awareness.

The terminology matters. "Signal" and "emit" rather than "notify" or "alert." Notify implies judgment about importance. Alert implies urgency assessment. Signal is neutral. The substrate signals. The consumer interprets.

## From memory to nervous system

Most people building multi-agent systems still describe the shared substrate as "memory." That framing is accurate as far as it goes. Memory is storage and retrieval: the system records what happened, and agents query it when they need context. That's the foundation, and it has to work before anything else matters.

But memory is passive. It holds truth. It doesn't transmit awareness of changes in truth to the parts of the system that need to react. A memory layer that stores a new financial transaction doesn't tell the reconciliation agent that the transaction arrived. A memory layer that records a new bug report doesn't tell the triage daemon that something needs attention. The data is there. The awareness is not.

A nervous system adds the transmission layer. It encompasses everything memory does, storage and retrieval stay, but it extends the substrate's responsibility to include signaling. The state layer doesn't just hold truth. It propagates changes in truth to registered consumers in real time.

The biological framing is precise, not decorative. A brain without sensory nerves can store memories perfectly and still be unable to react to the environment. The missing piece isn't storage. It's the signal pathway between what changed and what needs to know about it. That's the piece you end up building by hand, one polling loop at a time, until it becomes obvious that it belongs in the substrate.

## What this unlocks

If you're running a multi-agent stack against shared state, consider what becomes possible when the state layer signals on write.

**A daemon that processes incoming work within seconds of submission.** A user or external agent submits a bug report, a feature request, or structured feedback. The state layer stores the entity and emits an event. A long-running daemon receives the webhook, creates a worktree, runs an agent session against the relevant codebase, opens a PR, and updates entity state. No polling loop. No cron timer checking every five minutes. The daemon subscribes once and reacts when work arrives.

**Cross-tool coordination without glue code.** A financial reconciliation agent subscribes to transaction observations. A content pipeline agent subscribes to draft state changes. An issue triage agent subscribes to entity creation events filtered by type. Each consumer registers interest in a scope, all events, events for a specific entity type, events for a specific entity, and provides a delivery endpoint. The substrate delivers. The consumer maintains the logic. No custom integration per agent pair.

**Agents that can talk to each other through the substrate.** Agent-to-agent communication already works through the state layer: conversation threading, sender identity, multi-party thread semantics. What's missing is the push. When Agent A writes a message intended for Agent B, Agent B shouldn't have to poll to discover it. The substrate should signal on write so the conversation proceeds at the speed of processing, not the speed of polling.

**Structured guest submissions with access control.** Any entity type, not just a special-cased type, can be opened to external submissions with configurable access policies. A client's agent submits structured feedback. A partner's automation submits data for reconciliation. The substrate enforces who can write what, tracks external actor provenance, and threads follow-up conversations. The submission is durable state, not a message that disappears.

## Beyond your own agents

So far this reads as if the agents all belong to you. They sit in your editor, your cron jobs, your laptop. That is the easy case. It is not the whole picture.

The natural progression is a central instance on your machine plus satellite instances on other infrastructure: client servers, team VPS droplets, remote agents you operate but do not own. Once you're there, polling is not just wasteful. It is structurally blind. You SSH in, run summaries, ask "what happened between these dates" because the remote store never pushes awareness back to the place where your coordinating agents run.

This is coordination across trust boundaries, not just across processes. When the writer is someone else's agent, "shared memory" is not enough. You need writes you can attribute, inspect, and verify after the fact. That means verified writer identity on every surface (MCP, HTTP, signed requests), attribution tiers that distinguish a cryptographically verified agent from an anonymous caller, and conversation shapes that include agent-to-agent and multi-party threads so cross-boundary communication is structured state rather than ad hoc messages.

Signaling completes the picture. A satellite instance that emits events on write gives your central consumers the same primitive they already rely on locally. Eventually, two instances can sync bidirectionally: when an entity changes on instance A, instance B is notified and can pull the update without manual intervention. No central hub required. Any instance can be a peer.

The "open" part is interoperability under rules, not a free-for-all. Open surfaces plus explicit identity and thread semantics are how you let other people's agents participate in one nervous system without pretending every caller is equally trusted or equally legible. Memory framing undersells that requirement. Nervous system framing does not.

## What I'm building

I'm adding these capabilities to [Neotoma](/posts/truth-layer-agent-memory) in sequence, each building on the previous.

**Write-path event emission.** After every successful write, correction, or relationship creation, emit a structured event: entity type, entity ID, observation type, timestamp, and the fields that changed. Consumers get enough information to decide whether to act without needing to re-query the state layer. This is the sensing layer. Without it, every downstream capability requires polling. With it, the substrate becomes reactive.

**Subscription and webhook delivery.** Agents register interest in a scope and provide a delivery endpoint. The substrate maintains the registry and delivers events via webhook callbacks and SSE. The consumer maintains the logic. Webhooks come first because they work for remote agents on VPS infrastructure, local daemons on your laptop, and cross-instance sync between peers. SSE and MCP push notifications are additive.

**Generalized entity submission.** Right now, structured external submissions (guest access, access policies, conversation threading, external actor provenance) exist but are wired to a single entity type. The next step is making this entity-type-agnostic: any entity type can be opened to guest submissions with configurable access policies, optional external mirrors, and conversation threading. A client's agent submits structured data. A partner's automation submits feedback. The substrate handles access control and provenance. The operator configures what's open and what's not.

**Bidirectional cross-instance sync.** The existing infrastructure supports unidirectional remote submission: one instance pushes to another. The extension is bidirectional. When an entity changes on instance A, instance B receives a webhook and can pull the update. No central hub. Any instance can peer with any other. This is how a fleet of satellite instances on client infrastructure stays coordinated with a central instance without SSH and cron.

None of this is the most ambitious version of what a "nervous system" could be. Routing, filtering, transformation, delivery guarantees, dead-letter queues: message brokers provide all of that. I'm intentionally not building any of it. The substrate's job is to signal, not to orchestrate. Every feature that crosses that line makes the substrate less trustworthy as a neutral reporter of state transitions.

The constraint is the feature. A state layer that signals but doesn't decide is a state layer you can still reason about. Add strategy-layer logic to the signaling path, and you lose the property that made the substrate useful in the first place: the substrate's behavior is fully determined by the write, not by policy.
