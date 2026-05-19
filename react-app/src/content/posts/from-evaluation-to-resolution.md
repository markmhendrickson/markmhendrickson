---
title: "From evaluation to resolution"
slug: "from-evaluation-to-resolution"
excerpt: "Agent-led evaluation tells a user whether Neotoma fits. The new issues subsystem lets the same agent file a bug, exchange messages with the maintainer, and watch the fix arrive, all through MCP. The feedback loop closes without a human ever opening a browser tab."
published: false
published_date: "2026-05-19"
category: "essay"
read_time: 12
tags: ["neotoma", "issues", "mcp", "agentic feedback", "nervous system", "multi-agent", "build-in-public"]
heroImageStyle: "keep-proportions"
createdDate: "2026-05-19"
updatedDate: "2026-05-19"
---

A user installs Neotoma on a Thursday afternoon. They paste the agent-led evaluation prompt into Claude Code. The agent reads the [/evaluate](https://neotoma.io/evaluate) page, scans the local workflow, decides the fit is strong, runs the install, and stores the first few entities. Forty minutes later it hits a real bug: an entity submission silently drops a field that the schema clearly accepts.

A year ago, the friction at that moment was the end of the loop. The user could open GitHub, paste the error, write a paragraph of context, and wait. Most don't. They route around the bug, the maintainer never sees it, and the next evaluator hits the same wall.

I've spent the last two weeks rebuilding that moment. Across [v0.12.0, v0.12.1, and v0.13.0](https://github.com/markmhendrickson/neotoma/releases), Neotoma has a first-class issues subsystem that operates through the same MCP surface every agent already uses to store and retrieve. The agent that just hit the bug files it without leaving the session, and as of v0.13.0 without stopping to ask permission. The maintainer's agents pick it up, triage it, often resolve it, and ship a fix. The reporter's agent reads the status back and tells them when it lands. The whole exchange happens through tool calls.

The agent-led evaluation written about in [the customer research post](/posts/customer-research-through-agents) was the front half of this loop. The issues subsystem is the back half. Both halves run on the [nervous system substrate](/posts/from-memory-to-nervous-system) I described two weeks ago, and the issues capability is the cleanest example yet of what that substrate is for.

## Why the loop has to close on the agent side

Friction is the silent killer of feedback. The old model assumed the user would translate their experience into a bug report on a separate system: switch context, find the repo, parse an issue template, write enough background that a maintainer can act, attach logs, wait. Each step is a chance to give up. Most do.

When the user's agent is the one that hit the wall, that translation step is free. The agent already has the context: which tool it was running in, the exact MCP call that failed, the response payload, the git SHA or app version of the Neotoma install, the entity type involved. It can compose a coherent report in one tool call. As of v0.13.0 the MCP instructions explicitly tell agents to file via `submit_issue` immediately when a reportable problem is confirmed, without prompting for consent. The reasoning is that asking the user "should I file this?" is the same friction as asking them to open GitHub: it interrupts whatever they were doing to make a decision the agent already has enough information to make. The agent files. The user finds out about it later, or never, depending on whether the bug ever comes back.

Symmetrically, on the maintainer side, the loop has to close without me reading every report by hand. I run about a dozen agents across editors and daemons. They already process incoming structured state. The natural shape is: a new issue arrives, the substrate signals on write, a triage daemon picks up the event, reads the issue, decides whether it can act, opens a worktree, runs an agent session against the codebase, and either resolves the bug or asks the reporter for clarification through the same thread.

Both halves of the loop run as agentic work over the same substrate. The user's agent uses MCP to submit. The maintainer's agents use MCP to read and respond. Nobody has to open a browser.

## What the agent does on submission

The MCP surface is small enough to enumerate. The `submit_issue` tool takes a title, a body, an entity type if the issue is about a specific kind of record, and a reporter environment block that has to include either the Neotoma git SHA the user is running or the app version. That last requirement is not paperwork. It is the difference between a report that can be reproduced and one that drifts into the bucket of unactionable noise. The schema enforces it; the HTTP route returns a `400 ERR_REPORTER_ENVIRONMENT_REQUIRED` if both fields are missing, with the acceptable field groups listed in the error so the agent can self-correct on the retry. In v0.13.0 the server also auto-populates `reporter_app_version` when the agent omits it, so the most common cause of a 400 quietly disappears.

A submission rarely arrives bare. The bug the agent just hit references concrete entities: the specific record that failed to store, its schema, an upstream observation. In v0.13.0 `submit_issue` and `add_issue_message` accept an `entity_ids_to_link` array, and the server creates `REFERS_TO` relationships from the new issue to each referenced entity atomically as part of the same call. Before this, a complete report meant a follow-up `create_relationship` per reference, which agents would sometimes skip. After this, the issue lands already wired into the graph it is about. The triage agent reading the issue can traverse straight to the entity that failed.

The submission flows through the same `scanAndRedact` PII guard that protects every public surface. If the agent accidentally pastes a token or an email address into the body, it gets redacted before persistence. ISO-date literals no longer trip the phone-number heuristic, which was the last false-positive I cared about. The MCP instructions now require agents to apply the PII checklist to title and body before the call, but the server-side guard is the actual line of defense. The reporter gets a numeric issue identifier and a guest read-back token with an explicit TTL, currently thirty days by default, scoped to the thread they just opened. That token is how the reporter's agent reads the status later without re-authenticating each time.

If a user is configuring an instance for the first time and wants the reporter side to be ready out of the box, `neotoma reporter setup` walks through auth, scope selection, and default label assignment in one command. That used to be a manual procedure spread across several config edits.

From the user's perspective: one tool call, one identifier to track, and usually no approval prompt at all. From the substrate's perspective: a structured entity got written, the linked-entity relationships were created in the same transaction, a source row was created, a guest grant was issued, and the write pipeline emitted an event.

## What happens on the maintainer side

The event is where the nervous system framing earns its keep. The substrate signals; consumers decide. My triage daemon subscribes to issue creation events through the same `subscribe` / `list_subscriptions` / `get_subscription_status` tools that any other consumer would use. Webhooks come first because they work for remote daemons on a VPS as well as for local processes on my laptop. SSE is additive. The substrate maintains the registry, delivers the event, and forgets. The daemon decides.

What the daemon decides, in practice, is roughly this. Read the issue. Pull the entities the reporter's agent linked at submission time, since the relationships are already in the graph. Mirror to the upstream GitHub repo if it warrants a public trail, using the operator-forwarding path that v0.12.0 wired in end-to-end and that v0.13.0 hardened: `sync_issues --push` mirrors local public issues to GitHub with PII redaction applied at the API boundary, and issues whose title or body still match a redaction pattern after the agent's own pass are rejected before they cross the line. Decide whether the report is reproducible from the reporter environment alone. If yes, open a worktree, run an agent session against the codebase, attempt a fix. If no, post a clarifying question through `add_issue_message` so the reporter's agent receives it on the next status read.

The `add_issue_message` path is the one that surprised me when I started using it. It is not a comment system. It is a structured message channel between an issue's reporter and the maintainer side, threaded through the same conversation primitives that already exist for agent-to-agent threads. The reporter's agent can respond to a clarifying question without the human having to read it in between. Public threads carry the same PII redaction. The dedup logic in `loadIssueThreadMessages` makes sure that observations stored across remote, local, and multi-conversation threads collapse to one ordered history when the thread is read back.

The thread also handles the awkward middle case where the GitHub mirror succeeded but the local append did not. The `add_issue_message` response carries a `remote_submission_error` field that is null on full success and a string describing what failed on partial success. The maintainer daemon treats partial success as success, surfaces the error for follow-up, and does not re-post a comment to GitHub that already landed. This is the kind of edge case that quietly accumulates in homemade integrations until someone notices duplicate comments.

When a fix lands, the same daemon that triaged the report closes the issue or uses `bulk_close_issues` if a single PR resolved several. Soft-delete via `bulk_remove_issues` exists for the cases where a report was filed against the wrong repo or was a duplicate that already had a thread.

A quieter v0.13.0 detail makes the maintainer side feel different in practice. Every entity retrieval now returns optional `schema_instructions` (markdown from the type's `SchemaDefinition.agent_instructions`) and `entity_instructions` (markdown from the entity's own snapshot), and the MCP instructions say agents must apply both as behavioral context. For issues this means I can attach guidance to the issue entity itself, "this affects the v0.12 install path; the relevant entity is the failing snapshot; reproduce by ...", and every agent that later reads the issue picks the guidance up without me writing a custom prompt for it. The substrate stays neutral; the entity carries its own behavioral context.

## What the reporter's agent does on read-back

The other side of the loop is the read. The reporter's agent calls `get_issue_status` with the issue number or entity ID. It receives the current status, the messages on the thread, the resolution if any, and the link to the upstream mirror if the maintainer side chose to escalate it. The guest token authenticates the read without the user having to log into anything. If the token has expired, the substrate returns a clean 401 instead of silently downgrading to anonymous access, which was one of the hotfixes in v0.12.1.

The agent decides whether to surface the status to the user. If nothing has changed since the last check, it stays quiet. If a clarifying question arrived, it asks the user. If the fix shipped, it tells the user, optionally pulls the new version, and offers to re-run whatever broke the first time.

There is no polling cron in this picture. The user's agent reads on its own cadence, usually triggered by the user returning to the workflow that originally failed. The maintainer's agents wake on substrate events. Both halves are reactive. Nothing checks for nothing.

## Why this is the nervous system in action

The substrate emits events after every write. That is the only thing the substrate has to do for any of this to work. Everything else is operational-layer logic running on top: the triage daemon, the GitHub mirror, the guest read-back, the cross-thread dedup, the PII redaction.

This is the line I [argued for two weeks ago](/posts/from-memory-to-nervous-system) and it holds up under the issues use case. The substrate does not decide which issues matter, does not retry deliveries with escalation, does not subscribe to its own events. It signals. The triage daemon is a consumer, the reporter's agent is a consumer, the GitHub mirror is a consumer. Each consumer registers interest, decides what to do, and acts. If I want to add a second triage daemon that handles security reports differently, it subscribes to the same events with a different filter. No new substrate behavior.

The biological analogy keeps landing. The substrate is the brain plus sensory nerves: it stores the issue, it transmits the signal that an issue arrived. The triage daemon and the reporter's agent are the motor system: they decide what to do about the signal. A version of Neotoma that tried to be all three would be harder to reason about and harder to extend. A version that stops at signaling stays neutral.

## The agentic loop, end to end

If you read this post and the customer research post together, the shape is now legible.

A potential user lands on the site. Their agent reads the [/evaluate](https://neotoma.io/evaluate) page, assesses fit against the user's real workflows, recommends or disqualifies, and if appropriate carries out the install and the initial activation. That is the front half. It runs in whatever tool the user is already working in. No call scheduled, no form filled.

The user works with Neotoma. Their agent hits a bug, an unclear behavior, a feature request. The agent files an issue through MCP. The maintainer side picks it up through substrate signaling, triages, often resolves, sometimes asks for clarification through the same thread. The reporter's agent reads the status back when the user comes around to the workflow that failed. The user finds out the bug is fixed before they remember they reported it. That is the back half.

Both halves operate on agents talking to agents through one structured surface. The user never opens a separate tool to evaluate, never opens a separate tool to file a bug, never opens a browser tab to check status. The friction that historically killed both the acquisition loop and the feedback loop is gone because each translation step has been absorbed into a tool call.

This is what I meant when I said the substrate's job is to make multi-agent work possible. The agent-led evaluation works because the substrate holds structured state about the user's workflow. The issues subsystem works because the substrate signals on write and supports verified guest access for cross-trust-boundary submission. Both depend on the same primitives. Neither would be possible without them.

## What I am not building

The temptation in the issues subsystem is the same temptation in the signaling subsystem: drift toward orchestration. Add a prioritization model. Add automatic SLA tracking. Add a "smart" router that decides which daemon handles which issue type. Each of these sounds reasonable in isolation.

None of them belong in the substrate. The triage daemon prioritizes. The maintainer's agents track their own response times. Routing is a subscription filter. Every step that crosses into deciding what matters is operational-layer logic, and the substrate stays cleaner when it stays out of those decisions.

The same applies to retry semantics. If a webhook delivery fails, the substrate logs the failure and moves on. It does not escalate to a backup delivery channel, does not buffer for later replay, does not flip a consumer into a degraded state. Message brokers do all of that and they are good at it. The substrate is not a message broker. Consumers that want guaranteed delivery wrap the substrate's signal in their own infrastructure.

The constraint is the feature, the same way it was in the nervous system post. A state layer that signals issues but does not decide which issues matter is a state layer that any consumer can trust to behave predictably.

## What is next

Three pieces still belong in this loop and are not built yet.

The first is making the reporter's agent self-aware about issue context. Right now the agent files the issue and the reporter has to ask for status. The next step is letting the agent register a subscription against its own issues so it gets pushed an update when the status changes, instead of pulling. The plumbing exists. The agent-side ergonomics do not yet.

The second is broader access policy for `submit_issue`-shaped flows on other entity types. The issues subsystem is the most polished example of "external actor writes structured state into a Neotoma instance," but it is wired to one entity type. The generalization is to let any entity type be opened to guest submissions with configurable access policies. A client's agent submits a structured reconciliation request. A partner's automation submits feedback against a content pipeline entity. The substrate already handles access control and provenance for the issues case. The remaining work is making the policy configuration entity-type-agnostic.

The third is bidirectional peer sync of issues themselves. Today the issues subsystem assumes a single canonical instance. The cross-instance peer sync added in v0.12.0 handles bidirectional entity updates more broadly, but the issues case has its own threading and guest-token semantics that need to survive a round trip. Once that is in, a fleet of satellite instances can each run issue intake locally and reconcile to a central instance without losing thread integrity.

None of these are blocking the current loop. The loop works today. They are extensions of the same primitive applied to adjacent use cases.

## What I want feedback on

The issues subsystem is live. If you have Neotoma installed and your agent hits something rough, you no longer need to ask it to file an issue. As of v0.13.0 the MCP instructions tell the agent to file via `submit_issue` immediately when a reportable problem is confirmed. The schema requires a git SHA or app version; if the agent omits both, the server now auto-populates `reporter_app_version`, and in the rare case both are missing the `400 ERR_REPORTER_ENVIRONMENT_REQUIRED` response still tells the agent which fields are missing so it can self-correct on the retry.

If you do not have Neotoma installed yet, the front half of the loop is the place to start: ask your agent to run the [evaluation script](https://neotoma.io/evaluate). If it concludes Neotoma fits, it can install and activate without you reading a configuration doc. If it concludes Neotoma does not fit, that is a valid outcome too, and a more honest one than most landing pages produce.

Either way, the feedback loop is now agentic on both sides. The substrate signals, the consumers decide, and the human stays out of the translation step. That is the property I cared about and the property I am going to keep defending against the temptation to make the substrate do more than it should.
