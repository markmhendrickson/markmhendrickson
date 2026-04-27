import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, Rss } from 'lucide-react'
import {
  stripLinksFromExcerpt,
  parseExcerptAsBulletLines,
  getPostImageSrc,
  isExcludedFromListing,
  isPublishedPost,
  formatPostPublishedDate,
  parseCalendarOrIsoDateString,
} from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/i18n/LocaleContext'
import { supportedLocales, type SupportedLocale } from '@/i18n/config'
import { localizePath } from '@/i18n/routing'
import { getLocalizedPublicPosts } from '@/lib/postsLocaleData'
import { getHighlightedParts, scorePostMatch, type SearchablePost } from '@/lib/postSearch'
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
}

interface PostsProps {
  draft?: boolean
}

/** In dev, load private cache (includes drafts) so we can show "View drafts" and /posts/draft.
 * Prefer localized public cache when a slug exists in both. */
async function loadPostsData(includeDrafts: boolean, locale: SupportedLocale): Promise<Post[]> {
  const localizedPublicPosts = getLocalizedPublicPosts(locale) as unknown as Post[]
  if (!includeDrafts) return localizedPublicPosts
  if (import.meta.env.PROD && import.meta.env.VITE_SHOW_DRAFTS !== 'true') return localizedPublicPosts
  // Use directly-imported private posts (top-level import prevents tree-shaking)
  const privateList = (privatePostsJson as unknown as Post[])
  const mergedBySlug = new Map<string, Post>()
  for (const post of localizedPublicPosts) {
    if (post.slug) mergedBySlug.set(post.slug, post)
  }
  for (const post of privateList) {
    if (!post.slug) continue
    if (!mergedBySlug.has(post.slug)) mergedBySlug.set(post.slug, post)
  }
  return Array.from(mergedBySlug.values())
}

const isDev = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === 'true'

/** X/Twitter cutoff for "Show more" (280 chars) */
const TWEET_SHOW_MORE_CUTOFF = 280

const POSTS_PER_PAGE = 12

function HighlightedText({ text, query }: { text: string; query: string }) {
  const parts = useMemo(() => getHighlightedParts(text, query), [text, query])

  return (
    <>
      {parts.map((part, index) => (
        part.highlight ? (
          <mark
            key={`${part.text}-${index}`}
            className="bg-yellow-200/70 dark:bg-yellow-500/30 text-inherit rounded-sm px-0.5"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        )
      ))}
    </>
  )
}

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

function PostListingExcerpt({ excerpt, isTweet, query }: { excerpt?: string; isTweet: boolean; query: string }) {
  if (!excerpt || isTweet) return null
  const bullets = parseExcerptAsBulletLines(excerpt)
  if (bullets?.length) {
    return (
      <ul className="list-disc pl-5 mb-3 space-y-1.5 text-[15px] text-muted-foreground leading-relaxed">
        {bullets.slice(0, 6).map((item, i) => (
          <li key={i}>
            <HighlightedText text={item} query={query} />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <p className="text-[15px] text-muted-foreground mb-3 leading-relaxed">
      <HighlightedText text={stripLinksFromExcerpt(excerpt)} query={query} />
    </p>
  )
}

/** Coerce SSR list item to full Post shape for list rendering. */
function ssrPostToPost(p: { slug: string; title?: string; excerpt?: string; publishedDate?: string; updatedDate?: string; category?: string; readTime?: number; tags?: string[]; heroImage?: string; heroImageSquare?: string; ogImage?: string; linkedTweetUrl?: string }): Post {
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

  const filteredPosts = useMemo(() => {
    if (!query) return posts
    return postsForSearch
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
  }, [posts, query, postsForSearch])

  const pageParam = searchParams.get('page')
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE))
  const currentPage = Math.min(totalPages, Math.max(1, parseInt(pageParam ?? '1', 10) || 1))
  const paginatedPosts = useMemo(() => {
    // Dev-only draft index: list all drafts (pagination UI is not shown for this route).
    if (draft) return filteredPosts
    const start = (currentPage - 1) * POSTS_PER_PAGE
    return filteredPosts.slice(start, start + POSTS_PER_PAGE)
  }, [filteredPosts, currentPage, draft])

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

      // Search pool: all published posts (including excludeFromListing) for search results only
      if (!draft) {
        const allPublished = postsData
          .filter(post => isPublishedPost(post))
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
        <title>{pageTitle} — Mark Hendrickson</title>
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
        <meta property="og:title" content={`${pageTitle} — Mark Hendrickson`} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`https://markmhendrickson.com${localizePath(pagePath, locale)}`} />
        <meta property="og:image" content={defaultOgImage} />
        <meta property="og:image:width" content={String(ogImageWidth)} />
        <meta property="og:image:height" content={String(ogImageHeight)} />
        <meta name="twitter:creator" content="@markmhendrickson" />
        <meta name="twitter:title" content={`${pageTitle} — Mark Hendrickson`} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={defaultOgImage} />
        <meta name="twitter:image:width" content={String(ogImageWidth)} />
        <meta name="twitter:image:height" content={String(ogImageHeight)} />
        {!draft && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: `${pageTitle} — Mark Hendrickson`,
              description: pageDesc,
              url: `https://markmhendrickson.com${localizePath(pagePath, locale)}`,
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: posts.slice(0, 20).map((post, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  url: `https://markmhendrickson.com${localizePath(`/posts/${post.slug}`, locale)}`,
                  name: post.title || post.slug,
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
                (“{query}”)
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

        {!draft && isDev && (
          <div className="mb-6">
            <Link
              to={localizePath('/posts/series', locale)}
              className="text-[15px] text-muted-foreground hover:text-foreground hover:underline"
            >
              View post series
            </Link>
          </div>
        )}

        {!draft && (
          <div className="mb-8 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
            <Input
              type="search"
              placeholder={t.searchPosts}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-sm h-9 text-base md:text-sm"
              aria-label={t.searchPosts}
            />
          </div>
        )}

        <div className="space-y-8">
          {filteredPosts.length === 0 ? (
            <p className="text-[15px] text-muted-foreground">
              {query
                ? `${t.noMatchPrefix} “${query}”.`
                : draft
                  ? t.noDraftsYet
                  : t.noPostsYet}
            </p>
          ) : (
            paginatedPosts.map((post) => (
              <article key={post.slug} className="border-b border-border pb-8 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch md:items-start gap-4">
                {(post.heroImage || post.ogImage || post.tweetMetadata?.images?.[0]) && (
                  <Link
                    to={localizePath(`/posts/${post.slug}`, locale)}
                    className="order-1 md:order-2 shrink-0 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
                  >
                    <div className="w-full aspect-square md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center dark:border dark:border-border">
                      <img
                        src={getPostImageSrc(post.heroImageSquare ?? post.heroImage ?? post.ogImage ?? post.tweetMetadata?.images?.[0] ?? '')}
                        alt={post.title || ''}
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
                        <HighlightedText text={post.title} query={query} />
                      </Link>
                    </h2>
                  )}
                  <PostListingExcerpt
                    excerpt={post.excerpt}
                    isTweet={(post.category || '').toLowerCase() === 'tweet'}
                    query={query}
                  />
                  {post.seriesPart != null && post.seriesTotal != null && (
                    <div className="mb-1.5">
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Part {post.seriesPart} of {post.seriesTotal}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
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
            ))
          )}

        {!draft && filteredPosts.length > 0 && (
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
