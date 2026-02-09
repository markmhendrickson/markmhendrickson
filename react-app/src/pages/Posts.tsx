import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search } from 'lucide-react'
import publicPostsData from '@/content/posts/posts.json'
import { stripLinksFromExcerpt, getPostImageSrc } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface Post {
  slug: string
  title: string
  excerpt?: string
  body?: string
  summary?: string
  published: boolean
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
  excludeFromListing?: boolean
  showMetadata?: boolean
  tweetMetadata?: { images?: string[] }
}

interface PostsProps {
  draft?: boolean
}

/** In dev, load private cache (includes drafts) so we can show "View drafts" and /posts/draft. */
async function loadPostsData(includeDrafts: boolean): Promise<Post[]> {
  if (!includeDrafts) return publicPostsData as Post[]
  if (import.meta.env.PROD) return publicPostsData as Post[]
  try {
    const privateData = await import('@/content/posts/posts.private.json')
    return (privateData.default ?? privateData) as Post[]
  } catch {
    return publicPostsData as Post[]
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

function TweetPreview({
  body,
  expanded,
  onToggle,
  cutoff
}: {
  body: string
  expanded: boolean
  onToggle: () => void
  cutoff: number
}) {
  const truncated = body.length > cutoff
  const displayText = truncated && !expanded ? body.slice(0, cutoff) : body

  return (
    <p className="text-[15px] text-[#666] mb-3 leading-relaxed whitespace-pre-wrap">
      {displayText}
      {truncated && !expanded && (
        <>
          {' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-[#666] hover:text-black hover:underline bg-transparent border-0 p-0 cursor-pointer font-inherit text-inherit"
          >
            Show more
          </button>
        </>
      )}
      {truncated && expanded && (
        <>
          {' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-[#666] hover:text-black hover:underline bg-transparent border-0 p-0 cursor-pointer font-inherit text-inherit"
          >
            Show less
          </button>
        </>
      )}
    </p>
  )
}

export default function Posts({ draft = false }: PostsProps) {
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

  // Sync local search input from URL when navigating (e.g. back button)
  useEffect(() => {
    setSearchInput(query)
  }, [query])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    const next = value.trim() ? { q: value.trim() } : {}
    setSearchParams(next, { replace: true })
  }

  const defaultOgImage = 'https://markmhendrickson.com/images/og-default-1200x630.jpg'
  const ogImageWidth = 1200
  const ogImageHeight = 630

  useEffect(() => {
    const loadPosts = async () => {
      const postsData: Post[] = await loadPostsData(isDev)

      if (isDev) {
        const drafts = postsData.filter(post => !post.published)
        setDraftCount(drafts.length)
      }

      // Index list: draft route shows only drafts; /posts shows only published, excluding excludeFromListing
      const filtered = postsData
        .filter(post => !post.excludeFromListing)
        .filter(post => draft ? !post.published : post.published)

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
          .filter(post => post.published)
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
  }, [isDev, draft])

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const pageTitle = draft ? 'Drafts' : 'Posts'
  const pageDesc = draft
    ? 'Unpublished posts and works in progress.'
    : 'Essays, technical articles, and thoughts on building sovereign systems.'

  return (
    <>
      <Helmet>
        <title>{pageTitle} — Mark Hendrickson</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={`${pageTitle} — Mark Hendrickson`} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content="https://markmhendrickson.com/posts" />
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
              to="/posts/draft"
              className="text-[15px] text-[#666] hover:text-black hover:underline shrink-0"
            >
              View drafts ({draftCount})
            </Link>
          )}
          {draft && (
            <Link
              to="/posts"
              className="text-[15px] text-[#666] hover:text-black hover:underline shrink-0"
            >
              ← Back to posts
            </Link>
          )}
        </div>
        <p className="text-[17px] text-[#666] mb-6 font-light tracking-wide">
          {pageDesc}
        </p>

        {!draft && (
          <div className="mb-8 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
            <Input
              type="search"
              placeholder="Search posts"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-sm h-9 text-sm"
              aria-label="Search posts"
            />
          </div>
        )}

        <div className="space-y-8">
          {filteredPosts.length === 0 ? (
            <p className="text-[15px] text-[#666]">
              {query
                ? `No posts match “${query}”.`
                : draft
                  ? 'No drafts yet.'
                  : 'No posts yet.'}
            </p>
          ) : (
            filteredPosts.map((post) => (
              <article key={post.slug} className="border-b border-[#e0e0e0] pb-8 last:border-0 last:pb-0 flex flex-col md:flex-row items-stretch gap-4">
                {(post.heroImage || post.tweetMetadata?.images?.[0]) && (
                  <Link
                    to={`/posts/${post.slug}`}
                    className="order-1 md:order-2 shrink-0 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
                  >
                    <img
                      src={getPostImageSrc(post.heroImageSquare ?? post.heroImage ?? post.tweetMetadata?.images?.[0] ?? '')}
                      alt=""
                      className="w-full aspect-square object-cover rounded md:w-[148px] md:h-[148px]"
                    />
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
                    />
                  ) : (
                    <h2 className="text-[20px] font-medium mb-2 tracking-tight">
                      <Link
                        to={`/posts/${post.slug}`}
                        className="text-black no-underline hover:underline"
                      >
                        {post.title}
                      </Link>
                    </h2>
                  )}
                  {(post.category || '').toLowerCase() !== 'tweet' && post.excerpt && (
                    <p className="text-[15px] text-[#666] mb-3 leading-relaxed">
                      {stripLinksFromExcerpt(post.excerpt)}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-[13px] text-[#999]">
                    {post.publishedDate && (
                      <Link
                        to={`/posts/${post.slug}`}
                        className="text-[#999] hover:text-black hover:underline no-underline"
                      >
                        <time dateTime={post.publishedDate}>
                          {formatDate(post.publishedDate)}
                        </time>
                      </Link>
                    )}
                    {post.readTime && (
                      <span>{post.readTime} min read</span>
                    )}
                    {post.category && (
                      <span className="capitalize">
                        {(post.category || '').toLowerCase() === 'tweet' ? 'X Post' : post.category}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
    </>
  )
}
