import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { stripLinksFromExcerpt, isPublishedPost, parseCalendarOrIsoDateString, getPostImageSrc } from '@/lib/utils'
import { getSeriesOverview } from '@/lib/seriesOverview'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'
import { getLocalizedPublicPosts } from '@/lib/postsLocaleData'
import privatePostsJson from '@cache/posts.private.json'

interface Post {
  slug: string
  title: string
  excerpt?: string
  published: boolean | number | string
  publishedDate?: string
  readTime?: number
  series?: string
  seriesSlug?: string
  seriesPart?: number
  seriesTotal?: number
  heroImage?: string
  heroImageSquare?: string
  ogImage?: string
  tweetMetadata?: { images?: string[] }
  /** Optional series landing blurb (frontmatter `series_description` → cache). */
  seriesDescription?: string
}

interface SeriesSummary {
  slug: string
  title: string
  description?: string
  total: number
  firstPost?: Post
  latestDate?: string
  hasDrafts: boolean
}

const isDev = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === 'true'

function resolveSeriesSlug(post: Post): string | null {
  const explicit = post.seriesSlug?.trim()
  if (explicit) return explicit
  const slug = post.slug?.trim()
  if (!slug) return null
  const m = slug.match(/^(.*)-part-\d+$/i)
  if (m?.[1]) return m[1]
  return null
}

async function loadAllPosts(locale: string): Promise<Post[]> {
  const publicPosts = getLocalizedPublicPosts(locale as never) as unknown as Post[]
  if (!isDev) return publicPosts
  const privatePosts = privatePostsJson as unknown as Post[]
  const merged = new Map<string, Post>()
  for (const p of publicPosts) {
    if (p.slug) merged.set(p.slug, p)
  }
  for (const p of privatePosts) {
    if (!p.slug) continue
    if (!merged.has(p.slug)) merged.set(p.slug, p)
  }
  return Array.from(merged.values())
}

export default function SeriesIndex() {
  const { seriesSlug } = useParams<{ seriesSlug: string }>()
  const { locale, languageTag } = useLocale()
  const [searchParams] = useSearchParams()
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const draftSeriesMode = !seriesSlug && isDev && searchParams.get('view') === 'drafts'

  useEffect(() => {
    loadAllPosts(locale).then(setAllPosts)
  }, [locale])

  const seriesPosts = useMemo(() => {
    if (!seriesSlug) return []
    return allPosts
      .filter(
        (p) =>
          resolveSeriesSlug(p) === seriesSlug &&
          (isPublishedPost(p) || isDev),
      )
      .sort((a, b) => (a.seriesPart ?? 0) - (b.seriesPart ?? 0))
  }, [allPosts, seriesSlug])

  const allSeries = useMemo<SeriesSummary[]>(() => {
    const grouped = new Map<string, Post[]>()

    for (const post of allPosts) {
      const slug = resolveSeriesSlug(post)
      if (!slug || !post.series) continue
      if (!(isPublishedPost(post) || isDev)) continue
      const existing = grouped.get(slug) ?? []
      existing.push(post)
      grouped.set(slug, existing)
    }

    return Array.from(grouped.entries())
      .map(([slug, posts]) => {
        const sortedPosts = [...posts].sort((a, b) => (a.seriesPart ?? 0) - (b.seriesPart ?? 0))
        const latestPost = [...posts].sort((a, b) => {
          const tA = a.publishedDate ? parseCalendarOrIsoDateString(a.publishedDate).getTime() : 0
          const tB = b.publishedDate ? parseCalendarOrIsoDateString(b.publishedDate).getTime() : 0
          return tB - tA
        })[0]

        const overviewRaw = getSeriesOverview(slug, sortedPosts)
        return {
          slug,
          title: sortedPosts[0]?.series ?? slug,
          description: overviewRaw ? stripLinksFromExcerpt(overviewRaw) : undefined,
          total: sortedPosts.length,
          firstPost: sortedPosts[0],
          latestDate: latestPost?.publishedDate,
          hasDrafts: posts.some((post) => !isPublishedPost(post)),
        }
      })
      .sort((a, b) => {
        const tA = a.latestDate ? parseCalendarOrIsoDateString(a.latestDate).getTime() : 0
        const tB = b.latestDate ? parseCalendarOrIsoDateString(b.latestDate).getTime() : 0
        if (tB !== tA) return tB - tA
        return a.title.localeCompare(b.title)
      })
  }, [allPosts])

  const draftCount = useMemo(
    () => allPosts.filter((post) => !isPublishedPost(post)).length,
    [allPosts],
  )
  const draftSeriesCount = useMemo(
    () => allSeries.filter((series) => series.hasDrafts).length,
    [allSeries],
  )
  const visibleSeries = useMemo(
    () => (draftSeriesMode ? allSeries.filter((series) => series.hasDrafts) : allSeries),
    [allSeries, draftSeriesMode],
  )

  const seriesTitle = seriesPosts[0]?.series ?? seriesSlug ?? ''
  const seriesOverviewRaw =
    seriesSlug && seriesPosts.length > 0 ? getSeriesOverview(seriesSlug, seriesPosts) : undefined
  const seriesDescription = seriesOverviewRaw ? stripLinksFromExcerpt(seriesOverviewRaw) : undefined
  const total = seriesPosts.length

  const canonicalPath = seriesSlug ? `/posts/series/${seriesSlug}` : '/posts/series'
  const canonicalUrl = `https://markmhendrickson.com${localizePath(canonicalPath, locale)}`
  /** Optional cover: `public/images/posts/{seriesSlug}-series-hero.png` */
  const seriesHeroFilename = seriesSlug ? `${seriesSlug}-series-hero.png` : null
  const seriesHeroSrc = seriesHeroFilename ? getPostImageSrc(seriesHeroFilename) : null
  const seriesHeroOgUrl = seriesHeroSrc ? `https://markmhendrickson.com${seriesHeroSrc}` : null

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString(languageTag, { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (!seriesSlug) {
    return (
      <>
        <Helmet>
          <title>{draftSeriesMode ? 'Draft Series' : 'Series'} — Mark Hendrickson</title>
          <meta
            name="description"
            content={
              draftSeriesMode
                ? 'Browse draft multi-part post series by Mark Hendrickson.'
                : 'Browse multi-part post series by Mark Hendrickson.'
            }
          />
          <link rel="canonical" href={canonicalUrl} />
        </Helmet>

        <div className="flex justify-center items-center min-h-content pt-8 pb-8 px-4 md:pt-8 md:pb-8 md:px-8">
          <div className="max-w-[600px] w-full">
            <div className="flex items-center justify-between gap-4 mb-6">
              <Link
                to={localizePath('/posts', locale)}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline inline-block"
              >
                ← All posts
              </Link>
              {isDev && (
                <Link
                  to={
                    draftSeriesMode
                      ? localizePath('/posts/series', locale)
                      : {
                          pathname: localizePath('/posts/series', locale),
                          search: '?view=drafts',
                        }
                  }
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline inline-block"
                >
                  {draftSeriesMode
                    ? 'View all series'
                    : draftSeriesCount > 0
                      ? `View drafts (${draftSeriesCount})`
                      : 'View draft series'}
                </Link>
              )}
            </div>

            <div className="mb-8">
              <h1 className="text-[28px] font-medium tracking-tight mb-3">
                {draftSeriesMode ? 'Draft series' : 'Series'}
              </h1>
              <p className="text-[17px] text-muted-foreground leading-relaxed font-light">
                {draftSeriesMode
                  ? 'Browse multi-part post series that currently have drafts.'
                  : 'Browse multi-part post series.'}
              </p>
            </div>

            {visibleSeries.length === 0 ? (
              <p className="text-[15px] text-muted-foreground">
                {draftSeriesMode ? 'No draft series yet.' : 'No series yet.'}
              </p>
            ) : (
              <div className="space-y-6">
                {visibleSeries.map((series) => (
                  <article
                    key={series.slug}
                    className="border-b border-border pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {series.total}-part series
                      </span>
                      {series.latestDate && (
                        <span className="text-xs text-muted-foreground">
                          Updated {formatDate(series.latestDate)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-[18px] font-medium tracking-tight mb-1.5">
                      <Link
                        to={localizePath(`/posts/series/${series.slug}`, locale)}
                        className="text-foreground no-underline hover:underline"
                      >
                        {series.title}
                      </Link>
                    </h2>
                    {series.description && (
                      <p className="text-[15px] text-muted-foreground leading-relaxed">
                        {series.description}
                      </p>
                    )}
                    {series.firstPost && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Starts with{' '}
                        <Link
                          to={localizePath(`/posts/${series.firstPost.slug}`, locale)}
                          className="hover:text-foreground hover:underline"
                        >
                          {series.firstPost.title}
                        </Link>
                      </p>
                    )}
                    <Link
                      to={localizePath(`/posts/series/${series.slug}`, locale)}
                      className="mt-2 inline-block text-sm font-medium text-foreground/70 hover:text-foreground hover:underline"
                    >
                      View series →
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  if (seriesPosts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-content pt-8 pb-8 px-4 md:pt-8 md:pb-8 md:px-8">
        <div className="max-w-[600px] w-full">
          <p className="text-[15px] text-muted-foreground">Series not found.</p>
          <Link to={localizePath('/posts', locale)} className="text-sm text-muted-foreground hover:text-foreground hover:underline mt-4 inline-block">
            ← All posts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{seriesTitle} — Mark Hendrickson</title>
        <meta name="description" content={seriesDescription ?? `A ${total}-part series by Mark Hendrickson.`} />
        <link rel="canonical" href={canonicalUrl} />
        {seriesHeroOgUrl && (
          <>
            <meta property="og:image" content={seriesHeroOgUrl} />
            <meta name="twitter:image" content={seriesHeroOgUrl} />
          </>
        )}
      </Helmet>

      <div className="flex justify-center items-center min-h-content pt-8 pb-8 px-4 md:pt-8 md:pb-8 md:px-8">
        <div className="max-w-[600px] w-full">

          {/* Back link */}
          <Link
            to={localizePath('/posts', locale)}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline mb-6 inline-block"
          >
            ← All posts
          </Link>

          {/* Series header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {total}-part series
              </span>
            </div>
            <h1 className="text-[28px] font-medium tracking-tight mb-3">{seriesTitle}</h1>
            {seriesDescription && (
              <p className="text-[17px] text-muted-foreground leading-relaxed font-light">
                {seriesDescription}
              </p>
            )}
            {seriesHeroSrc && (
              <div className="mt-6 w-full">
                <img
                  src={seriesHeroSrc}
                  alt={`${seriesTitle} — series illustration`}
                  className="w-full max-h-[70vh] h-auto object-contain rounded dark:border dark:border-border"
                />
              </div>
            )}
          </div>

          {/* Parts list */}
          <div className="space-y-6">
            {seriesPosts.map((post) => {
              const thumbSrc =
                post.heroImageSquare ?? post.heroImage ?? post.ogImage ?? post.tweetMetadata?.images?.[0]
              const hasThumb = Boolean(thumbSrc)
              return (
              <article
                key={post.slug}
                className="border-b border-border pb-6 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch md:items-start gap-4"
              >
                {hasThumb && (
                  <Link
                    to={localizePath(`/posts/${post.slug}`, locale)}
                    className="order-1 md:order-2 shrink-0 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
                  >
                    <div className="w-full aspect-square md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center dark:border dark:border-border">
                      <img
                        src={getPostImageSrc(thumbSrc ?? '')}
                        alt={post.title || ''}
                        className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                      />
                    </div>
                  </Link>
                )}
                <div className="order-2 md:order-1 min-w-0 flex-1">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
                    Part {post.seriesPart}
                  </span>
                  {post.publishedDate && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(post.publishedDate)}
                    </span>
                  )}
                  {post.readTime && (
                    <span className="text-xs text-muted-foreground">{post.readTime} min read</span>
                  )}
                </div>
                <h2 className="text-[18px] font-medium tracking-tight mb-1.5">
                  <Link
                    to={localizePath(`/posts/${post.slug}`, locale)}
                    className="text-foreground no-underline hover:underline"
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && (
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    {stripLinksFromExcerpt(post.excerpt)}
                  </p>
                )}
                <Link
                  to={localizePath(`/posts/${post.slug}`, locale)}
                  className="mt-2 inline-block text-sm font-medium text-foreground/70 hover:text-foreground hover:underline"
                >
                  Read →
                </Link>
                </div>
              </article>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
