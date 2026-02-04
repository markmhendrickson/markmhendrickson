# Working with agents like a team

I use a single repository as the shared context for everything I do with AI agents. Strategy docs, operations playbooks, 60-plus data types, and a stack of MCP servers that read and write the same state. Over time it’s started to feel less like “me plus a tool” and more like working with a team. The other members are agents that share the same playbook and the same source of truth.

Here’s how that actually works in practice, and why the “team” metaphor holds.

## One playbook, many sessions

When I open a new Cursor session (or switch context, or come back tomorrow), the agent that loads in doesn’t start from zero. It reads the same docs I do: strategy at the top, tactics under that, operations at the bottom. It’s told that strategy overrides tactics, and tactics override operations. When I ask for something that touches finance or tasks or email, the agent isn’t guessing. It’s following the same hierarchy and the same procedures I would expect from a human who’d read the repo.

That means I can hand off work. “Triage the inbox” runs against the email protocol. “Update the task with what we decided” runs against the persistence rules and the task schema. “Run the liquidity scorecard” runs against the quarterly process. I don’t re-explain the rules each time. The playbook is in the repo; every session loads it.

## Shared state, not shared memory

The agents don’t share a brain. They share *state*: parquet datasets under a single data directory, exposed through MCP so every session reads and writes the same tasks, contacts, transactions, execution plans, and so on. When one agent creates a follow-up subtask or updates a contact after an email, the next agent (or the next session) sees that update. No “remember last time we…”. The record is just there.

That only works because the rules are strict. Data lives in normalized files; imports are read-only archives. Writes go through MCP; snapshots are created before changes. The “team” isn’t relying on fuzzy memory. It’s relying on the same tables and the same contracts. That’s what makes handoffs reliable.

## Why it feels like a team

With a human team you get: a shared playbook, a single source of truth, and clear precedence when rules conflict. I get the same here. The playbook is the doc tree and the rules in `/docs`. The source of truth is the Truth Layer (parquet today; [Neotoma](https://github.com/markmhendrickson/neotoma) later). Precedence is strategy > tactics > operations. Agents don’t get a different copy of reality. They get the same repo, the same data, and the same precedence order.

When I say “evaluate this tweet against the social strategy,” the agent loads the strategy docs and applies them. When I say “process this email,” it runs the triage protocol, updates contacts and tasks, and creates a follow-up reminder. When I say “add this to the execution plan,” it writes through MCP and the next session can pick up from there. That’s delegation. The fact that the delegate is an agent doesn’t change the structure: shared context, shared state, explicit rules.

## The trust part

The reason this doesn’t collapse into chaos is the same reason I’m building Neotoma: state has to be explicit and inspectable. If “the team” were each agent maintaining its own idea of what’s true, handoffs would break. Instead, there’s one state layer, one set of schemas, and named operations (MCP tools, not ad hoc file edits). I can see what changed, when, and in which dataset. I can trust that the next agent, or the next session, is working from the same facts I am.

I’m not claiming this is a full “team” in the human sense. There’s no debate, no creativity in the sense of inventing new strategy. But for execution the pattern is the same: follow the playbook, update the shared state, hand off to the next run. The repo plus agents plus MCP is already behaving like a small team with one playbook and one source of truth. That’s the dynamic I’m optimizing for as I tighten the rules and move the data layer toward event-sourced, deterministic memory.
