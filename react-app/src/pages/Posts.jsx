import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import publicPostsData from '@/content/posts/posts.json'

export default function Posts() {
  const [posts, setPosts] = useState([])
  const isDev = import.meta.env.DEV

  useEffect(() => {
    const loadPosts = async () => {
      // Start with public posts
      let postsData = [...publicPostsData]

      // Try to load private posts.json and merge with public
      try {
        const privatePostsModule = await import('@/content/posts/posts.private.json')
        const privatePosts = privatePostsModule.default || privatePostsModule
        
        // Create a map of slugs from public posts
        const publicSlugMap = new Map(postsData.map(post => [post.slug, post]))
        
        // Add private posts, overriding public posts with same slug
        privatePosts.forEach(privatePost => {
          publicSlugMap.set(privatePost.slug, privatePost)
        })
        
        // Convert map back to array
        postsData = Array.from(publicSlugMap.values())
      } catch (error) {
        // Private file doesn't exist, use public one only
        console.log('Using public posts.json only (private file not found)')
      }

      // Filter posts: published only in production, all in dev mode
      // Also exclude posts marked with excludeFromListing
      const filtered = (isDev
        ? postsData
        : postsData.filter(post => post.published)
      ).filter(post => !post.excludeFromListing)

      // Sort by published date (reverse chronological - newest first)
      const sorted = filtered.sort((a, b) => {
        // Handle posts without publishedDate (put them at the end)
        if (!a.publishedDate && !b.publishedDate) return 0
        if (!a.publishedDate) return 1  // a goes to end
        if (!b.publishedDate) return -1 // b goes to end
        
        // Parse dates and compare (newest first = reverse chronological)
        const dateA = new Date(a.publishedDate)
        const dateB = new Date(b.publishedDate)
        
        // Reverse chronological: newer dates come first
        return dateB.getTime() - dateA.getTime()
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
        <h1 className="text-[28px] font-medium mb-2 tracking-tight">Posts</h1>
        <p className="text-[17px] text-[#666] mb-12 font-light tracking-wide">
          Essays, technical articles, and thoughts on building sovereign systems.
        </p>

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
