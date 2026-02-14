Coinbase just launched something big: Agentic Wallets on their developer platform.

Here's how they line up with my primary wallet effort these days: an agentic Bitcoin wallet with self-custody and self-hosting.

https://www.coinbase.com/en-gb/developer-platform/discover/launches/agentic-wallets

What they have in common: Both give AI agents a single execution surface to hold and spend. It is the same agent-callable wallet idea on different chains and assets. Capabilities reach the agent either as Coinbase Agent Skills (send, trade, pay-for-service) or as MCP tools (93 in my case); same idea, different packaging. The payment pattern is the same: request, pay, get resource. x402 does it on Base and Solana; a self-custody MCP can do it with BTC or STX. The variables are settlement asset and who holds keys.

Guardrails match in spirit. In both setups the agent runs within policy and the human approves when it matters. Coinbase enforces KYT screening plus session and transaction limits before execution. With the self-custody MCP you get dry runs by default, optional caps, mainnet gated by config, and every destructive action previewable before it runs. Same principle: check before execution. The difference is who holds control.

Where they differ: Chains and custody. Coinbase is Base, stablecoins, gasless trading. Keys live in their infrastructure; you auth with email OTP and the agent never touches keys. My Bitcoin MCP is for Bitcoin L1 (PSBTs, Ordinals, Ledger) and Stacks L2 (Clarity, sBTC, stacking, swaps). You use one mnemonic or WIF on your machine; keys never leave the process or tool responses. You hold the keys; the agent executes within policy.

Hosting is the other split. Coinbase is hosted: turnkey UX, no ops, you trade control for convenience. The MCP is self-hosted: you run the server, hold the keys, own the stack. Most people will never self-host, so MCPs will need hosted options for adoption too. Optionality to self-host still matters for sovereignty. When a design lets you self-host, you can exit later. Hosted-only means locked in and exiting is difficult.

Coinbase will pursue custodial agentic wallets; that is their focus and it moves the whole industry forward. We need robust experimentation with self-custody agentic wallets as well, especially in the Bitcoin ecosystem, or we'll centralize by default. Agentic wallets can cut the complexity of self-custody and Bitcoin for non-technical users and unlock mainstream usage. I'm dogfooding the MCP for my own flows. See my repo and post for more:

https://github.com/markmhendrickson/mcp-server-bitcoin
https://markmhendrickson.com/posts/agentic-wallets-mcp-bitcoin
