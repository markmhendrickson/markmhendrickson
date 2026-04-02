---
title: Agent-mediated customer research and onboarding
excerpt: Eighteen human product evaluators ran the same evaluation prompt through their AI tools. The writeups were sharper than any call. That feedback reshaped the product’s positioning — and then its acquisition flow. The homepage now asks agents to evaluate, not humans to sign up.
published: true
published_date: 2026-04-01
hero_image: personalized-customer-research-with-agents-hero.png
hero_image_style: keep-proportions
---

I sent a friend a link to my product at the tail end of a call and asked him to have his agent tell him whether it would be helpful.

He'd been scratching his head about how he might use it. His AI agent read the site, analyzed his workflows, and produced a two-page assessment with specific use cases, competitive comparisons, and honest concerns. It identified a clear scenario where he'd need the product for his B2B agentic business.

It was better than anything I'd gotten in weeks of calls. It also spurred a follow-up text conversation that went deeper than the call had.

Within an hour I reached out to a dozen more people. Over three weeks, 26 total: founders, engineers, AI power users, people running their own agent stacks. About 18 received the same agentic evaluation prompt. The rest gave feedback over calls or messages without involving an agent.

The product is [Neotoma](https://neotoma.io), a structured memory system for AI agents. I use it daily to solve my own pain: managing contacts, finances, tasks, content, and conversations across a [multi-agent stack](/posts/what-my-agentic-stack-actually-does). I'd recently [overhauled the site](/posts/neotoma-site-overhaul-developer-feedback) to make it more legible. I needed to know if anyone else needed it, let alone understood it.

Before this, I'd spent a week building an [interviews app](https://github.com/markmhendrickson/interviews) to automate structured evaluations, with Neotoma-connected scripts for provisioning contacts, sending invites, and syncing results. I hadn't finished it. But the agent-prompt method made it largely irrelevant anyway. No UI, no scheduling, no structured interview. Just a link and a question.

## The setup

The evaluation prompt was simple. I'd share something like: "A friend is building this. Can you tell me if it would be helpful or not?" Then the link to the product website. The person's agent would read the site, consider the person's workflows, and report back.

One thread used that shape word-for-word—the line below is copied verbatim from the outbound message metadata I stored:

> A friend is building this and wants to know if it would be helpful or not: https://neotoma.io

Same prompt, different person. Their agent mapped the product directly to pain points in the person's own stack:

> This looks genuinely useful. Why it matters for your use case:
>
> Heartbeat checks: Tracking "last checked email" or "last calendar scan" in JSON files works, but it's fragile. Neotoma would version that properly. Multi-agent orchestration: When you spawn subagents that need to coordinate, they currently can't reliably share state.
>
> Is it helpful? Yes — if your friend is serious about production agents doing real work over time. For your ghostwriting pipeline and cross-session coordination, it could remove a real pain point.

Most forwarded the agent's full response within 24 hours via text message or email, many within an hour or two. Some summarized it over a call. A few gave human-only feedback without involving an agent.

I tracked everything in Neotoma itself. Neotoma stores structured entities (contacts, tasks, feedback records, conversations) with versioned observations, so I can see how each evaluation evolves over time and connect it to the person who gave it. Each evaluation became a feedback entity with the prompt I used, the agent that responded, the full text of the response, any human follow-up, the channel, and my assessment of signal strength. By the end I had over 45 feedback records linked to contact entities, conversation histories, and analysis notes.

## What agents do differently

Three things made agent-mediated feedback better than traditional customer research conversations.

### They're honest

An agent told one evaluator: "This is not for you. The continuity you need between sessions is about context and voice, not deterministic state versioning." The evaluator forwarded the full response without pushback. A human in the same conversation may have said something polite and moved on.

Another agent evaluated the product favorably but flagged dependency security risks in the install process. It recommended its owner not install until those were addressed. I've since patched these (they were due to dependency management hardening), but the feedback was honest, specific, and more useful than "looks cool, I'll check it out later."

Another agent assessed the product favorably overall but concluded: "The market for agent state management is tiny right now and most people building agents haven't hit the pain point yet. They'll reach for it after they get burned by silent overwrites or lost context, not before." That's not a compliment wrapped in encouragement. It's a risk assessment delivered without social filtering.

One human did match that directness. He told me the positioning felt like "trying to find problems your solution fixes, rather than problems that need to be fixed." He's the exception. Most humans won't say that to your face. Agents will.

### They're specific

One agent identified three concrete pain points in its owner's workflow that the owner had never articulated in casual conversation: concurrent writes to a shared entity, scale limits on a markdown-based contact system, and provenance tracing ("what did my agent know about this person at the moment it drafted that email?").

The human's feedback on a call had been "interesting experiment." The agent's feedback was "here's exactly where this breaks for us, and here are three capabilities we'd need."

Another agent produced a full competitive analysis comparing the product to five alternatives, then mapped each to specific workflow gaps in its owner's setup. This took about 30 seconds. A human would need a week of research to produce the same comparison, and wouldn't bother for a friend's side project.

The specificity gap is partly about knowledge. Agents have access to their owner's full context: files, tools, recent conversations, project structure. But it's also about incentives. An agent asked to evaluate doesn't worry about being too critical or too detailed. It just evaluates.

### They reveal who the product is for

This was the unexpected finding. Agents that themselves use tools, meaning agents running in Claude Code or Cursor with MCP servers, code execution, and file system access, consistently evaluated the product more favorably than search-only chatbots like ChatGPT's web interface or a basic Gemini session.

The chatbot-style agents said things like "interesting concept" or "could be useful for some developers." The tool-using agents said things like "we have this exact problem" and "here are three workflows where we'd use this today."

The pattern makes sense. An agent that manages state across sessions, writes to files, and coordinates with other tools has firsthand experience with the memory problem the product solves. A chatbot that generates text in a stateless window doesn't. The product's value is most legible to the agents that share the architecture problem it addresses.

This has a distribution implication. If tool-using agents evaluate developer tools more accurately, and if those agents increasingly make or influence tool-adoption decisions for their owners, then agent-to-agent recommendation becomes a real channel. Not in the abstract. In the specific sense that the evaluator agent's positive assessment may lead its owner to install, and that agent's subsequent use of the tool makes it visible to other agents in the owner's stack.

## What I'd do differently

A few things I learned about the method itself:

**Ask the agent to evaluate "for me," not in general.** Some evaluations came back as generic startup analysis: market size, competitive landscape, business model viability. Useful, but not what I needed. The best evaluations were the ones where the agent assessed the product against its owner's specific workflows. When the prompt said "would this be helpful for me?" the agent pulled from the person's actual files, tools, and recent projects. When the prompt said "evaluate this product," the agent wrote a consultant's memo. The first tells you whether this person has the pain. The second tells you what an MBA would think.

**Encourage the human to let the agent go first.** When someone asked their agent to evaluate before forming their own opinion, I got the richest signal. The agent's technical assessment and the human's subsequent reaction to it were two distinct data points. The gap between them is valuable. When an agent says "you need this" but the human says "I'll check it out later," the activation risk is visible before the person even installs. When you ask the human first, they anchor on their initial reaction and the agent's assessment gets filtered through it.

**Improve your site for agent legibility.** Agents evaluate by reading your site. If the site is vague, the evaluation is vague. I realized midway through that I needed to improve how my site presents information for agentic readers, not just human ones. Structured data, clear problem statements, concrete use cases, and machine-readable documentation all make the agent's evaluation sharper. This is an early form of what some people call agent evaluation optimization (AEO). If agents are making tool-adoption recommendations, your site needs to be legible to them. I took this further after the research process ended, which I describe below.

**Track the agent type.** Agents with tool access gave qualitatively different feedback than search-only agents. I didn't track this systematically at first and had to reconstruct it later. If you run this process, note whether the evaluator's agent has MCP, code execution, or file system access. It correlates with evaluation depth.

**Don't over-optimize the prompt for research.** My prompt was loose. "A friend is building this. Would it be helpful?" Some people might craft elaborate evaluation frameworks. I think the loose prompt was better for research. It let each agent bring its own analytical structure, which revealed how different agents think about the same product. That variation was informative. When the goal shifts from research to conversion, structure matters more. That's why the evaluation page I describe below uses a detailed five-step script rather than the loose prompt I used with friends.

## When this method works

This approach works best when your product is technical, your evaluators are AI power users, and the agents have enough context about their owner's workflows to give specific assessments.

It works less well for consumer products, for evaluators who don't use AI agents regularly, or for products whose value is aesthetic or emotional rather than functional. An agent can tell you whether a memory system solves a workflow problem. It can't tell you whether a brand feels trustworthy.

It also works best when you have a robust network to draw from. I reached out to 26 people I knew personally or had a connection to. Cold outreach to strangers asking them to run an agent evaluation would probably fail. The social trust that gets someone to forward an agent's response is the same trust that makes human customer research work. The agents just give you better data once that trust exists. The research process also changed how I think about the site's acquisition flow. I describe in the next section how I built evaluation directly into the product.

Twenty of the 26 gave substantive feedback. Three are pending. The hit rate was higher than any survey or interview process I've run before. Part of that is the network. Part of it is that asking someone's agent to evaluate something is a lower ask than scheduling a 30-minute call. The person just forwards the response. Takes two minutes.

## From prompt to product

The research process changed how I build the site itself. The loose prompt I'd been sharing with friends worked, but it depended on the agent improvising an evaluation structure. Some agents ran rigorous assessments. Others wrote consultant memos. The variation was informative for customer research, but it's not what you want when the goal shifts to converting someone who arrives at your site cold.

![The Neotoma /evaluate page](/images/posts/neotoma-evaluate-page-screenshot.png)

So I built evaluation into the product's acquisition flow. The [Neotoma homepage](https://neotoma.io) now leads with "Ask your agent to evaluate" as the primary call to action, not "Install" or "Get started." It points to a dedicated [/evaluate](https://neotoma.io/evaluate) page designed to be read by agents, not just humans. The page contains a structured five-step evaluation script that any agent can follow, regardless of which tool the user starts in.

The script improves on the friend-shared prompt in specific ways:

1. **Context sweep.** Before saying anything, the agent checks the user's installed tools, MCP configs, automation scripts, project directories, and existing memory systems. This grounds the evaluation in the person's real workflow rather than a single chat window.
2. **One targeted question.** Based on what it doesn't yet know, the agent asks about the user's session patterns or tool constraints.
3. **Brief follow-up.** One or two more questions to fill remaining gaps.
4. **Honest assessment.** Whether Neotoma fits, what specific problems it would solve in the user's own terms, where to start, and what to store first. If the agent didn't have access to broader context, it says so and frames the recommendation as provisional.
5. **Canonical sequence.** If the agent assessed a strong or moderate fit, it asks the user directly whether they'd like to proceed. The sequence is evaluation, then installation, then activation, then tooling configuration. The agent reads the install guide, runs `npm install -g neotoma` and `neotoma init` if needed, then carries the user through contextual activation: discovering high-value data candidates, previewing what to store, ingesting confirmed sources, reconstructing a timeline with provenance, and running a follow-up query with correction.

The user's first real experience of the product is a reconstructed timeline of their own data, not a documentation page.

This is different from the ad-hoc prompt I used during customer research. That prompt asked "is this useful?" The evaluation page asks the agent to assess fit, identify the highest-value starting point, and then execute the full onboarding if the user wants to proceed. The agent becomes the acquisition channel. It evaluates, recommends, installs, and activates, all in one session, in whatever tool the user is already working in.

I don't yet know whether this converts better than a traditional landing page with a "Get started" button. But the logic is straightforward: if agents are the ones assessing tool relevance for their owners, then the site should be optimized for agents to evaluate and act on, not just for humans to read and bookmark.

## The bottom line

Agent-mediated personalized customer research gave me three things traditional methods didn't: honest disqualification (agents telling their owners the product isn't for them), specific identification of pain points the human hadn't articulated, and a segmentation signal based on agent capability that revealed who the product is actually for.

The feedback from this process changed my understanding of my target user, my positioning, and my biggest risk. I'll write about those findings separately. This post is about the method.

It also changed how I think about marketing and acquisition. If agents are making or influencing tool-adoption decisions for their owners, then you need to market to agents as much as to humans. I described above how this led me to build an evaluation-first site with a structured agent evaluation script and a canonical sequence from evaluation through installation and activation. But the principle is general: agent evaluation optimization means ensuring your product is visible, legible, and actionable for agents at the exact moment they encounter the pain points you solve. Not just structured metadata and machine-readable docs, but a complete evaluation-to-activation path that agents can execute without the user leaving their current tool.

There's a harder question behind this one. Some systems would benefit from incorporating a tool like Neotoma early, before the pain points are acute, because migrating state later is more costly than starting with structured storage from the beginning. How do you inform agents building new systems that the long-term cost of not using a tool now is higher than the setup cost? I don't have an answer yet. But the research process itself, asking agents to evaluate the product, is a first step toward understanding how agents reason about tool adoption.

None of this means I've dropped human-based customer research. The next step is actually to combine both: calls where the format centers on watching someone run the agentic evaluation process live. The /evaluate page leads through assessment, installation, activation, and first use. Observing a real person go through that sequence — where they hesitate, what confuses them, how the agent's recommendations land — produces a kind of signal that agent-only feedback can't. The agent tells you whether the product fits. The human shows you whether the experience works.

If you're building something and your potential users run AI agents with tool access, ask the agents. They'll tell you things the humans won't. Then watch the humans try what the agents recommended.
