I have a bet with an industry friend: by February 2028, will the **majority** of crypto transactions be **transmitted by AI agents**, i.e. initiated via agentic interfaces (chat, policy, or agent API) rather than by humans tapping buttons in traditional wallet UIs? I'm on the yes side. He's on the no. Stakes: one beer, to be collected in Spain.

This post lays out the bet, the adoption curve I use to think it through, and what has to be true for it to resolve cleanly.

## The bet, precisely

- **Resolution date:** February 2028 (two years from when we shook on it).
- **Criterion:** More than half of crypto transactions (by an agreed metric, e.g. count on specified chains) are **transmitted by AI agents**. A transaction counts as agent-transmitted if it was constructed and submitted by an AI/agent from user intent; the user may approve, but the agent generated the tx. Human-initiated means the user operated a traditional UI (connect, sign, confirm) and the agent was at most a copilot.
- **Who's who:** I bet that agents will clear the majority. He bets they won't.

The bet is **not** about which company wins (MetaMask vs new entrants). It's about **how** transactions are initiated: agent-originated vs human-originated.

## Why the definition matters

"Transmitted by AI agents" can be drawn narrowly or broadly. **Narrow:** only transactions where the user explicitly used a chat/agent UI (e.g. "send 0.01 BTC to …") and the agent built and sent the tx. **Broad:** include existing automated flows (bots, scripts, MEV, arbitrage) where the logic is effectively agent-like. The broader the definition, the higher the share today and the easier it is to reach a majority by 2028. For the bet to be fair we had to agree that we're talking about the same thing; we're still sharpening that.

We also need to fix: which chains, count vs volume, and the data source (e.g. Dune, or vendor/ecosystem stats) for estimating agent vs non-agent share.

## Where this sits in the crypto+AI landscape

Vitalik Buterin's 2024 post on crypto+AI intersections ("[The promise and challenges of crypto + AI applications](https://vitalik.eth.limo/general/2024/01/30/crypto_ai.html)") splits the space into four categories: **AI as a player** in on-chain games (e.g. arbitrage, MEV, prediction-market AIs), **AI as an interface** to the game (agents helping users reason and execute, with the user approving), **AI as the rules** of the game (protocols or DAOs calling into AIs for subjective decisions), and **AI as the objective** of the game (mechanisms designed to build or govern AIs). This bet is about the second category. Agentic wallets (like [the Bitcoin/Stacks MCP I built](/posts/agentic-wallets-mcp-bitcoin)) are "AI as interface": the agent is the primary way the user interacts with the chain; the user approves, the agent constructs and submits. We're not betting on "AI as player" (that's already a large share of volume) unless we define "agent-transmitted" broadly. Locking the definition is what determines whether we're measuring interface adoption only or interface plus existing player volume.

Vitalik's main caveat for "AI as interface" is adversarial machine learning: if the assistant is open or widely used, attackers can optimize scams and flows that bypass its safeguards. My bet doesn't assume that risk away. If we hit a majority by 2028, that same adoption makes the caveat more salient. The upside is friction drop and a larger addressable market for self-custody; the downside is that success and attack surface scale together. I'm betting the upside wins on the timeline we set.

## Adoption curve

I ran a long-form analysis in a chat (agentic interfaces across verticals, then crypto specifically) and got a curve that argued crypto will go agentic faster than other industries because it's already API-native, automation-friendly, and a lot of volume is already machine-driven. The main bottleneck it stressed is trust and deterministic state; without that, adoption plateaus at power users. I shade the numbers down from that run and stand behind the following as my central case.

**Share of crypto interactions via agentic interfaces:**

| Timeframe   | % via agentic | % via human-centric | Dominant UX model                          |
|------------|----------------|---------------------|--------------------------------------------|
| 2026-2027  | 15-30%         | 70-85%              | Agents as power-user layer; copilots in wallets |
| 2028-2029  | 35-55%         | 45-65%              | Agent-orchestrated flows; majority is a close call |
| 2030-2032  | 55-75%         | 25-45%              | Agent-first in many core flows             |
| 2033+      | 70-90%         | 10-30%              | Intent-based; UI for inspection only      |

**Probability agents dominate core crypto tasks, by year:**

| Year | Probability | Note                          |
|------|-------------|-------------------------------|
| 2027 | ~25-30%     | Copilots and power users      |
| 2028 | ~40-50%     | Bet date; 50% is in range     |
| 2030 | ~55-70%     | Majority likely in many flows |
| 2035 | ~75-85%     | Agent-first as default       |
| 2040 | ~85%+       | Residual human-centric niches |

So by my numbers, February 2028 is right on the cusp: 40-50% is plausible, and a majority is possible but not the base case. I'm betting that we land in the upper part of that band, or that the agreed definition and measurement push the measured share over 50%.

## What has to go right for me to win

- **Adoption ramp:** Agent layers in major wallets and/or new agent-native products need to reach a large share of users and volume within two years. The analysis had Phase 1 (2025-2027) as "copilots inside wallets"; I need that to tip into "agent-orchestrated" and "agent-transmitted" for a majority of txns by early 2028.
- **Definition and data:** If we count a broad set of automated/agent-like flows (not only explicit chat UIs), the share attributed to "agents" goes up. We have to lock in a definition we can actually measure.
- **Trust and state:** The same analysis said deterministic state and auditability are the real enablers. If policy wallets, replay, and audit trails mature quickly, the curve can land in the upper part of my ranges. If they lag, the curve could slip a year or two.

## What has to go right for him to win

- **Slower adoption:** Majority of txns stay human-initiated (traditional UI, buttons, manual sign). Copilots and power-user agents grow, but don't cross 50% by the cutoff.
- **Trust or regulatory shocks:** A high-profile agent-wallet failure or regulatory clampdown could flatten the curve; the tables above don't build in that downside.
- **Adversarial and interface risk:** If agent interfaces get exploited at scale (e.g. optimized scams that bypass agent safeguards), trust in "AI as interface" could stall or reverse before we hit the cutoff.
- **Strict definition:** If "transmitted by AI agents" is defined narrowly (e.g. only explicit chat/agent UI, excluding existing bots/scripts), the measured share stays lower and 50% is harder to reach.

## Why I'm taking the yes side

Crypto is already machine-heavy at the protocol layer. The gap is at the interface: most retail and many power-user flows still go through human-centric UIs. I think that gap closes faster than in other industries because the stack is programmable, the users are automation-friendly, and the economic incentive to reduce friction is large. I also think "agent-transmitted" will be defined in a way that includes a meaningful share of automated and policy-driven flows, not only chat. So I'm comfortable betting on the upper part of the 2028 band, and on one beer in Spain either way.

We're still nailing down the exact metric, chains, and data source so the bet resolves cleanly. I'll update when we have that locked in.
