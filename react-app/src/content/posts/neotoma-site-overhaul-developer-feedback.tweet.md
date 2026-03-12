I overhauled the @neotoma_dev site. The old single-page wall of text is now a visual presentation backed by full documentation, tool-specific integration guides, and architecture deep dives. Every change traces to something a tester said or got stuck on during the developer release.

Image: /images/posts/neotoma-site-overhaul-home-hero.png

---

Most common feedback: "Who is this for and why would I use it?"

One tester compared the old site to selling a vitamin instead of a painkiller. New site leads with what breaks without deterministic state and what that costs you.

https://neotoma.io

Image: /images/posts/neotoma-site-overhaul-before-after-section.png

---

The centerpiece: a memory guarantees table comparing platform memory (@AnthropicAI, @OpenAI), retrieval systems (@mem0ai, @zep_ai), file-based approaches, and @neotoma_dev across 12 properties. Each row links to a dedicated explanation with before/after examples.

https://neotoma.io/memory-guarantees

Image: /images/posts/neotoma-site-overhaul-memory-guarantees-table.png

---

Testers asked "does it work with X?" and "how do I set this up?" Six tool-specific integration guides now: @cursor_ai, @AnthropicAI (Claude, Claude Code), @OpenAI (ChatGPT, Codex), and @openclaw. Each walks through setup from install to first store.

https://neotoma.io/install

Image: /images/posts/neotoma-site-overhaul-integration-guide-claude-code.png

---

The install process is now agent-led. Copy one prompt, paste it into your AI tool, and the agent handles the rest. No configuration docs needed.

Also added three use case pages so each audience can self-identify: AI infrastructure engineers, agent system builders, and AI-native operators.

https://neotoma.io/ai-infrastructure-engineers
https://neotoma.io/agentic-systems-builders
https://neotoma.io/ai-native-operators

Image: /images/posts/neotoma-site-overhaul-agent-install.png

---

The positive signal from testers: the core works. It stores and retrieves correctly. The site and onboarding needed to catch up. This overhaul is a first step in that direction.

If you try the site or install, I want to know: is the positioning clear? Can you get from the home page to a working setup without hitting a wall?

Full writeup with all the screenshots:
https://markmhendrickson.com/posts/neotoma-site-overhaul-developer-feedback

Image: /images/posts/neotoma-site-overhaul-developer-feedback-hero.png
