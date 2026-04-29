import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  stripLinksFromExcerpt,
  isPublishedPost,
  parseCalendarOrIsoDateString,
  getPostImageSrc,
  stripSeriesPrefixFromTitle,
  formatPostPublishedDate,
  isParsablePublishedDate,
} from '@/lib/utils'
import { PostListingExcerpt } from '@/components/PostListingBlocks'
import { getSeriesOverview } from '@/lib/seriesOverview'
import { resolveSeriesSlug } from '@/lib/resolveSeriesSlug'
import { useLocale } from '@/i18n/LocaleContext'
import type { SupportedLocale } from '@/i18n/config'
import { localizePath } from '@/i18n/routing'
import { getLocalizedPublicPosts } from '@/lib/postsLocaleData'
import { mergeLocalizedPublicWithPrivatePosts } from '@/lib/mergeDevPostCaches'
import privatePostsJson from '@cache/posts.private.json'

interface Post {
  slug: string
  title: string
  excerpt?: string
  body?: string
  published: boolean | number | string
  publishedDate?: string
  readTime?: number
  category?: string
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
  /** Basename under `/images/posts/` for list thumbnail (`{slug}-series-hero.png`). */
  listThumbBasename?: string
}

function postThumbBasename(p: Post): string | undefined {
  return p.heroImageSquare ?? p.heroImage ?? p.ogImage ?? p.tweetMetadata?.images?.[0]
}

/** Split repo / post `seriesDescription` on blank lines; trim each block (single newlines → space). */
function seriesOverviewParagraphs(raw: string): string[] {
  return raw
    .split(/\n\s*\n+/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
        .trim(),
    )
    .filter((p) => p.length > 0)
}

/**
 * `stripLinksFromExcerpt` collapses all whitespace to spaces, which destroys `\n\n` paragraph breaks.
 * Strip links per paragraph so overview prose can render as multiple `<p>` nodes.
 */
function seriesOverviewTextForProse(raw: string): string {
  return seriesOverviewParagraphs(raw)
    .map((p) => stripLinksFromExcerpt(p))
    .join('\n\n')
}

function SeriesOverviewProse({
  text,
  paragraphClassName,
}: {
  text: string
  paragraphClassName: string
}) {
  const paras = seriesOverviewParagraphs(text)
  if (paras.length === 0) return null
  return (
    <div className="space-y-4">
      {paras.map((p, i) => (
        <p key={i} className={paragraphClassName}>
          {p}
        </p>
      ))}
    </div>
  )
}

/**
 * Series list thumbnail: same asset as the series landing hero (`{slug}-series-hero.png`) so
 * `/posts/series` cards match `/posts/series/:slug`. Missing files hide via `onError` on the list img.
 */
function pickSeriesListThumbBasename(seriesSlug: string, sortedByPart: Post[]): string | undefined {
  if (sortedByPart.length === 0) return undefined
  return `${seriesSlug}-series-hero.png`
}

const isDev = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === 'true'

async function loadAllPosts(locale: SupportedLocale): Promise<Post[]> {
  const publicPosts = getLocalizedPublicPosts(locale) as unknown as Post[]
  if (!isDev) return publicPosts
  const privatePosts = privatePostsJson as unknown as Post[]
  return mergeLocalizedPublicWithPrivatePosts(publicPosts, privatePosts, locale)
}

export default function SeriesIndex() {
  const { seriesSlug } = useParams<{ seriesSlug: string }>()
  const { locale, languageTag, t } = useLocale()
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
        const withValidDates = posts.filter((p) => isParsablePublishedDate(p.publishedDate))
        const latestPost =
          withValidDates.length > 0
            ? [...withValidDates].sort((a, b) => {
                const tA = parseCalendarOrIsoDateString(a.publishedDate!).getTime()
                const tB = parseCalendarOrIsoDateString(b.publishedDate!).getTime()
                return tB - tA
              })[0]
            : undefined

        const overviewRaw = getSeriesOverview(slug, sortedPosts)
        const listThumbBasename = pickSeriesListThumbBasename(slug, sortedPosts)
        return {
          slug,
          title: sortedPosts[0]?.series ?? slug,
          description: overviewRaw ? seriesOverviewTextForProse(overviewRaw) : undefined,
          total: sortedPosts.length,
          firstPost: sortedPosts[0],
          latestDate: latestPost?.publishedDate,
          hasDrafts: posts.some((post) => !isPublishedPost(post)),
          listThumbBasename,
        }
      })
      .sort((a, b) => {
        const tA = isParsablePublishedDate(a.latestDate)
          ? parseCalendarOrIsoDateString(a.latestDate!).getTime()
          : 0
        const tB = isParsablePublishedDate(b.latestDate)
          ? parseCalendarOrIsoDateString(b.latestDate!).getTime()
          : 0
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
  const seriesDescription = seriesOverviewRaw ? seriesOverviewTextForProse(seriesOverviewRaw) : undefined
  const total = seriesPosts.length

  const canonicalPath = seriesSlug ? `/posts/series/${seriesSlug}` : '/posts/series'
  const canonicalUrl = `https://markmhendrickson.com${localizePath(canonicalPath, locale)}`
  /** Optional cover: `public/images/posts/{seriesSlug}-series-hero.png` */
  const seriesHeroFilename = seriesSlug ? `${seriesSlug}-series-hero.png` : null
  const seriesHeroSrc = seriesHeroFilename ? getPostImageSrc(seriesHeroFilename) : null
  const seriesHeroOgUrl = seriesHeroSrc ? `https://markmhendrickson.com${seriesHeroSrc}` : null

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
              <div className="space-y-8">
                {visibleSeries.map((series) => {
                  const thumbSrc = series.listThumbBasename
                    ? getPostImageSrc(series.listThumbBasename)
                    : ''
                  return (
                  <article
                    key={series.slug}
                    className="border-b border-border pb-8 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch md:items-start gap-4"
                  >
                    {thumbSrc ? (
                      <div
                        data-series-list-thumb
                        className="order-1 shrink-0 md:order-2 md:w-auto"
                      >
                        <Link
                          to={localizePath(`/posts/series/${series.slug}`, locale)}
                          className="block w-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90 md:w-[148px]"
                          aria-label={`${series.title} — series`}
                        >
                          <div className="aspect-square w-full overflow-hidden rounded dark:border dark:border-border md:h-[148px] md:w-[148px] md:aspect-auto flex items-center justify-center">
                            <img
                              src={thumbSrc}
                              alt=""
                              loading="lazy"
                              className="min-h-0 min-w-0 h-full w-full object-cover object-center"
                              style={{ objectPosition: 'center center' }}
                              onError={(e) => {
                                const root = e.currentTarget.closest('[data-series-list-thumb]')
                                if (root instanceof HTMLElement) root.style.display = 'none'
                              }}
                            />
                          </div>
                        </Link>
                      </div>
                    ) : null}
                    <div className="order-2 min-w-0 flex-1 md:order-1">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {series.total}-part series
                      </span>
                      {isParsablePublishedDate(series.latestDate) && (
                        <span className="text-xs text-muted-foreground">
                          Updated {formatPostPublishedDate(series.latestDate, languageTag)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-[20px] font-medium mb-2 tracking-tight">
                      <Link
                        to={localizePath(`/posts/series/${series.slug}`, locale)}
                        className="text-foreground no-underline hover:underline"
                      >
                        {series.title}
                      </Link>
                    </h2>
                    {series.description && (
                      <SeriesOverviewProse
                        text={series.description}
                        paragraphClassName="text-[15px] text-muted-foreground leading-relaxed"
                      />
                    )}
                    {series.firstPost && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Starts with{' '}
                        <Link
                          to={localizePath(`/posts/${series.firstPost.slug}`, locale)}
                          className="hover:text-foreground hover:underline"
                        >
                          {stripSeriesPrefixFromTitle(series.firstPost.title, series.firstPost.series)}
                        </Link>
                      </p>
                    )}
                    <Link
                      to={localizePath(`/posts/series/${series.slug}`, locale)}
                      className="mt-2 inline-block text-sm font-medium text-foreground/70 hover:text-foreground hover:underline"
                    >
                      View series →
                    </Link>
                    </div>
                  </article>
                  )
                })}
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
        <meta
          name="description"
          content={
            (seriesDescription
              ? seriesOverviewParagraphs(seriesDescription).join(' ')
              : null) ?? `A ${total}-part series by Mark Hendrickson.`
          }
        />
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

          {/* Series header — bottom margin on block when no hero; hero block carries border + margin like post hero + section break */}
          <div className={seriesHeroSrc ? undefined : 'mb-8'}>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {total}-part series
              </span>
            </div>
            <h1 className="text-[28px] font-medium tracking-tight mb-3">{seriesTitle}</h1>
            {seriesDescription && (
              <SeriesOverviewProse
                text={seriesDescription}
                paragraphClassName="text-[17px] text-muted-foreground leading-relaxed font-light"
              />
            )}
            {seriesHeroSrc && (
              <div className="mt-6 w-full border-b border-border pb-8 mb-8">
                <img
                  src={seriesHeroSrc}
                  alt={`${seriesTitle} — series illustration`}
                  className="w-full max-h-[70vh] h-auto object-contain rounded dark:border dark:border-border"
                />
              </div>
            )}
          </div>

          {/* Parts list — layout aligned with Posts index (`Posts.tsx` article rows) */}
          <div className="space-y-8">
            {seriesPosts.map((post) => {
              const hasThumb = Boolean(
                post.heroImage || post.ogImage || post.tweetMetadata?.images?.[0],
              )
              const thumbSrc =
                post.heroImageSquare ?? post.heroImage ?? post.ogImage ?? post.tweetMetadata?.images?.[0]
              const isTweet = (post.category || '').toLowerCase() === 'tweet'
              return (
                <article
                  key={post.slug}
                  className="border-b border-border pb-8 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch md:items-start gap-4"
                >
                  {hasThumb && (
                    <Link
                      to={localizePath(`/posts/${post.slug}`, locale)}
                      className="order-1 md:order-2 shrink-0 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
                    >
                      <div className="w-full aspect-square md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center dark:border dark:border-border">
                        <img
                          src={getPostImageSrc(thumbSrc ?? '')}
                          alt={stripSeriesPrefixFromTitle(post.title || '', post.series) || ''}
                          className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                          style={{ objectPosition: 'center center' }}
                        />
                      </div>
                    </Link>
                  )}
                  <div className="order-2 md:order-1 min-w-0 flex-1">
                    <h2 className="text-[20px] font-medium mb-2 tracking-tight">
                      <Link
                        to={localizePath(`/posts/${post.slug}`, locale)}
                        className="text-foreground no-underline hover:underline"
                      >
                        {stripSeriesPrefixFromTitle(post.title, post.series)}
                      </Link>
                    </h2>
                    <PostListingExcerpt excerpt={post.excerpt} isTweet={isTweet} query="" />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                      {post.seriesPart != null && post.seriesTotal != null && (
                        <span className="inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Part {post.seriesPart} of {post.seriesTotal}
                        </span>
                      )}
                      {isParsablePublishedDate(post.publishedDate) && (
                        <Link
                          to={localizePath(`/posts/${post.slug}`, locale)}
                          className="text-muted-foreground hover:text-foreground hover:underline no-underline"
                        >
                          <time dateTime={post.publishedDate}>
                            {formatPostPublishedDate(post.publishedDate, languageTag)}
                          </time>
                        </Link>
                      )}
                      {post.readTime != null && post.readTime > 0 && (
                        <span>
                          {post.readTime} {t.minRead}
                        </span>
                      )}
                      {post.category && (
                        <span className="capitalize">
                          {(post.category || '').toLowerCase() === 'tweet'
                            ? t.xPost
                            : (post.category || '').toLowerCase() === 'essay'
                              ? t.categoryEssay
                              : post.category}
                        </span>
                      )}
                    </div>
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
