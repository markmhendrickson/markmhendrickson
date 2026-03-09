import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search } from 'lucide-react'
import { stripLinksFromExcerpt, getPostImageSrc, isExcludedFromListing, isPublishedPost } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'
import { getLocalizedPublicPosts } from '@/lib/postsLocaleData'

interface Post {
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
  excludeFromListing?: boolean | number | string
  showMetadata?: boolean
  tweetMetadata?: { images?: string[] }
}

interface PostsProps {
  draft?: boolean
}

/** In dev, load private cache (includes drafts) so we can show "View drafts" and /posts/draft.
 * Prefer localized public cache when a slug exists in both. */
async function loadPostsData(includeDrafts: boolean, locale: 'en' | 'es' | 'ca'): Promise<Post[]> {
  const localizedPublicPosts = getLocalizedPublicPosts(locale) as unknown as Post[]
  if (!includeDrafts) return localizedPublicPosts
  if (import.meta.env.PROD) return localizedPublicPosts
  try {
    const privateData = await import('@cache/posts.private.json')
    const privateList = (privateData.default ?? privateData) as Post[]
    const mergedBySlug = new Map<string, Post>()
    for (const post of localizedPublicPosts) {
      if (post.slug) mergedBySlug.set(post.slug, post)
    }
    for (const post of privateList) {
      if (!post.slug) continue
      if (!mergedBySlug.has(post.slug)) mergedBySlug.set(post.slug, post)
    }
    return Array.from(mergedBySlug.values())
  } catch {
    return localizedPublicPosts
  }
}

function matchQuery(post: Post, q: string): boolean {
  const lower = q.toLowerCase()
  const title = (post.title ?? '').toLowerCase()
  const excerpt = (post.excerpt ?? '').toLowerCase()
  const body = (post.body ?? '').toLowerCase()
  const summary = (post.summary ?? '').toLowerCase()
  const tags = (post.tags ?? []).join(' ').toLowerCase()
  return title.includes(lower) || excerpt.includes(lower) || body.includes(lower) || summary.includes(lower) || tags.includes(lower)
}

const isDev = import.meta.env.DEV

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

export default function Posts({ draft = false }: PostsProps) {
  const { locale, languageTag, t } = useLocale()
  const uiCopy = {
    en: { showMore: 'Show more', showLess: 'Show less', noMatchPrefix: 'No posts match' },
    es: { showMore: 'Ver más', showLess: 'Ver menos', noMatchPrefix: 'No hay publicaciones que coincidan con' },
    ca: { showMore: 'Mostra més', showLess: 'Mostra menys', noMatchPrefix: 'No hi ha publicacions que coincideixin amb' },
  } as const
  const ui = uiCopy[locale]
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const [searchInput, setSearchInput] = useState(query)
  const [expandedTweetSlugs, setExpandedTweetSlugs] = useState<Set<string>>(new Set())
  const [posts, setPosts] = useState<Post[]>([])
  /** All published posts including excludeFromListing, for search only */
  const [postsForSearch, setPostsForSearch] = useState<Post[]>([])
  const [draftCount, setDraftCount] = useState(0)

  const filteredPosts = useMemo(() => {
    if (!query) return posts
    return postsForSearch.filter((post) => matchQuery(post, query))
  }, [posts, query, postsForSearch])

  const pageParam = searchParams.get('page')
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE))
  const currentPage = Math.min(totalPages, Math.max(1, parseInt(pageParam ?? '1', 10) || 1))
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE
    return filteredPosts.slice(start, start + POSTS_PER_PAGE)
  }, [filteredPosts, currentPage])

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
        const tA = dA ? new Date(dA).getTime() : 0
        const tB = dB ? new Date(dB).getTime() : 0
        if (tB !== tA) return tB - tA
        return (a.slug || '').localeCompare(b.slug || '')
      })

      setPosts(sorted)

      // Search pool: all published posts (including excludeFromListing) for search results only
      if (!draft) {
        const allPublished = postsData
          .filter(post => isPublishedPost(post))
          .sort((a, b) => {
            const tA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0
            const tB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0
            if (tB !== tA) return tB - tA
            return (a.slug || '').localeCompare(b.slug || '')
          })
        setPostsForSearch(allPublished)
      } else {
        setPostsForSearch([])
      }
    }

    loadPosts()
  }, [isDev, draft, locale])

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(languageTag, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const pageTitle = draft ? t.drafts : t.postsTitle
  const pageDesc = draft
    ? t.draftsDescription
    : t.postsDescription

  return (
    <>
      <Helmet>
        <title>{pageTitle} — Mark Hendrickson</title>
        <meta name="description" content={pageDesc} />
        <meta name="author" content="Mark Hendrickson" />
        <meta property="og:title" content={`${pageTitle} — Mark Hendrickson`} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`https://markmhendrickson.com${localizePath('/posts', locale)}`} />
        <meta property="og:image" content={defaultOgImage} />
        <meta property="og:image:width" content={String(ogImageWidth)} />
        <meta property="og:image:height" content={String(ogImageHeight)} />
        <meta name="twitter:creator" content="@markmhendrickson" />
        <meta name="twitter:title" content={`${pageTitle} — Mark Hendrickson`} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={defaultOgImage} />
        <meta name="twitter:image:width" content={String(ogImageWidth)} />
        <meta name="twitter:image:height" content={String(ogImageHeight)} />
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
          {!draft && isDev && draftCount > 0 && (
            <Link
              to={localizePath('/posts/draft', locale)}
              className="text-[15px] text-muted-foreground hover:text-foreground hover:underline shrink-0"
            >
              {t.viewDrafts} ({draftCount})
            </Link>
          )}
          {draft && (
            <Link
              to={localizePath('/posts', locale)}
              className="text-[15px] text-muted-foreground hover:text-foreground hover:underline shrink-0"
            >
              ← {t.backToPosts}
            </Link>
          )}
        </div>
        <p className="text-[17px] text-muted-foreground mb-6 font-light tracking-wide">
          {pageDesc}
        </p>

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
                ? `${ui.noMatchPrefix} “${query}”.`
                : draft
                  ? t.noDraftsYet
                  : t.noPostsYet}
            </p>
          ) : (
            paginatedPosts.map((post) => (
              <article key={post.slug} className="border-b border-border pb-8 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch gap-4">
                {(post.heroImage || post.tweetMetadata?.images?.[0]) && (
                  <Link
                    to={localizePath(`/posts/${post.slug}`, locale)}
                    className="order-1 md:order-2 shrink-0 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
                  >
                    <div className="w-full aspect-square md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center dark:border dark:border-border">
                      <img
                        src={getPostImageSrc(post.heroImageSquare ?? post.heroImage ?? post.tweetMetadata?.images?.[0] ?? '')}
                        alt=""
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
                      showMoreLabel={ui.showMore}
                      showLessLabel={ui.showLess}
                    />
                  ) : (
                    <h2 className="text-[20px] font-medium mb-2 tracking-tight">
                      <Link
                        to={localizePath(`/posts/${post.slug}`, locale)}
                        className="text-foreground no-underline hover:underline"
                      >
                        {post.title}
                      </Link>
                    </h2>
                  )}
                  {(post.category || '').toLowerCase() !== 'tweet' && post.excerpt && (
                    <p className="text-[15px] text-muted-foreground mb-3 leading-relaxed">
                      {stripLinksFromExcerpt(post.excerpt)}
                    </p>
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
                        {(post.category || '').toLowerCase() === 'tweet' ? t.xPost : post.category}
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
