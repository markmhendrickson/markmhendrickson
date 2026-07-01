A few months ago I wrote about [my agentic stack](/posts/what-my-agentic-stack-actually-does): a private monorepo where AI agents handle my email, payments, and deployments, with [Neotoma](https://neotoma.io) as the structured memory underneath. That post ended on a promise. I said I was the strategy layer, and that the architecture was designed to make that role replaceable by software. This is the post about doing it.

[Ateles](https://github.com/markmhendrickson/ateles) is my second product, after Neotoma, and it builds directly on top of it. It is a personal agent swarm. Where the old stack was one agent per session with me in the loop for every task, Ateles is a standing fleet of agents defined by role, coordinated through Neotoma, running daily under launchd. It is the difference between me driving each agent and me directing a team that already knows its jobs.

This post explains why I built it, how it works, and where it is going.

## Why the stack stopped scaling

The trigger was volume. After Neotoma's [developer release](/posts/neotoma-developer-release) in late February, my work split across three modes that each pull in a different direction: building the product, marketing it, and managing relationships with early users. The context behind them lived in one place, but I did not. I was the one paying to switch between them, and every jump cost focus and time. Meanwhile I kept feeding Neotoma more and more context about my life, professionally and personally, and the better that memory got, the more any single agent could do with it. That did not remove the constraint, it moved it. The limit was no longer what the agents knew. It was me, the only one turning what they knew into action, one session at a time.

The old approach was a set of repo-specific rules and skills. They let me avoid repeating myself on procedure. A skill defined the steps for email triage or a website deploy, and any session could run it against the context already in Neotoma. That worked until the sessions got busy.

The failure was specific. When one generic agent carries every rule and every role at once, it does not hold all of them evenly. At any given turn it leans into one kind of work and lets the rest slide. It drafts the email well and forgets the standing rule about how I sign off. It fixes the bug and skips the regression test. There was also no adversarial check. One agent planned, executed, and reviewed its own work, with nothing to catch it when it was confidently wrong.

Two more things pushed the same direction. I moved my product operations onto GitHub by default, using issues and pull requests instead of committing straight to main. That was partly forced by the [issue pipeline I built](/posts/agent-to-agent-issue-resolution-with-humans-at-the-edges), which started routing real reports from users and their agents into Neotoma and out to GitHub. And I wanted my development process to be legible in public, so the people using Neotoma could see exactly what work was going on. Both of those want a sequence of specialized agents across design, product management, QA, and release. One agent doing all of it defeats the point.

So Ateles is the decision to spin up a fleet, and to define that fleet in Neotoma itself.

## Neotoma as the fabric, not just the memory

The move that makes Ateles different is that Neotoma holds two things at once. It holds the operational context the swarm needs, the same facts my old stack read and wrote. And it holds the swarm itself.

Agents are Neotoma entities. Each one is an `agent_definition` with a prompt, a tool allowlist, and a set of capability grants. Updating how an agent behaves is a `correct()` call against that entity, with full version history and author attribution. No commit, no redeploy. The SKILL.md files on disk are generated mirrors of those entities, not the source.

Their relationships are Neotoma entities too. The swarm has a hierarchy, expressed as a tree, so a coordinator knows which agents it dispatches and a task knows which agent owns it. And the work itself is Neotoma entities: tasks, plans, workflow definitions, participation records. An agent picks up a task, does it, and writes the result back as an observation attributed to its identity.

The result is one world graph for everything. The facts the swarm acts on, the definition of the swarm that acts on them, and the record of what it did all live in the same append-only store. That gives the whole thing three properties I care about. It is transparent, because every action is an attributed observation you can read back. It is auditable, because you can replay any agent's actions over any window. And it is reversible, because nothing overwrites truth in place. If an agent makes a bad call, I can trace the event that caused it, revert the state, and correct the rule that led to it, once.

Identity is the piece that makes attribution real rather than aspirational. Every agent has an [AAuth](/posts/know-which-of-your-agents-wrote-what) keypair and signs every tool call. The harness verifies the signature before acting and records who claimed to act alongside who actually acted on GitHub. A code-writing agent no longer just acts as me. It acts as itself, and the log says so.

## The agents, by role

The swarm is organized in tiers. T1 is the host: the process that owns a channel and spawns the agents, currently OpenClaw for the ones I talk to and launchd for the background ones. It is infrastructure, not an agent with a role. The agents themselves run in three tiers on top of it. T2 agents are always-on and hold a persona: Ateles itself is the one I talk to, and it is the only agent that pages me. T3 daemons are event-driven background processes with no persona, each subscribed to Neotoma events or an external webhook. T4 agents are stateless, spawned per task, with a stable identity and memory they get by querying Neotoma.

The roles, grouped by what they own:

**Product.** A coordinator daemon reads workflow definitions from Neotoma and dispatches gates in order: design, product management, QA, release. Code work goes to an issue worker that opens pull requests across repos. Every pull request gets a baseline review from a separate reviewer agent, with domain specialists fanning in on the paths they own. The point of splitting these apart is the adversarial check the single agent never had. The one writing the code is not the one clearing it.

**Finance.** A recurring-payment daemon runs Wise and Bitcoin transfers triggered by calendar events and task due dates, with every recipient and amount loaded from payment profile entities rather than code. Adding a new recurring payment is a new entity, not a commit. A finance advisor role and a tax-and-filings role are defined for budgeting and reconciliation.

**Legal and compliance.** A legal role for risk assessment and terms review, and a compliance role for privacy and data governance, are defined and coming online. These matter more the moment a swarm can act on people's data, which mine does.

**Strategy.** This is the role I described as mine in the last post, and it is the one I am most deliberately handing over. That handoff is the concrete version of an argument I made in [The Human Inversion](/posts/series/the-human-inversion): as agents absorb the execution middle, the human's leverage moves to the ends, sharper standards going in and denser judgment coming out. Autonomy is calibrated per plan, not globally. An execution policy entity declares, for a given plan, what an agent is allowed to do on its own, what quality bar it has to clear, and where it must stop and check with me before proceeding. The escalation chain runs from the acting agent to a domain expert to a constitution keeper to me, and each resolution is written back as an entity so the next instance inherits the judgment.

**Operations.** A release coordinator drives that whole GitHub lifecycle on a schedule, from issues through the workflow gates to the release trigger, and a triage daemon routes incoming issues and pull requests to the right worker as they arrive. This is the machinery that lets the development process run in public without me shepherding each step.

Behind these sit the ingestion and support daemons that keep the graph fed: email triage, audio import, calendar prep, health and fitness, issue triage. Each is a small process that turns an inbound signal into Neotoma entities the rest of the swarm can act on.

Still more roles are defined and coming online as the swarm fills out: dedicated product management and design, QA, growth and go-to-market, data analysis, and developer relations. The pattern is the same for each. A role is an entity before it is a running process, so adding one is a definition, not a rebuild.

## The task spine

What ties the fleet together is task management, and it is deliberately boring. A task is an entity. It has an owner, a state, a priority, and a record of who it was executed for. Plans group tasks and carry their own decisions and next steps. Workflow definitions declare the phases and gates a piece of work moves through.

Because all of this is in the same store as everything else, the swarm coordinates without a separate orchestration database. A daemon subscribes to task events over Neotoma's event stream. When a task appears, it routes to the right agent by domain, behind a gate that weighs the agent's confidence against how much damage a wrong action could do. Low blast radius and high confidence runs on its own. High blast radius waits for me.

This is the spine I am building the rest of the experience around.

## Where this is going

The interface I want is simple to state. I give the swarm an input, through whatever transport is nearest, and the swarm absorbs it and acts. A prompt in a terminal. An email. A Telegram message. An audio memo recorded on a walk, which is how the notes for this post started. All of it should land in the same graph, and the swarm should be proactive about the work it implies, without me holding any agent's hand through it.

Two properties make that possible. The swarm has to be self-evolving. As it takes on new context and new kinds of work, it should provision the capabilities and grow the skills it needs, adapting to my corrections rather than waiting for me to reconfigure it by hand. And my input, still required at the moments that genuinely need judgment, should never have to be given twice. I correct a way of doing things once, it becomes an entity, and the correction holds.

The nearer roadmap is about reach. Ateles was built for my own use, so a fair amount of it still assumes one operator, me. I am [driving it toward being installable and multi-operator](https://github.com/markmhendrickson/ateles/blob/main/docs/multi_tenant.md): a swarm someone else can fork, point at their own Neotoma, supply their own context entities, and run. Because the agents are operator-agnostic by policy and nothing operator-specific is baked into the code, the fork case is mostly a matter of context, not rewriting. The genuinely new work is supporting more than one human inside a single tenant, which is why the tenant boundary is designed in now rather than retrofitted later.

Neotoma made agents that remember, and Ateles is what that memory made possible: a swarm that can act on it without me in the middle of every step. The two rise together. Better memory is not a finished problem I moved past. It is the substrate the whole swarm stands on, and every gain in what Neotoma can hold and resolve is a gain in what the swarm can do. The memory keeps improving, and the swarm keeps improving with it.

Ateles is open source. If you want the technical details, the tier model, the AAuth identity layer, the agent and workflow schemas, and how it all wires into Neotoma, the code and docs are on GitHub: [github.com/markmhendrickson/ateles](https://github.com/markmhendrickson/ateles).
