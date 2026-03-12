I overhauled the Neotoma site based on developer release feedback. The most common question from testers: "who is this for and why would I use it?" The single scrolling page is now 40+ pages of docs, integration guides, and architecture. Every change traces to something a tester said or got stuck on.

https://markmhendrickson.com/posts/neotoma-site-overhaul-developer-feedback

---

The centerpiece is a memory guarantees table. One tester pushed back that "general storage with schemas is unsolved." My response: here are 12 specific properties, here's where platform memory, retrieval, file-based, and Neotoma each deliver or fall short. Each row links to a deep dive.

https://neotoma.io

---

Testers asked "is this meant to replace my existing memory or sit alongside it?" and "how does ingestion work, regex or AI?" New developer walkthrough answers both: store a decision in session 1, retrieve it in session 2, handle a conflict in session 3, audit the trail. Real MCP examples, not pseudocode.

---

One tester had Neotoma running but asked "so it doesn't work with OpenClaw?" because the old site was ambiguous. Now there are six tool-specific integration guides: Cursor, Claude, Claude Code, ChatGPT, Codex, and OpenClaw. Each from install to first store.

---

Another tester said the framing was "too horizontal" and needed sharper persona segmentation. Three dedicated use case pages now: AI infrastructure engineers, agent system builders, and AI-native operators. Failure modes, data types, and schema patterns for each.

---

The positive signal: testers got it working and confirmed it "stores stuff when I ask and can verify with the CLI." The core works. The site needed to catch up.

Visit neotoma.io and try installing. I want to know: is the positioning clear now? Can you get from the home page to a working setup without hitting a wall?

https://neotoma.io
