OpenClaw is the fastest-growing open-source AI agent (310K GitHub stars). It stores memory in markdown files. Three billion-dollar-scale agent platforms converged on the same architecture. The economics work. The ceiling is real: no versioning, no provenance, no entity resolution, no conflict detection.

Neotoma v0.4.3 ships as a native OpenClaw plugin. Use the agent-assisted flow at neotoma.io/install so your agent enables the plugin and wiring. Your agent writes structured observations instead of appending to MEMORY.md. Entity identity is deterministic. Writes are append-only with schema validation. Every observation traces to its source.

The agent loop does not change. Skills, browsing, form-filling, all stay the same. What changes is where state lives and whether you can audit, replay, and fix it.

This is the first integration between a structured memory layer and a major agent platform's plugin system. Developer release, not stability guarantee. The goal is making the architectural argument testable.

https://markmhendrickson.com/posts/neotoma-openclaw-plugin