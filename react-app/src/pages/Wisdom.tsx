import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'
import { supportedLocales } from '@/i18n/config'
import wisdomRaw from '@cache/wisdom.json'

interface Quote {
  quote: string
  context: string
}

interface WisdomEntry {
  slug: string
  title: string
  publishedDate?: string
  quotes: Quote[]
}

interface WisdomCollection {
  generatedAt: string
  totalQuotes: number
  totalPosts: number
  entries: WisdomEntry[]
}

const wisdomData = wisdomRaw as WisdomCollection

type ViewMode = 'stream' | 'by-post'

const SITE_BASE = 'https://markmhendrickson.com'
const DEFAULT_OG_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`

const LINK_CLASS =
  'text-foreground underline underline-offset-2 decoration-muted-foreground/70 hover:decoration-foreground'

export default function Wisdom() {
  const { locale } = useLocale()
  const [viewMode, setViewMode] = useState<ViewMode>('stream')
  const [selectedContext, setSelectedContext] = useState<string | null>(null)

  const pageTitle = 'Wisdom — Mark Hendrickson'
  const pageDesc = 'The pithiest statements from across the writing, compiled into a book of wisdom for the AI age.'
  const canonicalUrl = `${SITE_BASE}${localizePath('/wisdom', locale)}`

  const allQuotes = useMemo(() => {
    if (!wisdomData?.entries) return []
    return wisdomData.entries.flatMap((entry) =>
      entry.quotes.map((q) => ({
        ...q,
        slug: entry.slug,
        title: entry.title,
        publishedDate: entry.publishedDate,
      }))
    )
  }, [])

  const contexts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const q of allQuotes) {
      counts.set(q.context, (counts.get(q.context) || 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([ctx]) => ctx)
  }, [allQuotes])

  const filteredQuotes = useMemo(() => {
    if (!selectedContext) return allQuotes
    return allQuotes.filter((q) => q.context === selectedContext)
  }, [allQuotes, selectedContext])

  const isEmpty = !wisdomData?.entries || wisdomData.entries.length === 0

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        {supportedLocales.map((altLocale) => (
          <link
            key={altLocale}
            rel="alternate"
            hrefLang={altLocale}
            href={`${SITE_BASE}${localizePath('/wisdom', altLocale)}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_BASE}/wisdom`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      </Helmet>

      <div className="flex justify-center items-start min-h-content pt-10 pb-20 px-5 md:py-28 md:px-8">
        <div className="max-w-[42rem] w-full">
          <header className="mb-12">
            <h1 className="text-[28px] font-medium mb-2 tracking-tight text-foreground">
              Wisdom
            </h1>
            <p className="text-[17px] text-muted-foreground dark:text-foreground/80 font-normal tracking-wide max-w-[32rem]">
              The pithiest statements from across the writing, compiled for the AI age.
            </p>
            {!isEmpty && (
              <p className="mt-3 text-[13px] text-muted-foreground/70">
                {wisdomData.totalQuotes} quotes from {wisdomData.totalPosts} posts
              </p>
            )}
          </header>

          {isEmpty ? (
            <div className="text-center py-12">
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                The wisdom collection is being compiled. Run the PithBot to generate it.
              </p>
              <pre className="mt-6 inline-block text-left text-[13px] bg-muted/50 rounded-lg p-4 overflow-x-auto text-muted-foreground">
                python execution/scripts/generate_pithbot.py
              </pre>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-8 flex-wrap">
                <div className="flex rounded-md border border-border overflow-hidden text-[13px]">
                  <button
                    onClick={() => setViewMode('stream')}
                    className={`px-3 py-1.5 transition-colors ${
                      viewMode === 'stream'
                        ? 'bg-foreground text-background'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Stream
                  </button>
                  <button
                    onClick={() => setViewMode('by-post')}
                    className={`px-3 py-1.5 transition-colors border-l border-border ${
                      viewMode === 'by-post'
                        ? 'bg-foreground text-background'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    By post
                  </button>
                </div>

                {viewMode === 'stream' && contexts.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                      onClick={() => setSelectedContext(null)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[12px] transition-colors ${
                        !selectedContext
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      All
                    </button>
                    {contexts.slice(0, 8).map((ctx) => (
                      <button
                        key={ctx}
                        onClick={() => setSelectedContext(selectedContext === ctx ? null : ctx)}
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[12px] transition-colors ${
                          selectedContext === ctx
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {ctx}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {viewMode === 'stream' ? (
                <div className="space-y-0">
                  {filteredQuotes.map((q, i) => (
                    <div
                      key={`${q.slug}-${i}`}
                      className="group py-6 border-b border-border last:border-0"
                    >
                      <blockquote className="text-[16px] leading-[1.7] font-light text-foreground italic">
                        &ldquo;{q.quote}&rdquo;
                      </blockquote>
                      <div className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                        <span className="inline-block w-4 h-px bg-muted-foreground/40" />
                        <Link
                          to={localizePath(`/posts/${q.slug}`, locale)}
                          className={LINK_CLASS + ' text-[13px]'}
                        >
                          {q.title}
                        </Link>
                        {q.context && (
                          <>
                            <span className="text-muted-foreground/40">&middot;</span>
                            <span className="text-muted-foreground/60">{q.context}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-16">
                  {wisdomData.entries.map((entry) => (
                    <section key={entry.slug}>
                      <h2 className="text-[18px] font-medium text-foreground tracking-tight mb-1">
                        <Link
                          to={localizePath(`/posts/${entry.slug}`, locale)}
                          className="hover:underline underline-offset-2 decoration-muted-foreground/70"
                        >
                          {entry.title}
                        </Link>
                      </h2>
                      {entry.publishedDate && (
                        <p className="text-[13px] text-muted-foreground/60 mb-5">
                          {entry.publishedDate}
                        </p>
                      )}
                      <div className="space-y-4 pl-4 border-l-2 border-border">
                        {entry.quotes.map((q, i) => (
                          <div key={i}>
                            <blockquote className="text-[15px] leading-[1.7] font-light text-foreground/90 italic">
                              &ldquo;{q.quote}&rdquo;
                            </blockquote>
                            {q.context && (
                              <p className="mt-1 text-[12px] text-muted-foreground/50">
                                {q.context}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
