import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search } from 'lucide-react'
import publicPostsData from '@/content/posts/posts.json'
import { stripLinksFromExcerpt } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface Post {
  slug: string
  title: string
  excerpt?: string
  published: boolean
  publishedDate?: string
  updatedDate?: string
  createdDate?: string
  category?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageSquare?: string
  heroImageStyle?: string
  excludeFromListing?: boolean
  showMetadata?: boolean
}

interface PostsProps {
  draft?: boolean
}

function matchQuery(post: Post, q: string): boolean {
  const lower = q.toLowerCase()
  const title = (post.title ?? '').toLowerCase()
  const excerpt = (post.excerpt ?? '').toLowerCase()
  const tags = (post.tags ?? []).join(' ').toLowerCase()
  return title.includes(lower) || excerpt.includes(lower) || tags.includes(lower)
}

export default function Posts({ draft = false }: PostsProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const [searchInput, setSearchInput] = useState(query)
  const [posts, setPosts] = useState<Post[]>([])
  /** All published posts including excludeFromListing, for search only */
  const [postsForSearch, setPostsForSearch] = useState<Post[]>([])
  const [draftCount, setDraftCount] = useState<number>(0)
  const isDev = import.meta.env.DEV

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
      // Start with public posts
      let postsData: Post[] = [...(publicPostsData as Post[])]

      // Load private posts (drafts) only in development so production build excludes them
      if (isDev) {
        try {
          const privatePostsModule = await import('@/content/posts/posts.private.json') as { default?: Post[] } | Post[]
          const privatePosts = (privatePostsModule as { default?: Post[] }).default || (privatePostsModule as Post[])
          const publicSlugMap = new Map<string, Post>(postsData.map(post => [post.slug, post]))
          privatePosts.forEach(privatePost => publicSlugMap.set(privatePost.slug, privatePost))
          postsData = Array.from(publicSlugMap.values())
        } catch {
          // Private file not found, keep public only
        }
      }

      // Count drafts for link (dev only)
      if (isDev) {
        const drafts = postsData.filter(post => !post.published && !post.excludeFromListing)
        setDraftCount(drafts.length)
      }

      // Index list: draft route shows only drafts; /posts shows only published, excluding excludeFromListing
      const filtered = postsData
        .filter(post => !post.excludeFromListing)
        .filter(post => draft ? !post.published : post.published)

      // Sort: published list by publishedDate desc; draft list always by modified time (updatedDate) desc
      const sorted = [...filtered].sort((a, b) => {
        const dateA = draft ? (a.updatedDate ?? a.createdDate) : a.publishedDate
        const dateB = draft ? (b.updatedDate ?? b.createdDate) : b.publishedDate
        if (!dateA && !dateB) return 0
        if (!dateA) return 1
        if (!dateB) return -1
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })

      setPosts(sorted)

      // Search pool: all published posts (including excludeFromListing) for search results only
      if (!draft) {
        const allPublished = postsData
          .filter(post => post.published)
          .sort((a, b) => {
            const dateA = a.publishedDate ?? ''
            const dateB = b.publishedDate ?? ''
            return new Date(dateB).getTime() - new Date(dateA).getTime()
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
              placeholder="Search posts by title, excerpt, or tags…"
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
              <article key={post.slug} className="border-b border-[#e0e0e0] pb-8 last:border-0 last:pb-0 flex flex-row items-stretch gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[20px] font-medium mb-2 tracking-tight">
                    <Link
                      to={`/posts/${post.slug}`}
                      className="text-black no-underline hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt && (
                    <p className="text-[15px] text-[#666] mb-3 leading-relaxed">
                      {stripLinksFromExcerpt(post.excerpt)}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-[13px] text-[#999]">
                    {post.publishedDate && (
                      <time dateTime={post.publishedDate}>
                        {formatDate(post.publishedDate)}
                      </time>
                    )}
                    {post.readTime && (
                      <span>{post.readTime} min read</span>
                    )}
                    {post.category && (
                      <span className="capitalize">{post.category}</span>
                    )}
                  </div>
                </div>
                {post.heroImage && (
                  <Link
                    to={`/posts/${post.slug}`}
                    className="hidden md:block shrink-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded [&:hover]:opacity-90"
                  >
                    <img
                      src={`/images/posts/${post.heroImageSquare ?? post.heroImage}`}
                      alt=""
                      className="shrink-0 w-[148px] h-[148px] rounded object-cover"
                    />
                  </Link>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
    </>
  )
}
