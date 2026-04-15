If you use OpenClaw (@openclaw) for anything beyond single-session chat, you've probably already hit this sort of issue: a contact detail that disappeared after compaction, two automations that corrupted the same memory, or a task your agent recognized last Tuesday but not today.



These are not hypothetical. OpenClaw's own docs flag the concurrent-write risk. The default memory model works well for getting started. It stops working when the agent manages data you actually rely on.



Neotoma v0.4.3 plugs directly into OpenClaw. Your agent still works the same way. The difference is what happens when it saves a fact: the data gets checked before it is stored, every contact or task gets a consistent ID no matter how you or your agent refer to it, and nothing previously stored can be silently overwritten. If two agents save something about the same contact at the same time, both facts are kept instead of one clobbering the other.



I use Neotoma to manage my life on the go through OpenClaw with the same ground truth I use at my desktop through Cursor and other CLI agents. Correspondence, tasks, contacts, finance, content and much more: all with the same memory.



This is a developer release, not a promise that everything works. I want to find out where this is actually worth it, and I need your feedback to do that.



Ask your OpenClaw agent to read neotoma.io/evaluate and tell you whether it fits your workflow. If it does, the agent will install and activate it for you.



https://markmhendrickson.com/posts/neotoma-openclaw-plugin
