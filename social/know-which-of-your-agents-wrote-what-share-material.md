# Social share material: Your agent fleet can build trustworthy state with their own keys

Source: https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what  
Generated: 2026-04-28  
Slug: `know-which-of-your-agents-wrote-what`

**Prior-work audit (Step 1):** Only other batch on disk is `the-substrate-plancast-needed-share-material.md` (Plancast, feed vs substrate, founder postmortem hooks). This batch avoids that arc: no "early," no feed primitives, no trio mesh framing. Hooks here are **multi-agent write collision**, **grant-scoped admission**, **audit question** ("who wrote it, who authorized it"). Cooldown list for this session: avoid bare "truth layer," "silently overwritten," "three questions," "append-only observations" as repeated slogans; use **write integrity**, **blast radius**, **admission**, **preflight** instead. Canonical terms tagged per unit: Write Integrity, Stateless Agent Problem (multi-writer ambiguity), State Drift (recovery paths).

**Expansion beyond the post (social-only):** (1) RFC 9421 as the signing wire format (named in post; social compresses to "stolen bearer token is useless without the private key" as consumer-grade framing). (2) One-server bump updating five MCP clients from handshake instruction refresh (post has it; social stresses **ops surface** for fleets). (3) Regulated buyer angle: SOC2-style evidence is often *process*; per-row attribution makes the evidence *data*.

---

## Top pick and timing

### 1. Link-in-reply pair — incident response frame (post first — today or tomorrow, 4–6 PM CEST / 10 AM–12 PM US Eastern)

**Main tweet (no link):**

> Cursor, Claude Code, Codex, ChatGPT — same Neotoma instance, same memory graph.
>
> The failure mode is not "bad summaries." It is "you cannot attribute the damage." Logs and chat threads are not a system of record.
>
> Neotoma now stamps every write with verified agent identity, a five-tier trust ladder, and grant-scoped capabilities. Suspend one `agent_grant` and the next request fails admission. No restart, no config reload.
>
> Who gets paged when a customer asks: who wrote this row, and on whose authority?

**Self-reply with link:**

> How AAuth (RFC 9421 + per-agent keys) maps into Neotoma, what the tiers mean in practice, and the audit endpoints I would expect a regulated buyer to ask for next.
>
> https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what

**Why this one:** Opens with the concrete fleet (named tools) instead of protocol throat-clearing. Centers **write integrity** and **bounded blast radius** before naming AAuth — readers feel the ops problem first. Ends on a question buyers actually ask, not a product slogan. Distinct from Plancast batch (no founder flashback, no substrate trio).

**Timezone:** Queue 3–6 PM CEST to catch US Eastern morning builders.

---

## Shareable units extracted

1. **Story beat / test proof** — Darkmesh joint tests: unauthorized peer-node agent rejected on `warm_intro_reveal`; authorized node unchanged. (Write integrity + enforcement, not theory.)
2. **Insider phrase** — "Logs and chat threads are not a system of record" (contrasts compliance theater vs row-level proof).
3. **Insider phrase** — "Suspend one grant, not one server" (grant lifecycle vs env JSON era).
4. **Framework** — Five trust tiers in one breath: hardware attestation, operator-attested issuer allowlist, software-signed (most agents today), unverified clientInfo, anonymous.
5. **Ops detail** — `GET /session` / `get_session_identity` / `neotoma auth session` — preflight so new agents fail loud before anonymous rows pile up.
6. **Fleet ops** — MCP instructions ship on every handshake; one server upgrade refreshed five agents without client releases (expansion: **change management** angle for enterprises).
7. **Buyer question** — "Who wrote it, and can you prove they were authorized?" as first-class reads: `/agents`, `/agents/{key}/records`, `/agents/grants`.
8. **Protocol anchor** — AAuth + RFC 9421: no shared bearer; stolen token without signing key does not move data.
9. **Named credibility** — Dick Hardt lineage (OAuth 2.0 editor, OpenID 2.0 co-author, OpenID Foundation board) as why the author bet the integration on that stack.
10. **Contrast** — Env-var capability JSON worked until you needed per-agent suspend — entity `agent_grant` replaces restart-the-world.

**Canonical term tags:**  
Units 1–4,7 → **Write Integrity**; units 1–2,10 → **Stateless Agent Problem**; unit 6 → **State Drift** (narrow: drift in *agent behavior*, not summarizer semantics).

---

## Scheduled drafts (post this week)

### Draft A — Punchy take (X) | Type: punchy_take | Slot: Tuesday AM CEST

> Five agents, one store: which key signed this row, and which grant admitted the write?

*(79 characters.)*

### Draft B — Punchy take (X) | Type: punchy_take | Slot: Thursday PM CEST

> Your customer will not ask if the model "remembered." They will ask who wrote it and who authorized it.

*(96 characters.)*

### Draft C — Conversation starter (X + Bluesky) | Type: conversation_starter | Slot: Wednesday AM CEST

> If three MCP clients share one memory backend, what is your current answer to "which client corrupted this relationship edge" — and how many steps does it take to prove it?

### Draft D — Bookmark bait (X) | Type: bookmark_bait | Slot: Tuesday PM CEST

> Five-tier agent trust ladder I wish existed before I ran a multi-tool fleet against one graph:
>
> 1) hardware attestation  
> 2) operator-attested issuer/subject allowlist  
> 3) software-signed requests (most agents today)  
> 4) declared client, unsigned  
> 5) anonymous  
>
> Which tier would you hard-fail in production for customer data?

### Draft E — Link-in-reply pair (reserve) | Type: link_in_reply | Slot: next week if A already used

**Main:**

> AAuth is HTTP message signatures (RFC 9421) plus per-agent keys — no shared bearer secret, no "rotate the one API key and pray."

**Reply:**

> How that plugs into Neotoma writes, grants, and session preflight: https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what

### Draft F — Bluesky link post | Type: link_post | Slot: Monday PM CEST

> One graph, five MCP clients: who signed each write? Short post on Neotoma + AAuth (RFC 9421), grants, preflight, and the audit paths a buyer can query. https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what

*(~195 characters; under Bluesky 300 limit.)*

### Draft G — LinkedIn insight | Type: insight_post | Slot: Wed 7:30–8:30 AM US Eastern / ~1:30–2:30 PM CEST

> I run Cursor, Claude Code, Codex, and ChatGPT against one structured memory layer (Neotoma). That is not a flex — it is a liability until every write answers two questions: which agent identity signed this row, and which capability grant admitted it.
>
> We integrated AAuth so each agent uses its own key, requests are signed with RFC 9421 HTTP Message Signatures, and capabilities are first-class `agent_grant` entities with suspend/revoke/restore — no server restart, no "edit env JSON and redeploy."
>
> Session preflight (`GET /session`, MCP `get_session_identity`, or `neotoma auth session`) means a misconfigured agent fails loudly before it pollutes the graph. For product teams in regulated spaces, the buyer question is shifting from "does it remember?" to "who wrote it, and can you prove authorization?" — that answer should be a query against stored data, not a scavenger hunt across logs.
>
> Full technical walkthrough: https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what

---

## Thread opener (optional, max once / week)

**Tweet 1:**

> Short thread: what changes when *five* agents write to *one* memory store (Neotoma), and why I integrated AAuth end-to-end.

**Tweet 2:**

> Without per-row attribution, debugging is "wipe and re-ingest" or live with drift. Both scale badly with customers and third-party MCP plugins.

**Tweet 3:**

> With AAuth, each write carries verified identity + trust tier + transport. Grants scope operations per entity type. Suspend a grant → next write rejected at admission. No restart.

**Tweet 4:**

> Preflight is mandatory in shipped MCP instructions: new agents do not get to whisper anonymous rows until someone notices.

**Tweet 5 + link reply:**

> Audit surface for the buyer conversation: `/agents`, per-agent record lists, grant roster. Post: [link in reply]

---

## Reserves (do not schedule same week as Draft A)

- **Reactive QT seed (topic):** If a major model vendor tweets about "shared memory for agents" without signing — QT with structural gap: "Shared memory without per-writer proof is a support ticket generator."
- **Punchy take:** "Bearer tokens in headers scale identity. They do not prove which agent process held the secret." (~90 chars)
- **Conversation starter:** "Has anyone shipped MCP → one database for more than two clients without row-level writer identity? What broke first?"

---

## Medium X overview draft with sentence-length rule applied

**Main tweet:**

> I run Cursor, Claude, OpenClaw, and a few other harnesses against one Neotoma memory store. They all write into the same data graph, which is constructed and maintained by a mix of agents.
>
> Until this week, I could not reliably tell those writers apart inside the data itself. Most of them also had broad access to system-wide memory operations, even when their roles were different.
>
> That is fine with one agent. You prompted it, so you know who wrote each row. Add a second writer, then a third, and the store starts accumulating state from processes with different roles, prompts, tools, and failure modes.
>
> When one writes bad data, the hard part is not spotting the bad summary or stale relationship. The hard part is knowing which records to keep trusting afterward.
>
> Bearer tokens do not solve that problem. A shared key proves that someone authenticated, but it does not prove which agent process held the secret at write time. Rotating the key after damage appears is not incident response.
>
> AAuth gives every HTTP client its own cryptographic identity. Each request is signed with RFC 9421 HTTP Message Signatures, so a stolen token is useless without the signing key.
>
> That protocol comes from @DickHardt, who edited OAuth 2.0, co-authored OpenID Authentication 2.0, and helped found the OpenID Foundation. That is exactly the identity lineage I want under agent memory.
>
> Now Neotoma stamps every observation, relationship, source, and interpretation with a verified agent identifier, a trust tier, and the transport the write arrived on. Capabilities move into first-class agent_grant entities that can be suspended or revoked instantly.
>
> One bad agent no longer means restarting the whole server with a new config. Suspending its grant makes the next request fail admission. The blast radius is bounded by what the agent was authorized to do.
>
> This changes the buyer conversation for agentic products. The question is not only whether the system remembered something. It is whether you can prove who wrote it, when they wrote it, and whether they were allowed to write it.

**Self-reply with link:**

> Full walkthrough of the trust tiers, grant lifecycle, session preflight, Darkmesh enforcement test, and audit endpoints a regulated buyer will ask for:
>
> https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what

---

## LinkedIn version with sentence-length rule applied

> I run Cursor, Claude, OpenClaw, and a few other harnesses against one Neotoma memory store.
>
> They all write into the same data graph, which is constructed and maintained by a mix of agents.
>
> Until this week, I could not reliably tell those writers apart inside the data itself. Many of them also had broad access to memory operations, even when their roles were different.
>
> That works when one agent writes everything. You prompted it, so attribution is obvious.
>
> It breaks when the second and third writers arrive. When one agent writes a bad summary, stale date, or misattributed relationship, the question becomes which surrounding records still deserve trust.
>
> Bearer tokens do not answer that question. A shared key proves that someone authenticated, not which agent process held the secret when the write happened.
>
> That is why I integrated AAuth into Neotoma. AAuth gives each HTTP client its own cryptographic identity, with requests signed using RFC 9421 HTTP Message Signatures. A stolen token is useless without the signing key.
>
> Neotoma now stamps every observation, relationship, source, and interpretation with a verified agent identifier, a trust tier, and the transport path. Capabilities also live in first-class agent_grant entities that can be suspended or revoked instantly.
>
> One bad agent no longer means restarting the whole server with new config. You suspend its grant, the next request fails admission, and the blast radius stays bounded by what that agent was authorized to do.
>
> This changes the buyer conversation for agentic products. The question is not only whether the system remembered something. It is whether you can prove who wrote it, when they wrote it, and whether they were allowed to write it.
>
> I wrote the full walkthrough here:
>
> https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what

---

## Weekly placement note

This post is **single-post mode** for the week of 2026-04-28 unless you interlace with Plancast material: cap **3–4** units from this slug Mon–Fri; do not stack Draft A + Thread + Draft E same day.

---

## Language audit notes

- **Cooldown avoided:** No standalone "truth layer"; no "silently overwritten"; no "same question different answer."
- **Fresh vocabulary:** blast radius, admission, preflight, scavenger hunt (logs), triage by vibes, system of record (negated).
- **Hook distance from Plancast file:** Plancast opens with 2012 postmortem list; this opens with named multi-tool fleet + shared store failure mode.
- **Canonical deployment:** "Write integrity" appears in prose; "Stateless Agent Problem" implied via multi-writer ambiguity; "State Drift" used narrowly (recovery / incident framing).
