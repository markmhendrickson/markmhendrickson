I've been working on something called **[Neotoma](/posts/truth-layer-agent-memory)**.[^1]

There's nothing to try yet. This isn't a launch post, and I'm not announcing a product or asking for signups. The problem has been bothering me for a while, and more importantly, it's been actively getting in the way of work I've been trying to do.

Over the past year, I've spent a lot of time experimenting with agentic systems: automating workflows, delegating tasks to agents, letting systems operate across sessions instead of starting from scratch each time. Again and again, I've run into the same wall. The systems were capable, often impressively so, but I couldn't trust them with real, ongoing state.

That limitation hasn't just been theoretical. It's been a practical blocker to automation.

## AI systems are quietly changing roles

They used to be something you just consulted: you asked a question, got an answer, and moved on. Increasingly, they act. They write files and documents, call tools and APIs, refer to past conversations across sessions, and chain decisions over time without being explicitly prompted for each step.

At that point, personal data stops being reference material and starts becoming *state*.

And state has different requirements.

## The thing that keeps breaking is not intelligence, but trust

Current AI memory systems are built around convenience. They optimize for recall, speed, and fluency, and for whether the system *feels* like it remembers you. None are built around provenance, inspectability, replay, or clear causality.

In practice, that means I can get an agent to do something once, but I hesitate to let it do something *again*. Memory changes implicitly. Context drifts. Assumptions accrete. And when something goes wrong, I can't answer what changed, why it changed, or whether the system would make the same decision if I reran it from scratch.

This is tolerable when AI is advisory but not when it's operational.

## Part of the problem is a category mismatch

We still treat personal data like notes, text blobs, or loose context. Agents, meanwhile, treat that same data like inputs, constraints, triggers, and long-lived state. You cannot safely automate against data you can't inspect, diff, audit, or replay.

This isn't a UX problem. It's a systems problem.

## What feels missing is a basic primitive

Explicit, inspectable, replayable personal state.

Other domains solved this long ago. Databases made application state reliable. Event logs made distributed systems understandable. Ledgers made financial history auditable. Personal data never needed that level of rigor before, because humans could carry context in their heads or reconstruct it by reviewing records manually.

Agents change that assumption.

## The uncomfortable implication is that doing this correctly adds friction

State changes can't be implicit.

Memory updates have to be named operations rather than side effects. Inputs have to be visible rather than inferred. History has to be reconstructable rather than hand-waved.

You give up some magic and accept more ceremony. Otherwise you and your agents will end up living together unreliably through divergent lenses of reality.

There isn't a shortcut around this tradeoff. Convenience-first systems and agent-safe systems pull in opposite directions.

## I'm treating personal data the way production systems treat state

That leads to some unavoidable consequences. Behavior has to be contract-first: state changes are explicit, typed operations, not ad hoc updates. Mutations have to be explicit. Nothing "just updates memory."

If agents are going to act, they need constrained, auditable interfaces rather than opaque prompts or embeddings. Replay matters as much as the current answer: being able to explain how you got here is part of the truth.

Same input always produces the same output since the memory layer is deterministic and agents have a reliable substrate. Changes are immutable and queryable so you can see entity state at any point in time.

Memory comes from both documents you upload and data agents write during conversations, one structured graph unifying entities and events so agents can reason across all of it.

These aren't aesthetic preferences. They fall directly out of trying, and repeatedly failing, to automate real workflows without losing trust in the system doing the work.

## Why I'm designing it this way

I'm keeping it MCP and CLI-first. There's no web UI and no hidden memory. It's local-first by default, with explicit interfaces for agents. I'm ingesting only what I explicitly provide with no automatic scanning or background ingestion. Those aren't omissions, they're guardrails. They make it harder, accidentally or otherwise, to lie about what the system knows and how it got there.

I'm also making it cross-platform and privacy-first by design. It works with ChatGPT, Claude, and Cursor via MCP, not locked to a single provider. Your data remains yours, user-controlled, never used for training. Those aren't conveniences; they're prerequisites for trust.

## What it's not

It's not a note-taking app or a "second brain"; it's a structured memory substrate for agents.

It's not provider-controlled ChatGPT Memory or Claude Projects; it's your own substrate, exposed via MCP so any agent can use it.

It's not a vector store or RAG layer; it's schema-first, structured memory with provenance.

It's not an autonomous agent or workflow engine or AI assistant with invisible memory; it's the memory layer agents read and write, and you control.


And it's not something I'd call reliable yet. I'm trying to build the foundation layer before pretending guarantees exist.

## Why now

We're normalizing systems that take actions on our behalf, persist beliefs, and accumulate decisions over time. When those systems fail, and they will, the first question will be, "How did this happen?"

Right now, most tools won't be able to answer that. And over the past year, that inability has been the main thing preventing me from trusting agents with anything that matters. That problem is about to scale.

The agentic web is emerging. We need one where users remain in control of memory, not one where we hand it to centralized platforms and agents act on our behalf using opaque, unreliable methods. I'm building Neotoma to provide that: a substrate that is inspectable, replayable, and user-controlled as the agentic web grows.

## Upcoming developer preview

I'm working on releasing a developer preview for my own usage and public testing. It will be rough and explicitly unreliable (e.g. APIs may change). Its purpose will be to pressure-test these ideas in real use, not to sell anything.

How I'm approaching the build: I'm dogfooding it first in my own agentic stack so I can see where determinism and provenance actually help and where they get in the way. Use cases include:

- **Tasks and execution** — Tasks, plans, projects, and outcomes with due dates and follow-up reminders
- **Contacts and relationships** — Contact records and relationship graph linked to communications, tasks, and events
- **Communications** — Email triage, workflow-triggered processing, and conversation tracking
- **Finance** — Transactions, flows, income, holdings, transfer and cost recording
- **Record keeping** — Purchases, accounts, property and one-off analysis reports
- **Content** — Posts, personal history, favorite media and consumption sources
- **Health** — Habits, exercises, and ongoing tracking

I'm prioritizing MCP stability and a minimal CLI before adding more surface area, stress-testing entity and relationship resolution and timeline queries as usage scales.

If this framing resonates, the work is happening in the open here:
[https://github.com/markmhendrickson/neotoma](https://github.com/markmhendrickson/neotoma)

Starring the repo is the simplest way to keep track of it as it evolves. Input from people thinking about agentic systems and scalable state is always welcome.

[^1]: Named after the genus *Neotoma* (packrats), known for collecting and preserving material.
