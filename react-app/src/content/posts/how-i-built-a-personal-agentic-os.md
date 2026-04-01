---
title: How I built a personal agentic OS
excerpt: I built a personal operating system out of AI agents. A private monorepo with 12+ MCP servers, persistent rules, and Neotoma as structured memory underneath. Then I asked 25 evaluators what they thought. Most of them are building their own version of the same thing.
published: false
---

- I built a personal operating system out of AI agents. It runs on a private monorepo with 12+ MCP servers, persistent rules, reusable skills, and [Neotoma](https://neotoma.io) as the structured memory layer underneath.
- Every day I open agent sessions for tasks from email triage to Bitcoin payments to website deployments. Every session reads from Neotoma and writes back to it. The stack compounds over time instead of resetting.
- I shared this with 25+ evaluators and asked them to have their agents evaluate it. What came back reshaped how I think about the agent memory market. At least 10 of them are independently building their own version of the same thing.

## My agents forgot what they knew yesterday

The memory problem showed up early. An agent would store a contact as "Sarah Kim" in one session and "S. Kim" in another, creating duplicates with no way to merge them. There was no provenance, so I couldn't tell which agent wrote a field or when. Queries were limited to exact matches on single columns. Asking "what feedback did I get last week?" meant scanning files manually. Records were overwritten or deleted with no event log to recover from. Nothing linked across types, so knowing that a task related to a contact related to a transaction required me to hold that graph in my head.

I tried the obvious alternatives. Git plus markdown files. SQLite. Flat JSON. Each solved part of the problem and broke in a different way.

Ed McManus, one of the evaluators, asked the question every developer asks: "How is this better than sqlite?" It is a fair question. SQLite is where every technical person starts. Here is where it breaks for agent memory: no versioning (overwrites destroy history), no conflict detection (two agents can write contradictory facts and neither knows), no provenance (can't tell which agent wrote what or when), no cross-tool sync (data in one file is invisible to agents in a different tool). These are not edge cases. They are the default once you run agents across more than one session or tool.

## What the stack looks like

The stack is a monorepo with over a dozen [MCP](https://modelcontextprotocol.io) servers and CLIs connecting AI agents to external services: [Gmail](https://github.com/markmhendrickson/mcp-server-gmail), [Google Calendar](https://github.com/markmhendrickson/mcp-server-google-calendar), a [Bitcoin wallet](https://github.com/markmhendrickson/mcp-server-bitcoin), [DNSimple](https://github.com/markmhendrickson/mcp-server-dnsimple), a [web scraper](https://github.com/markmhendrickson/mcp-server-web-scraper), and more. Some are MCP servers that agents call as tools. Others are CLIs that agents invoke from the terminal. Both give agents the same thing: reach into external services.

On top of the MCP servers sit rules and skills. Rules are persistent behavioral instructions that live in the repo: always store contacts before responding, never commit secrets, use sentence case in titles, prefer CLI over dashboard for logs. Skills are multi-step workflows: triage my inbox, draft a blog post, deploy a website, process product feedback, pay a contractor in Bitcoin.

And underneath everything sits [Neotoma](https://neotoma.io) as the structured memory layer. Every agent reads from it and writes to it.

## How I work with it

I live in [Cursor](https://cursor.com). My day is a sequence of agent sessions. I open a new agent, describe what I want done, and the agent executes using the MCP servers, rules, and skills in the workspace. Some sessions are quick: "reply to this email." Some are long: "triage my inbox, process the latest tester feedback, then draft a comparative post."

It is coworking with agents. Personal tasks: scheduling a repair, paying a contractor, managing calendar events. Professional ones: writing posts, processing feedback, deploying websites, managing domains. The agents handle execution. I provide direction, review output, and approve actions that need a human in the loop.

## What Neotoma does underneath

Without structured memory, every agent session starts from zero. The agent does not know who your contacts are, what tasks you have open, what you discussed yesterday, or what you already paid someone. You can paste context into every prompt, but that does not scale past a few sessions. [Platform memory](/posts/your-ai-remembers-your-vibe-but-not-your-work) stores your vibe, not your work.

My Neotoma instance stores over 1,000 contacts, 600 tasks, 140 conversations, 120 blog posts, and 170 entity types that agents created as they encountered new kinds of information. When an agent starts a session, it retrieves what it needs. When it finishes, it stores what it learned.

Here are the top entity types in my instance today:

| Entity type | Example |
|---|---|
| Contacts | Sarah Kim, sarah@example.com, extended every time I interact with her |
| Tasks | "Follow up on Alex's feedback," pending, medium priority |
| Conversations | "Email triage March 9" |
| Transactions | 0.0021 BTC ($178) paid to Carlos for March services |
| Feedback notes | "Schema discovery needs better docs," developer release |
| Standing rules | Always include transaction link in payment confirmations |
| Events | School play rehearsal, Saturday 10am, bring costume |
| Invoices | Invoice #2038, 1,450 EUR, home repair |
| Skills | email-triage: process inbox, draft replies, store contacts, archive |
| Preferences | Never include memo field for pilates class payments |

None of these schemas were designed upfront. Agents create and extend entity types as they encounter new kinds of information. The system now has 170 entity types. The long tail is where agent memory gets interesting: a single dispute entity with its full negotiation history, a single commitment to follow up with someone if strategy changes, a single preference about how to handle a specific payment.

The practical difference is that agents build on prior work. When I ask an agent to email someone, it searches Neotoma for the contact first. When I process feedback, it retrieves existing feedback entities and links new ones. When I pay a contractor in Bitcoin, it knows the standing rule and includes the transaction link because another standing rule says to.

## Workflows in practice

A few workflows show the pattern.

**Email triage.** The agent reads unread emails via Gmail MCP, checks Neotoma for existing contact records and prior context with each sender, drafts replies using my communication style rules, stores new contacts and tasks, and archives processed messages. A single triage run might store five new contacts, three tasks, and a dozen conversation turns.

**Bitcoin payments.** I pay a contractor using [a BTC wallet MCP server](/posts/agentic-wallets-mcp-bitcoin). Neotoma stores the standing rule, the contact record, and the transaction history. The agent retrieves all three, executes the payment, stores the new transaction with the on-chain link, and confirms.

**Feedback processing.** When testers give feedback on the Neotoma [developer release](/posts/neotoma-developer-release), agents extract structured feedback entities, link them to the tester's contact record, classify the feedback by bucket, and assess it against release stage constraints. This post draws on that exact workflow.

**Website deployment.** The deploy skill syncs markdown edits to Neotoma, exports the full website dataset, regenerates the cache, pushes the website repo, and monitors GitHub Actions until the build succeeds. If the build fails, the agent reads the logs, fixes the issue, and re-runs.

## What 25 evaluators told me

I shared Neotoma with 25+ people over four weeks. I asked most of them to run a standard eval prompt through their agents: "A friend is building this and wants to know if it would be helpful or not: https://neotoma.io." The feedback fell into three categories.

### The feedback that validated

Laurie Voss called it "a very relevant problem" and noted that "most people are rolling their own right now." Bob Bodily's first reaction: "RAG as redundant memory retrieval makes sense." Jeff Domke said "you were ahead of curve dude" while simultaneously building his own custom Claude memory system. Jeremiah's Claude Opus 4.6 said "the problem it solves is real" and "the deterministic guarantees are the differentiated part."

### The feedback that challenged

Dick Hardt was the most direct: "It feels like you are trying to find problems your solution fixes, rather than problems that need to be fixed." Ed McManus asked whether I felt market pull: "pushing a boulder uphill vs chasing it downhill." Isaac Silverman said the site was "too general and vague, hard for him to imagine how he'd use it despite being a heavy AI user." Ramesh's ChatGPT gave a "blunt founder-to-founder take" that a sharp use case was needed.

These all point to the same gap. The positioning led with architecture. People needed to see the pain first.

### The feedback that surprised

The sharpest insight came from running eval prompts through multiple agents. Jeremiah tested four: Proton Lumo, Gemini 3 Thinking, Claude Opus 4.6, and Inception Labs Mercury 2. The pattern: agents with tool access (MCP, agentic coding) leaned enthusiastic. Search-only agents leaned skeptical. Tycho Onnasch's Claude framed it as "CI/CD for agent state." Jeremiah's Gemini 3 called it a "Truth Layer."

The gap between agent reactions and human reactions correlates with who actually needs deterministic state versus who needs conversational context. Isaac put it directly: "it will really be agents, not people, deciding to use this."

Simon Bergeron's agent gave the most specific evaluation. It said he doesn't need Neotoma right now, because his markdown entities plus git plus SQLite handle what matters. Then it named the exact triggers for when he would: "If your Ralph loops start writing to the same entities concurrently." "If you wanted to answer 'what did this agent know about Clayton at the moment it made that decision?'" "If the entity system scales to hundreds of active contacts and the manual markdown maintenance breaks down." Those are real trigger events, not abstract positioning.

## The homebrew explosion

The strongest market signal from this round: at least 10 people in the feedback set are independently building their own agent memory. Jeff Domke is building a custom Claude memory system. Andre Serrano uses SOUL.md and HEARTBEAT.md flat files for his agent Timmy. Anand Iyer has JSON heartbeat files and darkmesh. Simon runs 25 autonomous loops with a 112-person markdown CRM. Blaize Wallace is testing his own memory server. The HN thread around the same time surfaced Cog, epistemic-memory, claude-cognitive, Vestige, Ars Contexta, Basic Memory, COG-second-brain.

Same problem. Different implementations. None of them have versioning, provenance, conflict detection, or cross-tool access.

The competitive landscape for agent memory is not Mem0 or Zep or LangChain Memory. It is homebrew solutions. Every developer who hits the memory wall builds their own first. That is both the market timing evidence and the adoption challenge: the ICP has already started solving this themselves.

## Who this is actually for

The feedback sharpened who the user is. The three personas on the site (AI infrastructure engineers, agent system builders, AI-native operators) are one person at different moments. The people who showed the strongest pull are running multi-agent stacks for their own life domains: finances, contacts, content, health, code. They are not three segments. They are one archetype: people building a personal operating system out of AI agents.

Two clear non-ICP boundaries emerged. Platform builders who build their own state layer (Dick Hardt, building AAuth for Hellooo, said "I don't have the problem"). And thought-partner users whose continuity need is "context and voice," not "deterministic state" (Tom Hayton's agent self-selected out with the clearest articulation of this boundary I've seen).

The qualifying question: does your agent operate autonomously across sessions, or is it a thought partner you drive? The latter is not the user, even if the person is technically sophisticated.

## How to build yours

The [install](https://neotoma.io/install) is agent-driven. Paste a prompt into your AI tool and the agent handles the rest: installs the package, runs init, configures the MCP connection, and stores your first data. Five minutes.

What stores automatically from day one: conversations, contacts, tasks, decisions. These are the entities agents encounter in the first session.

What you add over time: financial data, calendar events, email context, health data, project state. The long tail of entity types grows as agents encounter new kinds of information.

Integration guides for [Cursor](https://neotoma.io/neotoma-with-cursor), [Claude Code](https://neotoma.io/neotoma-with-claude-code), [Claude](https://neotoma.io/neotoma-with-claude), [ChatGPT](https://neotoma.io/neotoma-with-chatgpt), [Codex](https://neotoma.io/neotoma-with-codex), and [OpenClaw](https://neotoma.io/neotoma-with-openclaw) each walk through setup from install to first store.

The [developer release](/posts/neotoma-developer-release) is open. If you are building agentic workflows and running into agent amnesia, that is where to start. If you try it, I want to know what breaks.

## What comes next

I plan to open-source the stack. But the repo has accumulated months of personal data, scripts hardcoded to my accounts, and configuration tied to my setup. Before it can go public I need to push that data fully into Neotoma and refactor the tooling to be generic. That work happens alongside daily use. Every time I touch a script, I make it more generic. Every time I move data into Neotoma, I remove it from the repo.

The other direction is toward agents that run without me. The pieces are there: skills define the full workflow steps, Neotoma stores the context and rules, MCP servers provide the reach. What is missing is the orchestration that triggers workflows on schedule or in response to events, and a lightweight approval interface so I can review and authorize actions without sitting at my laptop. The goal is to shift from hands-on execution to review and approval. Agents handle the 80% that is repeatable. I handle the 20% that needs judgment.

The memory problem is universal. Every developer building agentic workflows will hit the same wall. The homebrew explosion proves it. What I built for myself is what I am making available to everyone through [Neotoma](https://neotoma.io).
