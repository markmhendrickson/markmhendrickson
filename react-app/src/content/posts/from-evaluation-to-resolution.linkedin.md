A user installs Neotoma on a Thursday afternoon. Their agent runs the evaluation, decides the fit is strong, completes the install, and hits a real bug forty minutes in.

A year ago, that was the end of the loop. Switching to GitHub, parsing an issue template, attaching logs, waiting — most users give up at step one. The bug never reaches the maintainer.

The v0.12 and v0.13 releases make that moment agentic on both sides. The MCP instructions tell the agent to file via `submit_issue` immediately when a reportable problem is confirmed, without prompting for consent. It passes `entity_ids_to_link` so the issue lands wired into the graph it is about. The substrate signals on write. A triage daemon subscribes, picks up the event, opens a worktree, runs an agent session, and either fixes the bug or asks for clarification through `add_issue_message`. `sync_issues --push` mirrors public issues to GitHub with PII redaction at the boundary. The reporter's agent reads progress through `get_issue_status` using a guest token.

The human never opens a browser. Asking "should I file this?" was the last friction step; it is gone.

This is the nervous system framing earning its keep. The substrate signals; consumers decide. The triage daemon prioritizes. Routing is a subscription filter. The substrate stays neutral.

https://markmhendrickson.com/posts/from-evaluation-to-resolution
