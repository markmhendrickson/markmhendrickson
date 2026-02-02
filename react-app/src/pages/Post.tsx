import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import publicPostsData from '@/content/posts/posts.json'
import { usePostSSR } from '@/contexts/PostSSRContext'
import { stripLinksFromExcerpt } from '@/lib/utils'

const SITE_BASE = 'https://markmhendrickson.com'
const OG_DEFAULT_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

interface Post {
  slug: string
  title: string
  excerpt?: string
  summary?: string
  /** Optional 110–160 char description for og:description and meta description when shared. */
  shareDescription?: string
  /** Optional path (under public/images/) to a 1200x630, under 600KB og:image for this post (e.g. og/foo.jpg). */
  ogImage?: string
  published: boolean
  publishedDate?: string
  category?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageStyle?: string
  excludeFromListing?: boolean
  showMetadata?: boolean
  body?: string
}

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  shouldAnimate?: boolean
  onComplete?: () => void
  delay?: number
}

// Progressive image reveal component (simulates AI image generation)
function ProgressiveImage({ src, alt, className, shouldAnimate = true, onComplete, delay = 0 }: ProgressiveImageProps) {
  const [progress, setProgress] = useState(0)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!shouldAnimate) {
      setProgress(100)
      if (onComplete) onComplete()
      return
    }

    setProgress(0)
    startTimeRef.current = null

    const animate = () => {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now()
      }

      const elapsed = Date.now() - startTimeRef.current
      // Simulate progressive rendering over 3 seconds
      const duration = 3000
      const newProgress = Math.min(100, (elapsed / duration) * 100)

      setProgress(newProgress)

      if (newProgress >= 100) {
        if (onComplete) onComplete()
        return
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    const startTimeout = setTimeout(() => {
      animate()
    }, delay)

    return () => {
      clearTimeout(startTimeout)
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
      startTimeRef.current = null
    }
  }, [shouldAnimate, onComplete, delay])

  // Calculate blur and opacity based on progress
  const blur = Math.max(0, 20 - (progress / 100) * 20) // Start at 20px blur, end at 0
  const opacity = Math.min(1, progress / 30) // Fade in quickly in first 30%
  const scale = 0.95 + (progress / 100) * 0.05 // Slight zoom in effect

  return (
    <div className="relative overflow-hidden">
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          filter: `blur(${blur}px)`,
          opacity: opacity,
          transform: `scale(${scale})`,
          transition: 'filter 0.1s ease-out, opacity 0.1s ease-out, transform 0.1s ease-out',
        }}
      />
      {progress < 100 && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20"
          style={{
            opacity: 1 - (progress / 100),
          }}
        />
      )}
    </div>
  )
}

interface TypewriterTextProps {
  children: React.ReactNode
  delay?: number
  speed?: number
  onComplete?: () => void
  shouldAnimate?: boolean
}

// Typewriter effect component for animating text character by character
function TypewriterText({ children, delay = 0, speed = 20, onComplete, shouldAnimate = true }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const fullTextRef = useRef('')

  // Extract plain text from children (for animation)
  const extractText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (React.isValidElement(node)) {
      if (node.props?.children) {
        return React.Children.toArray(node.props.children)
          .map(extractText)
          .join('')
      }
    }
    if (Array.isArray(node)) {
      return node.map(extractText).join('')
    }
    return ''
  }

  useEffect(() => {
    // Cancel any ongoing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (startTimeRef.current !== null) {
      startTimeRef.current = null
    }

    if (!shouldAnimate) {
      // When animation is disabled, show full content immediately
      const fullText = extractText(children)
      setIsComplete(true)
      setDisplayedText(fullText || '')
      return
    }

    const fullText = extractText(children)
    fullTextRef.current = fullText

    if (!fullText) {
      setIsComplete(true)
      setDisplayedText('')
      if (onComplete) onComplete()
      return
    }

    // Reset state when animation should start
    setIsComplete(false)
    startTimeRef.current = null
    // Show first character immediately to make animation visible
    if (fullText.length > 0) {
      setDisplayedText(fullText[0])
    } else {
      setDisplayedText('')
    }

    const animate = () => {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now()
      }

      const elapsed = Date.now() - startTimeRef.current
      const charsToShow = Math.floor((elapsed / speed))

      if (charsToShow >= fullText.length) {
        setDisplayedText(fullText)
        setIsComplete(true)
        if (onComplete) onComplete()
        return
      }

      const newText = fullText.slice(0, Math.max(1, charsToShow))
      setDisplayedText(newText)
      animationRef.current = requestAnimationFrame(animate)
    }

    let startTimeout: ReturnType<typeof setTimeout>
    if (delay === 0) {
      // Start immediately if no delay
      animate()
    } else {
      startTimeout = setTimeout(() => {
        animate()
      }, delay)
    }

    return () => {
      if (startTimeout) {
        clearTimeout(startTimeout)
      }
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
      startTimeRef.current = null
    }
  }, [children, delay, speed, onComplete, shouldAnimate])

  // If animation is disabled, show full content immediately
  if (!shouldAnimate) {
    return <>{children}</>
  }

  // If complete, show full content
  if (isComplete) {
    return <>{children}</>
  }

  // During animation, show partial text with cursor
  // For simple text, animate character by character
  if (typeof children === 'string' || (Array.isArray(children) && children.every(c => typeof c === 'string'))) {
    return (
      <span>
        {displayedText}
        {!isComplete && <span className="animate-pulse opacity-50 ml-1">|</span>}
      </span>
    )
  }

  // For complex children, show extracted text during animation
  return (
    <span>
      {displayedText}
      {!isComplete && <span className="animate-pulse opacity-50 ml-1">|</span>}
    </span>
  )
}

interface PostProps {
  slug?: string
}

export default function Post({ slug: slugProp }: PostProps) {
  const { slug: slugParam } = useParams<{ slug?: string }>()
  const slug = slugProp || slugParam
  const navigate = useNavigate()
  const ssrPost = usePostSSR() as Post | null
  const [post, setPost] = useState<Post | null>(ssrPost ?? null)
  const [content, setContent] = useState(ssrPost?.body ?? '')
  const [loading, setLoading] = useState(!ssrPost)
  const [animationPhase, setAnimationPhase] = useState<'title' | 'excerpt' | 'heroImage' | 'content' | 'complete' | null>(null)
  const [contentParagraphIndex, setContentParagraphIndex] = useState(0)
  const [heroImageProgress, setHeroImageProgress] = useState(0) // 0-100 for progressive reveal
  const contentParagraphsRef = useRef<string[]>([])
  const isDev = import.meta.env.DEV

  useEffect(() => {
    const loadPost = async () => {
      try {
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

        // Find post metadata
        const postMeta = postsData.find(p => p.slug === slug)

        if (!postMeta) {
          // Only navigate away if we have a slug param (not for home route)
          if (slugParam) {
            navigate('/posts', { replace: true })
          }
          return
        }

        // Check if post is published (or if we're in dev mode)
        if (!postMeta.published && !isDev) {
          // Only navigate away if we have a slug param (not for home route)
          if (slugParam) {
            navigate('/posts', { replace: true })
          }
          return
        }

        setPost(postMeta)

        // Load markdown content
        // First try to load from JSON cache (body field), then fall back to markdown files
        let content: string | null = null

        // Check if body is in the metadata (from parquet cache)
        if (postMeta.body) {
          content = postMeta.body
        } else {
          // Fallback: Try to load from markdown files (legacy support)
          try {
            let markdownModule: { default: string }
            if (!postMeta.published && isDev) {
              // Try drafts directory first for unpublished posts
              try {
                markdownModule = await import(`@/content/posts/drafts/${slug}.md?raw`) as { default: string }
              } catch (draftError) {
                // Fall back to published directory if not in drafts
                markdownModule = await import(`@/content/posts/${slug}.md?raw`) as { default: string }
              }
            } else {
              // Published posts are always in the main posts directory
              markdownModule = await import(`@/content/posts/${slug}.md?raw`) as { default: string }
            }
            content = markdownModule.default
          } catch (error) {
            console.error('Error loading post content from markdown:', error)
          }
        }

        if (content) {
          setContent(content)
          // Reset animation state when content loads
          setAnimationPhase('title')
          setContentParagraphIndex(0)
          setHeroImageProgress(0)
          contentParagraphsRef.current = []
        } else {
          console.error('Post body not found in cache or markdown files')
          setContent('# Post Not Found\n\nThe content for this post could not be loaded.')
          setAnimationPhase('title')
          setContentParagraphIndex(0)
          setHeroImageProgress(0)
          contentParagraphsRef.current = []
        }
      } catch (error) {
        console.error('Error loading post:', error)
        // Only navigate away if we have a slug param (not for home route)
        if (slugParam) {
          navigate('/posts', { replace: true })
        }
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadPost()
    }
  }, [slug, slugParam, navigate, isDev])

  const formatDate = (dateString: string | undefined): string => {
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
      <div className="flex justify-center items-center min-h-content pt-8 pb-8 px-4 md:pt-8 md:pb-8 md:px-8">
        <div className="max-w-[600px] w-full">
          <p className="text-[15px] text-[#666]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  const metaDescription = post.shareDescription
    ? post.shareDescription
    : post.excerpt
      ? stripLinksFromExcerpt(post.excerpt)
      : (post.summary && post.summary.replace(/\s+/g, ' ').replace(/^[-*]\s*/gm, '').trim().slice(0, 160))
  const desc = (metaDescription || post.title).slice(0, 160)
  const isHome = useLocation().pathname === '/'
  const canonicalUrl = isHome ? `${SITE_BASE}/` : `${SITE_BASE}/posts/${post.slug}`
  const ogImage = post.ogImage
    ? `${SITE_BASE}/images/${post.ogImage}`
    : isHome
      ? OG_DEFAULT_IMAGE
      : post.heroImage
        ? `${SITE_BASE}/images/posts/${post.heroImage}`
        : OG_DEFAULT_IMAGE

  return (
    <>
      <Helmet>
        <title>{post.title} — Mark Hendrickson</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
        {post.publishedDate && (
          <meta property="article:published_time" content={post.publishedDate} />
        )}
        <meta name="twitter:creator" content="@markmhendrickson" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta name="twitter:image:height" content={String(OG_IMAGE_HEIGHT)} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: desc,
            url: canonicalUrl,
            image: ogImage,
            ...(post.publishedDate && { datePublished: post.publishedDate }),
            author: { '@type': 'Person', name: 'Mark Hendrickson', url: SITE_BASE },
            publisher: { '@type': 'Organization', name: 'Mark Hendrickson', logo: { '@type': 'ImageObject', url: `${SITE_BASE}/profile.jpg` } },
          })}
        </script>
      </Helmet>
    <div className="flex justify-center items-center min-h-content pt-8 pb-8 px-4 md:pt-8 md:pb-8 md:px-8">
      <div className="max-w-[600px] w-full">
        <article>
          <header className="mb-8">
            <h1 className="text-[28px] font-medium mb-2 tracking-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-[15px] leading-[1.75] text-[#666] mb-4">
                {stripLinksFromExcerpt(post.excerpt)}
              </p>
            )}
          </header>

          {post.heroImage && post.heroImageStyle !== 'float-right' && (
            <div className="mb-8 md:-mx-8">
              <img
                src={`/images/posts/${post.heroImage}`}
                alt={post.title}
                className="w-full aspect-square object-cover"
              />
            </div>
          )}

          {post.summary && (() => {
            const normalizedSummary = post.summary.trim().replace(/\s+/g, ' ')
            const normalizedExcerpt = post.excerpt ? post.excerpt.trim().replace(/\s+/g, ' ') : ''
            const repeatsExcerpt = normalizedExcerpt && normalizedSummary === normalizedExcerpt
            return !repeatsExcerpt && (
            <div className="post-prose-summary prose prose-sm max-w-none mb-8 p-6 rounded-lg border-0 md:border md:border-sidebar-border bg-sidebar">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 mt-0">Key takeaways</h2>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.summary}</ReactMarkdown>
            </div>
          );
          })()}

          <div className="post-prose prose prose-sm max-w-none">
            {post.heroImage && post.heroImageStyle === 'float-right' && (
              <div className="w-full mb-4 md:float-right md:ml-8 md:mb-4 md:max-w-[300px]">
                <img
                  src={`/images/posts/${post.heroImage}`}
                  alt={post.title}
                  className="w-full aspect-square object-cover rounded"
                />
              </div>
            )}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>

          {post.heroImageStyle === 'float-right' && <div className="clear-both"></div>}

          {(post.showMetadata !== false) && (
            <footer className="mt-12 pt-8 border-t border-[#e0e0e0]">
              {!post.published && isDev && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 text-[11px] font-medium bg-yellow-100 text-yellow-800 rounded">
                    Draft
                  </span>
                </div>
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
            </footer>
          )}
        </article>
      </div>
    </div>
    </>
  )
}
