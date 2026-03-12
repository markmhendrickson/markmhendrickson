Since announcing the Neotoma developer release a few weeks ago, I've collected feedback from about a dozen testers across calls, chat, email, and screen recordings. The sentiment has been encouraging. One person called it "a very relevant problem" and noted that most people are rolling their own. Another said it sounds like a problem worth solving.

But the useful feedback was about where people got stuck. The most common question: "Who is this for and why would I use it?" Others asked whether Neotoma should replace their existing memory or live alongside it. One tester had it working with the CLI but asked "so it doesn't work with OpenClaw?" because the site was ambiguous. Another hit a module error trying to start the API. A third said the framing was too horizontal and needed sharper segmentation to stand out.

The core worked. The site didn't.

I spent the last stretch overhauling neotoma.io from a single scrolling page into a full documentation site with 40+ pages. Every change traces to something specific a tester said or got stuck on.

Highlights:

- A memory guarantees table comparing platform memory, retrieval, file-based, and Neotoma across 12 properties. One tester pushed back that "general storage with schemas is unsolved." This table is my response: here are the specific properties, here's where each approach delivers.
- A developer walkthrough answering "how does ingestion work?" Store a decision in one session, retrieve it in another, handle a conflict, audit the trail. Real MCP examples.
- Six integration guides for Cursor, Claude, Claude Code, ChatGPT, Codex, and OpenClaw. Each from install to first store.
- Three use case pages with failure modes and schema patterns for infrastructure engineers, agent builders, and individual operators.
- A memory models page answering "should this replace or complement my existing memory?"

The developer release is still active. If you try the site and installation, I want to know: is the positioning clear now? Does the guarantees table help you decide if this is relevant? Can you get from the home page to a working setup without hitting a wall?

https://neotoma.io

https://markmhendrickson.com/posts/neotoma-site-overhaul-developer-feedback