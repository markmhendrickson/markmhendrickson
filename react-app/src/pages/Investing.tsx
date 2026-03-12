import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import linksData from '@cache/links.json'
import investingPageData from '@/data/pages/investing.json'
import { useLocale } from '@/i18n/LocaleContext'
import { supportedLocales, type SupportedLocale } from '@/i18n/config'
import { localizePath } from '@/i18n/routing'

const investingMailto = (() => {
  const emailLink = (linksData as { name: string; url: string }[]).find((l) => l.url.startsWith('mailto:'))
  const base = emailLink?.url ?? 'mailto:'
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}subject=Investment%20inquiry`
})()

const SITE_BASE = 'https://markmhendrickson.com'
const DEFAULT_OG_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

const LINK_CLASS =
  'text-foreground underline underline-offset-2 decoration-muted-foreground hover:decoration-foreground'

interface InvestingCopy {
  title: string
  subtitle: string
  pageDesc: string
  statusHeading: string
  statusParagraphs: string[]
  interestsHeading: string
  interests: string[]
  ctaHeading: string
  ctaParagraph: string
  ctaEmailLabel: string
  ctaInclude: string[]
  ctaButton: string
}

const copy = (investingPageData as { copy: Record<string, InvestingCopy> }).copy

export default function Investing() {
  const { locale } = useLocale()
  const text = copy[locale] ?? copy.en

  const canonicalUrl = `${SITE_BASE}${localizePath('/investing', locale)}`
  const pageTitle = `${text.title} — Mark Hendrickson`

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={text.pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        {supportedLocales.map((altLocale) => (
          <link
            key={altLocale}
            rel="alternate"
            hrefLang={altLocale}
            href={`${SITE_BASE}${localizePath('/investing', altLocale)}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_BASE}/investing`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={text.pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={text.pageDesc} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta name="twitter:image:height" content={String(OG_IMAGE_HEIGHT)} />
      </Helmet>
      <div className="flex justify-center items-start min-h-content pt-10 pb-20 px-5 md:py-28 md:px-8">
        <div className="max-w-[42rem] w-full">
          <header className="mb-16">
            <h1 className="text-[28px] font-medium mb-2 tracking-tight text-foreground">
              {text.title}
            </h1>
            <p className="text-[17px] text-muted-foreground dark:text-foreground/80 font-normal tracking-wide max-w-[32rem]">
              {text.subtitle}
            </p>
          </header>

          <div className="space-y-16">
            {/* Current status */}
            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.statusHeading}
              </h2>
              <div className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed space-y-4">
                {text.statusParagraphs.map((p, i) => (
                  <p key={i} className="max-w-[65ch]">
                    {i === 1 ? paragraphWithLinks(p, locale) : p}
                  </p>
                ))}
              </div>
            </section>

            {/* Areas of interest */}
            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.interestsHeading}
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed marker:text-muted-foreground dark:marker:text-foreground/70">
                {text.interests.map((item, i) => (
                  <li key={i} className="pl-0.5 max-w-[65ch]">{item}</li>
                ))}
              </ul>
            </section>

            {/* Get in touch */}
            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.ctaHeading}
              </h2>
              <div className="text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed space-y-4">
                <p className="max-w-[65ch]">{text.ctaParagraph}</p>
                <p className="max-w-[65ch] font-medium text-foreground">
                  <a
                    href={investingMailto}
                    className={LINK_CLASS}
                  >
                    {text.ctaEmailLabel}
                  </a>
                  {locale === 'es' ? ' y por favor incluye:' : locale === 'ca' ? " i si us plau inclou:" : ' and please include:'}
                </p>
                <ul className="list-disc pl-6 space-y-1.5 marker:text-muted-foreground dark:marker:text-foreground/70">
                  {text.ctaInclude.map((item, i) => (
                    <li key={i} className="pl-0.5 max-w-[65ch]">{item}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2">
                <Link
                  to={localizePath('/meet', locale)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border hover:border-muted-foreground hover:bg-muted transition-all text-[15px] font-medium text-foreground"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>{text.ctaButton}</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

const INVESTING_LINKS: Array<{ phrase: string; url?: string; path?: string }> = [
  { phrase: 'Neotoma', url: 'https://neotoma.io' },
]

function paragraphWithLinks(text: string, _locale: SupportedLocale): React.ReactNode {
  let earliest = {
    index: -1,
    phrase: '',
    url: undefined as string | undefined,
    path: undefined as string | undefined,
  }
  for (const { phrase, url, path } of INVESTING_LINKS) {
    const idx = text.indexOf(phrase)
    if (idx !== -1 && (earliest.index === -1 || idx < earliest.index)) {
      earliest = { index: idx, phrase, url, path }
    }
  }
  if (earliest.index === -1) return text
  const before = text.slice(0, earliest.index)
  const after = text.slice(earliest.index + earliest.phrase.length)
  const linkNode = earliest.url ? (
    <a
      href={earliest.url}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS}
    >
      {earliest.phrase}
    </a>
  ) : earliest.path ? (
    <Link
      to={localizePath(earliest.path, _locale)}
      className={LINK_CLASS}
    >
      {earliest.phrase}
    </Link>
  ) : (
    earliest.phrase
  )
  return (
    <>
      {before}
      {linkNode}
      {paragraphWithLinks(after, _locale)}
    </>
  )
}
