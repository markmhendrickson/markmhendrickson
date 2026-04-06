My agentic stack is how I dogfood [Neotoma](https://neotoma.io). It is also my personal operating system. A private monorepo where AI agents handle everything from email triage to Bitcoin payments to website deployments, with Neotoma as the structured memory underneath.

Every feature I ship in Neotoma gets validated here first, primarily in [Cursor](https://cursor.com) and secondarily via terminal agents like [Claude Code](https://www.anthropic.com/claude-code), [Codex](https://openai.com/codex), and [Cursor CLI](https://cursor.com/cli). Every gap I find in agent memory surfaces here first. The stack is how I run my daily life and work. The friction I encounter, in addition to user feedback, is what drives the Neotoma roadmap.

I intend to open-source the stack. But the repo has accumulated months of personal data, scripts hardcoded to my accounts, and configuration tied to my setup. Before it can go public I need to push that data fully into Neotoma and refactor the tooling to be generic. That work is ongoing.

This post explains what the stack is, how I use it, and what it reveals about what structured agent memory needs to do.

## What the stack is

The stack is a monorepo with over a dozen [MCP](https://modelcontextprotocol.io) servers and CLIs, each connecting AI agents to a different service: [Gmail](https://github.com/markmhendrickson/mcp-server-gmail), [Google Calendar](https://github.com/markmhendrickson/mcp-server-google-calendar), [WhatsApp](https://www.whatsapp.com), a [Bitcoin wallet](https://github.com/markmhendrickson/mcp-server-bitcoin), [Instagram](https://github.com/markmhendrickson/mcp-server-instagram), [Asana](https://github.com/markmhendrickson/mcp-server-asana), [HomeKit](https://www.apple.com/home-app-accessories/), [DNSimple](https://github.com/markmhendrickson/mcp-server-dnsimple), [Google Search Console](https://search.google.com/search-console), [1Password](https://1password.com), a [web scraper](https://github.com/markmhendrickson/mcp-server-web-scraper), and more. Some are MCP servers that agents call as tools. Others are CLIs that agents invoke from the terminal. Both give agents the same thing: reach into external services.

On top of the MCP servers sit rules and skills. Rules are persistent behavioral instructions that live in the repo, not in Neotoma: always store contacts in Neotoma before responding, never commit secrets, use sentence case in titles, run tests after code changes, prefer CLI over dashboard for logs and config, link the first mention of product names. Skills are multi-step workflows: triage my inbox, draft a blog post, deploy a website, process product feedback, extract an Amazon order from email, pay a contractor in Bitcoin.

And underneath everything sits [Neotoma](https://neotoma.io) as the structured memory layer. Every agent reads from it and writes to it. That is what makes the stack compound over time instead of resetting on every session.

## How I work with it

I live in Cursor. My day is a sequence of agent sessions. I open a new agent, describe what I want done, and the agent executes using the MCP servers, rules, and skills in the workspace. Some sessions are quick: "reply to this email." Some are long: "triage my inbox, process the latest tester feedback, then draft a comparative post about [Google's memory agent](/posts/always-on-memory-agents-and-the-truth-layer)."

It is coworking with agents. I sit at my desk and work alongside them all day. Personal tasks: scheduling a repair, paying a contractor, managing calendar events. Professional ones: writing posts, processing feedback, deploying websites, managing domains. The agents handle the execution. I provide direction, review output, and approve actions that need a human in the loop.

Each agent session has the full workspace context: every MCP server, every rule, every skill. The agent can read my Gmail, check my calendar, query Neotoma for prior context, store new data, generate images, push code, and verify deployments. My role is increasingly to describe intent and review results.

## How Neotoma fits

Without structured memory, every agent session starts from zero. The agent does not know who your contacts are, what tasks you have open, what you discussed yesterday, or what you already paid someone. You can paste context into every prompt, but that does not scale past a few sessions. [Platform memory](/posts/your-ai-remembers-your-vibe-but-not-your-work) stores your vibe, not your work. [RAG](/posts/why-agent-memory-needs-more-than-rag) helps with code, but not with the structured facts that drive workflows: who you owe money to, what feedback you received last week, which tasks are still open.

My Neotoma instance stores over 1,000 contacts, 600 tasks, 140 conversations, 120 blog posts, and 170 entity types that agents created as they encountered new kinds of information: transactions, standing rules, feedback notes, calendar events, disputes, invoices, skills, deployment results. When an agent starts a new session, it retrieves what it needs. When it finishes, it stores what it learned.

Here are the top 20 entity types in my Neotoma instance today, with an example of each:

| Entity type | Example |
|---|---|
| Agent messages | "triage my inbox and process tester feedback" |
| Commitments | Inform investor if funding strategy changes |
| Companies | Acme Design Studio, acme-studio.com |
| Contacts | Sarah Kim, sarah@example.com, imported from Gmail then extended every time I interact with her |
| Conversations | "Email triage March 9" |
| Disputes | Refund dispute, 99 EUR, in review |
| Email messages | "Re: partnership proposal," March 8 |
| Events | School play rehearsal, Saturday 10am, bring costume |
| Feedback notes | "Schema discovery needs better docs," developer release |
| Invoices | Invoice #2038, 1,450 EUR, home repair |
| Links | LinkedIn, linkedin.com/in/username, social |
| Locations | Barcelona, Spain (home) |
| Posts | Why agent memory needs more than RAG, essay, published |
| Preferences | Never include memo field for pilates class payments |
| Standing rules | Always include transaction link in payment confirmations |
| Skills | fix-feature-bug: classify error, add regression test, run suite; email-triage: process inbox, draft replies, archive |
| Tasks | "Buy resistance bands," pending with urgency level, health domain |
| Timeline entries | Project Manager at TechCrunch, 2007-2009 |
| Transactions | 0.0021 BTC ($178) paid to Carlos for March services |

None of these schemas were designed upfront. Agents [create and extend schemas as needed](https://neotoma.io) as they encounter new kinds of information. The system now has 170 entity types total, most with only a handful of records. The long tail is where agent memory gets interesting: a single dispute entity with its full negotiation history, a single commitment to follow up with someone if strategy changes, a single preference about how to handle a specific payment.

The practical difference is that agents build on prior work. When I ask an agent to email someone, it searches Neotoma for the contact first. When I ask it to process feedback, it retrieves existing feedback entities and links new ones. When I ask it to pay a contractor in Bitcoin, it knows the standing rule (always pay this person in BTC) and includes the transaction link in the confirmation because another standing rule says to.

## Storage and retrieval up close

The Neotoma MCP exposes tools that agents call directly. Here is what real storage and retrieval looks like in practice.

When an agent needs to persist a conversation turn with extracted entities, it calls `store` with a single payload:

```json
store({
 "entities": [
 {
 "entity_type": "conversation",
 "title": "Email triage March 9"
 },
 {
 "entity_type": "agent_message",
 "role": "user",
 "content": "triage my inbox",
 "turn_key": "conv-42:1"
 },
 {
 "entity_type": "contact",
 "full_name": "Alex Chen",
 "email": "alex@example.com",
 "source": "tester feedback call"
 },
 {
 "entity_type": "task",
 "title": "Follow up on Alex's feedback",
 "status": "pending",
 "priority": "medium"
 }
 ],
 "relationships": [
 {
 "relationship_type": "PART_OF",
 "source_index": 1,
 "target_index": 0
 },
 {
 "relationship_type": "REFERS_TO",
 "source_index": 1,
 "target_index": 2
 },
 {
 "relationship_type": "REFERS_TO",
 "source_index": 1,
 "target_index": 3
 }
 ],
 "idempotency_key": "conv-42-turn-1-triage"
})
```

One call stores the conversation, the message, a new contact, and a task, all linked by typed relationships. The agent did not need a schema definition for `contact` or `task` beforehand. Neotoma accepts arbitrary fields and infers structure.

When an agent needs context before responding, it queries by identifier:

```json
retrieve_entity_by_identifier({
 "identifier": "Alex Chen"
})
```

This returns the contact record with email, prior conversations, and the provenance of each field. If the agent needs broader context, it queries by type:

```json
retrieve_entities({
 "entity_type": "feedback_note",
 "search": "developer release",
 "limit": 10
})
```

This returns the ten most relevant feedback notes about the developer release, each with its full snapshot and observation history.

For standing rules, the agent retrieves them once at the start of a workflow:

```json
retrieve_entities({
 "entity_type": "standing_rule"
})
```

My instance returns rules like "always pay Carlos in Bitcoin" and "provide drafted messages in markdown blocks." The agent applies these automatically for the rest of the session.

When workflows touch files (receipts, screenshots, documents), the agent stores them alongside entities in the same call using `file_path`:

```json
store({
 "entities": [
 {
 "entity_type": "transaction",
 "vendor": "Amazon",
 "amount": 47.99,
 "currency": "EUR"
 }
 ],
 "file_path": "/path/to/receipt.pdf",
 "idempotency_key": "amazon-order-march-9"
})
```

Neotoma's [unstructured storage path](https://github.com/markmhendrickson/neotoma) handles the file from there. The raw bytes are content-addressed (SHA-256) so the same file is never stored twice. The agent passes the file as-is via `file_path` (local environments like Cursor) or `file_content` (base64, for web-based environments); it does not interpret or extract data before storing. By default, Neotoma runs AI interpretation on the stored file automatically, extracting structured entities and linking them back to the source with an EMBEDS relationship. Re-storing the same file with `interpret: true` triggers reinterpretation without creating a duplicate. The receipt becomes queryable structured data with the original PDF preserved for provenance. Interpretation can also be deferred (`interpret: false`) for batch processing or quota management, then run later with different configuration.

## Workflows in practice

A few workflows show the pattern.

**Email triage.** The agent reads unread emails via Gmail MCP, checks Neotoma for existing contact records and prior context with each sender, drafts replies using my communication style rules, stores new contacts and tasks, and archives processed messages. A single triage run might store five new contacts, three tasks, and a dozen conversation turns.

**Blog post writing.** The skill itself lives in Neotoma as a structured entity. The agent retrieves it with `retrieve_entity_snapshot`. It then queries existing posts for style calibration, writes the draft, stores the post entity with all metadata, generates hero images, creates share copy for Twitter and LinkedIn, regenerates the website cache from the Neotoma export, and deploys. This post was written that way.

**Bitcoin payments.** I pay a contractor in Bitcoin using [a BTC wallet MCP server](/posts/agentic-wallets-mcp-bitcoin). Neotoma stores the standing rule, the contact record, and the transaction history. The agent retrieves all three, executes the payment, stores the new transaction with the on-chain link, and confirms.

**Feedback processing.** When testers give feedback on the Neotoma developer release, agents extract structured feedback entities, link them to the tester's contact record, classify the feedback by bucket, and assess it against release stage constraints. Prior feedback is retrievable by tester, by bucket, or by date.

**Website deployment.** The deploy skill syncs local markdown edits to Neotoma, exports the full website dataset, regenerates the cache, pushes the [website repo](https://github.com/markmhendrickson/markmhendrickson), and monitors [GitHub Actions](https://github.com/features/actions) until the build succeeds. If the build fails, the agent reads the logs, fixes the issue, and re-runs.

## Toward agents that run without me

Every workflow starts with me opening a Cursor agent and typing an instruction. I am in the loop for every task. That is fine for the current stage, but it is not the end state.

I am setting up automated processes so agents can handle workflows without my direct involvement. The pieces are already there: skills define the full workflow steps, Neotoma stores the context and rules, MCP servers provide the reach. What is missing is the orchestration that triggers workflows on schedule or in response to events, and a lightweight approval interface so I can review and authorize actions without sitting at my laptop.

Neotoma's [layered architecture](https://github.com/markmhendrickson/neotoma/blob/dev/docs/foundation/layered_architecture.md) is designed for exactly this. It separates three concerns:

1. **Truth layer (Neotoma).** Event-sourced, reducer-driven, deterministic. All agents read from it. State updates flow only through domain events processed by reducers. No agent mutates truth directly.
2. **Strategy layer.** Reads the current world state from Neotoma. Evaluates priorities, constraints, risk, commitments, and time. Outputs decisions and commands. Pure cognition: state in, decisions out. No side effects.
3. **Execution layer.** Takes commands from the strategy layer. Performs side effects through external adapters (email APIs, payment services, calendar, messaging). Emits domain events describing what happened. Those events flow back through reducers to update state. Pure effect: commands in, events out.

The loop is closed:

```
Inbound signals (email, WhatsApp, calendar, financial data)
 -> Normalization -> Neotoma state (event log + reducers)
 -> Strategy tick (evaluate priorities, output decisions)
 -> Execution agents (perform side effects, emit events)
 -> Reducers -> Updated state
 -> Next tick
```

Today, I am the strategy layer. I look at the state, decide what to do, and tell an agent to execute. The architecture makes that role replaceable by software. A strategy engine reads Neotoma, evaluates what needs attention based on standing rules and priorities, and issues commands to execution agents. Those agents call MCP servers, store the results, and the cycle repeats.

The critical invariant is that no layer writes to Neotoma's underlying data store directly. Updates only flow through domain events and reducers. That makes the system auditable and reversible. If an autonomous agent makes a bad decision, I can trace the event that caused it, revert the state update, and correct the rule that led to it.

The goal is to reduce my daily time at the computer. Not eliminate it. Shift from hands-on execution to review and approval. I want to wake up to a summary of what my agents handled overnight: emails triaged, posts drafted, deployments verified, payments queued. I want to approve a Bitcoin payment from my [Apple Watch](https://www.apple.com/watch). I want to review a drafted email on my phone while walking and tap to send. The agents handle the 80% that is repeatable. I handle the 20% that needs judgment.

This is where the hardware question gets interesting. Today's phones and watches are not designed for this interaction pattern. You need a device optimized for brief review and approval gestures, not for typing or browsing.

Of the devices that exist today, the [Apple Watch](https://www.apple.com/watch) feels closest to the right form factor: always on your wrist, glanceable, capable of simple tap-to-approve interactions. But the software layer is not there yet. There is no way to pipe agent summaries and approval requests to the watch in a way that feels native.

That might be an area for me to experiment with at some point, building a lightweight companion app that bridges Neotoma's state to a wrist-level interface. Whether the right surface ends up being a watch app, a dedicated AI device, or something that does not exist yet, the interaction model is clear: agents do the work, structured memory holds the state, and the human provides direction at the pace of intent rather than the pace of execution.

## Open-sourcing the stack

The stack is private today because it contains my life: contacts, finances, health data, personal communications, standing rules about how I run my household. Before I can open-source it, I need to untangle all of that.

The path is straightforward. Personal data moves fully into Neotoma, which is already the source of truth for most of it. Scripts that reference my specific accounts and paths get refactored to read from configuration. MCP server wrappers become generic. Skills lose their hardcoded assumptions.

What remains is a reusable agentic stack: a monorepo template with MCP server scaffolding, a rules and skills framework, Neotoma integration for structured memory, and example workflows that anyone can adapt. The architecture is the interesting part. My personal data is not.

I do not have a timeline for this. The refactoring happens alongside the daily use. Every time I touch a script, I make it more generic. Every time I move data into Neotoma, I remove it from the repo. The stack gets more portable with each session.

## What this proves about Neotoma

I built this stack before Neotoma existed. The early version used flat files and [Parquet](https://parquet.apache.org) tables. It worked until it did not.

The [failure modes](/posts/truth-layer-agent-memory) were specific: an agent would store a contact as "Sarah Kim" in one session and "S. Kim" in another, creating duplicates with no way to merge them. There was no provenance, so I couldn't tell which agent wrote a field or when.

Queries were limited to exact matches on single columns, so asking "what feedback did I get last week?" meant scanning every file manually. Occasionally records were overwritten badly or deleted entirely, with no event log to recover from. And nothing linked across types, so knowing that a task related to a contact related to a transaction required me to hold that graph in my head.

Neotoma replaced that layer. It gave agents a [structured, queryable, relationship-aware memory](/posts/agent-memory-truth-problem) that works across every workflow. The stack now has 170 entity types in Neotoma, not because I designed 170 schemas upfront, but because agents create entity types as they encounter new kinds of information. A feedback note is different from a transaction is different from a standing rule, and the system handles all of them.

This is the dogfooding that keeps Neotoma honest. When retrieval is slow, I feel it in every agent session. When entity resolution fails, I get duplicate contacts. When storage is unreliable, workflows break. Every bug and every gap shows up in my daily work before it shows up in anyone else's.

The memory problem is universal. Every developer building agentic workflows will hit the same wall: agents that cannot remember, cannot query, and cannot build on prior work. [Retrieval alone is not enough](/posts/why-agent-memory-needs-more-than-rag); structure and provenance are what make memory trustworthy. This stack is proof that structured memory changes what agents can do. Neotoma is how I am making that available to everyone.

The [developer release](/posts/neotoma-developer-release) is open for testing. If you are building agentic workflows and want structured memory underneath, that is where to start.
