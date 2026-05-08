I run about a dozen agents across Cursor, Claude Code, and custom scripts. They all share a single state layer. Storage and retrieval work. Coordination doesn't.

The problem: when one agent writes a new observation, the others discover it by polling. Most polls return nothing. The important ones arrive minutes late. Every multi-agent system I've built has hit this ceiling.

The fix is a substrate primitive that databases figured out decades ago: emit events after writes. The state layer signals what changed. Consumers decide what to do about it. No filtering, no prioritization, no orchestration in the substrate. Signal without strategy.

The hard part isn't adding the capability. It's adding it without crossing the line into decision-making. A state layer that signals but doesn't decide is a state layer you can still reason about.

https://markmhendrickson.com/posts/from-memory-to-nervous-system
