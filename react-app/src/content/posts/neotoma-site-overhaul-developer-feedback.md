I overhauled the [Neotoma](https://neotoma.io) site. The single scrolling page is now a full documentation site with [tool-specific integration guides](https://neotoma.io/docs) and [architecture deep dives](https://neotoma.io/architecture). Every change here traces back to something a tester said or got stuck on during the developer release.

## What the feedback told me

Since announcing the [developer release](/posts/neotoma-developer-release), I've collected feedback from about a dozen testers across calls, chat, email and screen recordings. The sentiment has been encouraging. One person called it "a very relevant problem" and noted that "most people are rolling their own right now." Another said it sounds like a problem worth solving. Someone else was just pumped it was out into the wild.

But the useful feedback was about where people got stuck.

**"Who is this for and why would I use it?"** Multiple people asked this directly. The old site led with architecture and abstractions. Testers wanted acute, specific pain first. One compared it to selling a vitamin instead of a painkiller. Another asked point-blank: "Am I one of the people this is for?" The site needed to answer that question in the first few seconds. (The new [use case pages](https://neotoma.io/ai-infrastructure-engineers) and [memory models comparison](https://neotoma.io/memory-models) are the direct response.)

**"Is this meant to replace my existing memory, or live alongside it?"** A technical tester asked whether Neotoma should be the primary memory system or sit alongside things like Claude Code's auto-memory. Another asked how ingestion works: is it regex, AI evaluation, or the agent filling in tool parameters? The old site didn't address any of this. The architecture and mechanics were scattered across the README and repo docs. (The new [memory models page](https://neotoma.io/memory-models) and [developer walkthrough](https://neotoma.io/developer-walkthrough) address both questions.)

**"How do I set this up with my tool?"** One tester had Neotoma running with the CLI but asked "so it doesn't work with OpenClaw?" because the client listing on the site was unclear. Another hit a module-not-found error trying to start the API. A third spent an hour reading docs on a fresh VM and flagged a broken link in the documentation index plus unexpected macOS permission popups. Setup instructions were buried and varied by tool, and the site's install snippet lacked a direct link to what happens after init. (The new [install page](https://neotoma.io/install) and six [integration guides](https://neotoma.io/neotoma-with-cursor) address this.)

The positive signal underneath all of this: several testers got Neotoma working and verified it stores and retrieves correctly. One confirmed it "stores stuff when I ask and can verify with the CLI." The core works. The site and onboarding didn't.

## Home page

The home page now has nine distinct sections instead of one long scroll. The three that respond most directly to the feedback:

**[Memory guarantees table](https://neotoma.io/memory-guarantees).** This is the answer to "how is this different?" A comparison of platform memory (Claude, ChatGPT), retrieval systems (Mem0, Zep, LangChain Memory), file-based approaches (Markdown, JSON stores), and Neotoma across 12 properties:

<!-- TODO: Screenshot of the memory guarantees comparison table on the home page -->

- [Deterministic state evolution](https://neotoma.io/deterministic-state-evolution). Same observations always produce the same entity state regardless of ordering. Eliminates ordering bugs and makes state transitions testable.
- [Versioned history](https://neotoma.io/versioned-history). Every change creates a new version instead of overwriting. Earlier states stay accessible.
- [Replayable timeline](https://neotoma.io/replayable-timeline). The full sequence of observations can be replayed from the beginning to reconstruct any historical state.
- [Auditable change log](https://neotoma.io/auditable-change-log). Every modification records who made it, when, and from what source.
- [Schema constraints](https://neotoma.io/schema-constraints). Entities conform to defined types and validation rules. Malformed data is rejected, not silently accepted.
- [Silent mutation risk](https://neotoma.io/silent-mutation-risk). Whether data can change without explicit awareness. Platform, retrieval, and file-based approaches all carry this risk. Neotoma prevents it.
- [Conflicting facts risk](https://neotoma.io/conflicting-facts-risk). Whether contradictory statements can coexist without detection. Neotoma flags and resolves conflicts instead of storing both.
- [Reproducible state reconstruction](https://neotoma.io/reproducible-state-reconstruction). The complete current state can be rebuilt from raw inputs alone, the way a ledger balances to zero from its entries.
- [Human inspectability](https://neotoma.io/human-inspectability). You can examine exactly what changed between any two versions and trace where each fact originated.
- [Zero-setup onboarding](https://neotoma.io/zero-setup-onboarding). Whether memory works from the first message with no install. Platform memory has this. Neotoma does not.
- [Semantic similarity search](https://neotoma.io/semantic-similarity-search). Finding relevant context by meaning rather than exact match. Retrieval systems and Neotoma both provide this, scoped differently.
- [Direct human editability](https://neotoma.io/direct-human-editability). Whether you can open the memory store in a standard editor and modify it directly. File-based systems have this. Neotoma does not.

Each row links to a dedicated explanation page with before/after examples and CLI code. One tester had pushed back that "general storage with schemas is unsolved" and that popular schemas could be the answer. The guarantees table is my response: here are the specific properties, here's where each approach delivers, here's where it doesn't.

<!-- TODO: Screenshot of the before/after animated section showing fail vs succeed responses -->

**Before and after.** An animated side-by-side showing the same question producing two different answers. Without Neotoma: "No contract found for Kline." With Neotoma: "Net-30, signed Oct 12, auto-renews Q1." Eleven scenarios cycle through the real failure modes: stale contacts going to the wrong person, forgotten deadlines triggering reminders against old tasks, conflicting records where two agents read different versions of the same contract and neither knew the other existed. Four failure cards break these down by data type (financial facts, people and relationships, commitments and tasks, events and decisions), each with a concrete narrative. This was the direct response to the "vitamin vs painkiller" feedback. The old site led with architecture. This section leads with what breaks without deterministic state and what that costs you.

<!-- TODO: Screenshot of the three audience cards with illustrations -->

**Who is it for.** Three audience cards with custom illustrations: [AI infrastructure engineers](https://neotoma.io/ai-infrastructure-engineers), [builders of agentic systems](https://neotoma.io/agentic-systems-builders), and [AI-native individual operators](https://neotoma.io/ai-native-operators). Each links to a dedicated page with failure modes, data types, and schema patterns specific to that audience. This is the direct answer to "am I one of the people this is for?"

## Documentation

The old site had everything inline. Testers who wanted depth had to go to the repo. Now there are 40+ dedicated pages organized in a sidebar navigation.

<!-- TODO: Screenshot of the developer walkthrough page showing multi-session MCP examples -->

**[Developer walkthrough](https://neotoma.io/developer-walkthrough).** A multi-session scenario that walks through the core loop: store an architectural decision in session 1, retrieve and act on it in session 2, handle a conflicting update in session 3, then audit the full observation trail. All using MCP (Model Context Protocol) store calls with real request/response examples. This addresses the ingestion question directly: the agent calls the [MCP tool](https://neotoma.io/mcp) with structured parameters, Neotoma stores the observation. No hidden AI model calls, no regex extraction.

**[Memory guarantees](https://neotoma.io/memory-guarantees).** The largest single page on the site. Each of the 12 properties from the comparison table gets a dedicated section with an explanation, a "before vs after" scenario, and runnable [command-line](https://neotoma.io/cli) examples. Properties link to each other where they depend on one another ([replayable timeline](https://neotoma.io/replayable-timeline) depends on [deterministic state evolution](https://neotoma.io/deterministic-state-evolution), for instance).

**[Memory models](https://neotoma.io/memory-models).** A comparison page explaining four approaches: [platform memory](https://neotoma.io/platform-memory), [retrieval memory](https://neotoma.io/retrieval-memory), [file-based memory](https://neotoma.io/file-based-memory), and [deterministic memory](https://neotoma.io/deterministic-memory). This is where the "should Neotoma replace or complement my existing memory?" question gets answered. Each model has a dedicated sub-page explaining what it is, where it works, and where it breaks.

**[Foundations](https://neotoma.io/foundations).** [Privacy-first](https://neotoma.io/privacy-first), deterministic, and [cross-platform](https://neotoma.io/cross-platform) explained in depth. The privacy-first page responds to testers who were skeptical about feeding personal data into cloud AI tools. Neotoma runs on your machine. Your data stays local.

**Reference pages.** Full [REST API](https://neotoma.io/api) endpoint table, [MCP actions](https://neotoma.io/mcp) catalog, and [command-line reference](https://neotoma.io/cli). The API page includes per-endpoint descriptions and parameters. The MCP page lists all 24 actions. The CLI page covers all 38 commands.

<!-- TODO: Screenshot of the architecture page showing the state flow diagram -->

**[Architecture](https://neotoma.io/architecture).** A full architecture page covering the state flow (source, observation, entity, entity snapshot), the layers, and how guarantees are enforced at each stage. This was one of the most requested additions.

## Integration guides

Six tool-specific pages, each walking through setup from install to first store:

- [Cursor](https://neotoma.io/neotoma-with-cursor)
- [Claude (Desktop)](https://neotoma.io/neotoma-with-claude)
- [Claude Code](https://neotoma.io/neotoma-with-claude-code)
- [ChatGPT (Custom GPT)](https://neotoma.io/neotoma-with-chatgpt)
- [Codex](https://neotoma.io/neotoma-with-codex)
- [OpenClaw](https://neotoma.io/neotoma-with-openclaw)

<!-- TODO: Screenshot of one integration guide page (e.g. Cursor or Claude Code) showing the setup steps -->

This is the direct answer to "does it work with X?" and "how do I set this up with my tool?" Every guide covers configuration, a first-run example, and what to expect. The ChatGPT page is the most detailed because the Custom GPT setup has the most steps. The OpenClaw page exists because a tester specifically asked whether it was supported and the old site was ambiguous.

## Use case pages

Three dedicated audience pages replace the summary table on the old home page:

<!-- TODO: Screenshot of one audience detail page showing failure modes and common data patterns -->

**[AI infrastructure engineers](https://neotoma.io/ai-infrastructure-engineers).** Pain points like non-reproducible agent runs, invisible state changes, and no provenance trail. Common failure modes with specific icons. Data types these teams work with (session state, pipelines, evaluations, audit trails) and the entity types that come up most often (agent_session, action, pipeline, evaluation).

**[Builders of agentic systems](https://neotoma.io/agentic-systems-builders).** Similar structure focused on agent frameworks, multi-step workflows, and observability. Failure modes like silent state changes between sessions, workflows that can't be replayed, and context loss when one agent hands off to another.

**[AI-native individual operators](https://neotoma.io/ai-native-operators).** Focused on the daily experience of lost commitments, tool-to-tool context loss, and personal data in opaque provider memory. This is the page for the tester who asked "am I one of the people this is for?"

## Site infrastructure

Beyond content, the site now has docs sidebar navigation, custom illustrations for the audience and interface sections, auto-translation for 12 languages, a full sitemap, a social preview image, a custom 404 page, copyable code blocks, and scroll position management across page transitions.

## What I want feedback on

The developer release is still active. If you try installing Neotoma and working through the site, I want to know:

- Is the positioning clear? When you land on the home page, do you understand what Neotoma does and how it differs from what you already use?
- Does the memory guarantees table help you decide whether Neotoma is relevant to your workflow?
- Is the install and onboarding path clear? Can you get from the site to a working setup without hitting a wall?
- Are the integration guides accurate for your tool?

Visit [neotoma.io](https://neotoma.io), [install](https://neotoma.io/install) with `npm install -g neotoma`, and share your feedback. Open an issue on [GitHub](https://github.com/markmhendrickson/neotoma) or reach out directly.
