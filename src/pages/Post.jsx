import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import publicPostsData from '@/content/posts/posts.json'
import { ArrowLeft } from 'lucide-react'

export default function Post() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const isDev = import.meta.env.DEV

  useEffect(() => {
    const loadPost = async () => {
      try {
        // Try to load private posts.json first, fall back to public
        let postsData = publicPostsData
        try {
          const privatePostsModule = await import('@/content/posts/posts.private.json')
          postsData = privatePostsModule.default || privatePostsModule
        } catch (error) {
          // Private file doesn't exist, use public one
        }
        
        // Find post metadata
        const postMeta = postsData.find(p => p.slug === slug)
        
        if (!postMeta) {
          navigate('/posts', { replace: true })
          return
        }

        // Check if post is published (or if we're in dev mode)
        if (!postMeta.published && !isDev) {
          navigate('/posts', { replace: true })
          return
        }

        setPost(postMeta)

        // Load markdown content using dynamic import
        // Check drafts directory first if post is unpublished, then published directory
        try {
          let markdownModule
          if (!postMeta.published && isDev) {
            // Try drafts directory first for unpublished posts
            try {
              markdownModule = await import(`@/content/posts/drafts/${slug}.md?raw`)
            } catch (draftError) {
              // Fall back to published directory if not in drafts
              markdownModule = await import(`@/content/posts/${slug}.md?raw`)
            }
          } else {
            // Published posts are always in the main posts directory
            markdownModule = await import(`@/content/posts/${slug}.md?raw`)
          }
          setContent(markdownModule.default)
        } catch (error) {
          console.error('Error loading post content:', error)
          setContent('# Post Not Found\n\nThe content for this post could not be loaded.')
        }
      } catch (error) {
        console.error('Error loading post:', error)
        navigate('/posts', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [slug, navigate, isDev])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen py-20 px-8">
        <div className="max-w-[600px] w-full">
          <p className="text-[15px] text-[#666]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <div className="flex justify-center items-center min-h-screen py-20 px-8">
      <div className="max-w-[600px] w-full">
        <Link 
          to="/posts" 
          className="text-[13px] text-black no-underline border-b border-black pb-[1px] font-[450] mb-8 inline-flex items-center gap-1 hover:border-transparent"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to posts
        </Link>

        {!post.published && isDev && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-[13px] text-yellow-800">
            <strong>Draft:</strong> This post is unpublished and only visible in dev mode.
          </div>
        )}

        <article>
          <header className="mb-8">
            <h1 className="text-[28px] font-medium mb-2 tracking-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-[13px] text-[#999] mb-4">
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
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-[11px] font-medium bg-gray-100 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-[24px] font-medium mb-4 mt-8 first:mt-0 tracking-tight" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-[20px] font-medium mb-3 mt-6 tracking-tight" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-[18px] font-medium mb-2 mt-4 tracking-tight" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-[15px] leading-[1.75] mb-4 text-[#333]" {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a className="text-black border-b border-black pb-[1px] hover:border-transparent" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside mb-4 space-y-2 text-[15px] leading-[1.75]" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-2 text-[15px] leading-[1.75]" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-[15px] leading-[1.75]" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic text-[15px] text-[#666] mb-4" {...props} />
                ),
                code: ({ node, inline, ...props }) => {
                  if (inline) {
                    return (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-[14px] font-mono" {...props} />
                    )
                  }
                  return (
                    <code className="block bg-gray-100 p-4 rounded mb-4 text-[14px] font-mono overflow-x-auto" {...props} />
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  )
}
