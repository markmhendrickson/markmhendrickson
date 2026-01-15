import timelineData from '@/data/timeline.json'

const timeline = timelineData

export default function Timeline() {
  return (
    <div className="flex justify-center items-center min-h-screen py-20 px-8">
      <div className="max-w-[600px] w-full">
        <h1 className="text-[28px] font-medium mb-2 tracking-tight">Timeline</h1>
        <div className="w-full text-[17px] text-[#666] mb-12 font-normal tracking-wide">
          Career and education history
        </div>

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
  )
}
