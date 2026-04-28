---
title: "Your agent fleet can build trustworthy state with their own keys"
excerpt: "When many agents write to one memory, you need proof on every row: who signed, what they were allowed to do, and no shared bearer secrets. Neotoma integrates AAuth so each agent signs with its own key and writes through grant-scoped admission."
published: true
published_date: "2026-04-28"
category: "Agent Architecture"
tags: ["neotoma", "aauth", "agent identity", "attribution", "multi-agent", "state integrity", "build-in-public"]
read_time: 8
hero_image: "know-which-of-your-agents-wrote-what-hero.png"
hero_image_square: "know-which-of-your-agents-wrote-what-hero-square.png"
hero_image_style: "keep-proportions"
---


## The problem ahead of most builders

If you run one agent against one store, attribution is trivial. You know who wrote every row. You wrote the agent.

The moment you run two, three, five agents against the same Neotoma instance, [the picture changes](/posts/when-agents-share-state-everything-breaks). Each agent writes observations, relationships, sources, interpretations. The store accumulates state from all of them. If one of those agents starts writing bad data, subtly wrong summaries, stale dates, misattributed relationships, the only way to reason about which records to trust is to reason about which agent wrote them.

Without per-row attribution, your options when something goes wrong are rough: wipe the store and re-ingest, or leave the bad rows in and live with the drift. Both get worse as the store grows.

This problem gets sharper for anyone shipping an agent-driven product. Your customers' records are being written by a fleet: your own agents, third-party agents integrated via MCP, maybe a plugin someone installed last week. When a customer asks "who wrote this to my account and on whose authority?", that question has to be answerable from the data, not from a correlation exercise across server logs and conversation transcripts.

I run agents across Cursor, Claude Code, Codex, and ChatGPT, all writing to one Neotoma instance. I wrote about [what that stack actually does](/posts/what-my-agentic-stack-actually-does). Neotoma's AAuth integration is what closes the gap for my stack and for anyone building on it: each agent brings its own key, and the store can stay trustworthy as the fleet grows.

## Why AAuth

The attribution layer is built on [AAuth](https://www.aauth.dev/), an open protocol that gives every HTTP client its own cryptographic identity. No pre-registration. No shared secrets. No bearer tokens. Every request is signed with [RFC 9421](https://datatracker.ietf.org/doc/html/rfc9421) HTTP Message Signatures, so a stolen token is worthless without the signing key.

I picked AAuth because the person behind it, Dick Hardt, is a friend and one of the deepest identity experts I know. He edited OAuth 2.0 ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)), co-authored OpenID Authentication 2.0, and was a founding board member of the [OpenID Foundation](https://openid.net/foundation/members/). That is the same lineage most developers meet through authorization code flows and federated login. When someone with that history starts a new protocol specifically for agents, that is the one worth building against.

## What every write now carries

[v0.6.0](https://github.com/markmhendrickson/neotoma/releases/tag/v0.6.0) ships per-row agent attribution across every write surface: `/store`, `/observations/create`, `/create_relationship`, `/correct`, `/entities/split`, the MCP store tools, and CLI writes over both MCP and HTTP. Each observation, relationship, source, and interpretation stamps:

- A verified agent identifier (public-key thumbprint for signed writers, JWT subject and issuer for agent tokens, clientInfo name and version as a fallback).
- A trust tier that classifies how strongly the identity is proven.
- The transport the write arrived on.

Five tiers cover the spectrum:

- `hardware`: the agent provided a `cnf.attestation` envelope (Apple Secure Enclave, WebAuthn packed, or TPM2) that the server verified against trusted roots.
- `operator_attested`: the signature verified, and the operator has allowlisted the issuer or issuer-subject pair. The operator vouches for the agent's process without requiring hardware attestation.
- `software`: the agent signed the request with a valid key, verified by the server. This is where most agents land today, including my own Cursor proxy signing with a file-backed ES256 JWK.
- `unverified_client`: the agent declared itself with a recognizable clientInfo but did not sign.
- `anonymous`: no identity at all.

The upshot: you can look at any row in your store and answer "which agent wrote this" as a read against first-class data.

## Grants instead of config files

Early in the v0.6.0 cycle, capabilities were loaded from environment-variable JSON files. That worked for a static set of agents but broke the moment you wanted to suspend one agent without restarting the server.

Now: each `agent_grant` is a first-class Neotoma entity. It matches an AAuth identity (by subject, issuer, thumbprint, or a combination), carries capability entries scoped per operation and entity type, and has a lifecycle: `active`, `suspended`, `revoked`. The admission middleware resolves a verified AAuth identity to its matching grant on every request, stamps the grant's user and capabilities onto the request context, and downstream enforcement checks each operation against the grant.

Grants are managed through the Inspector UI, the REST API (`POST /agents/grants`, `PATCH`, suspend, revoke, restore), or migrated once from the old env-config via `neotoma agents grants import`. The legacy env vars (`NEOTOMA_AGENT_CAPABILITIES_*`) cause a boot-time failure if still set, with a structured error pointing to the migration command.

Suspending a grant is instant. The agent's next request fails admission. Restoring is equally instant. No server restart, no config reload.

For anyone running a product with customer-facing agents, this means incident response moves from "restart the service with a new config" to "suspend one grant and investigate." The blast radius of a misbehaving agent is bounded to the operations that grant authorized.

## Identity preflight

Every agent can now ask Neotoma, before it produces any data, whether it is recognized as a trusted writer.

Three equivalent entry points:

- `GET /session` over HTTP.
- `get_session_identity` as an MCP tool.
- `neotoma auth session` on the CLI.

Each returns the resolved trust tier, the grant status (admitted or not, with reason), anonymous-write policy, and a boolean `eligible_for_trusted_writes`. The response includes a diagnostic block explaining how the tier resolved. A new agent fails loudly at session start instead of writing anonymous rows until someone notices.

The shipped MCP instructions tell every connected agent to run this check before enabling writes.

## Where I am running this

Three distinct service agents in my stack write to Neotoma under AAuth today.

**Cursor MCP proxy.** Every MCP request from Cursor flows through a signing proxy (`mcp_identity_proxy.py`) that injects an RFC 9421 signature with an `aa-agent+jwt` agent token. Neotoma verifies the signature, resolves the identity (`sub=cursor@markmhendrickson.com`, `iss=https://markmhendrickson.com`), matches the `agent_grant`, and admits the write at `tier=software`. The proxy also runs session preflight on startup and can fail closed if the server reports anonymous tier.

**Feedback pipeline.** A Netlify relay at `agent.neotoma.io` forwards agent bug reports into Neotoma over an AAuth-signed [Cloudflare Access](https://www.cloudflare.com/zero-trust/) tunnel. Its grant is scoped to `neotoma_feedback` operations only.

**[Darkmesh](https://github.com/markmhendrickson/darkmesh) warm-intro writeback.** My [Darkmesh fork](https://github.com/markmhendrickson/darkmesh/blob/main/docs/neotoma_integration.md) ([context](/posts/the-substrate-plancast-needed)) records warm-intro reveals back into Neotoma with RFC 9421 signatures and an `aa-agent+jwt` token. Each reveal lands with the node's `agent_sub`, `agent_iss`, and key thumbprint, scoped by a per-node grant.

The Darkmesh joint tests proved the enforcement in an adversarial shape. A second simulated agent from a peer node tried to write a `warm_intro_reveal` without that entity type in its grant. Neotoma rejected the write. The authorized node's writes went through unchanged.

Next on the roadmap: the [public agent on markmhendrickson.com](https://markmhendrickson.com/agent/) wraps a Neotoma instance as its memory and today only serves entities I have explicitly marked public. I plan to add AAuth-gated reads so authorized visitors can query specific non-public entity types. Same signed-identity-plus-grant machinery, applied to the read path.

## Fleet-wide upgrade

Neotoma ships its canonical MCP instructions from the server to every connected client on every handshake. In v0.6.0 those instructions now codify attribution preflight, `observation_source` tagging, reply-cited provenance edges, an `Ambiguous (N)` display group for heuristic-merge warnings, and a structured feedback-submission loop.

When I upgraded my server, my Cursor, Claude Code, Codex, and OpenCode hooks all picked up the new behaviors. No client-side releases. No per-tool migration. One server bump, five agents updated. For anyone running customer fleets, the same pattern applies: upgrade the Neotoma instance and every connected agent picks up the new defaults without a client deploy.

## The audit surface

For product-builders in regulated markets, the follow-up question from a customer is rarely "did your system remember this." It is "who wrote it, and can you prove they were authorized."

After v0.6.0 that is a read against first-class data:

- `GET /agents` enumerates every agent identity the server has seen.
- `GET /agents/{key}` returns the per-agent detail view.
- `GET /agents/{key}/records` audits which records a given agent authored.
- `GET /agents/grants` lists all grants, their capabilities, and their lifecycle status.

If you ship agentic functionality to customers in healthcare, finance, legal, or enterprise verticals, this is the surface your customers will eventually demand.

## How to turn it on

```bash
neotoma auth keygen --alg ES256
neotoma auth sign-example
neotoma auth session
```

Create a grant for the new identity via the Inspector or the REST API, scoping capabilities to the operations your agent needs. If you are upgrading from the old env-config model, run `neotoma agents grants import --owner-user-id <your_user_id>` once, then unset the legacy variables.

For programmatic signing, [`@aauth/local-keys`](https://www.aauth.dev/) or an equivalent AAuth library signs requests with RFC 9421 HTTP Message Signatures plus an `aa-agent+jwt` token. Neotoma verifies the signature on the raw bytes the client signed.

Writes without AAuth still work. They land in the `anonymous` tier. Builders who want hard failures can flip `NEOTOMA_AAUTH_STRICT=1` and add specific subjects to `NEOTOMA_STRICT_AAUTH_SUBS`.

## Also shipped

v0.6.0 is not only AAuth. The same release lands entity split for over-merged records, fleet snapshot export plus drift tooling, first-class multi-agent conversations via `conversation_message` and `sender_kind`, and a tightened API perimeter. The full supplement is in [the v0.6.0 release notes](https://github.com/markmhendrickson/neotoma/releases/tag/v0.6.0).

## Install and upgrade

```bash
npm install -g neotoma@[0.6.0](https://github.com/markmhendrickson/neotoma/releases/tag/v0.6.0)
neotoma init
neotoma auth keygen
neotoma auth session
```

Upgrading the server gives you the new attribution stamping and the MCP instruction refresh on the next client handshake. No client-side install required for agents already connected via MCP.

Full install: [neotoma.io/install](https://neotoma.io/install). Repo: [github.com/markmhendrickson/neotoma](https://github.com/markmhendrickson/neotoma). Release notes: [v0.6.0](https://github.com/markmhendrickson/neotoma/releases/tag/v0.6.0).
