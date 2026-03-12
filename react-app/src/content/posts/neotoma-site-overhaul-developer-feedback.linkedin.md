I overhauled the Neotoma site based on developer release feedback.

Since announcing the developer release, I've collected feedback from about a dozen testers across calls, chat, email, and screen recordings. The sentiment has been encouraging. One person called it "a very relevant problem." Another said it sounds like a problem worth solving. But the useful feedback was about where people got stuck.

The most common question: "Who is this for and why would I use it?" One tester compared the old site to selling a vitamin instead of a painkiller. Others asked whether Neotoma should replace their existing memory or live alongside it. One tester had it working but asked "so it doesn't work with OpenClaw?" because the site was ambiguous. A third said the framing was too horizontal and needed sharper segmentation.

The core worked. The site didn't.

The old single-page wall of text is now a visual presentation backed by full documentation, tool-specific integration guides, and architecture deep dives. Every change traces to something a tester said or got stuck on.

What changed:

- A memory guarantees table comparing platform memory (Anthropic, OpenAI), retrieval systems (Mem0, Zep), file-based approaches, and Neotoma across 12 properties. Each row links to a dedicated explanation with before/after examples.
- A developer walkthrough answering "how does ingestion work?" Store a decision in one session, retrieve it in another, handle a conflict, audit the trail. Real MCP examples.
- Six integration guides for Cursor, Claude, Claude Code, ChatGPT, Codex, and OpenClaw. Each from install to first store.
- Three use case pages with failure modes and schema patterns for AI infrastructure engineers, agent system builders, and AI-native operators.
- Agent-led install. Copy one prompt, paste it into your AI tool, and the agent handles the rest.

The positive signal from testers: the core stores and retrieves correctly. The site and onboarding needed to catch up. This overhaul is a first step in that direction.

If you try the site or install, I want to know: is the positioning clear? Can you get from the home page to a working setup without hitting a wall?

https://neotoma.io

Full writeup with all the screenshots:
https://markmhendrickson.com/posts/neotoma-site-overhaul-developer-feedback
