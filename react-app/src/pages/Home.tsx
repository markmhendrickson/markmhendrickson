export default function Home() {
  return (
    <div className="min-h-content">
      <div className="pt-8 pb-4 px-4 md:pt-20 md:pb-[100px] md:px-8">
        <div className="flex justify-start">
          <div className="max-w-[1200px] w-full">
            <img
              src="/profile.jpg"
              alt="Mark Hendrickson"
              className="float-right ml-12 mb-12 w-[400px] h-[400px] rounded-none object-cover"
            />
            <h1 className="text-[28px] font-medium mb-2 tracking-tight">Mark Hendrickson</h1>
            <div className="text-[17px] text-[#666] mb-12 font-normal tracking-wide">
              Building structured memory for the agentic era
            </div>

            <div className="text-[15px] leading-[1.75] font-light">
              <p className="mb-6">I'm building <a href="https://neotoma.io" className="underline hover:text-black transition-colors">Neotoma</a>, a structured memory layer for AI agents. The core problem: agents are increasingly stateful&mdash;handling tasks, contacts, transactions, and commitments over time&mdash;but their memory is built for retrieval, not truth. It drifts between sessions, overwrites without history, and can't be traced or replayed. Neotoma treats personal data the way production systems treat state: typed entities, stable IDs, full provenance, deterministic queries. Local-first, cross-platform via MCP, and entirely user-controlled.</p>

              <p className="mb-6">The principle underneath is the same one that's driven all of my work: people should control their own data, memory, and digital infrastructure&mdash;not rent it from platforms that optimize for engagement over truth.</p>

              <p className="mb-6">I work as a solo founder in Barcelona, operating with AI agents as a team rather than as tools. Every workflow&mdash;email, finance, content, product&mdash;runs through a shared repo and a shared source of truth. The agents follow the same playbook I do. That only works because the state layer is explicit and inspectable, which is exactly the contract Neotoma is designed to provide.</p>

              <p>Before this chapter, I spent nearly two decades building products across consumer web, crypto, and startups: writing and shipping at TechCrunch, co-founding Plancast (acquired by Active Network), co-founding KITE Solutions, advising and building with early-stage startups, leading user experience at Hiro for the Stacks blockchain, and running Leather at Trust Machines. You can see the full arc on my <a href="/timeline" className="underline hover:text-black transition-colors">timeline</a>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
