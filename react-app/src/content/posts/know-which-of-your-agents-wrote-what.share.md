## Tweet

Your agent fleet can build trustworthy state with their own keys: signed identity, trust tiers, and grant-scoped capabilities on every Neotoma write. I'm running it across three service agents today.

https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what

## LinkedIn

If you run one agent against one store, attribution is trivial. The moment you run two, three, five agents against the same instance, every row is suspect until you know who wrote it and what they were allowed to do.

Neotoma closes that gap with AAuth: your agent fleet can build trustworthy state with their own keys. Every observation, relationship, source, and interpretation carries a signed agent identity resolved against a five-tier trust ladder and a grant-scoped capability set. Capabilities live in first-class entities you can suspend, revoke, and restore without restarting the server.

The signed-identity foundation is AAuth (https://www.aauth.dev/), the agent-identity protocol from Dick Hardt. Dick is a friend and one of the deepest identity experts I know. He edited OAuth 2.0 (RFC 6749), co-authored OpenID Authentication 2.0, and helped found the OpenID Foundation—the same lineage as most authorization and federated login stacks. When he starts a new protocol specifically for agents, that is the one to build against.

Three service agents in my stack already run this way. My Cursor MCP proxy signs every request with an AAuth key resolved against an agent_grant. The Neotoma feedback pipeline uses AAuth-signed writes through a Cloudflare Access tunnel, scoped to feedback operations. My Darkmesh fork writes warm-intro reveals back to Neotoma with RFC 9421 signatures, and in the joint tests an unauthorized peer-node agent was rejected while the authorized node's writes went through.

For anyone shipping agentic functionality into regulated markets, the question from customers is rarely "did your system remember this." It is "who wrote it, and can you prove they were authorized." Neotoma makes that a read against first-class data.

https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what
