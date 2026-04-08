# Social Share Schedule: Neotoma Contrarian Principles (3 weeks)

Generated: 2026-04-07
Source: Extracted from Neotoma positioning & architecture docs, paired with blog posts

## Strategy

Three weeks of social content. Each week anchored by a blog post (one new, two new). Standalone social drafts interlaced so no single thesis dominates any given week. Reactive QTs deployed opportunistically throughout.

All times CEST. Queue for US audience: 3-8 PM CEST (9 AM - 2 PM Eastern).
Cap: 2-3 X posts per day, spaced 30-60 min apart.
Links never in main tweet; always self-reply.

---

## Week 1: April 7-11 — "Hallucination vs corruption"

**Blog post:** "Your agent isn't hallucinating. Its memory changed."
Publish: Wednesday Apr 9 (gives time to edit Tuesday, publish before Thursday's social push)

### Wednesday Apr 9 — 4 PM CEST

**Platform: X + Bluesky | Type: Punchy take (standalone) | Source: Principle #4**

> Append-only is the only honest architecture.
>
> Everything else is a system that can lie about its own past.

*106 chars. Pure screenshot-share material. No link needed. Sets up the week's theme without announcing a post.*

---

### Thursday Apr 10 — 4 PM CEST

**Platform: X + Bluesky | Type: Punchy take | Source: Principle #8, paired with new blog post**

> Your agent's memory is lying to you.
>
> Not hallucinating. Lying. There's a difference.
>
> Hallucination is the model making things up. Lying is your memory layer overwriting what it stored last week with something different today — and never telling you.
>
> I tracked my workouts in ChatGPT for weeks. Asked for a comparison to past sessions. The comparison was confident, detailed, and wrong. Was the model hallucinating or had the stored data drifted? I couldn't tell.
>
> Which failure mode are you checking for?

**Self-reply with link:**
> The scary part isn't either failure mode. It's that most memory systems give you no way to tell which one you're experiencing.
>
> Wrote up the distinction and what to check in your own stack: https://markmhendrickson.com/posts/no-ai-memory-benchmark-tests-what-actually-breaks

---

### Friday Apr 11 — 5 PM CEST

**Platform: X + Bluesky | Type: Punchy take (standalone) | Source: Principle #7**

> The most dangerous bug in AI isn't a wrong answer.
>
> It's a right-looking answer built on memory that changed three weeks ago without leaving a trace.

*153 chars. Reinforces the week's theme. No link.*

---

### Friday Apr 11 — LinkedIn

**Platform: LinkedIn | Type: Insight post | Source: New blog post**

> I spent two weeks debugging a wrong answer from an AI agent. The model wasn't hallucinating. The stored memory had changed.
>
> Most teams check for hallucination: did the model make something up? Almost nobody checks for memory corruption: did the stored data itself change between when it was written and when it was read?
>
> The second failure is harder to catch because it passes every hallucination check. The retrieved passage matches the query. The model cites its source. Every guardrail says the answer is grounded. The data is wrong.
>
> I found this in my own system. Same contact, two different email addresses a week apart. The earlier value was overwritten with no log, no notification, no way to compare. In a mutable memory system, the previous value simply disappears.
>
> Three architectural properties prevent this:
> 1. Immutability — observations can't be modified after write
> 2. Provenance — every fact traces to the agent and session that created it
> 3. Temporal replay — you can reconstruct what the system believed on any past date
>
> Hallucination is a model problem. Memory corruption is an infrastructure problem. The industry is focused on the first one. The second one is already here.
>
> https://markmhendrickson.com/posts/no-ai-memory-benchmark-tests-what-actually-breaks

---

## Week 2: April 14-18 — "The audit framework"

**Blog post:** "Three questions to audit your agent's memory"
Publish: Tuesday Apr 15

### Monday Apr 14 — 4 PM CEST

**Platform: X + Bluesky | Type: Conversation starter | Source: Principle #2**

> You don't have a memory system. You have a hope system.
>
> You hope the LLM summarized correctly. You hope nothing was overwritten between sessions. You hope the context window grabbed the right chunks.
>
> Hope is not an engineering strategy.
>
> When was the last time you actually audited what your agent "remembers"?

**Self-reply with link:**
> Tested my own assumptions about this last year. I failed my own criteria.
>
> Wrote about what "memory" actually stores vs what people assume: [link to your-ai-remembers-your-vibe-but-not-your-work]

---

### Wednesday Apr 16 — 4 PM CEST

**Platform: X + Bluesky | Type: Bookmark bait | Source: Principle #5, paired with new blog post**

> Three questions that tell you whether your AI memory layer is trustworthy:
>
> 1. Can you replay the exact state your agent had on any past date?
> 2. Can you trace every stored fact to the source that created it?
> 3. Can anything overwrite a previous observation without leaving a record?
>
> If you answered no to any of these, you don't have memory. You have a cache with aspirations.
>
> Which one breaks first in your stack?

**Self-reply with link:**
> Walked through each question — what "yes" looks like architecturally, what tools pass, what fails, and a self-test you can run in five minutes: [link to three-questions-audit-agent-memory]

---

### Thursday Apr 17 — 5 PM CEST

**Platform: X + Bluesky | Type: Conversation starter | Source: Principle #6**

> Everyone in AI memory is optimizing retrieval.
>
> Better search. Faster lookup. Smarter ranking.
>
> Nobody's asking: is the thing you retrieved actually what was originally stored? Or did something rewrite it between then and now?
>
> The industry is building faster roads to a house that might not be there anymore.
>
> How do you verify your agent's memory hasn't drifted from what was written?

**Self-reply with link:**
> The retrieval problem and the integrity problem look identical from the outside. The fixes are completely different.
>
> Wrote about why RAG doesn't solve this: [link to why-agent-memory-needs-more-than-rag]

---

### Thursday Apr 17 — LinkedIn

**Platform: LinkedIn | Type: Lesson post | Source: New blog post**

> I built a checklist for auditing agent memory. Three questions. Most systems fail all three.
>
> [Adapted from the three-questions blog post — write when blog post is drafted]

---

## Week 3: April 21-25 — "Embeddings and trust"

**Blog post:** "Embeddings are opinions, not facts" (or thread extension of existing RAG post — decide by Apr 18)
Publish: Monday Apr 21

### Monday Apr 21 — 4 PM CEST

**Platform: X + Bluesky | Type: Punchy take | Source: Principle #3, paired with new/existing post**

> Embeddings are opinions disguised as math.
>
> "These two things are similar" isn't a fact. It's a model's guess, frozen as a vector, treated as ground truth by every system downstream.
>
> I watched an agent retrieve the wrong contact three times because the embedding said two names were "similar enough." The names weren't even the same person.
>
> What's the worst decision you've traced back to a bad similarity score?

**Self-reply with link:**
> Wrote about why structure beats similarity for agent memory — and where embeddings actually help vs where they hurt: [link to embeddings post or RAG post]

---

### Wednesday Apr 23 — 5 PM CEST

**Platform: X + Bluesky | Type: Conversation starter | Source: Principle #5**

> If your agent can overwrite its own memory with no record of what was there before, it's not a tool. It's a liability in a productivity costume.
>
> We wouldn't trust an employee who rewrote their own meeting notes after every conversation and shredded the originals. Why do we accept software that does the same thing?
>
> Where do you draw the line between "autonomous" and "unaccountable"?

**Self-reply with link:**
> Compared two opposite architectures for agent memory — one that consolidates (rewrites), one that appends (preserves). The tradeoffs are real: [link to always-on-memory-agents-and-the-truth-layer]

---

### Thursday Apr 23 — LinkedIn

**Platform: LinkedIn | Type: Insight post | Source: Embeddings theme**

> [Adapted from embeddings blog post — write when blog post is drafted]

---

## Reactive QT Drafts (deploy when targets tweet, any week)

### Topic: RAG performance / vector search improvements
**Target accounts:** Anyone announcing a new RAG framework, embedding model, or vector DB improvement
**Draft:**
> The diagnosis is correct — retrieval matters. But the problem nobody's solving isn't finding the right chunk. It's verifying the chunk hasn't been rewritten since it was stored.
>
> Faster search over unverified data is a faster road to the wrong answer.
>
> What's your write-integrity story?

### Topic: Agent autonomy / agentic frameworks
**Target accounts:** @karpathy, @AllieKMiller, anyone posting about autonomous agents
**Draft:**
> Love the direction. One question that keeps getting skipped:
>
> When an autonomous agent modifies its own memory, who audits the change? If nobody — you've built an employee who rewrites their own performance reviews.
>
> Autonomy without auditability is abdication, not delegation.
>
> How are you solving this?

### Topic: AI memory announcements (Mem0, Zep, any new entrant)
**Target accounts:** Whoever announces
**Draft:**
> Interesting approach. Genuine question: can you replay your agent's state as it existed on a specific past date?
>
> Not "retrieve something similar." Replay the exact state.
>
> That's the line between memory and cache. Most systems are on the cache side and haven't tested which.

---

## Reserves (for future weeks / opportunistic use)

- **Insider phrase** — "Markdown files are memory-as-vibes." (Use when someone shares their .md-based agent memory setup)
- **Reframe** — "The real competitor to every AI memory product isn't another product. It's a senior engineer who says 'I'll just build this with event sourcing.'" (Use when a new memory product launches)
- **Moral claim** — "Mutability is a design decision. It's also a trust decision. Most teams make the first without realizing they've made the second." (Thread or LinkedIn)
- **Cost framing** — "The cheapest token is the one you never have to burn re-verifying something your system already knew." (Use when someone posts about token cost optimization)

---

## Posting Checklist

- [ ] All drafts aimed at US audience: post 3-8 PM CEST (9 AM - 2 PM Eastern)
- [ ] No links in any main tweet — link goes in self-reply only
- [ ] Self-reply template: context-specific (varies per draft above)
- [ ] Cap at 2-3 posts per day, spaced 30-60 min apart
- [ ] Cross-post to Bluesky same day (can include link directly on Bluesky)
- [ ] LinkedIn posts Tuesday-Thursday, adapted for longer format with link in body

## Blog Post Pipeline

| # | Title | Pairs with | Target publish | Status |
|---|---|---|---|---|
| 1 | Your agent isn't hallucinating. Its memory changed. | Draft 1 (Week 1 Thu) | Apr 9 | Draft complete |
| 2 | Three questions to audit your agent's memory | Draft 5 (Week 2 Wed) | Apr 15 | Not started |
| 3 | Embeddings are opinions, not facts | Draft 2 (Week 3 Mon) | Apr 21 | Assess vs RAG post extension |
