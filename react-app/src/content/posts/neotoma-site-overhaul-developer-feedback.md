I overhauled the [Neotoma](https://neotoma.io) site. The old single-page wall of text is now a visual presentation backed by [full documentation](https://neotoma.io/docs), tool-specific integration guides, and [architecture deep dives](https://neotoma.io/architecture). Most of what changed traces back to something a tester said or got stuck on during the developer release.

![Screenshot: Neotoma home page hero — value prop and agent session without state layer](/images/posts/neotoma-site-overhaul-home-hero.png "screenshot")

## What the feedback told me

Since announcing the [developer release](/posts/neotoma-developer-release), I've collected feedback from about a dozen testers across calls, chat, email and screen recordings. The sentiment has been encouraging. One person called it "a very relevant problem" and noted that "most people are rolling their own right now." Another said it sounds like a problem worth solving. Someone else was just pumped it was out into the wild.

But the most useful feedback was about where people got stuck:

### "Who is this for and why would I use it?"

Multiple people asked this directly. The old site led with architecture and abstractions. Testers wanted acute, specific pain first. One compared it to selling a vitamin instead of a painkiller. Another asked point-blank: "Am I one of the people this is for?" The site needed to answer that question in the first few seconds.

The new use case pages for [AI infrastructure engineers](https://neotoma.io/ai-infrastructure-engineers), [builders of agentic systems](https://neotoma.io/agentic-systems-builders), and [AI-native individual operators](https://neotoma.io/ai-native-operators), plus the [memory models comparison](https://neotoma.io/memory-models), are the direct response.

### "Is this meant to replace my existing memory, or live alongside it?"

A technical tester asked whether Neotoma should be the primary memory system or sit alongside things like Claude Code's auto-memory. Another asked how ingestion works: is it regex, AI evaluation, or the agent filling in tool parameters? The old site didn't address any of this. The architecture and mechanics were scattered across the README and repo docs.

The new [memory models page](https://neotoma.io/memory-models) and [developer walkthrough](https://neotoma.io/developer-walkthrough) address both questions.

### "How do I set this up with my tool?"

One tester had Neotoma running with the CLI but asked "so it doesn't work with OpenClaw?" because the client listing on the site was unclear. Another hit a module-not-found error trying to start the API. A third spent an hour reading docs on a fresh VM and flagged a broken link in the documentation index plus unexpected macOS permission popups. Setup instructions were buried and varied by tool, and the site's install snippet lacked a direct link to what happens after init.

The new [install page](https://neotoma.io/install) and integration guides for [Cursor](https://neotoma.io/neotoma-with-cursor), [Claude](https://neotoma.io/neotoma-with-claude), [Claude Code](https://neotoma.io/neotoma-with-claude-code), [ChatGPT](https://neotoma.io/neotoma-with-chatgpt), [Codex](https://neotoma.io/neotoma-with-codex), and [OpenClaw](https://neotoma.io/neotoma-with-openclaw) address this.

The positive signal underneath all of this: several testers got Neotoma working and verified it stores and retrieves correctly. One confirmed it "stores stuff when I ask and can verify with the CLI." The core works. The site and onboarding didn't.

## Home page

The home page now has nine distinct sections instead of one long scroll. The three that respond most directly to the feedback:

### Memory guarantees table

The [memory guarantees table](https://neotoma.io/memory-guarantees) is the answer to "how is this different?" A comparison of platform memory (Claude, ChatGPT), retrieval systems (Mem0, Zep, LangChain Memory), file-based approaches (Markdown, JSON stores), and Neotoma across 12 properties:

![Screenshot: Memory guarantees comparison table on the Neotoma home page](/images/posts/neotoma-site-overhaul-memory-guarantees-table.png "screenshot")

| Property | Description |
| -------- | ----------- |
| [Deterministic state evolution](https://neotoma.io/memory-guarantees#deterministic-state-evolution) | Same observations always produce the same entity state regardless of ordering. Eliminates ordering bugs and makes state transitions testable. |
| [Versioned history](https://neotoma.io/memory-guarantees#versioned-history) | Every change creates a new version instead of overwriting. Earlier states stay accessible. |
| [Replayable timeline](https://neotoma.io/memory-guarantees#replayable-timeline) | The full sequence of observations can be replayed from the beginning to reconstruct any historical state. |
| [Auditable change log](https://neotoma.io/memory-guarantees#auditable-change-log) | Every modification records who made it, when, and from what source. |
| [Schema constraints](https://neotoma.io/memory-guarantees#schema-constraints) | Entities conform to defined types and validation rules. Malformed data is rejected, not silently accepted. |
| [Silent mutation risk](https://neotoma.io/memory-guarantees#silent-mutation-risk) | Whether data can change without explicit awareness. Platform, retrieval, and file-based approaches all carry this risk. Neotoma prevents it. |
| [Conflicting facts risk](https://neotoma.io/memory-guarantees#conflicting-facts-risk) | Whether contradictory statements can coexist without detection. Neotoma flags and resolves conflicts instead of storing both. |
| [Reproducible state reconstruction](https://neotoma.io/memory-guarantees#reproducible-state-reconstruction) | The complete current state can be rebuilt from raw inputs alone, the way a ledger balances to zero from its entries. |
| [Human inspectability](https://neotoma.io/memory-guarantees#human-inspectability) | You can examine exactly what changed between any two versions and trace where each fact originated. |
| [Zero-setup onboarding](https://neotoma.io/memory-guarantees#zero-setup-onboarding) | Whether memory works from the first message with no install. Platform memory has this. Neotoma does not. |
| [Semantic similarity search](https://neotoma.io/memory-guarantees#semantic-similarity-search) | Finding relevant context by meaning rather than exact match. Retrieval systems and Neotoma both provide this, scoped differently. |
| [Direct human editability](https://neotoma.io/memory-guarantees#direct-human-editability) | Whether you can open the memory store in a standard editor and modify it directly. File-based systems have this. Neotoma does not. |

Each row links to a dedicated explanation page with before/after examples and CLI code. One tester had noted that "general storage with schemas is unsolved" and that popular schemas could be the answer. The guarantees table is my response: here are the specific properties, here's where each approach delivers, here's where it doesn't.

### Before and after

![Screenshot: Before/after section showing fail vs succeed responses](/images/posts/neotoma-site-overhaul-before-after-section.png "screenshot")

The intro animation cycles the same question through two outcomes. Without Neotoma: "No contract found for Kline." With Neotoma: "Net-30, signed Oct 12, auto-renews Q1." Eleven scenarios rotate through, each showing a real failure mode at a glance.

Below the animation, four failure cards break the scenarios down by data type: financial facts, people and relationships, commitments and tasks, events and decisions. Each card has a concrete narrative — stale contacts going to the wrong person, forgotten deadlines triggering reminders against old tasks, conflicting records where two agents read different versions of the same contract and neither knew the other existed.

This was the direct response to the "vitamin vs painkiller" feedback. The old site led with architecture. This section leads with what breaks without deterministic state and what that costs you.

### Who is it for

![Screenshot: Three audience cards with illustrations on the Neotoma home page](/images/posts/neotoma-site-overhaul-audience-cards.png "screenshot")

Three audience cards with custom illustrations: [AI infrastructure engineers](https://neotoma.io/ai-infrastructure-engineers), [builders of agentic systems](https://neotoma.io/agentic-systems-builders), and [AI-native individual operators](https://neotoma.io/ai-native-operators). Each links to a dedicated page with failure modes, data types, and schema patterns specific to that audience. This is the direct answer to "am I one of the people this is for?"

## Documentation

The old site had everything inline. Testers who wanted depth had to go to the repo. Now there are dedicated pages organized in a sidebar navigation.

### Developer walkthrough

![Screenshot: Developer walkthrough page showing multi-session MCP examples](/images/posts/neotoma-site-overhaul-developer-walkthrough.png "screenshot")

The [developer walkthrough](https://neotoma.io/developer-walkthrough) is a multi-session scenario that walks through the core loop: store an architectural decision in session 1, retrieve and act on it in session 2, handle a conflicting update in session 3, then audit the full observation trail. All using MCP (Model Context Protocol) store calls with real request/response examples. This addresses the ingestion question directly: the agent calls the [MCP tool](https://neotoma.io/mcp) with structured parameters, Neotoma stores the observation. No hidden AI model calls, no regex extraction.

### Memory models

![Screenshot: Memory models page showing platform, retrieval, file-based, and deterministic memory](/images/posts/neotoma-site-overhaul-memory-models.png "screenshot")

The [memory models](https://neotoma.io/memory-models) page compares four approaches: [platform memory](https://neotoma.io/platform-memory), [retrieval memory](https://neotoma.io/retrieval-memory), [file-based memory](https://neotoma.io/file-based-memory), and [deterministic memory](https://neotoma.io/deterministic-memory). This is where the "should Neotoma replace or complement my existing memory?" question gets answered. Each model has a dedicated sub-page explaining what it is, where it works, and where it breaks.

### Foundations

![Screenshot: Foundations page showing privacy-first, deterministic, and cross-platform commitments](/images/posts/neotoma-site-overhaul-foundations.png "screenshot")

[Foundations](https://neotoma.io/foundations) covers [privacy-first](https://neotoma.io/privacy-first), deterministic, and [cross-platform](https://neotoma.io/cross-platform) in depth. The privacy-first page responds to testers who were skeptical about feeding personal data into cloud AI tools. Neotoma runs on your machine. Your data stays local.

### Architecture

![Screenshot: Architecture page showing the state flow diagram](/images/posts/neotoma-site-overhaul-architecture-state-flow.png "screenshot")

The [architecture](https://neotoma.io/architecture) page covers the state flow (source, observation, entity, entity snapshot), the layers, and how guarantees are enforced at each stage. This was one of the most requested additions.

### Reference pages

Full [REST API](https://neotoma.io/api) endpoint table, [MCP actions](https://neotoma.io/mcp) catalog, and [command-line reference](https://neotoma.io/cli). The API page includes per-endpoint descriptions and parameters. The MCP page lists all 24 actions. The CLI page covers all 38 commands.

## Integration guides

Six tool-specific pages, each walking through setup from install to first store:

- [ChatGPT](https://neotoma.io/neotoma-with-chatgpt)
- [Claude (Desktop)](https://neotoma.io/neotoma-with-claude)
- [Claude Code](https://neotoma.io/neotoma-with-claude-code)
- [Codex](https://neotoma.io/neotoma-with-codex)
- [Cursor](https://neotoma.io/neotoma-with-cursor)
- [OpenClaw](https://neotoma.io/neotoma-with-openclaw)

![Screenshot: Neotoma with Claude Code integration guide](/images/posts/neotoma-site-overhaul-integration-guide-claude-code.png "screenshot")

This is the direct answer to "does it work with X?" and "how do I set this up with my tool?" Every guide covers configuration, a first-run example, and what to expect. The ChatGPT page is the most detailed because the Custom GPT setup has the most steps. The OpenClaw page exists because a tester specifically asked whether it was supported and the old site was ambiguous.

## Use cases

Three dedicated audience pages now highlight and explain who Neotoma is for, providing targeting guidance that the old home page lacked:

![Screenshot: AI infrastructure engineers audience page showing failure modes and common data patterns](/images/posts/neotoma-site-overhaul-audience-detail-ai-infrastructure.png "screenshot")

**[AI infrastructure engineers](https://neotoma.io/ai-infrastructure-engineers).** Pain points like non-reproducible agent runs, invisible state changes, and no provenance trail. Common failure modes with specific icons. Data types these teams work with (session state, pipelines, evaluations, audit trails) and the entity types that come up most often (agent_session, action, pipeline, evaluation).

**[Builders of agentic systems](https://neotoma.io/agentic-systems-builders).** Similar structure focused on agent frameworks, multi-step workflows, and observability. Failure modes like silent state changes between sessions, workflows that can't be replayed, and context loss when one agent hands off to another.

**[AI-native individual operators](https://neotoma.io/ai-native-operators).** Focused on the daily experience of lost commitments, tool-to-tool context loss, and personal data in opaque provider memory. This is the page for the tester who asked "am I one of the people this is for?"

## Agent-led install

![Screenshot: Agent install page with copy-and-paste instructions and agent session demo](/images/posts/neotoma-site-overhaul-agent-install.png "screenshot")

This is new since the developer release announcement. Instead of reading docs and configuring manually, you copy a single prompt from the [install page](https://neotoma.io/install), paste it into your AI tool, and the agent handles the rest: installing the package, running init, configuring the MCP connection, and storing your first data.

The prompt is designed for Claude Code, Codex, Cursor, and OpenClaw. It tells the agent to install Neotoma with `npm install -g neotoma`, initialize it, and then link the matching integration guide for that tool. The agent scans your local context and platform memory, previews what it found, and stores only what you approve.

Each integration guide links to the install prompt so the onboarding path is the same regardless of which tool you start with. The goal is to get from zero to a working Neotoma setup with real data stored in under five minutes, without ever reading a configuration doc.

## Language support

The site and all post content now auto-translate into 12 languages: Arabic, Bengali, Catalan, French, German, Hindi, Indonesian, Mandarin Chinese, Portuguese, Russian, Spanish, and Urdu. Each page includes a language switcher, and RTL layouts work for Arabic and Urdu.

This matters because the developer release has reached testers outside of English-speaking markets. Rather than gate the documentation behind a single language, every page — the home page, memory guarantees, integration guides, use case pages, and posts — is available in all 12 locales. The translations are auto-generated and may not be perfect, but they lower the barrier for anyone evaluating Neotoma in their primary language.

## What's next

The site overhaul addresses the presentation and documentation gaps. The next round of work addresses the product gaps that testers surfaced.

- **Agent-driven onboarding.** The current install flow gets you set up, but it's passive. You install, you init, you start storing. The next version will be a guided discovery experience where your agent scans your local files, proposes the highest-value candidates, and reconstructs a timeline from your own data within the first few minutes. The goal is a concrete moment where you see your scattered project files turned into a structured timeline with every event traced to a specific source. That's the moment the difference between Neotoma and a chat memory becomes obvious.

- **Markdown record export.** Several developers, especially those coming from Claude Code, expect memory to be represented as markdown files they can browse and edit directly. Neotoma uses SQLite as its canonical store, which gives you deterministic queries and schema constraints but means you can't just open a file in your editor. I'm adding a command to export your records as markdown files on disk, organized by entity type, with frontmatter metadata and provenance. SQLite stays canonical. The markdown files are a read-friendly mirror for transparency and inspectability.

- **Smoother remote access for ChatGPT and Claude.** The integration guides exist now, but the remote setup paths for ChatGPT (Custom GPT with API endpoint) and Claude (Desktop with remote MCP) need more of my own dogfooding and debugging before they're as smooth as the local paths for Cursor and Claude Code. I want to get both working reliably end-to-end and update the guides with clearer instructions and troubleshooting.

## What I want feedback on

The developer release is still active. If you try installing Neotoma and working through the site, I want to know:

- Is the positioning clear? When you land on the home page, do you understand what Neotoma does and how it differs from what you already use?
- Does the memory guarantees table help you decide whether Neotoma is relevant to your workflow?
- Is the install and onboarding path clear? Can you get from the site to a working setup without hitting a wall?
- Are the integration guides accurate for your tool?

Visit [neotoma.io](https://neotoma.io), ask your agent to [install](https://neotoma.io/install) with the copy-and-paste instructions, and share your feedback. Open an issue on [GitHub](https://github.com/markmhendrickson/neotoma) or reach out directly.
