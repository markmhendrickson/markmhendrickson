I built a personal operating system out of AI agents. A private monorepo with 12+ MCP servers connecting agents to Gmail, Google Calendar, a Bitcoin wallet, a web scraper, and more. On top sit persistent rules and reusable skills. Underneath sits Neotoma as structured memory.

I shared it with 25+ people and asked them to have their agents evaluate it. What came back reshaped how I think about the agent memory market. The strongest signal: at least 10 of them are independently building their own version of the same thing. Custom Claude memory systems, SOUL.md files, JSON heartbeats, 112-person markdown CRMs.

Same problem. Different implementations. None with versioning, provenance, conflict detection, or cross-tool access.

The feedback also sharpened who the user is. One evaluator's agent self-selected out: "context and voice, not deterministic state." Another ran the same prompt through four different agents and found that agents with tool access lean enthusiastic while search-only agents lean skeptical. The gap tracks with who actually needs persistent structured state.

Full writeup with the stack details, evaluator quotes, and what I learned about the market:

https://markmhendrickson.com/posts/how-i-built-a-personal-agentic-os
