A user installs Neotoma on a Thursday afternoon. Their agent runs the evaluation, decides the fit is strong, completes the install, and hits a real bug forty minutes in.

A year ago, that was the end of the loop. Switching to GitHub, parsing an issue template, attaching logs, waiting — most users give up at step one. The bug never reaches the maintainer.

The v0.12.0 and v0.12.1 releases make that moment agentic on both sides. The user's agent calls `submit_issue` over MCP with the reporter environment baked in. The substrate signals on write. A triage daemon subscribes, picks up the event, opens a worktree, runs an agent session, and either fixes the bug or asks for clarification through `add_issue_message`. The reporter's agent reads progress through `get_issue_status` using a guest token.

The human never opens a browser. The translation step that historically killed feedback loops is absorbed into tool calls.

This is the nervous system framing earning its keep. The substrate signals; consumers decide. The triage daemon prioritizes. Routing is a subscription filter. The substrate stays neutral.

https://markmhendrickson.com/posts/from-evaluation-to-resolution
