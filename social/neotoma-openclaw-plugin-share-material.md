# Social share material: OpenClaw plugin for Neotoma gives your agent memory it can't corrupt

Source: https://markmhendrickson.com/posts/neotoma-openclaw-plugin
Generated: 2026-04-15

## Prior-work audit (abbreviated)

- **Recent social:** `fat-skills-need-a-foundation-they-cant-corrupt-share-material.md` leads with Garry Tan / NPS rewrite arc. This batch must not reuse that hook or Tan as the opener.
- **This post's frontier:** OpenClaw-specific failure modes (compaction, entity strings, concurrent file writes, no audit trail), v0.4.3 plugin as native integration, honest developer-release framing, lived multi-agent dogfooding.
- **Cooldown for this session:** Avoid recycled phrasing from the markdown-ceiling series in hooks ("same question" patterns). Avoid standalone "truth layer" without new context. Prefer "write log," "receipts," "as-of replay" over repeating "append-only observations" in every draft.

---

## Top pick: X (copy and post)

### 1. Link-in-reply pair (post first: Tuesday–Thursday, 3–6 PM CEST / US morning overlap)

**Main tweet (no link in body):**

> If you run OpenClaw with contacts, tasks, or anything ongoing in memory, you've probably noticed: compaction drops facts you stored last week. Two skills writing at the same time corrupt the file. "Acme Corp" and "ACME CORP" are two different things next session.
>
> Neotoma v0.4.3 ships as a native OpenClaw plugin. Same agent loop. Structured state underneath.

**Self-reply with link:**

> Failure modes, what the plugin changes, and two install paths (agent-evaluated or direct via ClawHub):
>
> https://markmhendrickson.com/posts/neotoma-openclaw-plugin

### Why this one

Speaks directly to OpenClaw users who already hit these symptoms. Names three pain points they recognize before introducing the plugin. The announcement lands in the main tweet so it is visible without expanding the reply. Self-reply is a clean link-in-reply.

---

## Top pick: LinkedIn (copy and post)

### 1. Insight post (post Tue–Thu, 7–8 AM or 12–1 PM in your primary reader timezone; ~1,180 characters)

If you use OpenClaw for anything beyond single-session chat, you have probably already hit this: a contact detail that disappeared after compaction, two automations that stepped on the same memory file, or an entity your agent recognized last Tuesday but not today.

These are not hypothetical. OpenClaw's own docs flag the concurrent-write risk. The memory model works well for getting started. It stops working when the agent manages state you actually rely on.

Neotoma v0.4.3 registers as a native plugin through OpenClaw's Gateway. Your agent loop, skills, and browsing stay the same. Writes go through schema validation, get stable entity IDs (string variants resolve by rule, not re-inference), and land in an append-only store with provenance. Two agents writing about the same entity produce two rows, not a file conflict.

I run this daily across email triage, tasks, finance, and content in my own agentic stack. Developer release, not a maturity pitch. The goal is finding out where structured state earns its overhead under real agent load.

`openclaw plugins install clawhub:neotoma` or start with the evaluation prompt in the essay.

https://markmhendrickson.com/posts/neotoma-openclaw-plugin

### Why this one

Opens by naming symptoms existing users recognize, not explaining architecture to outsiders. Cites documented concurrency risk. Frames developer release as honest intent, not marketing hedge. ClawHub one-liner gives a concrete next step.

---

## Shareable units extracted

1. **Concrete specific** — Compaction as an agent turn that persists "durable" memories before truncation; loss is unrecoverable without an observation log.
2. **Concrete specific** — "Acme Corp" vs "ACME CORP" without merge rules vs hash-based canonical IDs (deterministic identity).
3. **Named product + release** — Neotoma v0.4.3, `openclaw.plugin.json`, four-layer plugin discovery path.
4. **Story beat** — Multi-agent, same store: email triage, tasks, finance, content (lived weekly failure surface).
5. **Provocative reframe** — Markdown is the right default until you need receipts for what the agent knew on Tuesday.
6. **Reference takeaway** — Evaluate-first prompt: agent reads neotoma.io/evaluate with workspace context before recommending install scope.
7. **New evidence (expansion)** — Public install one-liner: `openclaw plugins install clawhub:neotoma` (ClawHub distribution).
8. **New evidence (expansion)** — Scale signal: OpenClaw / `openclaw/openclaw` passed roughly 350k GitHub stars in mid-April 2026 (check current count before posting if timeliness matters).
9. **Disagreement surface** — Free markdown + KV-cache economics vs write-path validation overhead: pay at write time or pay in forensic time.
10. **Honest constraint** — Developer release: breaking changes expected; plugin exists to pressure-test structured state under a real platform, not to promise production SLAs.

---

## Scheduled drafts: X

### Draft 2: Punchy take

> Markdown memory is free until you need Tuesday's receipts.

(~72 characters. Post with link in reply to same URL as Draft 1, or standalone without link.)

### Draft 3: Conversation starter

> Two plugins write `MEMORY.md` at the same time. What do you expect to happen?

**Self-reply:**

> OpenClaw documents the corruption case. Neotoma's bet is append-only rows plus schema validation instead of shared mutable files.
>
> https://markmhendrickson.com/posts/neotoma-openclaw-plugin

### Draft 4: Bookmark bait

> Four checks I want before I trust an agent with money, people, or calendar state:
>
> 1. Can I diff memory across compaction events?
> 2. Do writes serialize without file races?
> 3. Do string variants resolve to one stable ID?
> 4. Can I answer "what did the agent know on date X?"
>
> If the stack is pure markdown, often the honest answer is no, no, no, no.

**Self-reply:** Link to post as in Draft 1.

### Draft 5: Link-in-reply (install-forward)

**Main:**

> If you already run OpenClaw and want structured state underneath without swapping clients, the shortest path is a ClawHub plugin line plus activation. Your agent can do the wiring if you paste the install doc.

**Reply:**

> `openclaw plugins install clawhub:neotoma` then follow https://neotoma.io/install — full essay for the failure-mode argument: https://markmhendrickson.com/posts/neotoma-openclaw-plugin

---

## Scheduled drafts: LinkedIn (variants)

### Draft L2: Lesson / builder frame (~980 characters)

I wanted Neotoma underneath OpenClaw, not beside it.

v0.4.3 ships native plugin metadata so the Gateway loads Neotoma tools in-process with the rest of the agent. The essay is explicit about what still fails in plain markdown memory: compaction that rewrites durable notes, concurrent writers clobbering the same paths, string variants that should be one entity, and no replayable audit trail when a recommendation goes wrong.

What does not change: skills, browsing, form fills, the harness you already like. What changes is whether writes earn receipts.

Try the smallest honest experiment: run two automations that touch the same memory surface and see whether you can still trust the file. If the answer makes you nervous, structured observations are the boring fix.

https://markmhendrickson.com/posts/neotoma-openclaw-plugin

### Draft L3: Shorter hook-first (~720 characters)

Your OpenClaw agent can be brilliant and still gaslight you about state if memory is a mutable markdown file and compaction rewrote it.

Neotoma v0.4.3 registers as a plugin so structured writes stay append-only: schema validation, provenance, deterministic entity IDs. Developer release, not a maturity claim. I care whether the integration survives real agents, not whether the tweet sounds safe.

https://markmhendrickson.com/posts/neotoma-openclaw-plugin

---

## Reserves (X)

- **Reactive QT seed:** If `@openclaw` or `@steipete` posts about memory, skills, or compaction, QT from the angle: "local-first memory is winning; the next fight is whether durability is files or append-only rows." Link in reply.
- **Punchy take:** "Free memory is expensive memory." (ambiguous; use only with thread context.)

---

## Reserves (LinkedIn)

- Carve-out paragraph on `neotoma.io/evaluate` (agent inspects real workspace before recommending persistence scope) for an audience allergic to install tweets.

---

## Language audit notes

- **Hooks differentiated** from recent Garry Tan / fat-skills opener (compaction and receipts, not YC NPS loop).
- **Cooldown substitutions:** Used "receipts," "replay," "append-only rows" instead of repeating "nothing silently overwritten" phrasing from prior campaigns.
- **Fresh vocabulary:** "Forensic time," "substrate under the writes," "falsifiable architecture."
- **Evidence gaps flagged:** GitHub star counts move fast; round or re-fetch before treating a star number as the lead.
