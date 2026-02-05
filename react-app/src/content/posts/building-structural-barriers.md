My dad asked me a good question this week: "How do you protect your intellectual property when Big Guys could develop their own version?"

The short answer: you don't protect it through secrecy or patents. You build something they structurally can't pursue.

## The myth of the copyable startup

The standard startup fear goes like this: you build something, it works, and then Google/Microsoft/OpenAI ships the same thing in six months with better distribution.

This fear assumes incumbents can copy anything. They can't.

Not because they lack engineers or capital. They have both. They can't copy certain architectures because their existing business models, technical stacks, and organizational incentives make it structurally expensive or impossible.

## Five structural barriers that actually work

### Incentive misalignment

Build something that would cannibalize a profitable revenue stream.

Example: A privacy-first memory system that runs entirely on user-controlled infrastructure directly conflicts with ad-supported business models. The incumbent would have to choose between their existing margin pool and the new product. They typically choose the existing margin.

### Architectural constraints

Build on foundations that require rewrites of core systems.

Example: Event-sourced, deterministic workflows with full provenance require immutable data structures and hash-based entity IDs. Platforms built on mutable document stores or eventual consistency models would need to rebuild their entire data layer. That's a multi-year rewrite, not a feature sprint.

### Business model conflicts

Build something that requires a different pricing model or customer relationship.

Example: Mid-market annual contracts (€3k–€15k per year) with deep workflow integration don't fit self-serve, usage-based billing platforms. The sales motion, support model, and product expectations are fundamentally different.

### Distribution mismatch

Build for a customer segment the incumbent can't reach effectively.

Example: Sovereignty-conscious power users who actively avoid platform lock-in won't adopt features from the very platforms they're trying to escape. The incumbent's distribution advantage becomes a liability.

### Timing and focus windows

Build fast enough that by the time they could copy, your compounding advantages make it irrelevant.

Example: If you can ship deterministic workflows, cross-domain entity resolution, and extensible object schemas in 12 months while the incumbent is navigating internal prioritization, compliance reviews, and competing roadmap pressures, you'll be three generations ahead before they start.

## Neotoma as a case study

I'm building [Neotoma](https://github.com/markmhendrickson/neotoma) as a privacy-first, deterministic memory substrate for AI tools. It demonstrates all five barriers.

**Privacy-first architecture (incentive misalignment).** Model providers make money from telemetry, training data, and platform lock-in. A system where users own their memory and can use any model directly conflicts with their revenue model. They could build it, but they'd be undermining their existing business.

**Deterministic, event-sourced design (architectural constraints).** Neotoma uses immutable observations, hash-based entity IDs, and deterministic reducers. This guarantees that the same operation always produces the same final state. Platforms built on mutable stores or eventually-consistent systems would need to rebuild their data layer from scratch.

**Cross-platform interoperability (business model conflicts).** Neotoma works with ChatGPT, Claude, and Cursor through MCP. Supporting competitor platforms directly conflicts with single-model lock-in strategies. Incumbents optimize for keeping users inside their ecosystem, not enabling them to leave.

**Sovereignty positioning (distribution mismatch).** The target customers are people who explicitly want control over their data and memory. They won't adopt memory features from the platforms they're trying to avoid. Distribution advantage becomes distribution liability.

**Architectural compounding (timing).** Every entity resolved, every schema extended, every workflow made reproducible increases the cost of replication. The value isn't in any single feature. It's in the network of typed relationships, the audit trail, and the compounding quality of deterministic memory.

## General principles for defensible startups

When evaluating startup ideas, ask these questions.

**Would copying this hurt their existing revenue?** If yes, they won't do it fast. If no, you're competing on execution speed alone.

**Does this require architectural changes they can't make incrementally?** If they can add it as a feature, they will. If it requires a rewrite, you have time.

**Does this require a different customer relationship or sales motion?** If their existing go-to-market doesn't fit your ICP, they can't reach your customers effectively even if they build the same thing.

**Is your distribution actually an advantage for this product?** Sometimes incumbents have anti-distribution for specific customer segments.

**Can you compound advantages faster than they can mobilize?** Speed matters, but it's speed of compounding, not speed of shipping features.

## What doesn't work

These don't create structural barriers.

**Complexity alone.** Hard to build isn't the same as structurally hard to copy. If it's just engineering complexity, they have more engineers.

**Better UX.** UI is easy to copy. Design systems can be replicated in weeks.

**Network effects (early stage).** Network effects take time to compound. In the first year, you don't have them yet.

**Patents.** Tech patents are expensive to enforce and easy to work around. Focus on structural barriers instead.

**Secrecy.** Once you ship, the approach is visible. Secrecy buys you months at most.

## The goal isn't to outrun them

The goal is to build something they can't pursue without making choices they won't make.

You're not trying to be faster forever. You're trying to construct a position where speed stops mattering because the structural constraints do the defending.

For Neotoma specifically: OpenAI could build a privacy-first, cross-platform memory system. But doing so would require them to give up telemetry, platform lock-in, and single-model revenue streams. They're structurally disincentivized from making that trade.

That's not fear-based positioning. That's understanding the board.

## Takeaway

When someone asks "what if Big Guys copy you?", the answer isn't "we'll move faster" or "we have patents."

The answer is: "We built something that would require them to make structural changes they're incentivized not to make."

That's the only moat that lasts.
