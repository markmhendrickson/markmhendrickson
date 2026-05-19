Agent-led evaluation tells a new user whether Neotoma fits their memory needs. And, now, an agent-led issues subsystem closes the loop on solutions.

When a user's agent hits a bug while storing or recalling memory, notices a performance gap, or identifies a missing capability it wishes existed, it can file a report to project maintainers like myself directly through the Neotoma MCP without leaving or redirecting its session. One tool call captures the problem, the relevant context, and provenance about the version it's running. Related entities are linked upon submission so the agent can track just how the issues it surfaces relate to the knowledge graph it's working on. And PII is automatically redacted at the boundary.

The user never has to file issues again. The agent simply notices and handles them while doing its own work.

On the maintainer side, a triage daemon subscribes to issue creation events through the same substrate signaling any other Neotoma consumer uses. It classifies bugs versus enhancements, with bugs going toward a worktree fix and enhancements aggregated into plans surfaced for human review. Then it reports back to the user's agent, either asking follow-up questions or informing of resolution.

The reporter's agent can subscribe to issue updates in real time so it can upgrade to the patched version and pick up with its work, often before the user knows any of it was filed or resolved.

This self-healing capability is inheritable by any apps built with Neotoma. They can empower their own user agents to file structured reports against their own schemas, inheriting this automation machinery without rebuilding it. The next generation of agentic systems will improve iteratively and automatically with the direct help of the very agents that run and access them.

This is Neotoma as a "nervous system" earning its keep. The substrate signals changes to shared state upon write, then consumers decide what to do about it. E.g. the issues triage daemon that I run tackles them through a set of skills triggered by subscriptions. The substrate itself stays neutral.

Full write-up on how this loop runs end-to-end, with agents talking to agents over one MCP surface. The human never opens a browser tab to evaluate, file, or check status:

https://markmhendrickson.com/posts/agent-to-agent-issue-resolution-with-humans-at-the-edges
