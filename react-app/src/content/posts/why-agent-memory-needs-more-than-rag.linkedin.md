# LinkedIn share (draft)

When an AI needs to remember information from external sources and augment its context, the usual trick (RAG: search for similar text and feed it back in) often fails. You get repetition, missing context, or wrong answers.

A new paper from King's College London and the Alan Turing Institute explains why. The fix is to organise and query by clear structure (tasks, contacts, events, relationships), not just by similar wording. One system in the paper does this with a learned hierarchy; it beats the search-by-similarity baseline but still relies on AI to build that structure, which the paper shows can be brittle.

An alternative is to use fixed, explicit structure from the start, so the same inputs always give the same result and the system stays predictable and auditable. I wrote more about that in the post below.

Link: https://markmhendrickson.com/posts/why-agent-memory-needs-more-than-rag

Paper (technical): https://arxiv.org/abs/2602.02007
