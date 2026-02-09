This weekend I pulled together an MCP server for a Bitcoin wallet: tools that AI agents can call over the Model Context Protocol. The [repo](https://github.com/markmhendrickson/mcp-server-bitcoin) exposes 93 tools across Layer 1 and Layer 2. One mnemonic drives both.

I was previously general manager of [Leather](https://leather.io), a crypto wallet that also supports Bitcoin and Stacks. At Leather I saw that human-facing self-custody wallets mostly reached people willing to absorb the attention and complexity (e.g. degens and developers). That meant key hygiene, fee awareness, confirmation flows, and the rest. The cognitive load kept the real addressable market narrow.

Agentic wallets change that. When the primary interface is agents that reason and execute within policy, the user approves only what matters. The friction drops and the set of people who can practically hold their own keys grows.

Same two chains. Different surface.

## What the server exposes (L1 and L2 in one surface)

The server is a single MCP process. Clients send tool names and JSON arguments over stdio and get back structured results. Destructive actions (sends, sign-and-broadcast, deploy) support `dry_run` and do not broadcast by default. The server never returns keys or mnemonics.

### Layer 1 (Bitcoin)

**Core Bitcoin:**

- Address derivation for P2PKH, P2SH-P2WPKH, P2WPKH, and P2TR with public keys and paths.
- Accounts with balances per address type ([mempool.space](https://mempool.space) for UTXO data); wallet balance and BTC prices (USD, EUR).
- Single and multi-recipient sends (amount in BTC or EUR); preview transfer with fee estimate before sending.
- Sweep (send max) and UTXO consolidation.
- PSBT sign, decode, and batch sign; message sign and verify (ECDSA legacy and BIP-322).
- Fee tiers from mempool.space and fee estimation by input/output count and address type.
- UTXO listing with filters (address type, min value, confirmed only) and per-UTXO details.

**Ordinals and inscriptions:**

- List inscriptions with pagination; inscription details (genesis, content type, sat ordinal, rarity, location).
- Send inscriptions (full UTXO or split so only the inscription's sat range goes to the recipient).
- Extract ordinals from mixed UTXOs; recover BTC from the ordinals address (sweep non-inscription UTXOs); recover ordinals that landed on the payment address back to the taproot address.
- Create single or batch inscriptions with commit/reveal fee estimates.

**Transaction and wallet management:**

- Transaction history for BTC and Stacks; status for a single tx.
- Speed up pending BTC via RBF; cancel pending BTC (RBF send-to-self).
- Network config and API endpoints; switch mainnet/testnet; add custom network.
- List all supported tool names and descriptions.

**Ledger (Bitcoin app):**

- Get BTC addresses from a connected [Ledger](https://www.ledger.com) device.
- Sign PSBT with the Ledger Bitcoin app.

### Layer 2 (Stacks)

The same mnemonic derives Stacks keys (path `m/44'/5757'/0'/0/0`). [Hiro](https://hiro.so) Stacks API for chain data and broadcasting.

**Stacks:**

- Addresses and public keys; accounts with STX balance, locked amounts, nonces.
- Balance including fungible and non-fungible tokens.
- STX transfer (micro-STX) with optional memo; preview transfer with fee and balance check.
- SIP-10 fungible and SIP-9 NFT transfers via contract calls.
- Clarity: call public function, deploy contract, read-only call.
- Sign serialized Stacks tx (SIP-30), sign message, sign SIP-018 structured data; nonce and fee estimation.
- On-chain profile update ([schema.org/Person](https://schema.org/Person)) for BNS names.
- Transaction queries with filters (type, block range, unanchored) and by contract.
- Mempool: list pending transactions, mempool stats, dropped transactions.
- Block explorer: recent blocks, block by height or hash, Stacks blocks for a given Bitcoin block.
- Contract events: events for a contract, or asset events for an address.
- Token metadata: SIP-10 and SIP-9 metadata and holders.
- Network info and health/status.

**Swaps, DeFi, and bridge:**

- Supported pairs and protocols ([ALEX](https://alexlab.co/), [Bitflow](https://www.bitflow.finance), [Velar](https://www.velar.co)).
- Swap quote (estimated output, rate, fees) for all three; execute swap via ALEX DEX. Bitflow and Velar support quotes and pair discovery; you could add execution via protocol SDKs (e.g. Velar SDK returns contract-call params).
- Swap history from on-chain activity.
- sBTC balance and bridge deposit/withdraw info.
- Stacking: current PoX status, cycle info (blocks remaining, percent complete, estimated time remaining, participation rate), initiate solo stacking, revoke delegation.

**BNS and market data:**

- [BNS](https://docs.stacks.co/docs/stacks-blockchain/bns) lookup (name to address), names owned by address, register BNS name.
- Multi-asset prices (e.g. [CoinGecko](https://www.coingecko.com)); price history for charting.
- Portfolio summary (BTC + STX in USD); all assets and collectibles (inscriptions, Stacks NFTs).

**Ledger (Stacks app):**

- Get Stacks addresses from Ledger.
- Sign Stacks transaction with Ledger Stacks app.

## Safety and design

⚠️ This MCP server is experimental and not safe for meaningful funds. Use only with wallets you are prepared to lose. No one has battle-tested or audited the code. I treat it as a research artifact to explore agent-native wallet surfaces.

Destructive operations default to `dry_run: true`. Preview and estimate tools exist for every send path. Keys stay out of version control and out of tool responses. The run script loads `.env` from repo root.

**Wallet key variables (keep secret, never commit):**

- **`BTC_PRIVATE_KEY`** — WIF-encoded Bitcoin private key; if set, takes precedence over mnemonic.
- **`BTC_MNEMONIC`** — BIP-39 seed phrase; the server uses it to derive Bitcoin and Stacks keys (same mnemonic, path `m/44'/5757'/0'/0/0` for Stacks).
- **`BTC_MNEMONIC_PASSPHRASE`** — Optional BIP-39 passphrase to use with `BTC_MNEMONIC`.

**Safety and limits (env or .env):**

- **`BTC_NETWORK`** — `mainnet` or `testnet` (default `testnet`).
- **`BTC_MAINNET_ENABLED`** — Set this to allow mainnet sends (safety flag).
- **`BTC_DRY_RUN`** — When set (default), destructive ops (sends, sign-and-broadcast, deploy) do not broadcast; set it to `false` to allow real transactions.
- **`BTC_MAX_SEND_BTC`** — Optional cap on send amount in BTC; the server rejects requests above this.
- **`BTC_MAX_FEE_SATS`** — Optional cap on fee in satoshis per transaction.
- **`STX_ACCOUNT_INDEX`** — Stacks derivation account index (default `0`).
- Config otherwise drives the fee tier (fixed rate or mempool.space tier: hour, half-hour, fastest).

## How it fits my agent stack

I run agents on a three-layer architecture. The layers are cleanly separated so that memory, reasoning, and action stay in the right place.

**Truth layer:** This is the memory substrate. It holds typed, structured data: holdings, flows, transactions, contacts, tasks, and the rest. In my setup the canonical store is [Neotoma](/posts/truth-layer-agent-memory). It uses event sourcing and reducers, with full provenance and entity resolution. Agents read from it. They never write truth directly. All updates flow through domain events produced by the execution layer.

**Strategy layer:** This is where goals, constraints, and tactics live. Strategy documents, tactical playbooks, and operations manuals sit here. Agents use this layer to reason: they read world state, evaluate priorities and risk, and produce decisions and commands. Strategy is pure cognition. No side effects. State in, decisions out.

**Execution layer:** This is where external actions happen. It takes commands from the strategy layer and performs side effects through adapters: email, calendar, DNS, and in this case the Bitcoin and Stacks wallet MCP. The wallet server is one execution adapter among many. It never mutates the truth layer. It does the thing (send, sign, swap) and the rest of the stack records what happened via domain events. Commands in, events out.

I define and maintain the strategy. Agents read from the truth layer and call MCP tools to execute. I do not use point-and-click crypto UIs for routine operations. I only step in to approve actions that exceed my pre-set limits.

Short-term my use cases are one-off: paying for services, rebalancing portfolios through manual prompting. Longer-term I want those flows automated. Agents would monitor, reason, and execute within policy. I would see explanations and approve when needed.

## How I'm approaching the build

I'm dogfooding the server in my own workflows first. I'm testing each surface (sends, PSBTs, Ordinals, Stacks transfers, swaps) gradually with small amounts and dry runs.

I've wired it into the same stack where I already use [truth and strategy layers](/posts/agentic-search-and-the-truth-layer#where-ive-hit-limits). Agents can combine wallet actions with calendar, email, and data. External users aren't in scope yet.

My goal is to validate the shape of an agentic wallet surface and to make my own Bitcoin and Stacks operations agent-driven instead of manual.

To run it: clone [mcp-server-bitcoin](https://github.com/markmhendrickson/mcp-server-bitcoin) (or add as submodule at `mcp/btc_wallet/`), add the server to your MCP config (use the `run_btc_wallet_mcp.sh` script path), and use a test wallet with dry run on.
