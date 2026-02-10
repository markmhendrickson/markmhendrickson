# Neotoma developer release

The Neotoma truth layer is now available as a developer release. Neotoma is the truth layer I use for persistent agent memory: an explicit, inspectable substrate that AI tools read and write via the Model Context Protocol (MCP). This post announces the release, walks through local setup, and outlines what the repo actually does.

**What Neotoma is.** Neotoma is not an app or a workflow engine. It is the lowest-level canonical source of truth for personal data that agents use. You upload documents (PDFs, receipts, contracts) or share information in conversation; agents structure and store it. Neotoma resolves entities across all sources, builds timelines from date fields, and keeps every fact traceable to its source. One graph connects people, companies, events, and relationships. ChatGPT, Claude, and Cursor talk to it over MCP.

**What it is not.** Not a note-taking app or "second brain." Not provider-controlled ChatGPT Memory or Claude Projects (those are conversation-only and platform-locked). Not a vector store or RAG layer. Not an autonomous agent. It is the memory layer agents read and write; you control what goes in.

For more on Neotoma and the truth layer, see the post [Truth layer agent memory](/posts/truth-layer-agent-memory).

## Three foundations

The architecture rests on three choices that provider memory does not offer:

1. **Privacy-first.** User-controlled memory, row-level security, never used for training. Your data stays yours.
2. **Deterministic.** Same input produces same output. Schema-first extraction, hash-based entity IDs, full provenance. No randomness in core components.
3. **Cross-platform.** Works with ChatGPT, Claude, Cursor, and Claude Code via MCP. One memory system across tools.

Those enable an immutable audit trail, time-travel queries, entity resolution across documents and agent data, timeline generation, and dual-path storing (files plus agent interactions) without context-window limits.

## Getting started in a local environment

Prerequisites: Node.js v18.x or v20.x (LTS), npm v9+, and Git.

**1. Install.**

Preferred: install the package. Run `npm install neotoma` (or `npm install -g neotoma` for the global CLI). Then configure `.env` and run as below.

Or from source:

```bash
git clone https://github.com/markmhendrickson/neotoma.git
cd neotoma
npm install
npm run type-check
```

If `type-check` passes (source install), dependencies are fine.

**2. Configure environment.**

Create `.env` in the project root (see `env.example`). For local storage (no Supabase), set these four; the repo's env.example is Supabase-oriented, so for SQLite-only runs use:

```bash
NEOTOMA_STORAGE_BACKEND=local
NEOTOMA_DATA_DIR=./data
NEOTOMA_SQLITE_PATH=./data/neotoma.db
NEOTOMA_RAW_STORAGE_DIR=./data/sources
```

Check the repo docs and env.example for the current list and any defaults. Optional for all setups: `PORT=3000`, `HTTP_PORT=8080`, `ACTIONS_BEARER_TOKEN` for the API; `OPENAI_API_KEY` if you use embeddings or interpretation.

**3. Run tests and servers.**

```bash
npm test
```

Then start what you need:

- **MCP server (stdio):** `npm run watch`.
- **API only:** `npm run watch:server`.
- **Production-style API (port 8082):** `npm run watch:prod`.

Development uses port 8080 by default.

**4. CLI (optional).**

```bash
npm run cli        # run without global install
npm run cli:dev    # dev mode, picks up source changes
npm run setup:cli  # build and link so `neotoma` is available globally
```

After global install or link, if `neotoma` is not found, add npm's global bin to your PATH (e.g. `export PATH="$(npm config get prefix)/bin:$PATH"`). Example commands: `neotoma entities list`, `neotoma sources list`, `neotoma timeline list --limit 10`.

## Repo functionality in detail

### Data model: source to snapshot

Neotoma uses a four-layer model:

1. **Source.** A single unit of input: a stored file (content-addressed) or a structured payload (e.g. from an agent). Sources are immutable; content hash drives deduplication.
2. **Interpretation.** For unstructured sources, an optional AI interpretation step produces structured extractions. Interpretations are versioned; you can run `reinterpret` with different config without losing history.
3. **Observation.** Each extracted fact is an observation: a field-level claim (e.g. "this invoice has amount 500 EUR") tied to a source and interpretation. Observations have priority; corrections create high-priority observations that override earlier ones.
4. **Entity and entity snapshot.** Entities are the resolved "things" (person, company, invoice, task, etc.). They get hash-based canonical IDs so the same real-world thing is one entity across sources. Reducers merge observations into the current entity snapshot. Snapshots are what you read when you ask for an entity.

Sources come in; interpretations run (for files), observations are created, reducers compute entity snapshots. The graph connects entities via typed relationships (e.g. PART_OF, REFERS_TO, SETTLES).

### Storing: unified `store` action

All writes go through one MCP action, `store`.

- **Unstructured (files):** Send `file_content` (base64) and `mime_type`. Optionally `original_filename`. The server stores the source and can run interpretation (`interpret: true` by default). You do not pre-extract or infer structure; the server does it.
- **Structured (agent data):** Send an `entities` array. Each item has `entity_type` (e.g. `contact`, `task`, `invoice`) and the field set for that type. Schema fields become observations; unknown fields go to `raw_fragments` for later schema promotion. You can omit `original_filename` for agent-originated data.

Idempotency is supported via `idempotency_key`. Storing is content-addressed so duplicate content does not create duplicate sources.

### Entity resolution and schema registry

Entity IDs are deterministic (hash-based from type and normalizable identifiers). The schema registry defines entity types and their fields. Built-in types include contact, person, company, task, invoice, transaction, receipt, note, contract, event, and others (see `docs/subsystems/schema_snapshots/` in the repo). You can register new types or new versions; user-specific schemas override global ones when configured.

Unknown fields in structured input are stored in `raw_fragments`. The system can analyze these and suggest or auto-promote fields to the schema (e.g. high confidence, consistent type). Schema tools: `analyze_schema_candidates`, `get_schema_recommendations`, `update_schema_incremental`, `register_schema`.

### Correction and reinterpretation

- **Correct.** When the AI mis-extracts something, you fix it with `correct`: entity ID, entity type, field name, and corrected value. That creates a high-priority observation; the reducer uses it so the snapshot reflects the correction.
- **Reinterpret.** Run interpretation again on an existing source with new config (e.g. different model or prompt). New observations are created; existing ones stay. Useful for improving extractions without losing history.

### Retrieval and graph

- **Entity lookup:** `retrieve_entity_snapshot` (one entity with provenance), `retrieve_entities` (filtered list), `retrieve_entity_by_identifier` (e.g. by name or email).
- **Graph:** `retrieve_related_entities` (n-hop relationships), `retrieve_graph_neighborhood` (entities, relationships, sources, and events around a node).
- **Provenance:** `list_observations` for an entity, `retrieve_field_provenance` to trace a field back to source.
- **Relationships:** `create_relationship` (typed edge between two entities), `list_relationships`, `get_relationship_snapshot`.
- **Timeline:** `list_timeline_events` (events derived from date fields across sources, with filters).

### File access and auth

- **Files:** `retrieve_file_url` returns a URL for a source; with local storage the server uses path-based or served access.
- **Auth:** For local dev the server uses a built-in dev stub (`neotoma auth login --dev-stub`). The repo has MCP setup docs for Cursor, Claude Code, and ChatGPT.

### MCP action catalog (summary)

- **Storing:** `store` (unified for files and structured entities).
- **Entity operations:** `retrieve_entity_snapshot`, `retrieve_entities`, `retrieve_entity_by_identifier`, `retrieve_related_entities`, `retrieve_graph_neighborhood`, `list_entity_types`, `merge_entities`.
- **Observations and relationships:** `list_observations`, `retrieve_field_provenance`, `create_relationship`, `list_relationships`, `get_relationship_snapshot`, `list_timeline_events`.
- **Correction and interpretation:** `correct`, `reinterpret`.
- **Schema:** `analyze_schema_candidates`, `get_schema_recommendations`, `update_schema_incremental`, `register_schema`.
- **Files and auth:** `retrieve_file_url`, `get_authenticated_user`.

The MCP server also exposes **resources** under the `neotoma://` URI scheme: entity collections, entity types, timeline by year/month, sources, and relationships. Clients can browse and discover data via these resources in addition to calling actions.

### API

The HTTP API serves MCP over HTTP and WebSocket for clients that do not use stdio. OpenAPI spec is in the repo (`openapi.yaml`).

### Testing and tooling

- **Tests:** `npm test` (unit and integration), `npm run test:integration`, `npm run test:e2e`, `npm run test:agent-mcp`. Type-check: `npm run type-check`. Lint: `npm run lint`.
- **Health:** `npm run doctor` checks environment and database.

## Who this is for

- People who use ChatGPT, Claude, or Cursor and want one persistent memory layer across sessions and tools.
- Knowledge workers who need cross-document and cross-agent entity unification (contracts, invoices, tasks).
- Small teams that want a shared truth layer with user isolation.
- Builders of agentic systems who need a deterministic memory and provenance layer for agents and toolchains.

## Current status and next steps

Version is v0.3.0 (reconciliation release). Implemented: sources-first architecture, content-addressed storage, dual-path storing, observations and reducers, entity resolution, schema registry, timeline generation, MCP integration, provenance, CLI. Roadmap and release notes live in `docs/releases/` in the repo.

If you want to run it locally, clone the repo, set `NEOTOMA_STORAGE_BACKEND=local`, create a minimal `.env`, run `npm test`, then `npm run watch` or `npm run watch:server`. For MCP setup from another workspace (e.g. Cursor), see the repo's [Cursor MCP setup](https://github.com/markmhendrickson/neotoma/blob/main/docs/developer/mcp_cursor_setup.md) and [getting started](https://github.com/markmhendrickson/neotoma/blob/main/docs/developer/getting_started.md) docs.

Repo: [github.com/markmhendrickson/neotoma](https://github.com/markmhendrickson/neotoma).
