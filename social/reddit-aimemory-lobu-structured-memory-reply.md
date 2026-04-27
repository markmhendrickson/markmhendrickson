# Reddit reply draft: r/AIMemory (lobu / structured memory per entity)

**Target post:** [Why agents need separate structured memory per entity to avoid forgetting anything](https://www.reddit.com/r/AIMemory/comments/1srrvlx/why_agents_need_separate_structured_memory_per/)
**Author:** u/Buremba (lobu.ai / github.com/lobu-ai/lobu)
**Subreddit:** r/AIMemory
**Generated:** 2026-04-21
**Mode:** comment reply (not a new thread post)

## Top pick: copy and post

### Post directly when ready (Reddit replies can't be scheduled; thread is fresh, post soon)

> Yes, this clicks. I landed on the same entity-per-type split coming at it from a different direction (~year in), and the data-engineer analogy is the right one. Once agents have named long-term nouns to save under, retrieval stops feeling like vibes and starts feeling like a query.
>
> Where I'd push on it: "forcing structured save" is necessary but not sufficient. If the write path updates the row in place, you end up with the same reliability problem you had with messy notes, just at the field level. A future session walks in with partial context, writes a worse value over the good one, and the old value is gone. LongMemEval and LoCoMo won't flag that; they don't probe what happens to stored state *after* the agent writes to it. The corpus is fixed for the whole eval.
>
> What shook out for me was treating the observation log (append-only, every write is a record with provenance) as the source of truth, and deriving the structured entity snapshot from the log. Same entities, same relationships, same schemas, but:
>
> - Contradictions are data you can inspect, not silent overwrites
> - You can ask "what did the system believe on April 1" and get an answer
> - Every field traces back to the session / message / file that produced it
>
> Just giving an agent a database skips all of this. DBs UPSERT by default. You want a ledger the agent appends to, and a view that rebuilds the rows.
>
> If it's useful: I put together [WRIT](https://github.com/markmhendrickson/writ) (Write Integrity Test) to probe exactly this - 5-20 sessions with temporal gaps, updates, contradictions, retractions - and check whether stored state is still correct afterwards. It's the class of scenario LongMemEval and LoCoMo don't cover, and it would likely surface the real value of the structured-save discipline you're demonstrating in lobu. I'm also building [Neotoma](https://neotoma.io) in the same neighborhood; different choices in the append-only direction, happy to compare notes.
>
> Question back at you: while running the experiments, did you ever see the agent stomp a good structured record with a worse value from a later session? That failure mode is what convinced me the write rule isn't "save as entity" but "never destroy prior state on save."

### Why this reply

- Affirms the thesis first (entity-per-type, data-engineer analogy) so it doesn't read as a pile-on from a neighbor product.
- Adds one concrete structural point OP didn't cover: write path semantics. This is the non-obvious augmentation, not a restatement.
- Uses OP's own benchmark vocabulary (LongMemEval, LoCoMo) to name the gap; makes the critique specific, not hand-wavy.
- Mentions WRIT and Neotoma once each, late, after value, with no CTA. Complies with r/AIMemory self-promo norms (discussion first).
- Ends with a concrete failure-mode question OP can answer from experience. Invites reply chain instead of closing the loop.

## Alternate drafts

### Alt A - shorter, reply-only, no link to WRIT

> Yes, the analogy clicks. Entity-per-type + forced structured save is the right move; once agents have named nouns to save under, retrieval stops feeling like vibes.
>
> The piece I'd add: forcing a structured save isn't enough on its own if the write path UPSERTs. A new session walks in with partial context, overwrites a good row with a worse value, and the old value is gone. LongMemEval / LoCoMo won't catch that; they don't probe what happens to stored state *after* the agent writes to it.
>
> I ended up treating an append-only observation log as the source of truth and deriving the structured snapshot from it. Same entities and relationships, but contradictions become inspectable data, "what did we believe on April 1" is answerable, and every field traces back to its source. Just giving an agent a DB skips all that - DBs update rows by default.
>
> Did you see the agent overwrite good structured data with a worse value across sessions while testing? That moment is what sold me on "never destroy prior state on save" as the real write rule.

### Alt B - narrower, pure question (good if OP's thread gets busy and a shorter reply might earn a response)

> The data-engineer analogy holds. One question to pressure-test the thesis: in your tests, when a later session writes a different value for the same entity field, does lobu overwrite, version, or reject? That's the spot where "force structured save" usually starts leaking, because the same discipline that keeps notes clean doesn't automatically keep history intact. LongMemEval and LoCoMo don't probe this, but it's the failure mode most production agents I've watched actually hit.

## Voice / language notes

**Cooldown phrases avoided:**
- "truth layer" (not used)
- "silently overwritten / silently rewrites" (used once in Alt A as "overwrites," varied from prior posts)
- "append-only observations" as a hook (used in body only, not as opener)
- "same question, different answer next week" (not used)
- "right instinct, wrong artifact" (not used)

**Fresh framings:**
- "write rule isn't 'save as entity' but 'never destroy prior state on save'"
- "DBs UPSERT by default. You want a ledger the agent appends to, and a view that rebuilds the rows."
- "the corpus is fixed for the whole eval" (restating LongMemEval / LoCoMo's static-corpus assumption in conversational shape)

**Tone:**
- Builder-to-builder, no claim of superiority. OP is explicitly "still very much an experiment, open to feedback" - this reply matches that register.
- Neotoma / WRIT mentions are placed after the structural point and framed as "compare notes," not install pitches.
- Em dashes used for pacing (social-content exempt from `content_style_enforcement`).

## Links used

- `https://github.com/markmhendrickson/writ`
- `https://neotoma.io`

No third self-link. Reddit self-promo tolerance on r/AIMemory is higher than most subs, but two links in one reply is still the ceiling.

## Post-reply follow-ups

If OP replies affirming the overwrite failure exists in lobu:
- Offer to run lobu through WRIT once the adapter interface fits, or share a scenario set they can self-run.
- Ask whether they'd consider versioning fields vs storing an observation log; good comparison-notes surface.

If OP replies asserting lobu already handles this:
- Ask for the specific mechanism (field versioning, event log, CRDT, soft delete, append-only table, etc). Keep it technical, not adversarial. Useful data either way.

If the thread goes quiet:
- Do not bump. Consider QT-ing the OP tweet/thread announcement (if any) with a short reframe aimed at the broader AI memory builder audience, not a second reply under OP.
