## Tweet

From "it works on my machine" to 11 npm releases in 5 weeks.

The CLI now works on a fresh install on someone else's machine. The MCP server is safe for daily agent use. The database can merge, recover, and survive operator mistakes.

What I underestimated: how many rough edges were specific to my own setup. Path resolution, environment detection, stdio safety, pagination. None were problems for me. All were problems for someone installing via npm for the first time.

https://markmhendrickson.com/posts/eleven-releases-in-five-weeks

## LinkedIn

I shipped 11 Neotoma releases in the first five weeks after the developer release. The arc: from "it works on my machine" to working on someone else's.

The biggest categories:

CLI reliability. The developer release CLI worked from a source checkout on my machine. That was the only context I'd tested. Path resolution, environment detection, config handling, and the init flow all needed to work from a fresh npm install in an arbitrary directory. By v0.3.10, the CLI could detect its own install context and adjust without the user telling it anything.

MCP stability. The MCP server is what agents call hundreds of times a day. Silent failures there corrupt workflows without warning. The first fix was trivial but important: schema registry logs were going to stdout, which corrupted the stdio protocol agents use. Moving them to stderr fixed a class of failures that were hard to diagnose.

Data integrity. Pagination was counting deleted entities, producing inconsistent page sizes. Database merge shipped as a real tool after I lost and recovered 6,000 memories. And the old LLM extraction path was removed entirely. Neotoma is a truth layer, not an inference layer. No LLM sits in the critical path for storage or retrieval.

The next phase is different. At least ten evaluators from my customer research process are building their own agent memory with markdown, SQLite, JSON heartbeats, and flat-file CRMs. Several named the exact triggers for when their approach would break. Those triggers are my roadmap.

https://markmhendrickson.com/posts/eleven-releases-in-five-weeks
