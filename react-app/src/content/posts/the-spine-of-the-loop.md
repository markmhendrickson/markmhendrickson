---
title: "The spine of the loop"
excerpt: "Three viral posts agree that durable state is what makes agent loops work, then hand the job to a markdown file. What loop state actually requires once you run more than one loop."
published: true
publishedDate: "2026-06-11"
---

Between June 8 and June 9, three people who rarely write the same essay wrote the same essay. [Addy Osmani](https://x.com/addyosmani/status/2064127981161959567), a director of AI at Google Cloud, published "Loop Engineering," a taxonomy of the systems that prompt coding agents so you do not have to. [Matt Van Horn](https://x.com/mvanhorn/status/2063865685558903149) published "WTF Is a Loop?", a research sweep across Reddit, X, YouTube, and Hacker News that traced the idea from the 2022 ReAct paper to the orchestration loops people run today. And [Lance Martin](https://x.com/RLanceMartin/status/2064397389189071163), a member of technical staff at Anthropic, published "Designing loops with Fable 5," two patterns for getting the most out of frontier models by designing loops instead of prompting directly.

All three converge on the same shift: prompting is giving way to designing loops that prompt agents for you. And all three name the same component as the one that matters most. Osmani lists five building blocks, then adds a sixth and gives it the strongest sentence in his piece: "The state file is the spine of the whole thing." Van Horn argues that the current generation of loops is genuinely new for one structural reason: "durability became explicit, with git-backed state and crash recovery." Martin frames memory as "an outer loop that spans across sessions."

The diagnosis is now consensus. Durable external state is the load bearing part of autonomous agents. What surprised me is what happened next. All three handed the job to a text file.

## What a loop is, briefly

Van Horn's definition is the cleanest: a loop is cron plus a decision maker in the body. A cron job runs a fixed script. A loop runs a model that looks at current state, decides what to do, does it, checks whether it worked, and decides whether to keep going. Stack those, let one loop dispatch others, and you have the thing Boris Cherny means when he says his job is to write loops.

The model inside that loop forgets everything between runs by design. Context windows end. Sessions restart. So something in the system has to not forget. That something is what the loop reads to decide what to do next and writes to record what happened. It is the spine, and Osmani is right to call it that.

## The substrate punt

Here is the complete inventory of spine candidates across all three posts: a markdown file, a Linear board, state files committed to git, and a mounted filesystem shared across sessions. Osmani offers the first two. Van Horn documents the third, which is what Steve Yegge's Gas Town uses to coordinate twenty to thirty Claude instances. Martin uses the fourth, the memory feature of Claude Managed Agents.

All of these solve persistence. The bytes survive a restart. None of them solve integrity. Ask any of these substrates the question a loop actually needs answered: of these two contradictory notes, which one is true, who wrote it, when, and was it ever verified? A prose file holds both notes side by side and leaves reconciliation to whichever model reads the file next. Git preserves every historical version of the ambiguity without resolving it. A shared mount adds last write wins on top.

Persistence and integrity are different properties. The discourse has fully absorbed the first and not yet noticed the second.

## We ran this experiment before

Applications stored their state in flat files for decades. Three forces ended that era: concurrent writers corrupted files, accumulated contradictions had no resolution mechanism, and answering questions meant parsing everything. Databases won because they made integrity a property of the storage layer instead of a discipline expected of every program that touched the data.

Each of those forces is already visible inside the three posts.

Concurrency arrives the moment loops supervise loops, which is exactly the stage Van Horn says we are entering. Two loops writing one state file is the same failure as two engineers committing to the same lines without talking. Worktrees solve this for code. Nothing in the current toolchain solves it for [shared state](/posts/when-agents-share-state-everything-breaks).

Contradiction is documented in Martin's benchmark results. On a continual learning task, Sonnet 4.6 left behind a memory store he describes as a list of failure notes and open guesses, including entries like "maybe prc instead of prc_usd?" The guesses accumulate. Nothing marks one resolved. The next session inherits the pile.

Queries are Van Horn's own punchline. He argues the expensive part of agentic coding is now loop management: halting conditions, no progress detection, and budget ceilings. Every one of those requires comparing the current run against previous runs. On a prose substrate, that means re-reading and re-parsing a growing file on every tick, which is a token tax that scales with the age of the loop.

## What running a swarm taught me

I run a swarm of named agents on my own machine: one for customer intelligence, one for content, one for outreach, others for operations. In the early setup, each kept notes in its own files. Those files drifted. The same person appeared under three names. A fact corrected in one file survived uncorrected in two others, and no record showed which version was current or where any of it came from.

The swarm now shares [one structured store](/posts/from-memory-to-nervous-system), and this post is itself a receipt. The research behind it was done by my customer intelligence agent, which fetched all three X posts, stored each as a typed record with engagement numbers and provenance, wrote the competitive findings into a structured analysis, and filed follow up tasks to two other agents through the shared store. When I asked a follow up question an hour later, the comparison was appended to the same analysis record with its own provenance trail, not scattered into a new file. No agent re-derived what another had already established.

## Memory maturity is a substrate property

The sharpest data in any of the three posts is in Martin's. He describes five stages of memory use: an agent fails, investigates why, verifies what it found, distills the answer into a rule, and consults that rule next time. An agent that completes all five turns failures into verified, reusable rules. An agent that stops early leaves a pile of guesses.

His results, all on the same mounted filesystem: Sonnet 4.6 stops at stage one, recording failures without investigating them. Opus 4.7 reaches the verify stage but checks only around 17 percent of its claims in the median run. Fable 5 completes the progression and verifies up to 73 percent.

Same filesystem, radically different memory quality. The difference lives entirely in the model's discipline, because the filesystem guarantees nothing: every stage is a behavior the model must choose to perform. A structured store turns those behaviors into data operations. A failure is a stored observation. Investigation is retrieving the related records. Verification is a correction with provenance attached. Distillation is writing a typed rule. Consulting is a bounded query. When the substrate carries the progression, any model gets to complete it.

## What to demand from a loop state layer

Stated tool agnostically, the spine of a loop should provide six things: typed records instead of prose blobs, provenance on every field, corrections that compute current truth instead of accumulating versions, concurrent writes that cannot conflict, retrieval that returns only what the current tick needs, and access from any harness rather than one vendor's stack.

To be fair to the text file: for one loop on one repo, [markdown is genuinely fine](/posts/the-markdown-memory-ceiling). It is readable, diffable, and free. The forcing function is loop number two, the first time two processes care about the same fact and neither can trust what the other wrote.

## Files remember, systems of record know

Van Horn ends his piece arguing that the loop is plumbing and the durable asset is the skill library it calls. Half right, I think. Skills are procedural memory, the how of repeated work. Underneath them sits factual memory, the what is true right now that every skill invocation depends on. Both compound, but only if the factual layer can be trusted after a thousand unattended writes.

I built [Neotoma](https://github.com/markmhendrickson/neotoma) because I needed that layer for my own swarm: typed observations, per field provenance, corrections that resolve to current truth, and shared access for every agent I run. The loop discourse just spent a week describing the slot it fills without naming anything that fills it.

Osmani closes his essay with the advice to build the loop like someone who intends to stay the engineer. The state layer is where that intention becomes testable. Files remember. A system of record knows.
