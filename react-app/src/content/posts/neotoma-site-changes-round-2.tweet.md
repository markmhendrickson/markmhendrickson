Asked 25+ people to have their agents evaluate @neotoma_dev. The feedback reshaped the site positioning. Round 2 of changes is live.

---

The feedback that cut deepest:

"It feels like you are trying to find problems your solution fixes."
"How is this better than sqlite?"
"Too general and vague, hard to imagine how I'd use it."

Three different people, three channels, same core point.

---

What changed: hero leads with what breaks, not architecture. Before/after demos show concrete failure modes. Comparisons against what developers actually use today (sqlite, git+markdown, flat JSON), not just the VC-funded competitor set.

https://neotoma.io

---

Strongest market signal from this round: at least 10 people in the feedback set are independently building their own agent memory. Custom Claude memory systems, SOUL.md files, JSON heartbeats, markdown CRMs. Same problem, different implementations, no versioning or provenance in any of them.

---

One evaluator ran the same prompt through 4 agents. Agents with tool access (MCP, agentic coding) leaned enthusiastic. Search-only agents leaned skeptical. The gap tracks with who actually needs deterministic state versus who needs conversational context.

---

Developer release is open. If you're building agentic workflows and hitting the memory wall:

https://neotoma.io/install

Next: a post about what I actually built with this stack and what 25 evaluators taught me about the agent memory market.
