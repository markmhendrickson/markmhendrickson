import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, Rss } from 'lucide-react'
import {
  getPostImageSrc,
  isExcludedFromListing,
  isPublishedPost,
  formatPostPublishedDate,
  parseCalendarOrIsoDateString,
  stripSeriesPrefixFromTitle,
  isParsablePublishedDate,
} from '@/lib/utils'
import { HighlightedText, PostListingExcerpt } from '@/components/PostListingBlocks'
import { SeriesOverviewProse, seriesOverviewTextForProse } from '@/components/SeriesOverviewProse'
import { seriesSeriesHeroBasename } from '@/lib/seriesListThumb'
import { getSeriesOverview } from '@/lib/seriesOverview'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/i18n/LocaleContext'
import { supportedLocales, type SupportedLocale } from '@/i18n/config'
import { localizePath } from '@/i18n/routing'
import { getLocalizedPublicPosts } from '@/lib/postsLocaleData'
import { mergeLocalizedPublicWithPrivatePosts } from '@/lib/mergeDevPostCaches'
import { scorePostMatch, type SearchablePost } from '@/lib/postSearch'
import { isSeriesPartForPostsIndex, resolveSeriesSlug } from '@/lib/resolveSeriesSlug'
// Direct top-level import ensures Vite bundles the JSON even with VITE_SHOW_DRAFTS=true (prevents tree-shaking)
import privatePostsJson from '@cache/posts.private.json'
import { usePostsListSSR } from '@/contexts/PostsListSSRContext'

interface Post extends SearchablePost {
  slug: string
  title: string
  excerpt?: string
  body?: string
  summary?: string
  published: boolean | number | string
  publishedDate?: string
  updatedDate?: string
  createdDate?: string
  category?: string
  linkedTweetUrl?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageSquare?: string
  heroImageStyle?: string
  ogImage?: string
  excludeFromListing?: boolean | number | string
  showMetadata?: boolean
  tweetMetadata?: { images?: string[] }
  seriesPart?: number
  seriesTotal?: number
  series?: string
  seriesSlug?: string
  seriesDescription?: string
}

interface SeriesIndexBundle {
  slug: string
  title: string
  parts: Post[]
}

interface PostsProps {
  draft?: boolean
}

/** In dev, load private cache (includes drafts) so we can show "View drafts" and /posts/draft.
 * Default locale: `posts.private.json` overwrites public per slug (see `mergeDevPostCaches`).
 * Other locales: localized public wins on overlap. */
async function loadPostsData(includeDrafts: boolean, locale: SupportedLocale): Promise<Post[]> {
  const localizedPublicPosts = getLocalizedPublicPosts(locale) as unknown as Post[]
  if (!includeDrafts) return localizedPublicPosts
  if (import.meta.env.PROD && import.meta.env.VITE_SHOW_DRAFTS !== 'true') return localizedPublicPosts
  // Use directly-imported private posts (top-level import prevents tree-shaking)
  const privateList = (privatePostsJson as unknown as Post[])
  return mergeLocalizedPublicWithPrivatePosts(localizedPublicPosts, privateList, locale)
}

const isDev = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === 'true'

/** X/Twitter cutoff for "Show more" (280 chars) */
const TWEET_SHOW_MORE_CUTOFF = 280

const POSTS_PER_PAGE = 12

function TweetPreview({
  body,
  expanded,
  onToggle,
  cutoff,
  showMoreLabel,
  showLessLabel,
}: {
  body: string
  expanded: boolean
  onToggle: () => void
  cutoff: number
  showMoreLabel: string
  showLessLabel: string
}) {
  const truncated = body.length > cutoff
  const displayText = truncated && !expanded ? body.slice(0, cutoff) : body

  return (
    <p className="text-[15px] text-muted-foreground mb-3 leading-relaxed whitespace-pre-wrap">
      {displayText}
      {truncated && !expanded && (
        <>
          {' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground hover:underline bg-transparent border-0 p-0 cursor-pointer font-inherit text-inherit"
          >
            {showMoreLabel}
          </button>
        </>
      )}
      {truncated && expanded && (
        <>
          {' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground hover:underline bg-transparent border-0 p-0 cursor-pointer font-inherit text-inherit"
          >
            {showLessLabel}
          </button>
        </>
      )}
    </p>
  )
}

/** Coerce SSR list item to full Post shape for list rendering. */
function ssrPostToPost(p: {
  slug: string
  title?: string
  excerpt?: string
  publishedDate?: string
  updatedDate?: string
  category?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageSquare?: string
  ogImage?: string
  linkedTweetUrl?: string
  series?: string
  seriesSlug?: string
  seriesPart?: number
  seriesTotal?: number
}): Post {
  return {
    slug: p.slug,
    title: p.title ?? '',
    excerpt: p.excerpt,
    published: true,
    publishedDate: p.publishedDate,
    updatedDate: p.updatedDate,
    category: p.category,
    readTime: p.readTime,
    tags: p.tags,
    heroImage: p.heroImage,
    heroImageSquare: p.heroImageSquare,
    ogImage: p.ogImage,
    linkedTweetUrl: p.linkedTweetUrl,
    series: p.series,
    seriesSlug: p.seriesSlug,
    seriesPart: p.seriesPart,
    seriesTotal: p.seriesTotal,
  }
}

export default function Posts({ draft = false }: PostsProps) {
  const { locale, languageTag, t } = useLocale()
  const ssrPosts = usePostsListSSR()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const [searchInput, setSearchInput] = useState(query)
  const [expandedTweetSlugs, setExpandedTweetSlugs] = useState<Set<string>>(new Set())
  const [posts, setPosts] = useState<Post[]>(() => (ssrPosts != null && !draft ? ssrPosts.map(ssrPostToPost) : []))
  /** All published posts including excludeFromListing, for search only */
  const [postsForSearch, setPostsForSearch] = useState<Post[]>(() => (ssrPosts != null && !draft ? ssrPosts.map(ssrPostToPost) : []))
  const [draftCount, setDraftCount] = useState(0)

  /** Published /posts list: exclude series parts (they appear only under the series block). Draft index unchanged. */
  const standalonePosts = useMemo(
    () => (draft ? posts : posts.filter((p) => !isSeriesPartForPostsIndex(p))),
    [posts, draft],
  )

  const postsForSearchStandalone = useMemo(
    () => (draft ? postsForSearch : postsForSearch.filter((p) => !isSeriesPartForPostsIndex(p))),
    [postsForSearch, draft],
  )

  const filteredPosts = useMemo(() => {
    if (!query) return standalonePosts
    return postsForSearchStandalone
      .map((post) => ({ post, score: scorePostMatch(post, query) }))
      .filter((entry): entry is { post: Post; score: number } => entry.score != null)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        const tA = a.post.publishedDate ? parseCalendarOrIsoDateString(a.post.publishedDate).getTime() : 0
        const tB = b.post.publishedDate ? parseCalendarOrIsoDateString(b.post.publishedDate).getTime() : 0
        if (tB !== tA) return tB - tA
        return (a.post.slug || '').localeCompare(b.post.slug || '')
      })
      .map((entry) => entry.post)
  }, [standalonePosts, query, postsForSearchStandalone])

  /** Published multi-part series on the index: parts sorted by part number, series keyed by latest published date. */
  const seriesIndexBundles = useMemo<SeriesIndexBundle[]>(() => {
    if (draft) return []
    const grouped = new Map<string, Post[]>()
    for (const post of posts) {
      const sSlug = resolveSeriesSlug(post)
      if (!sSlug || !post.series?.trim()) continue
      if (!isPublishedPost(post)) continue
      const arr = grouped.get(sSlug) ?? []
      arr.push(post)
      grouped.set(sSlug, arr)
    }
    return Array.from(grouped.entries()).map(([slug, parts]) => {
      const partsByPub = [...parts].sort((a, b) => {
        const tA = a.publishedDate ? parseCalendarOrIsoDateString(a.publishedDate).getTime() : 0
        const tB = b.publishedDate ? parseCalendarOrIsoDateString(b.publishedDate).getTime() : 0
        if (tB !== tA) return tB - tA
        return (a.slug || '').localeCompare(b.slug || '')
      })
      const title = parts.find((p) => p.series?.trim())?.series?.trim() ?? slug
      return { slug, title, parts: partsByPub }
    })
  }, [posts, draft, locale])

  type FeedItem =
    | { kind: 'post'; post: Post; sortKey: number }
    | { kind: 'series'; bundle: SeriesIndexBundle; sortKey: number }

  /** Merged, date-sorted feed of standalone posts and series bundles (non-search mode only). */
  const mergedFeed = useMemo<FeedItem[]>(() => {
    if (draft || query.trim()) return []
    const items: FeedItem[] = [
      ...filteredPosts.map((post): FeedItem => ({
        kind: 'post',
        post,
        sortKey: post.publishedDate ? parseCalendarOrIsoDateString(post.publishedDate).getTime() : 0,
      })),
      ...seriesIndexBundles.map((bundle): FeedItem => ({
        kind: 'series',
        bundle,
        sortKey: bundle.parts[0]?.publishedDate
          ? parseCalendarOrIsoDateString(bundle.parts[0].publishedDate).getTime()
          : 0,
      })),
    ]
    items.sort((a, b) => {
      if (b.sortKey !== a.sortKey) return b.sortKey - a.sortKey
      const aSlug = a.kind === 'post' ? a.post.slug : a.bundle.slug
      const bSlug = b.kind === 'post' ? b.post.slug : b.bundle.slug
      return aSlug.localeCompare(bSlug)
    })
    return items
  }, [draft, query, filteredPosts, seriesIndexBundles])

  /** When searching, show only matched standalone posts (no series bundles). Otherwise use the merged date-sorted feed. */
  const feedForPagination = useMemo<FeedItem[]>(() => {
    if (draft) return filteredPosts.map((post): FeedItem => ({ kind: 'post', post, sortKey: 0 }))
    if (query.trim()) return filteredPosts.map((post): FeedItem => ({ kind: 'post', post, sortKey: 0 }))
    return mergedFeed
  }, [draft, query, filteredPosts, mergedFeed])

  const pageParam = searchParams.get('page')
  const totalPages = Math.max(1, Math.ceil(feedForPagination.length / POSTS_PER_PAGE))
  const currentPage = Math.min(totalPages, Math.max(1, parseInt(pageParam ?? '1', 10) || 1))
  const paginatedFeed = useMemo(() => {
    if (draft) return feedForPagination
    const start = (currentPage - 1) * POSTS_PER_PAGE
    return feedForPagination.slice(start, start + POSTS_PER_PAGE)
  }, [feedForPagination, currentPage, draft])

  const setPage = (page: number) => {
    const next = new URLSearchParams(searchParams)
    if (page <= 1) next.delete('page')
    else next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }

  // Sync local search input from URL when navigating (e.g. back button)
  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    const next = new URLSearchParams()
    if (value.trim()) {
      next.set('q', value.trim())
    }
    setSearchParams(next, { replace: true })
  }

  const defaultOgImage = 'https://markmhendrickson.com/images/og-default-1200x630.jpg'
  const ogImageWidth = 1200
  const ogImageHeight = 630

  useEffect(() => {
    // When we have SSR data for the index, skip client fetch to avoid flash and duplicate work
    if (!draft && ssrPosts != null && ssrPosts.length > 0) return

    const loadPosts = async () => {
      const postsData: Post[] = await loadPostsData(isDev, locale)

      if (isDev) {
        const drafts = postsData.filter(post => !isPublishedPost(post))
        setDraftCount(drafts.length)
      }

      // Index list: draft route shows only drafts; /posts shows only published, excluding excludeFromListing
      const filtered = postsData
        .filter(post => !isExcludedFromListing(post))
        .filter(post => draft ? !isPublishedPost(post) : isPublishedPost(post))

      // Sort: published list by publishedDate desc (newest first), slug asc for ties. Must match Post.tsx publishedListOrder and cache script.
      const sorted = [...filtered].sort((a, b) => {
        const dA = draft ? (a.updatedDate ?? a.createdDate) : a.publishedDate
        const dB = draft ? (b.updatedDate ?? b.createdDate) : b.publishedDate
        const tA = dA ? parseCalendarOrIsoDateString(dA).getTime() : 0
        const tB = dB ? parseCalendarOrIsoDateString(dB).getTime() : 0
        if (tB !== tA) return tB - tA
        return (a.slug || '').localeCompare(b.slug || '')
      })

      setPosts(sorted)

      // Search pool: all published posts (including excludeFromListing), for search-only matches
      if (!draft) {
        const allPublished = postsData
          .filter((post) => isPublishedPost(post))
          .sort((a, b) => {
            const tA = a.publishedDate ? parseCalendarOrIsoDateString(a.publishedDate).getTime() : 0
            const tB = b.publishedDate ? parseCalendarOrIsoDateString(b.publishedDate).getTime() : 0
            if (tB !== tA) return tB - tA
            return (a.slug || '').localeCompare(b.slug || '')
          })
        setPostsForSearch(allPublished)
      } else {
        setPostsForSearch([])
      }
    }

    loadPosts()
  }, [isDev, draft, locale, ssrPosts])

  const formatDate = (dateString: string | undefined): string =>
    formatPostPublishedDate(dateString, languageTag)

  const pageTitle = draft ? t.drafts : t.postsTitle
  const pageDesc = draft
    ? t.draftsDescription
    : t.postsDescription
  const pagePath = draft ? '/posts/draft' : '/posts'

  return (
    <>
      <Helmet>
        <title>{pageTitle} -- Mark Hendrickson</title>
        <meta name="description" content={pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={`https://markmhendrickson.com${localizePath(pagePath, locale)}`} />
        {supportedLocales.map((altLocale) => (
          <link
            key={altLocale}
            rel="alternate"
            hrefLang={altLocale}
            href={`https://markmhendrickson.com${localizePath(pagePath, altLocale)}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://markmhendrickson.com/posts" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${pageTitle} -- Mark Hendrickson`} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`https://markmhendrickson.com${localizePath(pagePath, locale)}`} />
        <meta property="og:image" content={defaultOgImage} />
        <meta property="og:image:width" content={String(ogImageWidth)} />
        <meta property="og:image:height" content={String(ogImageHeight)} />
        <meta name="twitter:creator" content="@markmhendrickson" />
        <meta name="twitter:title" content={`${pageTitle} -- Mark Hendrickson`} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={defaultOgImage} />
        <meta name="twitter:image:width" content={String(ogImageWidth)} />
        <meta name="twitter:image:height" content={String(ogImageHeight)} />
        {!draft && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: `${pageTitle} -- Mark Hendrickson`,
              description: pageDesc,
              url: `https://markmhendrickson.com${localizePath(pagePath, locale)}`,
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: standalonePosts.slice(0, 20).map((post, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  url: `https://markmhendrickson.com${localizePath(`/posts/${post.slug}`, locale)}`,
                  name: stripSeriesPrefixFromTitle(post.title || post.slug, post.series) || post.slug,
                })),
              },
            })}
          </script>
        )}
      </Helmet>
    <div className="flex justify-center items-center min-h-content pt-8 pb-4 px-4 md:py-20 md:px-8">
      <div className="max-w-[600px] w-full">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <h1 className="text-[28px] font-medium tracking-tight">
            {pageTitle}
            {query && (
              <span className="text-[17px] font-normal text-muted-foreground ml-2">
                ("{query}")
              </span>
            )}
          </h1>
          <div className="flex items-center gap-3 shrink-0">
            {!draft && (
              <a
                href="https://markmhendrickson.com/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[15px] text-muted-foreground hover:text-foreground hover:underline"
                aria-label={t.navRss}
              >
                <Rss className="w-4 h-4" aria-hidden />
                <span>{t.navRss}</span>
              </a>
            )}
            {!draft && isDev && draftCount > 0 && (
              <Link
                to={localizePath('/posts/draft', locale)}
                className="text-[15px] text-muted-foreground hover:text-foreground hover:underline"
              >
                {t.viewDrafts} ({draftCount})
              </Link>
            )}
            {draft && (
              <Link
                to={localizePath('/posts', locale)}
                className="text-[15px] text-muted-foreground hover:text-foreground hover:underline"
              >
                ← {t.backToPosts}
              </Link>
            )}
          </div>
        </div>
        <p className="text-[17px] text-muted-foreground mb-6 font-light tracking-wide">
          {pageDesc}
        </p>

        {!draft && (
          <div className="mb-8 flex w-full min-w-0 items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              placeholder={t.searchPosts}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-9 min-w-0 max-w-sm flex-1 text-base md:text-sm"
              aria-label={t.searchPosts}
            />
          </div>
        )}

        <div className="space-y-8">
          {paginatedFeed.length === 0 ? (
            <p className="text-[15px] text-muted-foreground">
              {query
                ? `${t.noMatchPrefix} "${query}".`
                : draft
                  ? t.noDraftsYet
                  : t.noPostsYet}
            </p>
          ) : (
            paginatedFeed.map((item) => {
              if (item.kind === 'series') {
                const { slug, title, parts } = item.bundle
                const byPart = [...parts].sort((a, b) => (a.seriesPart ?? 0) - (b.seriesPart ?? 0))
                const maxDeclaredSeriesTotal = parts.reduce(
                  (max, p) =>
                    typeof p.seriesTotal === 'number' && p.seriesTotal > 0 && p.seriesTotal > max
                      ? p.seriesTotal
                      : max,
                  0,
                )
                const partCountForLabel = Math.max(parts.length, maxDeclaredSeriesTotal)
                const overviewRaw = getSeriesOverview(slug, byPart, locale)
                const description = overviewRaw ? seriesOverviewTextForProse(overviewRaw) : undefined
                const thumbBasename = seriesSeriesHeroBasename(slug)
                const thumbSrc = getPostImageSrc(thumbBasename)
                const latestDate = parts[0]?.publishedDate
                const primaryCategory = byPart.find((p) => (p.category || '').trim())?.category?.trim()
                return (
                  <article
                    key={`series-${slug}`}
                    className="border-b border-border pb-8 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch md:items-start gap-4"
                  >
                    <Link
                      to={localizePath(`/posts/series/${slug}`, locale)}
                      data-series-thumb-posts-index
                      className="order-1 md:order-2 shrink-0 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
                      aria-label={`${title} -- ${t.postsSeriesSeriesPage}`}
                    >
                      <div className="w-full aspect-square md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center dark:border dark:border-border">
                        <img
                          src={thumbSrc}
                          alt={title}
                          loading="lazy"
                          className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                          style={{ objectPosition: 'center center' }}
                          onError={(e) => {
                            const root = e.currentTarget.closest('[data-series-thumb-posts-index]')
                            if (root instanceof HTMLElement) root.style.display = 'none'
                          }}
                        />
                      </div>
                    </Link>
                    <div className="order-2 md:order-1 min-w-0 flex-1">
                      <h2 className="text-[20px] font-medium mb-2 tracking-tight">
                        <Link
                          to={localizePath(`/posts/series/${slug}`, locale)}
                          className="text-foreground no-underline hover:underline"
                        >
                          {title}
                        </Link>
                      </h2>
                      {description ? (
                        <SeriesOverviewProse
                          text={description}
                          paragraphClassName="text-[15px] text-muted-foreground leading-relaxed"
                          maxParagraphs={1}
                        />
                      ) : null}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                        {isParsablePublishedDate(latestDate) && (
                          <Link
                            to={localizePath(`/posts/series/${slug}`, locale)}
                            className="text-muted-foreground hover:text-foreground hover:underline no-underline"
                          >
                            <time dateTime={latestDate}>
                              {formatPostPublishedDate(latestDate, languageTag)}
                            </time>
                          </Link>
                        )}
                        <span>
                          {partCountForLabel}{' '}
                          {partCountForLabel === 1 ? t.postsSeriesPartSingular : t.postsSeriesPartPlural}
                        </span>
                        {primaryCategory ? (
                          <span className="capitalize">
                            {primaryCategory.toLowerCase() === 'tweet'
                              ? t.xPost
                              : primaryCategory.toLowerCase() === 'essay'
                                ? t.categoryEssay
                                : primaryCategory}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              }

              const post = item.post
              return (
                <article key={post.slug} className="border-b border-border pb-8 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch md:items-start gap-4">
                  {(post.heroImage || post.ogImage || post.tweetMetadata?.images?.[0]) && (
                    <Link
                      to={localizePath(`/posts/${post.slug}`, locale)}
                      className="order-1 md:order-2 shrink-0 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
                    >
                      <div className="w-full aspect-square md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center dark:border dark:border-border">
                        <img
                          src={getPostImageSrc(post.heroImageSquare ?? post.heroImage ?? post.ogImage ?? post.tweetMetadata?.images?.[0] ?? '')}
                          alt={stripSeriesPrefixFromTitle(post.title || '', post.series) || ''}
                          className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                          style={{ objectPosition: 'center center' }}
                        />
                      </div>
                    </Link>
                  )}
                  <div className="order-2 md:order-1 min-w-0 flex-1">
                    {(post.category || '').toLowerCase() === 'tweet' ? (
                      <TweetPreview
                        body={post.body ?? ''}
                        expanded={expandedTweetSlugs.has(post.slug)}
                        onToggle={() => {
                          setExpandedTweetSlugs(prev => {
                            const next = new Set(prev)
                            if (next.has(post.slug)) next.delete(post.slug)
                            else next.add(post.slug)
                            return next
                          })
                        }}
                        cutoff={TWEET_SHOW_MORE_CUTOFF}
                        showMoreLabel={t.showMore}
                        showLessLabel={t.showLess}
                      />
                    ) : (
                      <h2 className="text-[20px] font-medium mb-2 tracking-tight">
                        <Link
                          to={localizePath(`/posts/${post.slug}`, locale)}
                          className="text-foreground no-underline hover:underline"
                        >
                          <HighlightedText
                            text={stripSeriesPrefixFromTitle(post.title, post.series)}
                            query={query}
                          />
                        </Link>
                      </h2>
                    )}
                    <PostListingExcerpt
                      excerpt={post.excerpt}
                      isTweet={(post.category || '').toLowerCase() === 'tweet'}
                      query={query}
                    />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                      {post.seriesPart != null && post.seriesTotal != null && (
                        <span className="inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Part {post.seriesPart} of {post.seriesTotal}
                        </span>
                      )}
                      {post.publishedDate && (
                        <Link
                          to={localizePath(`/posts/${post.slug}`, locale)}
                          className="text-muted-foreground hover:text-foreground hover:underline no-underline"
                        >
                          <time dateTime={post.publishedDate}>
                            {formatDate(post.publishedDate)}
                          </time>
                        </Link>
                      )}
                      {post.readTime && (
                        <span>{post.readTime} {t.minRead}</span>
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
            })
          )}

        {!draft && feedForPagination.length > 0 && (
          <nav
            className="flex flex-wrap items-center justify-center gap-3 pt-8 pb-4 mt-8"
            aria-label="Pagination"
          >
            <span className="text-[13px] text-muted-foreground mr-2">
              {t.paginationPage} {currentPage} {t.paginationOf} {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="text-[15px] text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:no-underline bg-transparent border border-border px-3 py-1.5 rounded"
                aria-label={t.paginationPrevious}
              >
                {t.paginationPrevious}
              </button>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="text-[15px] text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:no-underline bg-transparent border border-border px-3 py-1.5 rounded"
                aria-label={t.paginationNext}
              >
                {t.paginationNext}
              </button>
            </div>
          </nav>
        )}
        </div>
      </div>
    </div>
    </>
  )
}
