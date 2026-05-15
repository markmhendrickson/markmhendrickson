import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import linksData from '@cache/links.json'
import neotomaPageData from '@/data/pages/neotoma.json'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'

const neotomaMailto = (() => {
  const emailLink = (linksData as { name: string; url: string }[]).find((l) => l.url.startsWith('mailto:'))
  const base = emailLink?.url ?? 'mailto:'
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}subject=Neotoma%20inquiry`
})()

const SITE_BASE = 'https://markmhendrickson.com'

const LINK_CLASS =
  'text-foreground underline underline-offset-2 decoration-muted-foreground hover:decoration-foreground'

interface NeotomaWritingPost {
  slug: string
  title: string
  blurb: string
}

interface NeotomaWritingGroup {
  label: string
  posts: NeotomaWritingPost[]
}

interface NeotomaCopy {
  title: string
  subtitle: string
  pageDesc: string
  oneLinerHeading: string
  oneLinerParagraphs: string[]
  whyNowHeading: string
  whyNowPoints: string[]
  differentiationHeading: string
  differentiationPoints: string[]
  stateHeading: string
  stateParagraphs: string[]
  writingHeading: string
  writingViewAll: string
  writingGroups: NeotomaWritingGroup[]
  capitalHeading: string
  capitalParagraphs: string[]
  fitHeading: string
  fitPoints: string[]
  ctaHeading: string
  ctaParagraph: string
  ctaEmailLabel: string
  ctaInclude: string[]
  ctaButton: string
}

const copy = (neotomaPageData as { copy: Record<string, NeotomaCopy> }).copy

export default function Neotoma() {
  const { locale } = useLocale()
  const text = copy[locale] ?? copy.en

  const canonicalUrl = `${SITE_BASE}${localizePath('/neotoma', locale)}`
  const pageTitle = `${text.title} — Mark Hendrickson`

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={text.pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <div className="flex justify-center items-start min-h-content pt-10 pb-20 px-5 md:py-28 md:px-8">
        <div className="max-w-[42rem] w-full">
          <header className="mb-16">
            <h1 className="text-[28px] font-medium mb-2 tracking-tight text-foreground">
              {text.title}
            </h1>
            <p className="text-[17px] text-foreground dark:text-foreground/80 font-normal tracking-wide max-w-[32rem]">
              {text.subtitle}
            </p>
          </header>

          <div className="space-y-16">
            <Section heading={text.oneLinerHeading}>
              <Paragraphs items={text.oneLinerParagraphs} withLinks />
            </Section>

            <Section heading={text.whyNowHeading}>
              <BulletList items={text.whyNowPoints} />
            </Section>

            <Section heading={text.differentiationHeading}>
              <BulletList items={text.differentiationPoints} />
            </Section>

            <Section heading={text.stateHeading}>
              <Paragraphs items={text.stateParagraphs} />
            </Section>

            <Section heading={text.writingHeading}>
              <div className="space-y-6">
                {text.writingGroups.map((group) => (
                  <div key={group.label} className="space-y-2.5">
                    <h3 className="text-[13px] uppercase tracking-wider text-muted-foreground dark:text-foreground/70 font-medium">
                      {group.label}
                    </h3>
                    <ul className="list-disc pl-6 space-y-2.5 marker:text-muted-foreground dark:marker:text-foreground/70">
                      {group.posts.map((post) => (
                        <li key={post.slug} className="pl-0.5 max-w-[65ch]">
                          <Link to={localizePath(`/posts/${post.slug}`, locale)} className={LINK_CLASS}>
                            {post.title}
                          </Link>
                          {' — '}
                          {post.blurb}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <p>
                  <Link to={localizePath('/posts', locale)} className={LINK_CLASS}>
                    {text.writingViewAll}
                  </Link>
                </p>
              </div>
            </Section>

            <Section heading={text.capitalHeading}>
              <Paragraphs items={text.capitalParagraphs} />
            </Section>

            <Section heading={text.fitHeading}>
              <BulletList items={text.fitPoints} />
            </Section>

            <section className="space-y-5">
              <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                {text.ctaHeading}
              </h2>
              <div className="text-[15px] text-foreground dark:text-foreground/80 leading-relaxed space-y-4">
                <p className="max-w-[65ch]">{text.ctaParagraph}</p>
                <p className="max-w-[65ch] font-medium text-foreground">
                  <a href={neotomaMailto} className={LINK_CLASS}>
                    {text.ctaEmailLabel}
                  </a>
                  {locale === 'es' ? ' y por favor incluye:' : ' and please include:'}
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

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
        {heading}
      </h2>
      <div className="text-[15px] text-foreground dark:text-foreground/80 leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  )
}

function Paragraphs({ items, withLinks = false }: { items: string[]; withLinks?: boolean }) {
  return (
    <>
      {items.map((p, i) => (
        <p key={i} className="max-w-[65ch]">
          {withLinks ? paragraphWithLinks(p) : p}
        </p>
      ))}
    </>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-6 space-y-2 marker:text-muted-foreground dark:marker:text-foreground/70">
      {items.map((item, i) => (
        <li key={i} className="pl-0.5 max-w-[65ch]">{item}</li>
      ))}
    </ul>
  )
}

const NEOTOMA_LINKS: Array<{ phrase: string; url: string }> = [
  { phrase: 'github.com/markmhendrickson/neotoma', url: 'https://github.com/markmhendrickson/neotoma' },
  { phrase: 'neotoma.io', url: 'https://neotoma.io' },
]

function paragraphWithLinks(text: string): React.ReactNode {
  let earliest = { index: -1, phrase: '', url: '' }
  for (const { phrase, url } of NEOTOMA_LINKS) {
    const idx = text.indexOf(phrase)
    if (idx !== -1 && (earliest.index === -1 || idx < earliest.index)) {
      earliest = { index: idx, phrase, url }
    }
  }
  if (earliest.index === -1) return text
  const before = text.slice(0, earliest.index)
  const after = text.slice(earliest.index + earliest.phrase.length)
  return (
    <>
      {before}
      <a href={earliest.url} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        {earliest.phrase}
      </a>
      {paragraphWithLinks(after)}
    </>
  )
}
