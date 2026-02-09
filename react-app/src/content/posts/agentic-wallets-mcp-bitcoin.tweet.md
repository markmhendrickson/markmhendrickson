This weekend I pulled together an MCP server (i.e. tools for AI agents) for a Bitcoin wallet. It supports extensive L1 functionality: PSBTs, UTXOs, Ordinals, Ledger. It also supports L2 with Stacks: sBTC bridging, Clarity, Stacking, swaps.

https://github.com/markmhendrickson/mcp-server-bitcoin

This is an experiment in the future of crypto wallets, which I believe is agentic. I'll be gradually testing, improving and integrating it into my own workflows for Bitcoin-based transactions and investments.

Short-term these are one-off needs (e.g. paying for services, rebalancing portfolios through manual prompting) but longer-term I envision them as automated entirely by agents.

Those agents operate from a three-layer stack: truth (holdings, flows, transactions in Neotoma), strategy (goals and tactics in Ateles), and execution (this MCP server and others).

I define and maintain the strategy, then agents execute against it: truth layer for data, MCP tools for external actions. I never have to point-and-click with crypto UI again. I just approve actions that go over my pre-set limits.
