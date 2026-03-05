---
title: Your AI remembers your vibe but not your work
excerpt: Claude and ChatGPT now offer memory for free, but what they store are profile snippets, not the details of what you actually worked on. My testing showed stale exports, one-shot access, and platform-gated portability. That is why I am building a truth layer underneath.
published: true
hero_image: your-ai-remembers-your-vibe-but-not-your-work-hero.png
hero_image_style: keep-proportions
---
[Claude moving memory to the free plan](https://x.com/claudeai/status/2028559427167834314) is a real milestone. It confirms memory is now a core product surface, not a premium edge feature.

That part is great news.

The harder question is what "memory" actually means once you depend on it for real work. I have been testing memory across both Claude and ChatGPT for months. Two problems keep showing up.

## What memory actually stores

Both Claude and ChatGPT use the word "memory" in a way that leads people to assume full retention of meaningful detail across conversations. The reality is different. [Agent memory has a truth problem](/posts/agent-memory-truth-problem): retrieval breaks on completeness, consistency, and provenance.

What these systems store is closer to condensed profile snippets. They observe your conversations and distill a handful of facts about who you are and how you prefer to work. Claude seems to do this best. For every chat, it produces a few observations, mostly about your identity as a professional, your style preferences, how you like to interact with AI. ChatGPT, at least in my experience, tends to save these snippets only when you explicitly prompt it to.

These features do not capture granular detail about the things you have actually worked on.

If I have a conversation about my fitness routine, the exercises I have been doing, the body composition stats I have been tracking, the system will summarize that I am "into fitness." It will not store the actual data about my health evolution. If I work through a financial analysis or a set of project tasks, the system might note that I care about those domains. It will not retain the specifics.

The broad claim that these agents remember the "context" you have given them is helpful but narrow. It is good for familiarity. It makes conversations feel more natural. It does not provide any guarantee that an agent can answer detailed questions about past work or reliably pick up where you left off.

The result is something like a friend who forgets the details of everything you have talked about but has a vague sense of who you are as a person. That is useful for smoother conversation. It is not useful for delegating ongoing work.

## Where portability breaks down

Claude made a compelling offer alongside its memory release: [import your memory from other services](https://claude.com/import-memory). The idea is simple. Ask your old assistant what it knows about you, copy the output, and bring it into Claude.

As UX, this is smart. As infrastructure, it breaks fast.

I tested this with ChatGPT. The first time I used the Claude export prompt in a regular, non-project chat, ChatGPT did respond with the memory snippets it had saved. But these were mostly stale entries, many from 2024, and almost none reflected my recent work or interactions from this year. There was no sign that the system had automatically learned anything new from the hundreds of conversations I had in the past several months.

![ChatGPT saved memories showing stale, surface-level entries](/images/posts/your-ai-remembers-your-vibe-but-not-your-work-chatgpt-saved-memories.png)

The cross-chat context that ChatGPT clearly has, where information from one thread surfaces in another, did not appear in the export at all. Only the discrete, explicitly saved memory entries came through.

When I tried the exact same export prompt again in subsequent non-project chats, ChatGPT refused entirely. It would not produce the memory list a second time. So even the partial export I got was a one-shot result.

![ChatGPT refusing to export memory, listing internal categories as not exportable](/images/posts/your-ai-remembers-your-vibe-but-not-your-work-chatgpt-export-denied.png)

In project-based chats, the situation was worse still. When I used the same prompt inside a ChatGPT project, it refused to export memory from the start. Instead, it redirected me to the bulk conversation export feature. That feature gives you a raw data dump, not structured context. You get files to download and figure out on your own.

![ChatGPT refusal: no dump of memories or internal context](/images/posts/your-ai-remembers-your-vibe-but-not-your-work-chatgpt-refusal-no-dump.png) ![ChatGPT what you can export: account data and distinction from internal summaries](/images/posts/your-ai-remembers-your-vibe-but-not-your-work-chatgpt-export-what-you-can.png)

So the portability story has a gap at both ends. The source platform controls what it will disclose and where. The target platform can only ingest what actually comes through. If exports are partial, stale, and surface-dependent, "portability" is best-effort transfer, not reliable state migration.

## Three categories hiding under one word

I think the market is collapsing at least three distinct things under the word "memory."

The first is convenience memory. Profile snippets that smooth out interactions, avoid repetition, and help personalization. It makes chatbots feel less stateless. This is what Claude and ChatGPT ship today, and it is what the first two sections of this post describe.

The second is retrieval-augmented memory. Some platforms already do this to some extent by treating past conversation transcripts as files and searching over them on demand. More broadly, the agent uses agentic search or embedding-based search over your files, mail, and tools to surface context when you ask for it. It can answer "what did we decide in the last three emails?" or "find anything about the Barcelona apartment." That is a step up from profile snippets. But [agentic retrieval infers; it does not guarantee](/posts/agentic-search-and-the-truth-layer). There is no persistent canonical state, no provenance, no cross-session consistency. Same question can yield a different answer next time. It is a middleground: better than convenience memory for real work, not a substitute for durable state.

The third is durable operational memory. It is typed, deterministic, and auditable state that can survive tool changes, platform switches, and workflow boundaries. It is what you need when agents start handling recurring tasks, contacts, commitments, and transactions on your behalf.

All three matter. They are not interchangeable.

Convenience memory wins the chat experience. Retrieval wins exploratory, one-off questions. Durable memory wins the state layer underneath.

## How Neotoma handles this differently

I am building Neotoma for the third category. I have written before about [building a truth layer for persistent agent memory](/posts/truth-layer-agent-memory).

The core design difference is that Neotoma treats memory as explicit, user-owned data infrastructure rather than an opaque byproduct of chat interactions.

**Entities instead of snippets.** Every piece of context in Neotoma is a structured entity with a type, properties, and relationships to other entities. A contact is a contact. A task is a task. A financial record is a financial record. They are not collapsed into a bag of natural language summaries about "what the user cares about." When an agent stores something, it stores a typed record. When an agent retrieves something, it gets back a deterministic result, not a probabilistic reconstruction.

**Provenance on every fact.** Every observation in Neotoma tracks where it came from and when it was recorded. If two agents contribute information about the same entity, each contribution is separately traceable. There is no black box. You can audit any fact back to its source.

**Cross-tool access through MCP.** Neotoma exposes its data through the Model Context Protocol, which means any MCP-compatible agent can read and write to the same truth layer. I use this daily. The same data I populate through Cursor is available to Claude, to ChatGPT, and to any future tool that speaks MCP. There is no export step. There is no copy-paste. The data is just there, accessible and consistent regardless of which agent I happen to be working with.

**No platform gating.** In the ChatGPT model, memory lives inside the platform and the platform decides what to disclose, where, and to whom. In Neotoma, the user owns the data store. No platform can refuse to export it because it was never locked into one.

**Incremental and composable.** Agents can add observations to existing entities over time. If one agent helps me with taxes this year, another agent on a different platform next year can pick up from the same structured records. The knowledge compounds instead of resetting.

This creates a clean separation. Chat interfaces can keep optimizing for interaction quality, personality, and UX. The truth layer underneath optimizes for reliability, completeness, and control. When one model or interface changes, the underlying state does not drift with it.

## Where I think this goes

In the near term, most users will keep using platform memory. They should. It is improving and it makes chat feel better.

In parallel, anyone building serious agent workflows will start running into the same gaps I ran into: partial recall, stale exports, surface-dependent behavior, hallucinated context. Those problems get more expensive as you delegate more responsibility. I have written separately about the [six structural trends](/posts/six-agentic-trends-betting-on) that make this gap wider over time: agents becoming stateful, errors becoming priced, platforms staying opaque, tools staying fragmented.

The pattern I expect is that truth layers appear underneath the chat layer. Gradually at first, then as obvious infrastructure.

Claude making memory free pushes the whole category forward. My testing just clarifies where the boundary is. Platform memory improves conversation quality. It does not yet provide a dependable substrate for cross-context, long-horizon agent work.

That gap is what I am building [Neotoma](/posts/neotoma-developer-release) to fill. The developer release is available now at [neotoma.io](https://neotoma.io), and I am actively welcoming testers.
