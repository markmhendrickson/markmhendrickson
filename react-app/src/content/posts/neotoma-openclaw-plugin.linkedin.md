If you use OpenClaw for anything beyond single-session chat, you have probably already hit this: a contact detail that disappeared after compaction, two automations that stepped on the same memory file, or an entity your agent recognized last Tuesday but not today.

These are not hypothetical. OpenClaw's own docs flag the concurrent-write risk. The memory model works well for getting started. It stops working when the agent manages state you actually rely on.

Neotoma v0.4.3 registers as a native plugin through OpenClaw's Gateway. Your agent loop, skills, and browsing stay the same. Writes go through schema validation, get stable entity IDs (string variants resolve by rule, not re-inference), and land in an append-only store with provenance. Two agents writing about the same entity produce two rows, not a file conflict.

I run this daily across email triage, tasks, finance, and content in my own agentic stack. Developer release, not a maturity pitch. The goal is finding out where structured state earns its overhead under real agent load.

`openclaw plugins install clawhub:neotoma` or start with the evaluation prompt in the essay.

https://markmhendrickson.com/posts/neotoma-openclaw-plugin
