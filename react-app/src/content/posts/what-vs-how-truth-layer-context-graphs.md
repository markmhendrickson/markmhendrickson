- Enterprise context graphs (e.g. Glean) model how work gets done: process paths, next-step prediction, who did what in what order. The Truth Layer models what exists: canonical state, entities, and provenance.
- The distinction is architectural. Conflating them leads to probabilistic state, tight coupling to orchestration, and a graph that drifts when the execution layer changes.
- Arvind Jain's "How do you build a context graph?" and Glean's product framing validate that graph-plus-time is the right category. They also show why the enterprise and personal problems differ.
- Personal memory benefits from determinism: same input yields same entity, full audit trail, no model drift. Enterprise context graphs benefit from probabilistic patterns across many users. Different buyers, different invariants.
- Positioning the Truth Layer as "what exists" lets it stay execution-agnostic. Any agent host (Cursor, ChatGPT, Claude) consumes it via MCP. The graph is not owned jointly with orchestration, so it doesn't drift when you switch tools.

## The stakes of conflating what and how

If you build a single system that tries to do both, you get one of two failures.

You optimize for "how work gets done" and you add process traces, action sequences, and next-step prediction. The graph fills with probabilistic edges and ML-inferred entities. That helps with "what tends to happen next" but it makes "what actually happened" and "what is true right now" harder to query. State becomes a distribution. Reproducibility and audit suffer.

Or you optimize for "what exists" and you keep state deterministic and schema-first. Then someone asks "what step usually comes after this?" and you have no answer. You've left process and behavior out of the model.

The cost of being wrong is building a memory layer that either can't support high-stakes queries (because state is probabilistic) or can't support process-aware reasoning (because you never modeled actions). Most teams don't name the distinction. They end up with a graph that tries to be both and does neither well.

## One distinction

**What exists:** Canonical state. Entities with stable IDs. Observations with provenance. Events on a timeline. "What is true about the world as of now?" and "What happened, in what order, with what evidence?" Same input gives same output. Deterministic.

**How work gets done:** Process paths. Who did what, in what app, in what order. What tends to happen next. Semantic tasks inferred from signals. Anonymized patterns across many users. Probabilistic. Optimized for "what step is likely next" and "why did path A differ from path B?"

Enterprise context graphs put "how" front and center. Glean is the visible example. Jain's post describes the category. They need activity traces, causal edges, and aggregation over users. The buyer is IT or knowledge-ops. The deployment is company-wide. The value is "make work flow better" and "surface the right context for the next action."

Personal memory is different. The buyer is the individual or a small team. The value is "what do I know, what did I do, what can I prove?" You need canonical state and timelines you can replay. You don't need cross-user process patterns. You need a graph that doesn't change when you switch from one agent host to another.

So: one layer models what exists. The other models how work gets done. They're conceptually adjacent (both use graph plus time) but they serve different problems and different buyers.

## What enterprise context graphs validate

Jain's framing ("How do you build a context graph?") and Glean's architecture do two useful things for positioning.

They validate the category. Graph plus time plus structure is the right base for AI context. Activity signals alone are noisy. You need a knowledge graph underneath to make them meaningful. That's true for both enterprise and personal. So "memory as a graph with a temporal dimension" is not a niche idea. It's category validation.

They also clarify the fork. In the enterprise version, the knowledge graph sits under an activity layer. Connectors ingest docs and change events. ML resolves entities and infers process patterns. The context graph is anonymized and probabilistic. Agents run inside the same system so the graph and orchestration don't drift. In the personal version, the graph is the main layer. No activity stream. No cross-user aggregation. Deterministic entity resolution. Orchestration stays outside. The graph is consumed by whatever agent host you use today.

So when I explain the Truth Layer, I say: enterprise context graphs show that the category is right. The Truth Layer is the personal, deterministic, execution-agnostic counterpart. Same family. Different scope and invariants.

## Evidence from how I'm building

I'm building [Neotoma](https://github.com/markmhendrickson/neotoma) as the Truth Layer for my own agentic stack. It only models what exists.

Records and agent-provided data become observations. Observations feed reducers that produce entity snapshots. Same observations yield same state. Entity IDs are deterministic (canonicalize, then hash). Timelines come from date fields and event history. There is no "next step" prediction. No process tags. No agents running inside the system. No coupling to a single orchestration layer.

All execution lives in the tools I already use: Cursor, ChatGPT, Claude. They call Neotoma via MCP. If I switch hosts, the graph doesn't change. That's possible because the graph never tried to own "how work gets done." It only owns "what is true."

The contrast with enterprise context graphs is deliberate. They need joint ownership of data and orchestration to avoid drift. I need the opposite: a graph that is independent of who is reading it or which agent is calling it.

## Where this doesn't apply

The distinction is not "enterprise bad, personal good." It's "different problems, different designs."

If you're building for a company and your job is to improve how work flows across systems and people, you need process traces and probabilistic context. Glean and similar systems are built for that. If you're building for an individual or a small team and your job is to hold canonical state and provenance, you need determinism and execution-agnostic design. Neotoma is built for that.

The same person can use both. Personal Truth Layer for "my docs, my entities, my timeline." Employer context graph for "how we work, org knowledge." They're complements. Positioning the Truth Layer as "what exists" doesn't mean context graphs are wrong. It means they solve a different problem.

One more limit: "what exists" can still include inferred structure. Schema evolution and optional LLM-suggested types are fine. The system must stay deterministic at the reducer level. Inference can propose, but the system decides. Same input, same output.

## How I'm approaching the build

I'm dogfooding Neotoma as the only memory layer in my setup. I don't run a separate context graph. Process and "what tends to happen" live in strategy docs and agent behavior, not in the graph.

When I explain the Truth Layer to others, I lead with "what vs how" and "knowledge graph underneath." I cite enterprise context graphs as category validation and position Neotoma as the personal, deterministic, execution-agnostic counterpart. That keeps the story tight and avoids framing it as "we vs them."

I'm not building connectors into every app or ingesting activity streams. Ingestion is explicit: file uploads and what agents write via MCP. That keeps control and privacy where I want them and keeps the graph from depending on how work flows in any single tool.

## Unresolved edge

The open question is how much "how" a personal Truth Layer can absorb without losing determinism or execution independence. For example, could you add a thin layer of "recent actions by this user" as first-class events, still deterministic and user-scoped, and still serve it via MCP without coupling to orchestration? I don't know yet. If I try it, the invariant stays: same input, same state. No probabilistic edges. No cross-user aggregation.
