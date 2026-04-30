import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  isPublishedPost,
  parseCalendarOrIsoDateString,
  getPostImageSrc,
  stripSeriesPrefixFromTitle,
  formatPostPublishedDate,
  isParsablePublishedDate,
  stripLinksFromExcerpt,
} from '@/lib/utils'
import { PostListingExcerpt } from '@/components/PostListingBlocks'
import {
  SeriesOverviewProse,
  seriesOverviewParagraphs,
  seriesOverviewTextForProse,
} from '@/components/SeriesOverviewProse'
import { seriesSeriesHeroBasename } from '@/lib/seriesListThumb'
import { getSeriesOverview } from '@/lib/seriesOverview'
import { resolveSeriesSlug } from '@/lib/resolveSeriesSlug'
import { useLocale } from '@/i18n/LocaleContext'
import { supportedLocales, type SupportedLocale } from '@/i18n/config'
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
  latestDate?: string
  /** Sum of part `readTime` values for listing metadata (mirrors post index). */
  totalReadMinutes?: number
  /** First part’s category for listing metadata row. */
  primaryCategory?: string
  hasDrafts: boolean
  /** Basename under `/images/posts/` for list thumbnail (`{slug}-series-hero.png`). */
  listThumbBasename?: string
}

function postThumbBasename(p: Post): string | undefined {
  return p.heroImageSquare ?? p.heroImage ?? p.ogImage ?? p.tweetMetadata?.images?.[0]
}

const isDev = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === 'true'

const SITE_BASE = 'https://markmhendrickson.com'
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

function buildInitialPostsForLocale(locale: SupportedLocale): Post[] {
  const publicPosts = getLocalizedPublicPosts(locale) as unknown as Post[]
  if (!isDev) return publicPosts
  const privatePosts = privatePostsJson as unknown as Post[]
  return mergeLocalizedPublicWithPrivatePosts(publicPosts, privatePosts, locale)
}

export default function SeriesIndex() {
  const { seriesSlug } = useParams<{ seriesSlug: string }>()
  const { locale, languageTag, t } = useLocale()
  const [searchParams] = useSearchParams()
  const [allPosts, setAllPosts] = useState<Post[]>(() => buildInitialPostsForLocale(locale))
  const draftSeriesMode = !seriesSlug && isDev && searchParams.get('view') === 'drafts'

  useEffect(() => {
    setAllPosts(buildInitialPostsForLocale(locale))
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

        const overviewRaw = getSeriesOverview(slug, sortedPosts, locale)
        const listThumbBasename =
          sortedPosts.length > 0 ? seriesSeriesHeroBasename(slug) : undefined
        const totalReadMinutes = sortedPosts.reduce((acc, p) => {
          const rt = p.readTime
          return acc + (typeof rt === 'number' && rt > 0 ? rt : 0)
        }, 0)
        const primaryCategory = sortedPosts.find((p) => (p.category || '').trim())?.category
        return {
          slug,
          title: sortedPosts[0]?.series ?? slug,
          description: overviewRaw ? seriesOverviewTextForProse(overviewRaw) : undefined,
          total: sortedPosts.length,
          latestDate: latestPost?.publishedDate,
          totalReadMinutes: totalReadMinutes > 0 ? totalReadMinutes : undefined,
          primaryCategory: primaryCategory?.trim() || undefined,
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
  }, [allPosts, locale])

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
    seriesSlug && seriesPosts.length > 0 ? getSeriesOverview(seriesSlug, seriesPosts, locale) : undefined
  const seriesDescription = seriesOverviewRaw ? seriesOverviewTextForProse(seriesOverviewRaw) : undefined
  const total = seriesPosts.length

  const canonicalPath = seriesSlug ? `/posts/series/${seriesSlug}` : '/posts/series'
  const canonicalUrl = `${SITE_BASE}${localizePath(canonicalPath, locale)}`
  /** Optional cover: `public/images/posts/{seriesSlug}-series-hero.png` */
  const seriesHeroFilename = seriesSlug ? `${seriesSlug}-series-hero.png` : null
  const seriesHeroSrc = seriesHeroFilename ? getPostImageSrc(seriesHeroFilename) : null
  const seriesHeroOgUrl = seriesHeroSrc ? `${SITE_BASE}${seriesHeroSrc}` : null

  const seriesAlternateUrls = useMemo(
    () =>
      supportedLocales.map((altLocale) => ({
        locale: altLocale,
        href: `${SITE_BASE}${localizePath(seriesSlug ? `/posts/series/${seriesSlug}` : '/posts/series', altLocale)}`,
      })),
    [seriesSlug],
  )

  const listMetaDescription = draftSeriesMode
    ? 'Browse draft multi-part post series by Mark Hendrickson.'
    : 'Browse multi-part post series by Mark Hendrickson.'
  const listPageTitle = draftSeriesMode ? 'Draft Series' : 'Series'

  if (!seriesSlug) {
    const listOgDesc = listMetaDescription.slice(0, 160)
    return (
      <>
        <Helmet>
          <title>{listPageTitle} — Mark Hendrickson</title>
          <meta name="description" content={listMetaDescription} />
          <meta name="author" content="Mark Hendrickson" />
          <link rel="canonical" href={canonicalUrl} />
          {seriesAlternateUrls.map((alt) => (
            <link key={alt.locale} rel="alternate" hrefLang={alt.locale} href={alt.href} />
          ))}
          <link rel="alternate" hrefLang="x-default" href={`${SITE_BASE}/`} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={`${listPageTitle} — Mark Hendrickson`} />
          <meta property="og:description" content={listOgDesc} />
          <meta property="og:url" content={canonicalUrl} />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:creator" content="@markmhendrickson" />
          <meta name="twitter:title" content={`${listPageTitle} — Mark Hendrickson`} />
          <meta name="twitter:description" content={listOgDesc} />
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: listPageTitle,
              description: listMetaDescription,
              url: canonicalUrl,
              isPartOf: { '@type': 'WebSite', name: 'Mark Hendrickson', url: SITE_BASE },
            })}
          </script>
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: t.navHome, item: `${SITE_BASE}${localizePath('/', locale)}` },
                { '@type': 'ListItem', position: 2, name: t.navPosts, item: `${SITE_BASE}${localizePath('/posts', locale)}` },
                { '@type': 'ListItem', position: 3, name: listPageTitle, item: canonicalUrl },
              ],
            })}
          </script>
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
                  const thumbBasename = series.listThumbBasename
                  const thumbSrc = thumbBasename ? getPostImageSrc(thumbBasename) : ''
                  const hasThumb = Boolean(thumbBasename && thumbSrc)
                  return (
                  <article
                    key={series.slug}
                    className="border-b border-border pb-8 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch md:items-start gap-4"
                  >
                    {hasThumb && (
                      <Link
                        to={localizePath(`/posts/series/${series.slug}`, locale)}
                        data-series-list-thumb
                        className="order-1 md:order-2 shrink-0 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
                        aria-label={`${series.title} — series`}
                      >
                        <div className="w-full aspect-square md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center dark:border dark:border-border">
                          <img
                            src={thumbSrc}
                            alt={series.title}
                            loading="lazy"
                            className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                            style={{ objectPosition: 'center center' }}
                            onError={(e) => {
                              const root = e.currentTarget.closest('[data-series-list-thumb]')
                              if (root instanceof HTMLElement) root.style.display = 'none'
                            }}
                          />
                        </div>
                      </Link>
                    )}
                    <div className="order-2 md:order-1 min-w-0 flex-1">
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
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                      <span className="inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {series.total} {series.total === 1 ? 'part' : 'parts'}
                      </span>
                      {isParsablePublishedDate(series.latestDate) && (
                        <Link
                          to={localizePath(`/posts/series/${series.slug}`, locale)}
                          className="text-muted-foreground hover:text-foreground hover:underline no-underline"
                        >
                          <time dateTime={series.latestDate}>
                            {formatPostPublishedDate(series.latestDate, languageTag)}
                          </time>
                        </Link>
                      )}
                      {series.totalReadMinutes != null && series.totalReadMinutes > 0 && (
                        <span>
                          {series.totalReadMinutes} {t.minRead}
                        </span>
                      )}
                      {series.primaryCategory && (
                        <span className="capitalize">
                          {series.primaryCategory.toLowerCase() === 'tweet'
                            ? t.xPost
                            : series.primaryCategory.toLowerCase() === 'essay'
                              ? t.categoryEssay
                              : series.primaryCategory}
                        </span>
                      )}
                    </div>
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
    const nfUrl = `${SITE_BASE}${localizePath(`/posts/series/${seriesSlug}`, locale)}`
    return (
      <>
        <Helmet>
          <title>Series not found — Mark Hendrickson</title>
          <meta name="description" content="The requested series does not exist or is not published." />
          <link rel="canonical" href={nfUrl} />
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="flex justify-center items-center min-h-content pt-8 pb-8 px-4 md:pt-8 md:pb-8 md:px-8">
          <div className="max-w-[600px] w-full">
            <p className="text-[15px] text-muted-foreground">Series not found.</p>
            <Link to={localizePath('/posts', locale)} className="text-sm text-muted-foreground hover:text-foreground hover:underline mt-4 inline-block">
              ← All posts
            </Link>
          </div>
        </div>
      </>
    )
  }

  const rawSeriesDesc =
    (seriesDescription ? seriesOverviewParagraphs(seriesDescription).join(' ') : null) ??
    `A ${total}-part series by Mark Hendrickson.`
  const seriesMetaDesc = stripLinksFromExcerpt(rawSeriesDesc).slice(0, 160)
  const displayTitleForMeta = seriesTitle || seriesSlug || 'Series'
  const latestPart = [...seriesPosts]
    .filter((p) => isParsablePublishedDate(p.publishedDate))
    .sort(
      (a, b) =>
        parseCalendarOrIsoDateString(b.publishedDate!).getTime() -
        parseCalendarOrIsoDateString(a.publishedDate!).getTime(),
    )[0]

  return (
    <>
      <Helmet>
        <title>{`${displayTitleForMeta} — Mark Hendrickson`}</title>
        <meta name="description" content={seriesMetaDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        {seriesAlternateUrls.map((alt) => (
          <link key={alt.locale} rel="alternate" hrefLang={alt.locale} href={alt.href} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_BASE}/`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={displayTitleForMeta} />
        <meta property="og:description" content={seriesMetaDesc} />
        <meta property="og:url" content={canonicalUrl} />
        {seriesHeroOgUrl != null && <meta property="og:image" content={seriesHeroOgUrl} />}
        {seriesHeroOgUrl != null && (
          <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
        )}
        {seriesHeroOgUrl != null && (
          <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
        )}
        {seriesHeroOgUrl != null && <meta name="twitter:image" content={seriesHeroOgUrl} />}
        {seriesHeroOgUrl != null && (
          <meta name="twitter:image:width" content={String(OG_IMAGE_WIDTH)} />
        )}
        {seriesHeroOgUrl != null && (
          <meta name="twitter:image:height" content={String(OG_IMAGE_HEIGHT)} />
        )}
        {latestPart?.publishedDate && (
          <meta property="article:published_time" content={latestPart.publishedDate} />
        )}
        {latestPart?.updatedDate && (
          <meta property="article:modified_time" content={latestPart.updatedDate} />
        )}
        <meta property="article:author" content={SITE_BASE} />
        <meta property="og:article:author" content="Mark Hendrickson" />
        <meta name="twitter:card" content={seriesHeroOgUrl ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:creator" content="@markmhendrickson" />
        <meta name="twitter:title" content={displayTitleForMeta} />
        <meta name="twitter:description" content={seriesMetaDesc} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWorkSeries',
            name: displayTitleForMeta,
            description: seriesMetaDesc,
            url: canonicalUrl,
            ...(seriesHeroOgUrl != null && { image: seriesHeroOgUrl }),
            ...(latestPart?.publishedDate && { datePublished: latestPart.publishedDate }),
            numberOfItems: total,
            author: {
              '@type': 'Person',
              name: 'Mark Hendrickson',
              url: SITE_BASE,
              sameAs: [
                'https://www.linkedin.com/in/markmhendrickson',
                'https://github.com/markmhendrickson',
                'https://x.com/markymark',
              ],
            },
            publisher: {
              '@type': 'Organization',
              name: 'Mark Hendrickson',
              logo: { '@type': 'ImageObject', url: `${SITE_BASE}/profile.jpg` },
            },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: t.navHome, item: `${SITE_BASE}${localizePath('/', locale)}` },
              { '@type': 'ListItem', position: 2, name: t.navPosts, item: `${SITE_BASE}${localizePath('/posts', locale)}` },
              {
                '@type': 'ListItem',
                position: 3,
                name: t.postsSeriesHeading,
                item: `${SITE_BASE}${localizePath('/posts/series', locale)}`,
              },
              { '@type': 'ListItem', position: 4, name: displayTitleForMeta, item: canonicalUrl },
            ],
          })}
        </script>
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
              <SeriesOverviewProse text={seriesDescription} variant="postBody" />
            )}
            {seriesHeroSrc && (
              <div className="mt-6 w-full border-b border-border pb-8 mb-8">
                <div className="w-full aspect-square md:aspect-auto">
                  <img
                    src={seriesHeroSrc}
                    alt={`${seriesTitle} — series illustration`}
                    className="w-full h-full max-h-none object-cover rounded dark:border dark:border-border md:h-auto md:max-h-[70vh] md:object-contain"
                  />
                </div>
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
