# Tweet thread: Coinbase Agentic Wallets vs btc_wallet MCP

Introduces [Coinbase's Agentic Wallet](https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets) launch, then compares and contrasts with the [Bitcoin + Stacks wallet MCP](https://markmhendrickson.com/posts/agentic-wallets-mcp-bitcoin) on chains, custody, security, and payments protocol.

Style: Foundation writing style guide (no em/en dashes; active voice; direct statements; colons for lists; ~280 chars per tweet).
---

**Tweet 1 (intro)**
Coinbase just launched Agentic Wallets on their developer platform.

Wallets let AI agents hold and spend stablecoins on Base, with email OTP and configurable limits.

This is a good moment to compare that model to the alternative I care about most: agentic wallets with self-custody and self-hosting. I'll unpack that in the thread below. 🧵

https://x.com/CoinbaseDev/status/2021647661871640726?s=20

---

**Tweet 2 (chains)**
I'll start with chain scope.

Coinbase Agentic Wallet is for Base, stablecoins, and gasless token trading.

My Bitcoin MCP experiment is for Bitcoin L1 (PSBTs, Ordinals, Ledger) plus Stacks L2 (Clarity, sBTC, stacking, swaps).

It is the same agent-callable wallet idea on different chains and assets. Both give agents a single execution surface.

https://markmhendrickson.com/posts/agentic-wallets-mcp-bitcoin

---

**Tweet 3 (custody)**
Custody is the big split.

With Coinbase, keys live in their infrastructure. You auth with email OTP, and the agent never touches keys. You get clean UX if you trust Coinbase with your assets.

With the Bitcoin MCP, you use one mnemonic or WIF on your machine. Keys never leave the process and are never returned in tool responses. You hold the keys; the agent executes within policy.

---

**Tweet 4 (security guarantees)**
Security guarantees differ.

In the custody model, Coinbase gives you "Know Your Transaction" (KYT) screening and session and transaction limits, and enforces them before any transaction executes.

With the self-custody MCP you get dry_run by default, optional caps (max send, max fee), mainnet gated by env, and every destructive action can be previewed before it runs.

Same guardrails idea: check before execution. In one case they hold it; in the other you hold it with limits in code.

Quote tweet URL: https://docs.cdp.coinbase.com/agentic-wallet/welcome (Security section)

---

**Tweet 5 (policy and approval)**
In both cases the goal is that the agent executes within policy and the human approves when it matters. Coinbase does it with their infra and limits.

With the MCP I set strategy and limits in env. The agent reads from my truth layer and calls tools.

I step in only when an action would exceed what I have allowed. Same principle; the difference is who holds control.

---

**Tweet 6 (self-hosting subtweet)**
Hosted wallet infra (e.g. Coinbase) gives you turnkey UX and no ops. You trade control for convenience.

Self-hosting a wallet server (e.g. the MCP) means you run it, you hold the keys, and you own the stack.

Most people will never self-host, which is why MCPs will also need hosted options for widespread adoption. Optionality to self-host is still critical for sovereignty. When a design lets you self-host, you can choose that path later if you need to exit a bad hosted relationship. When it is hosted-only, you are locked in and exiting is difficult.

---

**Tweet 7 (skills / capabilities surface)**
How the agent gets wallet capabilities:

Coinbase uses what they call Agent Skills (you install a skill pack; the agent gets send, trade, pay-for-service). Turnkey and vendor-curated, but tied to their stack.

The Bitcoin MCP exposes 93 tools via MCP; same idea, different packaging. MCP tools are granular and composable, and you run the server yourself. More to wire up, no single bundle.

Quote tweet URL: https://docs.cdp.coinbase.com/agentic-wallet/skills/overview

---

**Tweet 8 (payments protocol)**
Coinbase Agentic Wallet ties into a standard called x402: HTTP 402, pay with stablecoins, machine-to-machine. x402 today supports Base and Solana only; it does not support Bitcoin or Stacks.

That pattern (request, 402, pay, get resource) is the right shape for agents paying for APIs. A self-custody MCP could implement the same pattern with BTC or STX. The agent gets 402, calls an MCP tool to sign and send the payment, then retries with proof.

Same protocol idea; the variables are settlement asset and who holds keys.

Quote tweet URL: https://docs.cdp.coinbase.com/x402/welcome

---

**Tweet 9 (takeaway)**
Coinbase will pursue custodial agentic wallets. That is their focus and it moves the whole industry forward.

However, we need robust experimentation with self-custody agentic wallets too, especially in the Bitcoin ecosystem, or we centralize by default.

Agentic wallets have deep potential to reduce the complexity of self-custody and Bitcoin for non-technical, non-degen users, unlocking mainstream usage. I go into this in more detail in my post:

Quote tweet URL: https://markmhendrickson.com/posts/agentic-wallets-mcp-bitcoin

**Tweet 10 (wrap + CTA)**
There are two paths: custody (Base, x402) and self-custody (Bitcoin, Stacks, policy in env, dry_run by default). I'm dogfooding the MCP for my own flows. If you want to explore the self-custody plus Bitcoin and L2 path, the repo and post are here.
https://github.com/markmhendrickson/mcp-server-bitcoin
https://markmhendrickson.com/posts/agentic-wallets-mcp-bitcoin

Quote tweet URL: (links in tweet body; or quote-tweet the post URL above to thread the CTA)
