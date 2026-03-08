import { Helmet } from 'react-helmet-async'
import { Calendar } from 'lucide-react'

const slots = [
  { duration: '30 minutes', url: 'https://calendar.notion.so/meet/markmhendrickson/meeting', label: 'Meeting' },
  { duration: '60 minutes', url: 'https://calendar.notion.so/meet/markmhendrickson/chat', label: 'Chat' },
]

export default function Schedule() {
  const pageTitle = 'Meet with me — Mark Hendrickson'
  const pageDesc = 'Book a 30 or 60 minute slot with Mark.'
  const canonicalUrl = 'https://markmhendrickson.com/schedule'
  const defaultOgImage = 'https://markmhendrickson.com/images/og-default-1200x630.jpg'
  const ogImageWidth = 1200
  const ogImageHeight = 630

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={defaultOgImage} />
        <meta property="og:image:width" content={String(ogImageWidth)} />
        <meta property="og:image:height" content={String(ogImageHeight)} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={defaultOgImage} />
        <meta name="twitter:image:width" content={String(ogImageWidth)} />
        <meta name="twitter:image:height" content={String(ogImageHeight)} />
      </Helmet>
      <div className="flex justify-center items-start min-h-content pt-8 pb-4 px-4 md:py-20 md:px-8">
        <div className="max-w-[600px] w-full">
          <h1 className="text-[28px] font-medium mb-2 tracking-tight">Meet with me</h1>
          <div className="text-[17px] text-[#666] mb-12 font-normal tracking-wide">
            Pick a time that works for you
          </div>

          <div className="space-y-4">
            {slots.map((slot) => (
              <a
                key={slot.url}
                href={slot.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-lg border border-[#e0e0e0] hover:border-[#999] hover:bg-[#fafafa] transition-all group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#f5f5f5] flex items-center justify-center group-hover:bg-[#e8e8e8] transition-colors">
                  <Calendar className="w-6 h-6 text-[#333]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-medium text-[#333] mb-1">
                    {slot.duration}
                  </div>
                  <div className="text-[13px] text-[#666]">Book via Notion Calendar</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
