## Tweet (posted)

**Main**

If you use @openclaw for anything beyond single-session chat, you've probably already hit this sort of issue:

A contact that disappeared after compaction, two automations that corrupted the same memory, or a task your agent recognized last Tuesday but not today.

Neotoma v0.4.3 plugs directly in. Facts get checked before stored, get consistent IDs, and can't be silently overwritten. I use it on the go through OpenClaw with the same memory I use at my desktop through Cursor and CLI agents.

Developer release, not a promise that everything works. I need your feedback to find out where this is actually helpful.

**Reply**

Ask your @openclaw agent to read neotoma.io/evaluate. It checks your workflow and walks you through install if it fits.

https://markmhendrickson.com/posts/neotoma-openclaw-plugin

## LinkedIn

OpenClaw is the fastest-growing open-source AI agent (310K GitHub stars). It stores memory in markdown files. Three billion-dollar-scale agent platforms converged on the same architecture. The economics work. The ceiling is real: no versioning, no provenance, no entity resolution, no conflict detection.

Neotoma v0.4.3 ships as a native OpenClaw plugin. Use the agent-assisted flow at neotoma.io/install so your agent enables the plugin and wiring. Your agent writes structured observations instead of appending to MEMORY.md. Entity identity is deterministic. Writes are append-only with schema validation. Every observation traces to its source.

The agent loop does not change. Skills, browsing, form-filling, all stay the same. What changes is where state lives and whether you can audit, replay, and fix it.

This is the first integration between a structured memory layer and a major agent platform's plugin system. Developer release, not stability guarantee. The goal is making the architectural argument testable.

https://markmhendrickson.com/posts/neotoma-openclaw-plugin
