---
title: When the chain becomes the product
excerpt: I joined Blockstack in 2018 for the off-chain developer tools. Over seven years I watched token economics reshape the product direction, push the perceived moment of value perpetually into the future, and replace empirical product development with narrative-driven roadmaps.
published: true
published_date: "2026-03-09"
hero_image: when-the-chain-becomes-the-product-hero.png
hero_image_style: keep-proportions
---
I joined [Blockstack](https://venturebeat.com/ai/blockstack-raises-52-million-to-build-a-parallel-internet-where-you-own-all-your-data) in 2018 because of [Gaia](https://github.com/stacks-network/gaia).

Gaia was a distributed storage system that let users control their own data. Apps built on Blockstack stored and retrieved user data without a central server. Users picked their storage provider. Encryption happened by default. It was the kind of infrastructure that makes you believe the team has found something real about how the internet should work.

Blockstack already had a small developer community building apps with its JavaScript SDKs. People were experimenting with decentralized identity and user-controlled storage. The experiments felt genuinely early and genuinely useful. That was the product surface I signed up to work on.

## The pivot I did not see coming

Within months of joining, I realized the company's focus had already shifted.

Blockstack had raised $50 million through a 2017 token offering under Regulation D, limited to accredited investors. By the time I arrived, the team was preparing for something bigger: a Regulation A+ offering that the SEC would [qualify in July 2019](https://www.sec.gov/Archives/edgar/data/1693656/000110465919048927/a19-18332_11u.htm). It became the first SEC-qualified token offering in U.S. history, [raising roughly $15.5 million for 74.3 million](https://www.coindesk.com/markets/2019/09/10/blockstacks-regulated-token-offerings-raise-23-million) [Stacks](https://www.stacks.co/faq/what-is-stx-token-and-what-is-it-used-for) tokens. The company spent [10 months and $2.8 million](https://www.kutakrock.com/newspublications/publications/2019/7/blockstack-holds-the-first-regulated-token-offer) on the regulatory process alone.

These were real accomplishments. The SEC qualification was genuinely historic. [Proof-of-Transfer](https://docs.stacks.co/stacks-101/proof-of-transfer) was a defensible technical contribution. [Clarity](https://docs.stacks.co/clarity/overview) made deliberate design choices around safety and predictability that most smart contract languages had not attempted. The team was talented and the ambition was real.

But the token issuance changed the gravity of the organization. Instead of iterating on Gaia and the SDK capabilities that had attracted me and the community, the company refocused on the Stacks blockchain and Clarity. The publicly marketed developer product was quietly becoming secondary to long-term chain infrastructure.

This is the structural feature of token-funded ventures that I did not understand at the time. In a normal startup, valuation follows the product: you build something, people use it, revenue or at least sustained usage grows, and the company becomes more valuable. Token issuance flips that order. The market capitalizes future narratives before the product exists. The team receives validation before delivery. Belief becomes an asset.

## Narrative replaces feedback

Once a token prices the future, the organization's feedback loop changes.

A healthy product company runs on short cycles: ship, measure, learn, iterate. The gap between action and outcome is days or weeks. When something is wrong, you find out fast.

Crypto infrastructure projects operate in a different regime. The value thesis depends on layers that each take years: the L1, the developer tools, the applications, the users, the network effects. The compounded timeline stretches to a decade or more. But most participants, myself included, implicitly assume two or three years.

The industry's intense FOMO makes this worse. Projects promise aggressive release deadlines well before they have realistic timing visibility, because the market punishes uncertainty and rewards confidence. Then they peg their traction hopes on hitting those deadlines, turning each one into an existential event. The deadlines create death marches. The traction hopes compensate for the pain. Both reinforce the cycle.

That mismatch is where the trouble starts. When feedback latency is measured in years, narrative fills the gap. Instead of evidence, teams rely on ideology, inevitability claims, and the reputation of the founding team. The language shifts. Early on, you hear user feedback and honest constraints. Later, you hear "long-term vision" and "misunderstood by the market."

The metrics degrade in a specific way. Real product signals like active users, retention, and developer pain get replaced by activity proxies: GitHub commits, ecosystem grants, conference presence, partnership announcements, and ambitious sounding but underspecified and unanchored pre-release announcements. These are internally generated. They do not come from outside the belief system.

I watched this happen gradually at Blockstack and then across the broader Stacks ecosystem. The feedback loop that should have connected developers to the roadmap was replaced by a narrative loop that connected token price to institutional survival.

## Developers as the imaginary future user

Blockstack had something most crypto projects struggle to get: a real developer community. People were shipping apps. They were filing bugs, giving feedback, asking for features. That is the raw material of product discovery.

The company chose not to use it that way.

[App Mining](https://bitcoinmagazine.com/business/blockstack-looks-boost-decentralized-app-usage-through-new-app-mining-program) launched in late 2018. Developers earned monthly Bitcoin payouts based on their app's quality ranking. The program grew the app count from 46 to over 400 in about a year. Those numbers looked good in blog posts and pitch decks.

But the program was structured around rankings and payouts, not around understanding what developers actually needed. When structural problems surfaced around fair distribution, privacy-preserving analytics, and decentralization of the program itself, Blockstack [paused App Mining in February 2020](https://www.theblock.co/linked/55474/blockstack-to-pause-its-app-mining-program-due-to-several-structural-challenges). It never came back.

What replaced it was not neglect exactly. It was deprioritization so deep it functioned the same way.

Over time, the organization began treating its existing developers not as the people to build for, but as noise. The implicit framing became: these early adopters are not representative of the "real" users who will arrive once the infrastructure is complete. There was always a better, larger, more sophisticated customer on the horizon. The people actually building on the platform were reframed as edge cases whose feedback was not worth centering.

That is not to say developers were completely ignored. When they cried foul loudly enough in community forums and Discord channels, risking reputational harm to the ecosystem and the companies behind it, the organizations did respond. If a shipped tool was broken at a basic level, teams jumped to fix it to avoid the optics. But the default mode was reactive, not curious. Developers were expected to adopt whatever technology was thrown at them regardless of their existing needs. Proactive discovery of what would actually help them build better apps almost never happened.

The [Ordinals](https://cointelegraph.com/explained/what-are-bitcoin-ordinals) wave in 2023 illustrated the pattern from the other direction. The Stacks community jumped on Bitcoin NFTs and tokens like [BRC-20](https://www.coindesk.com/learn/brc-20-tokens-what-are-they-and-how-do-they-work) not because existing Stacks developers or users needed ordinal support for their applications, but because the "Bitcoin-native web3" narrative Ordinals represented was an opportunity to reinforce Stacks' own positioning. Energy went toward narrative alignment with an external trend rather than toward solving problems the existing community had actually surfaced.

This is a specific pathology. When an organization needs to believe that long-term infrastructure will eventually attract a mass market, the current users become inconvenient. Their concrete feedback about missing features, wrong abstractions, and usability friction creates tension with the thesis. Two interpretations are always available: the product needs to change, or these users are the wrong users. Organizations with strong narrative commitments tend toward the second.

The irony is that early adopters are the only empirical signal available. Rejecting them removes the only guide to what future users might actually need. The team then operates entirely in theoretical design space: architecture purity, protocol elegance, ideological alignment. Those discussions can persist indefinitely because they are not constrained by reality.

## The chain consumes the roadmap

In October 2020, Blockstack PBC renamed itself [Hiro Systems](https://forum.stacks.org/t/blockstack-pbc-to-become-hiro-systems/11291). The name honored the protagonist of [Neal Stephenson's Snow Crash](https://en.wikipedia.org/wiki/Snow_Crash). It marked an official narrowing: Hiro would build developer tools for the Stacks blockchain. A separate "Stacks" brand would represent the broader network.

That narrowing had direct consequences. I had been leading the Stacks Wallet, which increasingly served end users rather than developers. It no longer fit Hiro's scope, so I eventually led its spin-out into a joint venture managed by [Trust Machines](https://www.trustmachines.co) with the goal of building it into a sustainable, independent company.

Meanwhile, Hiro announced a generic hosted [Hiro Platform](https://www.hiro.so/blog/introducing-the-hiro-platform) product, another initiative launched without real customer development work. I did not expect the product development culture at Hiro to change. I hoped the spin-out would give me room to build differently. But the venture, which became [Leather](https://leather.io), still operated within the Stacks ecosystem, serving the Stacks market. The ecosystem's dominant culture still constrained what was possible. The same lack of real end-user demand that the broader pattern had produced followed Leather, too.

[Stacks 2.0](https://stacks.co/blog/stacks-2-0-launch-details) launched on mainnet in January 2021 with [Proof-of-Transfer](https://docs.stacks.co/stacks-101/proof-of-transfer), a consensus mechanism anchored to Bitcoin. From that point, product investment followed wherever the chain roadmap pointed. This was not about who controlled the protocol. It was about what the incentive structure rewarded. Every organization in the ecosystem, regardless of formal governance, faced the same pull toward chain infrastructure, because that was where the token price signal pointed. Every major initiative was about extending the chain stack: [Stacking](https://www.stacks.co/learn/stacking) rewards, successive Clarity language versions (from Clarity 1 at launch through [Clarity 4](https://www.stacks.co/blog/clarity-4-bitcoin-smart-contract-upgrade) in 2025), [subnets](https://github.com/hirosystems/stacks-subnets), the [Nakamoto upgrade](https://nakamoto.run), [sBTC](https://docs.stacks.co/more-guides/sbtc).

Subnets were a layer-2 scaling initiative, originally pitched as Hyperchains, that consumed years of engineering effort without real customer development work. No one had validated that developers needed these capabilities on yet another layer, effectively an L3 relative to Bitcoin. The ecosystem eventually learned, very late, that developers expected fast blocks and high throughput on Stacks itself, if only for competitive positioning. The multi-year tangent shipped mostly quietly and partially. There was no traction.

Each came with timelines that slipped. The Nakamoto upgrade, originally targeted for April 2024 around the Bitcoin halving, was delayed through late 2024. Bugs appeared during testnet activation. Community members grew frustrated. One holder [wrote](https://ambcrypto.com/nakamoto-upgrade-delay-raises-concerns-as-stx-struggles-below-2/): "Repeated delays stimulate the imagination of whether Nakamoto upgrade and sBTC was a virtually unfeasible dream."

As this happened, something else shifted. The organizational focus moved toward attracting liquidity relative to other crypto projects. Success was measured not by whether the core value thesis was advancing, but by whether [STX](https://www.stacks.co/faq/what-is-stx-token-and-what-is-it-used-for) was gaining market share, TVL, and investor attention compared to competing L1s and L2s.

This is a second feedback loop that replaces the first. Liquidity signals, market cap, trading volume, funding rounds, are immediate, numerical, and publicly visible. They update daily. Product signals are slow and ambiguous. Organizations naturally optimize toward the highest-frequency metric. Once the competitive frame becomes intra-crypto rather than real-world, the system becomes self-referential.

The cultural pattern never changed. Theoretical chain upgrades took priority over iterative improvements to the surfaces where developers and users actually lived.

## The receding horizon

Every token-funded project has a "moment of value." The upgrade that will make the chain fast enough. The feature that will bring real users. The milestone that will justify the token price. In the Stacks ecosystem, that moment kept moving.

First it was Stacks 2.0. The mainnet launch was supposed to unlock smart contracts on Bitcoin and bring a wave of applications. Then it was Stacking rewards, which would attract serious capital. Then subnets, which would scale throughput for DeFi and NFTs. Then the Nakamoto upgrade, which would bring Bitcoin finality and fast blocks. Then sBTC, which would bring programmable Bitcoin to the masses. The current horizon is [dual stacking](https://forum.stacks.org/t/dual-stacking-litepaper-launch-update/18437): Bitcoin earning Bitcoin on Stacks.

Each milestone was presented as the catalytic event. When it shipped late or shipped without the expected impact, the narrative shifted to the next one. The perceived moment of value was always 12 to 18 months away. It never arrived. It only moved.

This does something specific to the people involved. Everyone holds simultaneous financial, reputational, and identity exposure. Criticizing the project risks all three at once. The cost of discovering you are wrong is high, so people unconsciously construct protective narratives instead.

Token holders who bought in expecting near-term value face a choice: sell at a loss or hold and believe the next milestone will deliver. Many hold. Employees who joined for the product vision learn that the real roadmap is the chain, but they have equity, relationships, and sunk time. Many stay. Community members who built apps or participated in Stacking rationalize the delays because admitting the timeline was unrealistic means admitting their own investment was mispriced.

The pattern creates collective momentum through inertia rather than conviction. People stay not because the evidence supports staying, but because leaving requires confronting what staying cost them. Each new milestone resets the clock just enough to make the next 12 months feel worth waiting for.

Over time, the community splits. One group doubles down on belief, becoming increasingly vocal about the coming transformation. The other group goes quiet, then gradually disappears. Critics get reframed not as signal for thesis refinement, but as outsiders and eventually as adversaries. The culture selects for optimism and penalizes pattern recognition.

I watched this cycle repeat for seven years. The frustration does not arrive as a single event. It builds as a slow realization that the structure is designed to produce this exact outcome. The incentive structure rewards producing the next milestone more than it rewards delivering on the last one.

## The structural pattern

This is not unique to Blockstack or Stacks. It is structural to how token-funded crypto ventures work. The sequence is consistent across projects:

Early enthusiasm gives way to slow progress. Slow progress triggers narrative reinforcement. Narrative reinforcement shifts focus toward liquidity competition. Liquidity competition displaces attention from real users. Real users get dismissed in favor of imagined future adoption. And what remains is institutionalized belief, a system that no longer takes meaningful input from reality.

The mechanisms are well-documented. Sunk-cost escalation, groupthink, concentrated decision-making, cognitive dissonance. What crypto adds is a financial instrument that binds all of these together. The token makes belief liquid. It gives narrative a price. And it means that in most token-funded projects, everyone involved—the treasury, early investors, employees, community participants—shares a direct financial interest in maintaining the story.

Product iteration does not move token price. Fixing SDK bugs does not move token price. Building features that make developers productive does not move token price. What moves token price is announcing a consensus upgrade, publishing a whitepaper, or landing a headline about a regulatory first.

[Recent data](https://mementoresearch.com/state-of-2025-token-launches-year-in-review) confirms the pattern is industry-wide. In 2025, 85% of VC-backed tokens traded below their launch price (84.7% of 118 tracked TGEs; median drawdown over 70%). [Nearly 60%](https://medium.com/@lopetaku/crypto-venture-capital-3-lies-token-unlocks-37e15c658c03) fell below their private fundraising valuations within six months (Lopez, citing Messari). The raise-launch-spike-decline pattern is not failing at one company. It is failing at scale. The temporary spike only hardens the biases of those involved, making the eventual decline harder to see coming and harder to accept.

A simple diagnostic captures the problem: if the token price disappeared tomorrow, would the project still make sense? For most crypto ecosystems, the honest answer is no.

## What I took from it

I left the Stacks ecosystem last year after seven years with a clear picture of what happens when financial instrument dynamics replace product feedback loops.

Good products come from tight cycles: ship something, listen to users, iterate. Token economics break that cycle by introducing a competing optimization target. The team stops asking "what do our developers need?" and starts asking "what supports the token narrative?"

The infrastructure projects that actually worked (e.g. Linux, Git, PostgreSQL) all followed a different pattern. They were useful before ecosystems formed around them. Early users drove the architecture. Small, immediate utility created real feedback loops, which created broader adoption, which created the ecosystem. No reliance on hypothetical future users was required.

I think about this constantly while building [Neotoma](https://neotoma.io). I chose not to issue a token. I chose to ship a [developer release](/posts/neotoma-developer-release) and collect real feedback from real testers. Not because tokens are inherently bad. Some large innovations require temporary belief excess to survive long enough to deliver. But the key variable is feedback loop integrity: whether reality reliably corrects the system. When I ask myself how soon I would know if my core thesis were wrong, I want the answer to be weeks, not years.

The best products I have used were built by teams that treated early users as the most important signal, not the most important slide in the deck. That is the difference between building a product and building a narrative.
