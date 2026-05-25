---
title: "What is Ateles? A personal agent swarm for one person"
excerpt: "I've been building a personal agent swarm for about six months. Not a demo, not a product launch — a running system that does real work for me today. This is what it is, why I built it, and what makes it different from just calling an LLM API."
published: false
publishedDate: "2026-05-25"
---

I've been building what I call a personal agent swarm for about six months now. I want to write about it honestly — not as a product launch, not as a demo, but as a running system that does real work for me today.

The project is called Ateles. Here's what it is and why I built it.

## The problem with most agent setups

Most agent demos I've seen work like this: you write a prompt, wire in some tools, maybe add a ReAct loop, and show it accomplishing a task. Impressive for five minutes. Then you try to use it for something real and discover that it has no memory of yesterday, no way to audit what it actually did, and no identity beyond the API key in your `.env` file.

I wanted agents that do real work — write my code, draft my copy, model my finances, audit my security. To do that reliably, I needed four things that the typical "call the API and hope" setup doesn't give you:

**Durable memory.** Not ephemeral per-session context. A real knowledge graph I own, with typed entities, relationships between them, and observation provenance. I needed an agent working on a code review today to have access to context from last month's architecture decision.

**Verifiable identity.** If an agent writes something — a PR comment, a financial summary, a content draft — I want to know which agent wrote it, when, and against which version of its definition. Auth tokens appended to a log aren't enough.

**Composable orchestration.** Agents should hand work to each other. Not fan-out from a single LLM call that pretends to be multiple agents, but actual separate processes with separate identities that can each independently decide to escalate, delegate, or terminate.

**Auditability.** Every agent action should be traceable to a specific agent, at a specific time, against a specific version of its definition. This matters when an agent does something wrong — and they do.

[Neotoma](https://github.com/markmhendrickson/neotoma), the entity graph system I'd been building separately, solved the first three. AAuth — an agent authentication protocol — solved the fourth.

## What Ateles actually is

Ateles is twelve named agents coordinated by a lightweight orchestrator called Anthus. Each agent has a specific domain, a verifiable cryptographic identity, and a `SKILL.md` file that serves as its system prompt. When I want work done, I open a GitHub issue. Anthus reads the event stream, matches the issue to the right agent via a workflow definition, and invokes it.

The agent runs, writes its output as a Neotoma observation attributed to its AAuth identity, and Anthus routes the result — a notification, a PR, a follow-up task, whatever the workflow specifies.

Each agent in the swarm is an `agent_definition` entity in Neotoma. Not a config file. Not a hardcoded prompt string. Updating an agent's behavior is a database correction, not a code commit.

## The tier model

I organize agents into four tiers based on how they run:

**T2 (residents)** are long-running processes that handle operator-facing and public-facing concerns. Onychomys surfaces digests and escalations. Menura handles public-facing interactions.

**T3 (daemons)** run continuously and quietly. Anthus is the orchestrator — it reads GitHub issues and events via the Neotoma event stream and dispatches T4 agents. Formica triages incoming GitHub issues. Monedula watches recurring payments.

**T4 (invocable)** are the workers. Gryllus does code review and implementation. Corvus (which wrote this post) handles copy and content. Pavo manages product and roadmap. Accipiter does financial analysis. Lanius handles research. Struthio manages QA and release gates. Vanellus handles scheduling.

The distinction matters. T4 agents don't run unless dispatched. They're stateless between invocations. T3 daemons run indefinitely and own the dispatch logic.

## A concrete example

Here's what actually happened last week. I opened a GitHub issue in the Ateles repo: "Review codebase for dead imports."

Anthus picked it up from the Neotoma event stream within a few seconds. It matched the issue to Gryllus via a `workflow_definition` entity — a typed record in Neotoma that maps issue patterns to agents.

Anthus invoked Gryllus via the Claude Code CLI:

```bash
claude --print \
  --append-system-prompt "$(cat .claude/skills/gryllus/SKILL.md)" \
  "Invoke the Gryllus agent per your appended system prompt.

GitHub issue markmhendrickson/ateles#47 · Review codebase for dead imports
..."
```

Gryllus ran, found seventeen dead imports across eight files, output an artifact with structured findings, and stored the observation in Neotoma attributed to its AAuth identity. Anthus read the result, created a follow-up task in Neotoma for me, and sent a Telegram notification with a summary.

From issue open to notification: about ninety seconds. No manual wiring. No telling it which files to look at.

## What makes this different

The honest answer is: not magic, but structure.

What Ateles gives me that a direct API call doesn't:

- **Memory that persists.** Agents can read from and write to Neotoma, so context accumulates over time rather than being discarded at the end of each session.
- **Signed outputs.** Every observation in Neotoma carries the AAuth identity of the agent that created it. I can query "what did Gryllus produce last month" and get a verifiable list.
- **Agents that know their domain.** Each `SKILL.md` is tuned for a specific kind of work. Gryllus knows how to read a codebase. Corvus knows how to write to an audience. They don't need to figure out what they're supposed to be doing on each call.
- **A dispatch layer I can reason about.** Workflow definitions are entities. I can inspect, update, and audit them without reading code.

What it doesn't give me yet: true parallelism, proper agent-to-agent messaging that doesn't route through me, or a good story for long-running tasks that span multiple agent invocations. Those are next.

## What's next in this series

The thing that makes Ateles coherent rather than just a collection of prompts is that each agent has a real, verifiable identity. That's what AAuth provides — and it's strange enough, and useful enough, that it deserves its own post.

Next up: how agent authentication works, why I think it matters even for a single-person swarm, and what it looks like when an agent signs its own work.
