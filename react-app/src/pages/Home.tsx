export default function Home() {
  return (
    <div className="min-h-content">
      <div className="pt-20 pb-[100px]">
        <div className="flex justify-start px-8">
          <div className="max-w-[1200px] w-full">
            <img
              src="/profile.jpg"
              alt="Mark Hendrickson"
              className="float-right ml-12 mb-12 w-[400px] h-[400px] rounded-none object-cover"
            />
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
    </div>
  )
}
