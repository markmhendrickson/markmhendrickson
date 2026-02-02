import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import publicPostsData from '@/content/posts/posts.json'
import { stripLinksFromExcerpt } from '@/lib/utils'

interface Post {
  slug: string
  title: string
  excerpt?: string
  published: boolean
  publishedDate?: string
  category?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageStyle?: string
  excludeFromListing?: boolean
  showMetadata?: boolean
}

interface PostsProps {
  draft?: boolean
}

export default function Posts({ draft = false }: PostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [draftCount, setDraftCount] = useState<number>(0)
  const isDev = import.meta.env.DEV

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

      // Filter: draft route shows only drafts; /posts shows only published
      // Also exclude posts marked with excludeFromListing
      const filtered = postsData
        .filter(post => !post.excludeFromListing)
        .filter(post => draft ? !post.published : post.published)

      // Sort by date (publishedDate for published, updatedDate/createdDate for drafts)
      const sorted = filtered.sort((a, b) => {
        const dateA = a.publishedDate ?? (a as Post & { updatedDate?: string }).updatedDate ?? (a as Post & { createdDate?: string }).createdDate
        const dateB = b.publishedDate ?? (b as Post & { updatedDate?: string }).updatedDate ?? (b as Post & { createdDate?: string }).createdDate
        if (!dateA && !dateB) return 0
        if (!dateA) return 1
        if (!dateB) return -1
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })

      setPosts(sorted)
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

  return (
    <div className="flex justify-center items-center min-h-content pt-8 pb-4 px-4 md:py-20 md:px-8">
      <div className="max-w-[600px] w-full">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <h1 className="text-[28px] font-medium tracking-tight">
            {draft ? 'Drafts' : 'Posts'}
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
        <p className="text-[17px] text-[#666] mb-12 font-light tracking-wide">
          {draft
            ? 'Unpublished posts and works in progress.'
            : 'Essays, technical articles, and thoughts on building sovereign systems.'}
        </p>

        <div className="space-y-8">
          {posts.length === 0 ? (
            <p className="text-[15px] text-[#666]">
              {draft ? 'No drafts yet.' : 'No posts yet.'}
            </p>
          ) : (
            posts.map((post) => (
              <article key={post.slug} className="border-b border-[#e0e0e0] pb-8 last:border-0 last:pb-0">
                {post.heroImage && (
                  <Link
                    to={`/posts/${post.slug}`}
                    className="block mb-4 -mx-8"
                  >
                    <img
                      src={`/images/posts/${post.heroImage}`}
                      alt={post.title}
                      className="w-full h-auto object-cover max-h-[300px]"
                    />
                  </Link>
                )}
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
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
