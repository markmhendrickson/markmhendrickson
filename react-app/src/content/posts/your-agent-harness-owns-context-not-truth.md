---
title: "Your agent harness owns context, not truth"
excerpt: "Sarah Wooders argues memory is the harness. She's right about context management. She's wrong that context is the whole problem."
published: true
publishedDate: "2026-04-10"
---

I saw Sarah Wooders' thread last week and immediately agreed with half of it.

Wooders, co-creator of MemGPT (now Letta), [argued that memory is not a plugin, it is the harness](https://x.com/sarahwooders/status/2040121230473457921). The harness makes invisible decisions no external tool can control: what survives compaction, how context is loaded, whether the agent can modify its own instructions. "Asking to plug memory into an agent harness is like asking to plug driving into a car."

The framing is easy to pass along. I keep hearing the harness line repeated as settled background, not as a claim to inspect. That is partly because the half I agree with is correct.

## The invisible decisions are real

[Claude Code has a multi-level memory hierarchy built into the harness](https://docs.anthropic.com/en/docs/claude-code/memory): CLAUDE.md, session state, compaction rules, system message injection. When [Claude Code compacts](https://docs.anthropic.com/en/docs/claude-code/best-practices) a 100K-token conversation to 20K, the harness decides what survives. No external tool can replicate or override that decision.

Ahmed Kidwai, who builds [Virtual Context](https://github.com/virtual-context/virtual-context), described the same structure from the user seat in [AI spends most of its life reading about its life](https://open.substack.com/pub/virtualcontext/p/ai-spends-most-of-its-life-reading). Each turn can replay the full thread, so most input tokens go to rereading what already happened. When the window fills, compaction replaces raw history with a summary. You do not get a line-item receipt of what vanished.

Within a single session, the harness's choices about what enters the context window, what gets summarized, and what gets dropped are the effective memory system. Wooders is right about this.

## The argument assumes one harness

The thread concludes you should use a memory-first harness. That conclusion requires you to operate inside one.

I don't. I use Cursor as my primary interface, Claude Code for specific tasks, ChatGPT for conversations, and custom scripts for automation. That is four harnesses, each making its own invisible decisions about what to remember.

The people I talk to who build with agents use three to five tools. Each compacts differently, loads context differently, stores state differently. The user becomes the human sync layer between all of them.

Adding more harness-embedded memory makes this worse, not better. Each tool gets better internal memory. None of them agree.

## Three concerns, not one

Wooders collapses context window management, session state, and durable state into one concept she calls "memory." These are architecturally distinct.

**Context window management**: What fits in the prompt right now, what gets compacted, what the model sees this turn. This is a harness concern. Wooders is right.

**Session state**: Persists within a conversation. This is also a harness concern.

**Durable state**: Persists across sessions, tools, and agents, with provenance and versioning. This is infrastructure, not harness.

No harness provides deterministic, schema-bound, append-only, cross-platform state with provenance. Context management is driving. Durable state is the navigation data. It informs driving but does not belong inside the drivetrain.

## Even context can be externalized

Kidwai's [Virtual Context](https://github.com/virtual-context/virtual-context) is a proxy that sits between your client and the upstream LLM API. The client sets a 20-million-token context window. The model's real window is 200K. Virtual Context compresses, indexes, and pages between them. A 937K-token Claude Code payload with 52 tool chains collapses to ~65K of curated signal.

On [LongMemEval](https://github.com/virtual-context/virtual-context#benchmark-results), Virtual Context scored 95% accuracy versus 33% for Claude Sonnet 4.5 with full raw context, at half the cost. The proxy works with Claude Code, Cursor, OpenClaw, or any client that accepts a base URL. VCATTACH lets two clients share the same compacted knowledge base across platforms.

The mechanism matters. VC does not bypass the harness. The harness still makes its own compaction and truncation decisions and composes the API request. VC intercepts that request downstream via a base-URL redirect. When the harness truncates conversation history, VC detects the truncation and recovers from its own durable store. What reaches the model is VC's curated window, not the harness's raw output.

Wooders is right that no external tool can control the harness's internal decisions. But a proxy sitting between the harness and the API can observe those decisions and partially reverse them. The harness sends 937K tokens after its own compaction. VC sends 65K of curated signal to the model. The harness still runs the tool loop and the agent. The layer that decides what the model actually sees lives outside.

That leaves three layers, not two. The harness runs the agent. An optional context management layer can sit between the harness and the API. And a durable state layer sits beneath everything, persisting what is true regardless of how any session's context is managed.

## Control versus value

An external tool cannot control the harness's compaction decisions. True. But the question is not whether a state layer controls compaction. It is whether it provides value the harness's native memory does not.

Most harness-native memory is ephemeral. Letta is the exception: it persists memory across sessions by design. But even Letta's memory is tool-specific, non-portable, and non-deterministic. The agent decides what to store and when via LLM-driven tool calls, so the same conversation can produce different memory states. Cursor cannot read it. Claude Code cannot read it. A durable state layer is cross-platform, deterministic, versioned, and traceable to source.

You don't need to control the harness to be valuable. You need to survive the harness's decisions. Append-only, durable state survives by design. When a harness compacts context, the state layer holds the full record. When you open a different tool tomorrow, the state layer has what you stored yesterday.

## Triggering versus transport

Nicolò Boschi (Hindsight/Vectorize) [agreed with Wooders](https://x.com/nicoloboschi/status/2042145292632379598): "Using memory via MCP and hoping the model will store and search information from memory is hopeless." The concern is real. If the model has to decide when to store and retrieve, it can forget to store. It can skip retrieval when it matters.

Instead of MCP, Hindsight uses [hooks](https://docs.anthropic.com/en/docs/claude-code/hooks): scripts that harnesses run automatically at lifecycle events like session start, prompt submission, or tool completion. No LLM decides whether to fire them. Hindsight's Claude Code plugin uses four lifecycle hooks to auto-retain every conversation and auto-recall on every prompt. It works.

But this argument conflates two things: how memory is triggered and where it lives.

Hindsight's hooks call the Hindsight API. They do not write to the harness's built-in memory. The hooks are the trigger. The external server is the storage. That separation is the entire architecture. A hook that wrote to Claude Code's native memory would inherit the same limitations: ephemeral, non-portable, invisible to Cursor tomorrow.

Hooks solve the triggering problem. They do not solve the storage problem. Every durable memory system needs both.

Hooks are widely though not universally available. Claude Code has a plugin system with 12+ events. Cursor has hooks.json with 14+ events in beta. OpenCode has 20+ events including compaction control and system prompt injection. Codex has session hooks with tool-level hooks in development. ChatGPT and the Claude web app remain MCP-only. Hindsight itself ships an MCP server for exactly those cases.

The answer is hooks where available, MCP where not, both writing to the same durable state layer beneath every harness. "MCP is hopeless" is a statement about triggering reliability, not about where memory should live.

## The layers are complementary

Five harnesses making five different compaction and context decisions produce five different versions of what the agent knows. The "driving" analogy works for context management. It breaks when you drive five cars and need consistent navigation data across all of them.

Context management and durable state are not competing. A harness runs the agent and the tool loop. A context layer, built in or external, manages what the model sees each turn. A state layer manages what is true across sessions and tools. No harness or context proxy offers verifiable truth, provenance, determinism, schema validation, or cross-tool access. The argument for harness-embedded memory is simultaneously the argument for a shared state layer beneath every harness.

## What I'm building

I'm building [Neotoma](https://neotoma.io), a structured memory layer that lives beneath any harness: entity resolution, timelines, provenance, determinism, cross-platform access.

These threads changed what I'm building next. I had treated MCP as the only integration surface. Now I'm adding hooks as a lifecycle extension layer. MCP remains the primary agent interface.

The separation is deliberate. MCP owns the agent contract: instructions loaded once at session start, structured storage tools the agent calls with full contextual awareness. Hooks own the harness contract: lifecycle events the agent does not control. A `UserPromptSubmit` hook retrieves relevant entities automatically before the agent sees each prompt. `PostToolUse` hooks capture every file edit and shell command as observations. A `Stop` hook persists the raw conversation if the agent's own closing store was missed. A `PreCompact` hook observes what the harness is about to discard.

The result is a reliability floor beneath the MCP quality ceiling. Without hooks, MCP works as it does today. Without MCP, hooks provide raw observation capture but no structured entity extraction. Both together give deterministic retrieval, passive observation, compaction awareness, and crash recovery.

This differs from Hindsight's approach. Hindsight captures raw transcripts via hooks, then runs a separate server-side LLM to extract entities. That means a second model judges what matters, with additional cost and latency per operation. Neotoma keeps entity extraction agent-driven: the same model that understands the conversation does the extraction at zero marginal LLM cost. Hooks provide the reliability layer underneath, not the intelligence.

Plugins for Claude Code, Cursor, OpenCode, and Codex are next. The hooks write to Neotoma, not to the harness's built-in memory. All of them reach the same durable state layer, by hooks where available and MCP where not.

Wooders is right that the harness owns context. Boschi is right that hooks beat MCP for triggering reliability. Kidwai shows that even context management can be externalized. The question none of them addresses is who owns truth when you use five harnesses. That answer has to live beneath all of them.
