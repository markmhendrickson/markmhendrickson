
const timeline = [
  {
    role: "Founder",
    company: "Startup (Neotoma & Ateles)",
    date: "2025 – Present · Barcelona, Spain",
    description: [
      "Building Neotoma, a truth layer for AI memory, and Ateles, a sovereign agentic operating system for personal workflow automation.",
      "Focused on schema-first design, event-sourced memory, and deterministic workflows that restore sovereignty and autonomy to individuals."
    ]
  },
  {
    role: "General Manager",
    company: "Trust Machines (Leather)",
    date: "2022 – 2025 · Barcelona, Spain",
    description: ["Led Leather, a Bitcoin wallet and subsidiary of Trust Machines focused on driving the global transition to a digital economy built on Bitcoin."]
  },
  {
    role: "Product Lead",
    company: "Hiro Systems PBC (originally Blockstack)",
    date: "2018 – 2022 · Barcelona, Spain",
    description: ["Led user experience for products that protect individuals' freedom online by securing digital ownership and privacy using the Stacks blockchain."]
  },
  {
    role: "Product Manager, Designer and Developer",
    company: "Freelance",
    date: "2015 – 2018 · Barcelona, Spain",
    description: ["Worked with early-stage startups including Digit (acquired by Oportun), First Opinion (acquired by Curai), and STYLEBEE on product-market fit and measurable growth."]
  },
  {
    role: "Head of Product and Co-Founder",
    company: "KITE Solutions Inc.",
    date: "2012 – 2015 · New York City & Barcelona",
    description: ["Led product design and development for a web and mobile marketplace connecting brands and agencies with emerging technologies."]
  },
  {
    role: "Product Lead",
    company: "Lift",
    date: "2012 · San Francisco, California",
    description: ["Led product design for Lift, an iPhone app with web companion for tracking and improving daily habits."]
  },
  {
    role: "CEO and Co-Founder",
    company: "Plancast",
    date: "2009 – 2011 · San Francisco, California",
    description: [
      "Co-founded and ran Plancast, a social event discovery service.",
      "Led product development, programmed the application, and designed the frontend; acquired by Active Network in 2012."
    ]
  },
  {
    role: "Project Manager, Designer and Writer",
    company: "TechCrunch",
    date: "2007 – 2009 · Atherton, California",
    description: ["Led efforts to redesign Crunchbase and the TechCrunch blog network while writing over 500 articles about new web technologies. TechCrunch acquired by AOL in 2010; Crunchbase spun out from AOL as an independent company in 2015."]
  },
  {
    role: "Network Engineer",
    company: "Bowdoin College",
    date: "2003 – 2007 · Brunswick, Maine",
    description: ["Upgraded and maintained a campus-wide network for student body and faculty."]
  },
  {
    role: "Web Designer & Developer",
    company: "Freelance",
    date: "1997 – 2007 · Menlo Park, California and Brunswick, Maine",
    description: ["Designed and developed web projects for small businesses, non-profits, student organizations, and Bowdoin College."]
  },
  {
    role: "BA, Government & Economics",
    company: "Bowdoin College",
    date: "2003 – 2007 · Brunswick, Maine",
    description: [
      "Double major with coursework in classical and modern political theory, constitutional and international law, and economics.",
      "Awarded summa cum laude for honors thesis examining Nietzsche's theory of morality across Human, All Too Human, Daybreak, and On the Genealogy of Morals, and its relationship to Schopenhauer and Rée."
    ]
  },
  {
    role: "High School",
    company: "Menlo School",
    date: "1999 – 2003 · Atherton, California",
    description: []
  }
]

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="pt-20 pb-[100px]" style={{ backgroundColor: 'rgba(252, 252, 252, 1)', boxShadow: '0px 2px 50px 0px rgba(0, 0, 0, 0.1)' }}>
        <div className="flex justify-center px-8">
          <div className="max-w-[600px] w-full">
            <h1 className="text-[28px] font-medium mb-2 tracking-tight">Mark Hendrickson</h1>
            <div className="text-[17px] text-[#666] mb-12 font-normal tracking-wide">
              Building sovereign systems at the intersection of crypto and AI
            </div>

            <div className="text-[15px] leading-[1.75] font-light">
              <p className="mb-6">I build systems that restore sovereignty, clarity, and long-range capability to individuals in a world defined by complexity, centralized control, and cognitive overload.</p>

              <p className="mb-6">My technology transforms chaos into structure, volatility into signal, and information abundance into actionable leverage, empowering people to operate with more agency, creativity, and strategic independence.</p>

              <p className="mb-6">My work centers on designing personal infrastructure that is open, privacy-preserving, and fundamentally user-owned. Through data ingestion, contextual modeling, and automation, I eliminate friction and restore the time, mental bandwidth, and autonomy lost to modern digital and institutional systems. This gives people the structural foundation to think more deeply, act more decisively, and build more freely.</p>

              <p>I take an antifragile approach: systems grow stronger through disruption, not weaker. The tools I build help people thrive under uncertainty, adapt intelligently to changing conditions, and make decisions from clarity rather than reactivity.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center py-20 px-8">
        <div className="max-w-[600px] w-full">
          <div className="mt-12 mb-12">
            {timeline.map((item, index) => (
              <div key={index} className="mb-16 relative pl-6 last:mb-0">
                <div className="absolute left-0 top-[0.7em] w-1.5 h-1.5 rounded-full bg-black transform -translate-y-1/2"></div>
                {index < timeline.length - 1 && (
                  <div className="absolute left-[2.5px] top-4 w-px bg-[#ddd]" style={{ height: 'calc(100% + 1rem)' }}></div>
                )}
                <div className="text-[15px] font-medium mb-1">{item.role}</div>
                <div className="text-[15px] text-[#666] mb-1">{item.company}</div>
                <div className="text-[13px] text-[#999] mb-2">{item.date}</div>
                {item.description.length > 0 && (
                  <div className="text-[13px] text-[#666] leading-relaxed">
                    {item.description.map((desc, i) => (
                      <p key={i} className={i < item.description.length - 1 ? 'mb-3' : ''}>{desc}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
