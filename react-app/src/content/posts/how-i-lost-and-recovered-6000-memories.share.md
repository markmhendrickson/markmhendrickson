## Tweet

I accidentally wiped my own production Neotoma database. 6,174 observations down to 84 in one command.

Got nearly all of it back because observations are immutable and entity state is derived. Merge -> recompute -> done.

https://markmhendrickson.com/posts/how-i-lost-and-recovered-6000-memories

## LinkedIn

Last week I ran a database reset against production instead of dev. My working Neotoma instance went from 6,174 observations to 84. Months of contacts, conversations, tasks, transactions, and agent sessions: gone.

I recovered nearly everything in about an hour. The final database came back with more observations than the original because the merge combined data from sources that each covered slightly different windows.

The recovery was possible because of how Neotoma stores data. Every fact enters as an immutable observation. Entity state is never overwritten; it's recomputed from the full observation log. So a backup isn't a snapshot of "current state." It's a copy of every fact the system has ever seen.

That meant recovery was mechanical: merge the observation logs from two backup files into the live database, recompute entity snapshots, verify counts. No judgment calls about which version of a record is correct. The observations are the ground truth. Everything else derives from them.

Three things I took away from this:

1. Informal backups (manual cp commands when I remembered) saved me, but they aren't a system. I'm setting up automated snapshots now.
2. The env flag mistake is a classic. I added a forced confirmation prompt to the reset command for production environments.
3. Event-sourced architecture pays off most when things go wrong. If your data layer overwrites in place, a wipe is permanent. If it's append-only with derived state, a wipe is a merge away from full recovery.

Your data should survive your worst mistakes.

https://markmhendrickson.com/posts/how-i-lost-and-recovered-6000-memories
