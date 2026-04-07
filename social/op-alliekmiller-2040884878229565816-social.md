# Social: OP tweet @alliekmiller (2040884878229565816)

**Source:** https://x.com/alliekmiller/status/2040884878229565816
**Generated:** 2026-04-06
**OP text (verbatim):** I'm a knowledge base MONSTER in Claude Code right now. Introducing: Claudeopedia. 1) I took @karpathy's 'llm-wiki' idea doc (90% of this, so the biggest credit goes to @karpathy) and 2) Combined it with the /last30days skill (HT @mvanhorn) and 3) Added a /wiki skill with screenshot and download arguments to transfer raw inputs faster and 4) Built an interactive visualization to search my knowledge base (with date ranges to compare knowledge over time!) 5) Set up a "question your assumptions" cron job that runs my recent writing/client emails against the wikis. All happening in Obsidian for now. All of this was done this weekend, including testing. Will keep adding more features. For now, the main topic I'm building out is (surprise, surprise) enterprise AI. I'm drooling. I need a Claude-branded bib.

**OP metrics:** 121K views | 1,532 likes | 3,099 bookmarks | 89 RTs | 72 replies | 10 QTs
**OP author:** Allie K. Miller (@alliekmiller) — 97K followers, #1 Most Followed Voice in AI Business, former Amazon/IBM, Time100 AI, Fortune 500 advisor

## Top pick and timing

### 1. Reply A (post directly when ready — thread is active, ~20h old)

> The date-range comparison is the part most people will skip — it's the most valuable. "What did I believe about enterprise AI three months ago" changes how you evaluate your own expertise.
>
> How are you handling versioning when wiki entries get updated — overwrite or keep the old version?

### 2. QT 1 (post today, 3-5 PM CEST / 9-11 AM Eastern — tweet is aging, don't wait another day)

> A cron job that runs your recent writing against your knowledge base to surface contradictions. @alliekmiller built this in a weekend with Claude Code.
>
> Your wiki remembers the latest version of every entry. Your reasoning used the previous one. That gap grows invisibly.
>
> How do you tell the difference between "I changed my mind" and "the wiki silently changed under me"?

**Self-reply with link:**

> I accidentally wiped 6,000 memories from my knowledge store and recovered nearly all of them — because the system stores observations as append-only and recomputes state from the log. The same architecture that makes recovery possible is what makes "what did I know on March 15" answerable.
>
> Wrote up the full story: markmhendrickson.com/posts/how-i-lost-and-recovered-6000-memories

### Why this combo

Reply A lands directly under a high-traffic tweet (72 replies — visible, not buried) and asks a genuine structural question Allie would want to answer. The versioning question naturally surfaces the mutability problem without being prescriptive. QT 1 stands alone for your audience with an insider phrase ("Your wiki remembers the latest version. Your reasoning used the previous one.") that's screenshot-worthy, and the open question invites builders who've run into the same gap. The self-reply links the 6,000 memories post as a lived example, not a pitch.

## Triage

**Recommendation:** Reply + QT
**Why:** This is directly in our domain — personal knowledge management, temporal queries, and the structural integrity of agent memory. Allie's audience is enterprise AI builders, exactly our target. The thread is civil, high-signal, and the tweet has massive dark engagement (3,099 bookmarks vs 1,532 likes = 2:1 bookmark-to-like ratio, meaning the content is being consumed and saved far more than publicly engaged with). 72 replies means a good reply is visible; the QT reframes for our audience with a structural insight that adds genuine value rather than agreeing-and-linking.

**Green lights:** OP describes a knowledge base with temporal search and self-correction features — we have non-obvious structural expertise on what breaks at scale. The "question your assumptions" cron is genuinely novel and worth engaging with. 97K-follower account = reach amplification for QT. Audience overlap with AI builders is high.

## Reply drafts (post under OP)

### Reply A — Temporal versioning question

> The date-range comparison is the part most people will skip — it's the most valuable. "What did I believe about enterprise AI three months ago" changes how you evaluate your own expertise.
>
> How are you handling versioning when wiki entries get updated — overwrite or keep the old version?

**Angle:** Engages with her specific feature (date-range search), validates the non-obvious choice, asks a genuine technical question that leads naturally to the mutability problem. No product mention. Ends with a question she'd want to answer.

**280-char fold check:** "The date-range comparison is the part most people will skip — it's the most valuable. 'What did I believe about enterprise AI three months ago' changes how you evaluate your own expertise." (~192 chars) is the visible portion. Strong enough standalone; the question below the fold rewards "show more."

### Reply B — Assumption-checking workflow

> "Question your assumptions" cron is the sleeper feature here. Most knowledge tools help you accumulate. Running recent writing against existing beliefs to surface contradictions — that's a different category of tool.
>
> What does the prompt structure look like for that?

**Angle:** Validates the most novel part of her setup. The question is specific and practical — other builders will want to see her answer. Positions us as someone who recognizes the self-correction layer as the hard part.

### Reply C — Structural observation + question

> Every knowledge base eventually hits the point where entries have been updated so many times you can't tell which version of your thinking was current when you made a decision.
>
> The temporal search is the right instinct. Has the assumption-checking cron surfaced any real contradictions yet?

**Angle:** Names the structural challenge without being prescriptive. Validates her approach. Ends with a question that invites a story.

### Reply D — Weekend builder validation + deeper question

> Most enterprise knowledge tools spend years failing to ship what you built in a weekend. The visualization with date ranges is the real differentiator — most wikis show what you know now, not how your understanding evolved.
>
> Does the cron compare current wiki state against recent writing, or does it diff wiki versions too?

**Angle:** Gives credit for the speed, identifies the temporal layer as the key innovation, asks a precise architectural question.

## Quote-tweet drafts

### QT 1 — Insider phrase + open question

> A cron job that runs your recent writing against your knowledge base to surface contradictions. @alliekmiller built this in a weekend with Claude Code.
>
> Your wiki remembers the latest version of every entry. Your reasoning used the previous one. That gap grows invisibly.
>
> How do you tell the difference between "I changed my mind" and "the wiki silently changed under me"?

**Self-reply with link:**

> I accidentally wiped 6,000 memories from my knowledge store and recovered nearly all of them — because the system stores observations as append-only and recomputes state from the log. The same architecture that makes recovery possible is what makes "what did I know on March 15" answerable.
>
> Wrote up the full story: markmhendrickson.com/posts/how-i-lost-and-recovered-6000-memories

**Angle:** Stands alone for unfamiliar readers (paraphrases OP in first sentence). The insider phrase ("Your wiki remembers the latest version of every entry. Your reasoning used the previous one.") is the kind of line people screenshot. Ends with a specific question that builders who've run into versioning problems will want to answer. Self-reply links the 6,000 memories post as evidence, not pitch.

### QT 2 — Self-correction as the missing layer

> Allie Miller's "Claudeopedia" includes a cron that checks recent writing against accumulated knowledge to find contradictions. The "question your assumptions" feature is what everyone's knowledge base is missing.
>
> Everyone builds the accumulation layer. Almost nobody builds the self-correction layer.
>
> Six months in, when wiki entries have been quietly updated dozens of times — which version of what you "know" were you actually working from?

**Self-reply with link:**

> The structural fix: treat every observation as append-only and derive the current state from the full history. Then "what did I believe on March 15" is a query, not a guess.
>
> Wrote about what happens when this matters: markmhendrickson.com/posts/how-i-lost-and-recovered-6000-memories

**Angle:** Sharper framing — "accumulation layer vs self-correction layer" is a memorable distinction. More directly names the problem (versions updated quietly) without resolving it in the QT. Self-reply introduces the architectural concept.

## Follow recommendations (repliers)

**Note:** No reply thread data available. The web-scraper fetches single tweets but not reply threads.

**Next step:** Open the tweet's replies, copy 5-10 that look like builders or operators (handle + text), paste here. I'll score follow-worthiness and check profiles where possible.

Alternatively: share a screenshot of the reply thread and I'll extract handles and assess.

## Reserves / follow-ups

### Standalone punchy take (derived from this interaction)

> Your wiki remembers the latest version of every entry. Your reasoning used the previous one.

**Use:** Post standalone when the knowledge-base discourse resurfaces. Works without any QT context. 87 chars — optimal punchy take range.

### Reactive QT draft — topic: personal knowledge management, PKM tools, Obsidian AI

**Target accounts:** @karpathy, @kepano, @obabordeaux, @alliekmiller
**Draft:**

> The gap in every PKM tool: they optimize for what you know now. The moment you update an entry, the previous version — the one your last three decisions were based on — disappears.
>
> Accumulation is table stakes. Temporal integrity is the hard part.

**Use:** QT when any of these accounts posts about knowledge management, second brain, or AI-augmented notes.

### Reactive QT draft — topic: AI memory, agent memory, context windows

**Target accounts:** @karpathy, @levabordeaux, @alexalbert__, @skiabordeaux
**Draft:**

> "Just put it in the context window" works until your agent makes a decision based on a fact that was true last week but got silently overwritten yesterday.
>
> The context window is short-term memory. What's missing is a knowledge store where you can trace which version of a fact was active when a conclusion was drawn.

**Use:** QT when anyone prominent posts about context window limits, agent memory, or RAG limitations.
