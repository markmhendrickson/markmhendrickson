import { Helmet } from 'react-helmet-async'
import { Calendar } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'

export default function Schedule() {
  const { locale } = useLocale()
  const copy = {
    en: {
      title: 'Meet with me',
      subtitle: 'Pick a time that works for you',
      pageDesc: 'Book a 30 or 60 minute slot with Mark.',
      bookVia: 'Book via Notion Calendar',
      duration30: '30 minutes',
      duration60: '60 minutes',
      labelMeeting: 'Meeting',
      labelChat: 'Chat',
    },
    es: {
      title: 'Reúnete conmigo',
      subtitle: 'Elige una hora que te funcione',
      pageDesc: 'Reserva una reunión de 30 o 60 minutos con Mark.',
      bookVia: 'Reservar con Notion Calendar',
      duration30: '30 minutos',
      duration60: '60 minutos',
      labelMeeting: 'Reunión',
      labelChat: 'Charla',
    },
    ca: {
      title: "Reuneix-te amb mi",
      subtitle: "Tria una hora que et vagi bé",
      pageDesc: 'Reserva una reunió de 30 o 60 minuts amb en Mark.',
      bookVia: 'Reserva amb Notion Calendar',
      duration30: '30 minuts',
      duration60: '60 minuts',
      labelMeeting: 'Reunió',
      labelChat: 'Xerrada',
    },
    zh: {
      title: '与我会面',
      subtitle: '选择一个适合你的时间',
      pageDesc: '预订与 Mark 的 30 分钟或 60 分钟会面。',
      bookVia: '通过 Notion Calendar 预约',
      duration30: '30 分钟',
      duration60: '60 分钟',
      labelMeeting: '会议',
      labelChat: '聊天',
    },
  } as const
  const baseText = copy[locale as keyof typeof copy] ?? copy.en
  const text = baseText
  const slots = [
    {
      duration: text.duration30,
      url: 'https://calendar.notion.so/meet/markmhendrickson/meeting',
      label: text.labelMeeting,
    },
    {
      duration: text.duration60,
      url: 'https://calendar.notion.so/meet/markmhendrickson/chat',
      label: text.labelChat,
    },
  ]
  const pageTitle = `${text.title} — Mark Hendrickson`
  const pageDesc = text.pageDesc
  const canonicalUrl = `https://markmhendrickson.com${localizePath('/meet', locale)}`
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
          <h1 className="text-[28px] font-medium mb-2 tracking-tight">{text.title}</h1>
          <div className="text-[17px] text-muted-foreground dark:text-foreground/80 mb-12 font-normal tracking-wide">
            {text.subtitle}
          </div>

          <div className="space-y-4">
            {slots.map((slot) => (
              <a
                key={slot.url}
                href={slot.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-muted-foreground hover:bg-muted transition-all group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                  <Calendar className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-medium text-foreground mb-1">
                    {slot.duration}
                  </div>
                  <div className="text-[13px] text-muted-foreground dark:text-foreground/80">{text.bookVia}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
