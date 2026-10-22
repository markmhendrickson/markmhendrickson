import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, Rss } from 'lucide-react'
import {
  isPublishedPost,
  stripSeriesPrefixFromTitle,
} from '@/lib/utils'
import { PostsFeedItems } from '@/components/PostsFeedItems'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/i18n/LocaleContext'
import { supportedLocales } from '@/i18n/config'
import { localizePath } from '@/i18n/routing'
import { usePostsListSSR } from '@/contexts/PostsListSSRContext'
import {
  type FeedItem,
  type Post,
  buildMergedFeed,
  buildSearchFeed,
  buildSeriesIndexBundles,
  loadPostsData,
  paginateFeed,
  postsIncludeDrafts,
  selectListingPosts,
  selectSearchPool,
  selectStandalonePosts,
  ssrPostToPost,
} from '@/lib/postsFeed'

interface PostsProps {
  draft?: boolean
}

const isDev = postsIncludeDrafts

export default function Posts({ draft = false }: PostsProps) {
  const { locale, t } = useLocale()
  const ssrPosts = usePostsListSSR()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const [searchInput, setSearchInput] = useState(query)
  const [posts, setPosts] = useState<Post[]>(() => (ssrPosts != null && !draft ? ssrPosts.map(ssrPostToPost) : []))
  /** All published posts including excludeFromListing, for search only */
  const [postsForSearch, setPostsForSearch] = useState<Post[]>(() => (ssrPosts != null && !draft ? ssrPosts.map(ssrPostToPost) : []))
  const [draftCount, setDraftCount] = useState(0)

  /** Published /posts list: exclude series parts (they appear only under the series block). Draft index unchanged. */
  const standalonePosts = useMemo(() => selectStandalonePosts(posts, draft), [posts, draft])

  /** Published multi-part series on the index: parts sorted by part number, series keyed by latest published date. */
  const seriesIndexBundles = useMemo(() => buildSeriesIndexBundles(posts, draft), [posts, draft, locale])

  /** Merged, date-sorted feed of standalone posts and series bundles (non-search mode only). */
  const mergedFeed = useMemo<FeedItem[]>(
    () => buildMergedFeed(draft, query, standalonePosts, seriesIndexBundles),
    [draft, query, standalonePosts, seriesIndexBundles],
  )

  const searchFeed = useMemo(
    () => buildSearchFeed(postsForSearch, seriesIndexBundles, query, locale),
    [postsForSearch, seriesIndexBundles, query, locale],
  )

  /** Search ranks series and posts together; other views keep the existing date ordering. */
  const feedForPagination = useMemo<FeedItem[]>(() => {
    if (draft) return standalonePosts.map((post): FeedItem => ({ kind: 'post', post, sortKey: 0 }))
    if (query.trim()) return searchFeed
    return mergedFeed
  }, [draft, query, standalonePosts, searchFeed, mergedFeed])

  const pageParam = searchParams.get('page')
  const {
    totalPages,
    currentPage,
    items: pageItems,
  } = paginateFeed(feedForPagination, parseInt(pageParam ?? '1', 10) || 1)
  const paginatedFeed = draft ? feedForPagination : pageItems

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
      const postsData: Post[] = loadPostsData(isDev, locale)

      if (isDev) {
        const drafts = postsData.filter(post => !isPublishedPost(post))
        setDraftCount(drafts.length)
      }

      // Index list: draft route shows only drafts; /posts shows only published, excluding excludeFromListing.
      // Sorted newest first (see selectListingPosts).
      setPosts(selectListingPosts(postsData, draft))

      // Search pool: all published posts (including excludeFromListing), for search-only matches
      setPostsForSearch(draft ? [] : selectSearchPool(postsData))
    }

    loadPosts()
  }, [isDev, draft, locale, ssrPosts])

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
      <div className="max-w-[var(--content-max)] w-full">
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
            <PostsFeedItems items={paginatedFeed} query={query} />
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
