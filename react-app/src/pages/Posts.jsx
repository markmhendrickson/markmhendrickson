import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import publicPostsData from '@/content/posts/posts.json'

export default function Posts() {
  const [posts, setPosts] = useState([])
  const isDev = import.meta.env.DEV

  useEffect(() => {
    const loadPosts = async () => {
      let postsData = publicPostsData

      // Try to load private posts.json if available (dev mode or if file exists)
      try {
        const privatePostsModule = await import('@/content/posts/posts.private.json')
        postsData = privatePostsModule.default || privatePostsModule
      } catch (error) {
        // Private file doesn't exist, use public one
        console.log('Using public posts.json (private file not found)')
      }

      // Filter posts: published only in production, all in dev mode
      const filtered = isDev
        ? postsData
        : postsData.filter(post => post.published)

      // Sort by published date (newest first)
      const sorted = filtered.sort((a, b) => {
        const dateA = new Date(a.publishedDate || '1970-01-01')
        const dateB = new Date(b.publishedDate || '1970-01-01')
        return dateB - dateA
      })

      setPosts(sorted)
    }

    loadPosts()
  }, [isDev])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="flex justify-center items-center min-h-screen py-20 px-8">
      <div className="max-w-[600px] w-full">
        <Link to="/" className="text-[13px] text-black no-underline border-b border-black pb-[1px] font-[450] mb-8 inline-flex items-center gap-1 hover:border-transparent">
          ← Back home
        </Link>

        <h1 className="text-[28px] font-medium mb-2 tracking-tight">Posts</h1>
        <p className="text-[17px] text-[#666] mb-12 font-light tracking-wide">
          Essays, technical articles, and thoughts on building sovereign systems.
        </p>

        {isDev && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-[13px] text-yellow-800">
            <strong>Dev Mode:</strong> Showing all posts including drafts.
          </div>
        )}

        <div className="space-y-8">
          {posts.length === 0 ? (
            <p className="text-[15px] text-[#666]">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <article key={post.slug} className="border-b border-[#e0e0e0] pb-8 last:border-0 last:pb-0">
                {!post.published && isDev && (
                  <span className="inline-block mb-2 px-2 py-1 text-[11px] font-medium bg-gray-100 text-gray-700 rounded">
                    Draft
                  </span>
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
                    {post.excerpt}
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
