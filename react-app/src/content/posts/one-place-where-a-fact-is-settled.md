Agents working on the same task can reach different answers when they read different versions of a fact. A due date shows the problem plainly.

Suppose invoice INV-2041 says payment is due on October 22nd, and a later email from the vendor moves the due date to October 29th. One agent reads the invoice, another reads the email, and a third prepares the week's payments from whatever it can find. The first answers October 22nd, the second answers October 29th, and the third answers whichever it found first. Nothing in that arrangement says which date counts, so the person running the agents has to check.

I made up this particular invoice example, but the arrangement behind it is real. I run [agents in three tools](https://markmhendrickson.com/posts/what-my-agentic-stack-actually-does) against one [Neotoma](https://neotoma.io/) instance. A mail poller stores incoming mail with its source and turns the messages that need action into tasks, and sessions in Claude Code, Codex, and Cursor pick up [the same tasks and plans](https://markmhendrickson.com/posts/the-swarm-that-runs-my-work). That setup, and my work on Neotoma as a comprehensive system of record, are where this essay comes from.

![A document and envelope each linked to separate fact slips](/images/posts/neotoma-paper/observation.svg "paper|Synthetic example · INV-2041|Two sources say different things about one invoice: the PDF says due October 22nd, a later email says October 29th.")

## Recall is good at a different job

Recall finds material that looks related to a question. A vector index or a long chat history can return both the invoice and the later email. That helps an agent find the evidence. Relevance alone does not [determine which due date to use](https://markmhendrickson.com/posts/agentic-search-and-the-truth-layer). The email changes the due date, but the original invoice still supplies the amount. A system of record applies a rule to each field so the payments agent can read the selected values and inspect their sources.

More tools and harnesses make this harder. One agent keeps [notes in a markdown file](https://markmhendrickson.com/posts/the-markdown-memory-ceiling), another keeps what it learned inside its chat product, and a third reads a shared folder. Each copy was correct when it was written. When the fact changes, the copies change at different times, or not at all, and no agent can ask which copy wins, because no place exists where that question has an answer. The system of record has to sit outside any one of them, in one place all of them can reach.

At the start of this year I called Neotoma [a memory layer and a truth layer](https://markmhendrickson.com/posts/truth-layer-agent-memory). I stopped because I came to think memory is the wrong category for Neotoma: it is [a confusing one](https://markmhendrickson.com/posts/your-ai-remembers-your-vibe-but-not-your-work), and people kept comparing Neotoma to memory products. What I need an agent to keep is exact data about many kinds of things, in a form that can be audited, and the plain term for the place that holds it is a system of record.

That place is what I mean by a system of record: it says what is current, where that came from, and what it replaced. Similarity search cannot answer those questions, because similarity says nothing about time or source.

> **Recall and the record**
>
> **Memory and retrieval tools help an agent keep and find context. A system of record takes on a different job. It computes the current value from accepted observations and keeps a path back to the evidence for each field. The two overlap, and a product can cover more than one.**

## What Neotoma does today

I build Neotoma, the system of record for AI agents. It is open source under the MIT license and runs locally, in a data directory you choose. What follows is what the latest published package on npm does today.

Every write is stored as a new observation, linked to the source it came from. A new value is added beside the old one rather than written over it. Neotoma can store the [original PDF or email](https://github.com/markmhendrickson/neotoma/blob/main/docs/developer/source_storage_by_reference.md) alongside the structured entities derived from it, keeping observations linked to their source.

Observations belong to entities. An entity's ID is derived from the entity type and its identifying fields. Within the same instance and identity rules, the same identifying values deterministically produce the same ID, so two agents storing the same invoice write to the same entity.

Entities can also be linked to one another: the invoice to its vendor, or a follow-up task to the invoice it concerns. An agent creates those relationships explicitly. They describe how the records fit together, while source links show the PDF or email behind an observation.

Neotoma automatically applies the schema's merge rule for each field to compute its current value from the observations. For most fields the latest observation wins. Given the same observations and the same merge rules, the reduction produces the same snapshot, without asking a model to choose again on each read.

Each current field names the observation that set it, and a stored observation names its source. That is a trail to the evidence, not proof that an agent read the evidence correctly. A correction is one more observation, not an edit, and the earlier value stays listed. You can also read one entity as Neotoma had it recorded at an earlier time.

Now return to the invoice. Both agents' writes land on one entity. The due date now reads October 29th and names the observation from the email. The amount still names the first observation, because nothing changed it. The payments agent reads October 29th, and the October 22nd observation stays listed with its source.

![A separate invoice and email each connect by fine threads to a marked record card](/images/posts/neotoma-paper/invoice-example.svg "paper|The current record · INV-2041|The due date now reads October 29th. The changed field points to the later observation. The amount still comes from the first observation. Both observations stay on record.")

Agents reach Neotoma through an MCP server, a REST API, and a CLI. The install guide explains how to connect supported tools and harnesses. Point each tool at the same instance and data profile or MCP entry to share records; separate entries can use separate databases.

People can inspect their records in the bundled Neotoma app.

An admitted [signed request](https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what/) can establish verified agent identity. Active scoped grants determine permitted actions; a signature alone is not permission.

## Where this is going

So far I have described a system of record that computes current values for agents. The direction is a system of record that people and agents maintain together, where anyone can ask which value is current, which source introduced it, whether it was observed, inferred, or decided, who had the authority to correct it, and which agents relied on the version before. The planned governance capabilities extend beyond today's signed identity, scoped grants, and app:

- Give each domain a clear owner, with authority to correct its records scoped to that domain.
- Represent competing claims, unresolved disputes and official positions explicitly.
- Show why a value holds, whose authority it follows and what a change would affect.

Ateles extends that direction on the operational side. In [Ateles's adapter design](https://github.com/markmhendrickson/ateles/blob/a3e4d9ed2c33ac867bb67447221d559cbe8c5810/docs/foundation/adapters.md#L14-L22), adapters bring information from systems such as mail, calendars, and code hosts into Neotoma, and carry authorized actions back to those systems. Neotoma stores the records; the connected tools perform the work.

The full vision, with where each part stands today, is in the [README](https://github.com/markmhendrickson/neotoma#vision-and-execution-status).

![Governed collaboration: a matching authority key enters one bounded part of a shared record while another stays separate](/images/posts/neotoma-paper/vision-domain.svg "paper|Governed collaboration|People and agents will maintain shared records, with clear authority to correct each domain.")
![Competing claims and decisions: two evidence-backed positions remain attached to the same subject while a selector marks one](/images/posts/neotoma-paper/vision-positions.svg "paper|Competing claims and decisions|The record will distinguish evidence, interpretations and decisions, preserving disagreements alongside explicit positions.")
![Explanations and impact: an exploded current field reveals its evidence and authority, with connections to affected records](/images/posts/neotoma-paper/vision-explanation.svg "paper|Explanations and impact|You will be able to inspect why a value holds, whose authority it follows and which connected records or agents a change could affect.")

## A system of record, not recall

Recall helps an agent find the invoice and the email. [A system of record tells it which values are current](https://markmhendrickson.com/posts/the-spine-of-the-loop). Agents that work across several tools need the second, in one place they can all reach, and a system of record helps only when the agents write to it and read from it.

If you run agents in more than one tool or harness, start with one workflow whose facts and entities belong together:

```
npm install -g neotoma
neotoma init
neotoma setup --tool claude-code
```

Use the setup option for your tool or harness; the install guide covers other supported integrations. Then store the workflow's interrelated facts and entities from one agent and read them from another connected to the same configured instance and data profile or MCP entry.

The install guide is at [neotoma.io/install](https://neotoma.io/install?utm_source=site&utm_medium=blog&utm_campaign=essay-system-of-record). The code and the issue tracker are on GitHub at [github.com/markmhendrickson/neotoma](https://github.com/markmhendrickson/neotoma).

> **The ambition**
>
> **Neotoma is the system of record for AI agents. The ambition is to give people and agents a shared understanding they can inspect and govern: what is known, why it is believed, where they disagree, and who has authority to change it. That understanding should outlast any particular model, tool or application.**
