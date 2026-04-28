In 2012 I wrote a [postmortem for Plancast](https://markmhendrickson.com/posts/a-postmortem-for-plancast/), a startup I had spent three years on. The premise was simple: people make plans, plans are worth sharing, and a feed of upcoming events from people you trust would surface things you didn't know you wanted to do. It didn't work. The piece walked through why.

Re-reading it fourteen years later, the surface diagnoses still hold. Plans get made too infrequently to sustain a daily feed habit. Sharing future plans gives weak vanity loops compared to sharing photos. Plans expire, so any single piece of content has hours of shelf life. Most plans are geographically local, so most of your network's plans are irrelevant most of the time. And the deepest problem: people don't want to be ambiently aware of events they weren't personally invited to. Awareness without invitation feels like exclusion. Most people also do not want to share every plan with their whole network. The wrong people can show up, or the room stops feeling controllable.

What I missed in 2012 was that none of these were really product mechanics problems. They were substrate problems. The substrate available at the time, a feed inside a centralized social network, was the wrong shape for any of them. I tried to engineer around the substrate with features. The substrate was still a low ceiling on every metric.

## What was actually wrong

A feed is the wrong primitive for plan-sharing because:

- A feed assumes a steady stream of content. Plans don't arrive as a stream.
- A feed rewards broadcast. Plans need addressed audiences.
- A feed has one collapse function. Plancast picked "soonest first" by event date, social feeds pick "newest first" by post time. Either way, it is one chronological sort. Plans benefit from many query functions, and the useful ones (who in your trust graph is going, what fits this Thursday, who is in town) are rarely a chronological sort at all.
- A feed makes every piece of content visible to everyone who follows you. Plans need scopes.
- A feed treats consumption as the user-facing surface. Plans need composition with other systems (calendars, RSVPs, transit, weather).
- A feed centralizes the mediation. Plans are inherently between people.

Once that list is on the table, every Plancast failure I named in 2012 is a downstream symptom. The substrate could not express what plan-sharing actually wants to be.

## The substrate I needed

The substrate I would now build on has two pieces, neither of which existed in usable form in 2012.

**Durable, append-only state for personal AI agents.** This is what I'm building as [Neotoma](https://neotoma.io). Every observation an agent makes (a contact added, an event RSVPed, an invitation issued, an attendance confirmed) becomes a typed entity with provenance, schema constraints, and an immutable history. The user's own AI agent reads and writes from it. There is no centralized social graph. The user owns the state.

**A sovereign mesh of address books and trust scopes.** This is what [Darkmesh](https://github.com/markmhendrickson/darkmesh) (my fork of [Anand Iyer](https://www.anandiyer.com/)'s original) is for. Darkmesh lets a person publish addressable slices of their context (specific contacts, specific groups, specific scopes) to other people's mesh nodes under explicit consent. Consent is held at the network edge. A sender's agent cannot put a message into a recipient's state unless the recipient's mesh node has admitted the sender's scope.

Personal AI agents talk to each other across the mesh. State they care about lives durably in each user's own Neotoma. There is no central server holding everyone's plans.

## How the original mission becomes tractable

The original Plancast pitch was: serendipitous get-togethers from shared awareness of plans. The mistake was thinking that shared awareness had to come from a feed.

On this new substrate, the same pitch decomposes into different work.

1. **Event ingest is automatic.** My agent already knows about events I've RSVPed to on Luma, events on my calendar, events in confirmation emails from Eventbrite or Meetup. It writes them to my Neotoma as `event` entities with provenance. I never type them anywhere.

2. **Sharing is consent-gated and addressed.** When I RSVP to something, my agent can flag scopes that should know I'm going. These are not feed posts. They are addressed observations that travel through the mesh only to people whose nodes have admitted my scope.

3. **Discovery is a query, not a feed.** The most natural surface for "what is happening in my world" is not a stream. It is a question I ask my own agent. *Who in my trust mesh is going where in the next two weeks. Which of those events fits my evening this Thursday. Who is in town that I haven't seen in a year.* Each query is computed at retrieval time over my Neotoma plus whatever scopes my mesh has admitted. There is no feed.

4. **Invitations are first-class.** This is the part the 2012 piece insisted on, and the part most product attempts have skipped.

## How invitations should actually work

Plancast did have explicit invitations, but they were manual. They sat on top of a plan your subscribers could already see. The feed was still the first surface. A tag, a mention, or metadata that flagged you had the same shape: ambient visibility came first, the personal tap second. A real invite is supposed to invert that order.

In this substrate, an invitation is a typed entity on the recipient's own state. Roughly:

```
invitation
  sender:               contact_id
  recipient:            contact_id
  event_ref:            event_id
  scope:                "1:1" | "small_group" | "co_attending_set"
  note_to_recipient:    string  (mandatory, non-empty)
  relationship_basis:   string  (why this person, why this event)
  slot_budget_used:     integer (per-event budget)
  expires_at:           timestamp
  conditional_on:       optional quorum predicate
  provenance:           agent / source / timestamp
```

A few things follow from this shape.

**The substrate refuses to deliver if the mesh has not admitted the sender's scope.** That kills cold mass invites at machine speed at the only layer where they can be killed: the network edge.

**Per-event invite budgets force selectivity.** Each event has a small, configurable number of invite slots a sender can spend. The substrate, not willpower, enforces "don't fire-hose your address book." The 2012 vanity-versus-selectivity tension becomes a substrate parameter.

**Pull with pre-clearance is the dominant pattern.** When my agent runs its standing query, it sees only people whose own agents have flagged me as someone they would welcome at this specific event. The intersection of "who in my mesh is going" and "who would welcome me there" is much smaller than "who in my network posted." It is not a feed. It is a permission-gated index.

**Personal context is mandatory at the type level.** `note_to_recipient` and `relationship_basis` are required fields. Empty is not a valid state. My agent can draft them from my Neotoma graph (last overlap, shared context, common contacts) but a human-confirmed line is the default. This is what the 2012 piece was pointing at when it insisted that people want to feel personally invited. The substrate makes the personal note a structural requirement, not an optional courtesy.

**Decline is silent and unattributed.** Recipients reply with `accept`, `pass`, or `pencil`. Only `accept` is visible to the sender. `pass` resolves to "no answer" with no read receipt and no reason. The recipient retains private provenance. You can audit your own social load without exposing it.

**Quorum is a first-class primitive.** The 2012 piece named procrastination as a top failure: people keep options open and refuse to commit early. The substrate addresses this directly with `conditional_on`: "I'll go to X if Aaron and Diwaker also commit." The substrate watches the predicate and resolves it. No coordinator role, no group chat thread, no flake.

**Composability with the existing event graph.** When an invite is accepted, the agent reaches into the platform that owns the canonical RSVP (Luma, Eventbrite, calendar) and writes the actual reservation. The Neotoma `attendance_commitment` entity stays canonical for who-trusts-who-is-going-where. The third-party RSVP stays canonical for the venue and the door. Two records, one source of truth per concern, linked.

## What the agents are actually deciding

The system above only works if agents do non-trivial work locally. The two questions, in both directions of the loop, are concrete.

**Outbound, who would welcome this plan.** When my agent sees I have RSVPed to something, it scores my contacts against the event, not against me. Useful local signals:

- contacts whose Neotoma carries shared topics or co-attended events with this one,
- contacts I have been to similar things with in the last year,
- contacts who have explicitly opted in to a category (flag me about live music in this city),
- contacts whose own observed schedule or location overlaps with the event window.

The agent produces a ranked candidate list, never an auto-fire. Slot budgets are spent by me or with my confirmation, and the `relationship_basis` field is filled from the same scoring so I can see why a person was suggested before I send.

**Inbound, which plans coming through the mesh are worth surfacing.** My agent runs the symmetric query against incoming invitations and against ambient attendance observations admitted by my scope. Local signals:

- how recently and how often I have co-attended with the people involved,
- whether the topic matches a category I have stayed engaged with,
- whether my own calendar has room,
- whether a quorum I care about is forming.

Most incoming pings get filed, not surfaced. The ones that surface come with the agent's own short paragraph on why this one and not the others.

Both directions are heavy lifting and both stay local. There is no central ranker. Each user's agent computes against state that user owns, and the scoring is inspectable by that user. That is what makes the experience start looking like infrastructure that can act on your behalf without becoming a platform.

## How relationships evolve as observed

In a feed, your relationship graph is mostly static once formed. You follow people, you unfollow them rarely, and everything else is signal noise the platform interprets for you. In this substrate the graph is shaped by observations.

Every typed write moves a relationship slightly. An invitation sent moves the edge in one direction. An invitation accepted moves it further. Attendance overlap recorded by both agents moves it further again. A recorded conversation, a shared note, or a project entity both nodes touch each leave an observation on the edge between two contacts, with provenance and a timestamp.

The inverse is also true. Edges decay when nothing happens. A contact you have not invited, attended with, or written about in a year is a different kind of edge than the contact you saw last weekend. The decay is not deletion. The history is still there for retrieval. But the agent's relevance scoring tomorrow uses the up-to-date weight, so a year of silence costs visibility before it costs the relationship itself.

This inverts the feed model in the way that matters. Feeds make the graph the input and the activity the output. This substrate makes the activity the input and the graph the output. Relationships evolve because behavior is structured state, not because someone clicked "Follow" once in 2014 and the platform has been pretending the edge still means something ever since.

## What this is not

This is not an attempt to replace human-authored invitations. The substrate's job is to make a hand-written invite cheaper to send well, more certain to land, and harder to spam. Every layer above is meant to push the experience back toward what 2012 me correctly identified as the actual social currency: someone you trust thought of you specifically. The substrate cannot manufacture that thought. It can refuse to deliver substitutes.

## What is still open

A few things I do not yet have good answers for.

- How invite budgets should be denominated and renewed. Per event, per week, per mesh? Tied to acceptance rate?
- How mesh scope changes propagate when relationships change. What does it look like to revoke a scope without burning a relationship?
- Cross-mesh interop when participants run different mesh implementations. Does it require a thin protocol layer?
- Abuse handling when a previously admitted sender starts spamming. Who applies the penalty, the recipient's mesh node or the substrate as a whole?
- Migration story for events whose canonical RSVP lives behind a paywall or login.

These are real questions, but they are product and protocol questions on top of a substrate that already works. They are not architectural unknowns.

## Why I am writing this now

A few days ago Oo Nwoye left a public comment on [this LinkedIn thread](https://www.linkedin.com/feed/update/urn:li:activity:7452367955801128962) under Mike Butcher's post about gathering people at events, recalled Plancast, and asked, in so many words, whether it should be resurrected for the AI age. The answer is the same as the one above. The original mission was right. The substrate was wrong. The substrate now exists.

I do not think the answer is to rebuild Plancast as an app. The answer is to build invitations, attendance, and trust scopes as primitives on a sovereign personal-state layer, let agents do the work of ingesting and routing, and let the social mechanic emerge from the fact that an invitation is a typed write to durable state instead of an ambient feed event.

If you have built or are building anything in this neighborhood, I would like to talk.
