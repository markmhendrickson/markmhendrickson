---
title: "Agent-to-agent issue resolution, with humans at the edges"
slug: "agent-to-agent-issue-resolution-with-humans-at-the-edges"
excerpt: "Agent-led evaluation tells a user whether Neotoma fits. The new issues subsystem lets the same agent file a bug or enhancement, exchange messages with the maintainer, and watch the change arrive, all through MCP, without a human ever opening a browser tab."
published: true
published_date: "2026-05-19"
category: "essay"
tags: ["neotoma", "issues", "mcp", "agent-to-agent", "formica", "process-issues", "nervous system", "multi-agent"]
heroImage: "agent-to-agent-issue-resolution-with-humans-at-the-edges-hero.png"
heroImageSquare: "agent-to-agent-issue-resolution-with-humans-at-the-edges-hero-square.png"
ogImage: "og/agent-to-agent-issue-resolution-with-humans-at-the-edges-1200x630.jpg"
heroImageStyle: "keep-proportions"
createdDate: "2026-05-19"
updatedDate: "2026-05-19"
---

A user pastes the agent-led evaluation prompt into their editor. The agent reads the [Neotoma evaluation page](https://neotoma.io/evaluate), scans the local workflow, decides the fit is strong, runs the install, and stores the first few entities. Some time later it hits a real bug — an entity submission silently drops a field that the schema clearly accepts. A little later it notices something else: retrieval over a large entity graph is slower than it should be for the workflow it is supporting. And later still, while building a custom retrieval loop, it realizes the MCP surface is missing a batch operation that would make the pattern it keeps repeating much cleaner. The user never asked about any of this. The agent noticed it on the way to doing something else.

The old shape of those moments was the end of the loop. The user could open GitHub, paste the error or the request, write a paragraph of context, and wait. Most don't. They route around the problem, the maintainer never sees it, and the next user hits the same wall.

Neotoma now has a first-class issues subsystem that operates through the same MCP surface every agent already uses to store and retrieve. The agent files bugs, performance observations, and enhancement requests without leaving the session, and without stopping to ask per-issue. The maintainer's agents pick them up, triage, often resolve, and ship. The reporter's agent reads the status back and tells the user when something lands. The whole exchange happens through tool calls.

The agent-led evaluation written about in [the customer research post](/posts/customer-research-through-agents) was the front half of this loop. The issues subsystem is the back half. Both halves run on the [nervous system substrate](/posts/from-memory-to-nervous-system) I described earlier, and the issues capability is the cleanest example yet of what that substrate is for.

## Why the loop has to close on the agent side

Friction is the silent killer of feedback. The old model assumed the user would translate their experience into a report on a separate system: switch context, find the repo, parse an issue template, write enough background that a maintainer can act, attach logs, wait. Each step is a chance to give up. Most do. And that model only covers problems the user noticed. It has no path at all for problems the agent noticed that the user never surfaced.

One evaluator's agent identified that activation produced a hydration error when their substrate config pointed to a self-hosted instance behind a Cloudflare tunnel. The agent wrote a precise summary, including the failing endpoint and the response headers. The user forwarded the summary to me as a message. I rebuilt the context, routed it to my agents, shipped a release, and messaged the user back. The user asked their agent to verify. That verification took about ninety seconds. The human relay steps took days.

The agent's original summary was good. It was the rebuilding-context that ate the time. Each handoff between an agent and a human loses fidelity. Each handoff between a human and another agent rebuilds context from scratch. Rich agent-authored detail compresses into terse human-authored prose, and then a downstream agent has to expand it back out.

When the user's agent is the one that hit the wall — or noticed the slowness, or wanted the missing capability — the translation step is free. The agent already has the context: which tool it was running in, the exact MCP call that failed or felt awkward, the response payload, the git SHA or app version of the Neotoma install, the entity type involved. It composes a coherent report in one tool call. The MCP instructions tell agents to file via `submit_issue` immediately when a reportable problem or improvement opportunity is confirmed, without stopping to ask per-issue — the per-issue prompt adds no new information and interrupts whatever the user was doing. The agent files. The user finds out about it later, or never, depending on whether the change ever ships.

On the maintainer side, the loop has to close without me reading every report by hand. I run about a dozen agents across editors and daemons. They already process incoming structured state. The natural shape is: a new issue arrives, the substrate signals on write, a triage daemon picks up the event, reads the issue, decides whether it can act, opens a worktree, runs an agent session against the codebase, and either resolves the bug or asks the reporter for clarification through the same thread.

Both halves of the loop run as agentic work over the same substrate. The user's agent uses MCP to submit. The maintainer's agents use MCP to read and respond. Nobody has to open a browser.

## What the agent does on submission

The MCP surface is small enough to enumerate. The `submit_issue` tool takes a title, a body, an entity type if the issue is about a specific kind of record, and a reporter environment block — the git SHA the user is running or the app version, with the latter auto-populated server-side when the agent omits both. The reporter environment carries more weight than it looks like; the next section unpacks why.

Reports rarely arrive without context. A bug references concrete entities: the specific record that failed to store, its schema, an upstream observation. An enhancement request references the call pattern it would simplify, or the entity type it would make faster to retrieve. `submit_issue` and `add_issue_message` accept an `entity_ids_to_link` array, and the server creates `REFERS_TO` relationships from the new issue to each referenced entity atomically as part of the same call. The issue lands already wired into the graph it is about. The triage agent reading the issue can traverse straight to the entity that failed.

The submission flows through the same `scanAndRedact` PII guard that protects every public surface. If the agent accidentally pastes a token or an email address into the body, it gets redacted before persistence. The MCP instructions require agents to apply the PII checklist to title and body before the call, but the server-side guard is the actual line of defense. The reporter gets a numeric issue identifier and a guest read-back token with an explicit TTL, scoped to the thread they just opened. That token is how the reporter's agent reads the status later without re-authenticating each time.

From the user's perspective: one tool call, one identifier to track, and usually no approval prompt at all. From the substrate's perspective: a structured entity got written, the linked-entity relationships were created in the same transaction, a source row was created, a guest grant was issued, and the write pipeline emitted an event.

## Provenance is the unsung hero

The reporter environment requirement looks like a small detail. It's the most important shift.

Before the issues subsystem existed, a report could be submitted with no reference to the build it was authored against. That's fine for a paper ticket. It's catastrophic for an automated triage loop. If an agent submits a bug at commit `abc1234` and my agents fix it at commit `def5678`, the user's agent has to know which build to verify against. If a debugging thread spans three builds, each comment has to record which build it was tested in. The same applies to an enhancement request: knowing which version the agent was running when it identified the missing batch operation tells me whether the gap was already addressed in a later build or is genuinely open. Without provenance, the thread becomes archaeology.

`submit_issue` rejects any submission that lacks both `reporter_git_sha` and `reporter_app_version`. The rejection envelope lists the alternatives explicitly:

```json
{
  "error_code": "ERR_REPORTER_ENVIRONMENT_REQUIRED",
  "details": {
    "acceptable_field_groups": [
      ["reporter_git_sha"],
      ["reporter_app_version"]
    ]
  }
}
```

`add_issue_message` accepts the same fields and emits a server warning on public threads when both are missing. Every message a debugging agent authors records the build under test.

The reason this matters for agent-to-agent handling is that it lets the receiving side classify the report before doing any work. For a bug: did the user run a published release? Branch from `main` and open a PR. A specific commit on a feature branch? Create a worktree at that commit, reproduce, and report findings without modifying mainline. Their own fork? Post a structured follow-up asking for the patch source. For an enhancement: is the requested capability already on a branch, or genuinely missing? Does it conflict with a design constraint the agent filing it can't see? The classification determines the response — and none of it is possible without provenance.

Provenance is what turns a free-form report into a routable event, whether it describes something broken or something missing.

## What happens on the maintainer side

My triage daemon subscribes to issue creation events through the same `subscribe` tools any other consumer would use. Webhooks come first because they work for remote daemons on a VPS as well as local processes on my laptop; SSE is additive. The substrate maintains the registry, delivers the event, and forgets. The daemon decides.

The daemon I run for this is called Formica. Genus _Formica_, ants. Each subagent is a worker carrying one piece of work from the event log to a fix.

What it does, in practice: read the issue. Pull the entities the reporter's agent linked at submission time, since the relationships are already in the graph. Mirror to the upstream GitHub repo if it warrants a public trail, with PII redaction applied at the API boundary and any issue whose title or body still match a redaction pattern rejected before it crosses the line. Classify whether the report is a bug or an enhancement. For bugs: decide whether it is reproducible from the reporter environment alone, then hand off to a `/process-issues` skill that opens a worktree, runs an agent session, and attempts a fix. For enhancements: synthesize a plan entity that aggregates the request with any related open issues, and surface it for human review rather than attempting autonomous implementation. If more context is needed for either type, post a clarifying question through `add_issue_message` so the reporter's agent receives it on the next status read.

The `/process-issues` skill drives the actual fix. The contract is short. For each open issue:

- Load the snapshot, conversation thread, and reporter environment.
- Classify the reproduction environment as `public_release`, `local_commit`, `local_branch`, or `unknown`.
- If unknown or conflicting, call `add_issue_message` with a structured request for the missing detail and mark the plan `awaiting_input`.
- Otherwise, synthesize a `plan` entity linked to the source issue and the relevant conversation message rows.
- If the plan touches schema, security, foundation docs, or an ambiguous architectural boundary, stop and ask. Don't execute.
- If execution is safe and allowed by reporting mode: branch from `main` for a public release reproduction and open a PR, or create a detached git worktree for a local reproduction and report the path.

Subagents fan out with a concurrency cap of four, one issue per subagent. The skill honors `reporting_mode`: `off` generates and stores plans only, `consent` asks before executing, `proactive` executes safe plans autonomously. Never push to `main`. Never use `--no-verify`. Never amend a pushed commit. The redaction leak guard runs before any public artifact is created from a private issue.

Safe defaults stay on:

- `dry_run: true` for the first run of any new issue type so I see what would happen before anything writes.
- `auto_fix: false` so nothing pushes or opens a PR until I confirm via the operator transport.
- `max_prs_per_hour: 5` so a flood of related issues can't fan out into a flood of branches.
- `dirty_tree_policy: abort` so a stale checkout never gets used as the base.
- A kill switch via a `daemon_config` entity in Neotoma with `active: false`, so I can pause all processing from a single Neotoma write without touching the host machine.

The operator transport piece deserves a note. Formica supports a Telegram backend that surfaces `human_needed` handoffs and `/shipit` commands for resuming when `auto_fix` is off. Allowlisted Telegram messages are mirrored to Neotoma as `conversation_message` rows, so even my human-side back-and-forth with the daemon is captured in the same substrate. The audit trail is end to end.

The `add_issue_message` path is the one that surprised me when I started using it. It is not a comment system. It is a structured message channel between an issue's reporter and the maintainer side, threaded through the same conversation primitives that already exist for agent-to-agent threads. The reporter's agent can respond to a clarifying question without the human having to read it in between. Public threads carry the same PII redaction, and partial-success cases (GitHub mirror accepted, local append failed, or vice versa) surface as a structured error on the response rather than silently producing duplicate comments.

When a fix lands, the same daemon that triaged the report closes the issue, or bulk-closes several at once if a single PR resolved a cluster.

## What the reporter's agent does on read-back

The other side of the loop is the read. The reporter's agent calls `get_issue_status` with the issue number or entity ID. It receives the current status, the messages on the thread, the resolution if any, and the link to the upstream mirror if the maintainer side chose to escalate it. The guest token authenticates the read without the user having to log into anything. If the token has expired, the substrate returns a clean 401 instead of silently downgrading to anonymous access.

The agent decides whether to surface the status to the user. If nothing has changed since the last check, it stays quiet. If a clarifying question arrived, it asks the user. If the fix shipped, it tells the user, optionally pulls the new version, and offers to re-run whatever broke the first time.

The current read model for the reporter side is pull — the agent checks when it has reason to — but push is available today through the same subscription tools the maintainer's daemon uses. Subscriptions can be scoped to a specific entity ID, so a reporter's agent can register interest in the issue it just filed and receive `entity.updated` and `observation.created` events as the thread progresses. What's missing is the ergonomic glue: the MCP instructions don't yet tell agents to auto-subscribe after `submit_issue` returns. Until they do, the reporter side stays pull-by-default; the maintainer's agents already wake on substrate events. Fully reactive on both halves is one instruction change away.

## Why this is the nervous system in action

The substrate emits events after every write. That is the only thing the substrate has to do for any of this to work. Everything else is operational-layer logic running on top: the triage daemon, the GitHub mirror, the guest read-back, the cross-thread dedup, the PII redaction.

This is the line I [argued for in the nervous system post](/posts/from-memory-to-nervous-system) and it holds up under the issues use case. The substrate does not decide which issues matter, does not retry deliveries with escalation, does not subscribe to its own events. It signals. The triage daemon is a consumer, the reporter's agent is a consumer, the GitHub mirror is a consumer. Each consumer registers interest, decides what to do, and acts. If I want to add a second triage daemon that handles security reports differently, it subscribes to the same events with a different filter. No new substrate behavior.

The biological framing holds. The substrate is the brain plus sensory nerves: it stores the issue, it transmits the signal that an issue arrived. The triage daemon and the reporter's agent are the motor system: they decide what to do about the signal. A version of Neotoma that tried to be all three would be harder to reason about and harder to extend. A version that stops at signaling stays neutral.

## Inheriting the loop

The shape I've described is built around Neotoma's own issues, but the substrate doesn't care. Anything built on top of it inherits most of the same machinery.

The generic side of submission is already in place. `submit_entity` accepts reports against arbitrary entity types when the operator has seeded a `submission_config` row authorizing it. The same guest-token grant, the same conversation threading, the same `add_entity_message` follow-up channel apply. `subscribe` accepts any entity type as a filter, so a third-party operator can run their own triage daemon by registering interest in their custom types and reacting to `entity.created` and `entity.updated` events exactly the way Formica reacts to issues.

What this means in practice: if you're running a content pipeline, a reconciliation service, or any product whose users run agents, you can let those agents file structured reports against entities you own — a failing pipeline run, a misclassified record, a reconciliation request — and pick them up on your side through the same subscription mechanism. The wire is general.

A few pieces stay specific to Neotoma's own issues today. The PII redaction guard is currently tied to the `submit_issue` path, not the generic `submit_entity` path. The GitHub mirroring is issues-specific. Both are operational-layer additions a third-party operator would wire themselves. The substrate handles the parts that have to be uniform — provenance enforcement, atomic relationship creation, guest access scoped to the thread, event emission on every write. The parts that depend on what the report is *about* are where the operator earns their keep.

The issues subsystem is the first complete consumer of a more general pattern. The same shape applies to any structured signal an agent might want to send back to the system it's running against.

## Why human review stays

Two things tempt me to wire `auto_fix: true` and ship everything the daemon produces.

The first is convenience. A green pipeline that closes issues while I sleep is satisfying. The second is the fact that for a meaningful fraction of issues, the agentic plan and the diff are correct. I've watched enough of them now to know the failure mode isn't usually "wrong fix." It's usually "fix for the wrong scope," which a code review catches in thirty seconds.

I'm leaving human review in because agents are occasionally confidently wrong about decisions with downstream consequences they can't see. A schema migration that satisfies the failing test but breaks an unrelated integration. A redaction tweak that fixes the immediate leak but loosens a related guard. A dependency bump that resolves the build error and silently changes the default behavior of a query.

Enhancement requests sharpen this further. A bug has a ground truth — either the field is dropped or it isn't. An enhancement is a design claim that carries assumptions about usage patterns, architectural constraints, and tradeoffs the reporting agent can't fully see. The signal is valuable; it surfaces real friction, not imagined friction. But the decision about what to do with it belongs to a human who can see the full picture.

The decisions that need a human are the ones where the cost of being wrong is high and the cost of being slow is low. Those are the merges — not the plans, the patches, the tests, or the PR descriptions. Agents handle everything else. Agents propose; humans decide.

## The agentic loop, end to end

Read alongside the customer research post, the shape is now legible. The front half: the user's agent evaluates Neotoma against their real workflow and installs it if the fit is there. The back half: the agent files bugs, performance observations, and enhancement requests as it encounters them, and the maintainer side resolves them — often before the user remembers any of it was filed.

Both halves operate on agents talking to agents through one structured surface. The friction that historically killed both the acquisition loop and the feedback loop is gone because each translation step has been absorbed into a tool call. Neither half would be possible without the substrate underneath: agent-led evaluation needs structured state about the user's workflow, and the issues subsystem needs event signaling plus guest access across trust boundaries. Both depend on the same primitives.

## What I'm not building

The temptation in the issues subsystem is to drift toward orchestration: a prioritization model, automatic SLA tracking, a "smart" router that decides which daemon handles which issue type. Each sounds reasonable in isolation. None of them belong in the substrate. The triage daemon prioritizes. The maintainer's agents track their own response times. Routing is a subscription filter.

The same applies to retry semantics. If a webhook delivery fails, the substrate logs the failure and moves on. It does not escalate to a backup channel, does not buffer for replay, does not flip a consumer into a degraded state. Message brokers do all of that and they're good at it; the substrate is not a message broker. Consumers that want guaranteed delivery wrap the signal in their own infrastructure.

The constraint is the feature. A state layer that signals issues but does not decide which issues matter is a state layer any consumer can trust to behave predictably.

## What I want feedback on

The issues subsystem is live. If you have Neotoma installed and your agent hits something rough — a bug, a performance gap, a missing capability it wishes existed — you no longer need to ask it to file an issue. To pick this up on an existing install, upgrade with `npm install -g neotoma@latest`. There's no per-user consent toggle to configure; the consent is the install. If this is a fresh install, `neotoma reporter setup` walks through the one-time reporter-side configuration so the first issue your agent files has somewhere to land.

If you don't have Neotoma installed yet, ask your agent to run the evaluation page. If it concludes Neotoma fits, it can install and activate without you reading a configuration doc. If it concludes Neotoma doesn't fit, that's a valid outcome too, and a more honest one than most landing pages produce.

If you're building a product whose users run agents, the model is portable. The interesting work isn't on either side of the wire; it's the wire itself.
