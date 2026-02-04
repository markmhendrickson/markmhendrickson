import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import React from 'react'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import publicPostsData from '@/content/posts/posts.json'
import { usePostSSR } from '@/contexts/PostSSRContext'
import { stripLinksFromExcerpt } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import AmenitiesCards from '@/components/AmenitiesCards'

const SITE_BASE = 'https://markmhendrickson.com'
const OG_DEFAULT_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

interface Post {
  slug: string
  /** Alternative URL slugs (e.g. short or share-friendly); canonical URL uses slug. */
  alternativeSlugs?: string[]
  title: string
  excerpt?: string
  summary?: string
  /** Optional 110–160 char description for og:description and meta description when shared. */
  shareDescription?: string
  /** Optional path (under public/images/) to a 1200x630, under 600KB og:image for this post (e.g. og/foo.jpg). */
  ogImage?: string
  published: boolean
  publishedDate?: string
  updatedDate?: string
  category?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageSquare?: string
  heroImageStyle?: string
  excludeFromListing?: boolean
  showMetadata?: boolean
  body?: string
  /** Draft share tweet (dev only, from .tweet.md / parquet). */
  shareTweet?: string
}

/** Build a map from primary + alternative slugs to post (for resolving URL slug to canonical post). */
function buildSlugToPostMap(posts: Post[]): Map<string, Post> {
  const map = new Map<string, Post>()
  for (const post of posts) {
    if (post.slug) map.set(post.slug, post)
    for (const alt of post.alternativeSlugs ?? []) {
      if (alt) map.set(alt, post)
    }
  }
  return map
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
  const location = useLocation()
  const slug = slugProp || slugParam
  const navigate = useNavigate()
  const slugToPostPublic = useMemo(
    () => buildSlugToPostMap(publicPostsData as Post[]),
    []
  )
  const resolvedCanonicalSlug = slug ? (slugToPostPublic.get(slug)?.slug ?? slug) : null
  const ssrPost = usePostSSR() as Post | null
  const [post, setPost] = useState<Post | null>(ssrPost ?? null)
  const [content, setContent] = useState(ssrPost?.body ?? '')
  const [summaryContent, setSummaryContent] = useState<string | undefined>(undefined)
  const [tweetContent, setTweetContent] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(!ssrPost)
  const [animationPhase, setAnimationPhase] = useState<'title' | 'excerpt' | 'heroImage' | 'content' | 'complete' | null>(null)
  const [contentParagraphIndex, setContentParagraphIndex] = useState(0)
  const [heroImageProgress, setHeroImageProgress] = useState(0) // 0-100 for progressive reveal
  const contentParagraphsRef = useRef<string[]>([])
  const isDev = import.meta.env.DEV

  // Extract ordered list of images from markdown for gallery viewer
  const postImages = useMemo(() => {
    if (!content) return []
    const list: { src: string; alt: string }[] = []
    const re = /!\[([^\]]*)\]\(([^)]+)\)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
      list.push({ alt: m[1] ?? '', src: m[2] ?? '' })
    }
    return list
  }, [content])

  const [imageViewer, setImageViewer] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })

  // For barcelona-guest-floor, split content so we can render amenity cards between "What this place offers" and the next section
  const barcelonaContentSplit = useMemo(() => {
    if (resolvedCanonicalSlug !== 'barcelona-guest-floor' || !content.includes('## What this place offers')) return null
    const parts = content.split(/\n## What this place offers\n\n/)
    if (parts.length !== 2) return null
    const [, listAndRest] = parts
    const nextParts = listAndRest.split(/\n\n## /)
    const restPart = nextParts.slice(1).join('\n\n## ')
    return {
      contentBefore: parts[0] + '## What this place offers\n\n',
      contentAfter: restPart ? '\n\n## ' + restPart : '',
    }
  }, [resolvedCanonicalSlug, content])

  const openImageViewer = (index: number) => {
    setImageViewer({ open: true, index })
  }
  const closeImageViewer = () => setImageViewer((v) => ({ ...v, open: false }))
  const goPrev = () => setImageViewer((v) => ({ ...v, index: Math.max(0, v.index - 1) }))
  const goNext = () => setImageViewer((v) => ({ ...v, index: Math.min(postImages.length - 1, v.index + 1) }))

  useEffect(() => {
    if (!imageViewer.open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImageViewer()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [imageViewer.open])

  const latestPost = useMemo(() => {
    const list = (publicPostsData as Post[])
      .filter((p) => p.published && !p.excludeFromListing && p.slug !== (resolvedCanonicalSlug ?? ''))
      .sort((a, b) => (b.publishedDate || '').localeCompare(a.publishedDate || ''))
    return list[0] ?? null
  }, [resolvedCanonicalSlug])

  const { prevPost, nextPost } = useMemo(() => {
    const raw = (publicPostsData as Post[])
      .filter((p) => p.published && !p.excludeFromListing)
      .sort((a, b) => {
        const dateCmp = (b.publishedDate || '').localeCompare(a.publishedDate || '')
        if (dateCmp !== 0) return dateCmp
        return (a.slug || '').localeCompare(b.slug || '')
      })
    const seen = new Set<string>()
    const list = raw.filter((p) => {
      if (seen.has(p.slug)) return false
      seen.add(p.slug)
      return true
    })
    const idx = list.findIndex((p) => p.slug === (resolvedCanonicalSlug ?? ''))
    if (idx < 0) {
      return {
        prevPost: list[0] ?? null,
        nextPost: null,
      }
    }
    return {
      prevPost: list[idx + 1] ?? null,
      nextPost: list[idx - 1] ?? null,
    }
  }, [resolvedCanonicalSlug])

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

        const slugToPost = buildSlugToPostMap(postsData)
        const postMeta = slug ? slugToPost.get(slug) ?? postsData.find(p => p.slug === slug) : undefined
        const canonicalSlug = postMeta?.slug

        if (postMeta && slug && canonicalSlug && slug !== canonicalSlug) {
          navigate(`/posts/${canonicalSlug}`, { replace: true })
          return
        }

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
        // In dev, prefer markdown files for preview. In prod, prefer parquet cache.
        let content: string | null = null

        const loadMarkdownContent = async (): Promise<string> => {
          const loadSlug = canonicalSlug ?? slug
          let markdownModule: { default: string }
          if (!postMeta.published && isDev) {
            try {
              markdownModule = await import(`@/content/posts/drafts/${loadSlug}.md?raw`) as { default: string }
            } catch (draftError) {
              markdownModule = await import(`@/content/posts/${loadSlug}.md?raw`) as { default: string }
            }
          } else {
            markdownModule = await import(`@/content/posts/${loadSlug}.md?raw`) as { default: string }
          }
          return markdownModule.default
        }

        const tryLoadMarkdown = async (): Promise<string | null> => {
          try {
            return await loadMarkdownContent()
          } catch (error) {
            console.error('Error loading post content from markdown:', error)
            return null
          }
        }

        const tryLoadSummaryMarkdown = async (): Promise<string | null> => {
          const loadSlug = canonicalSlug ?? slug
          try {
            let mod: { default: string }
            if (!postMeta.published && isDev) {
              try {
                mod = await import(`@/content/posts/drafts/${loadSlug}.summary.md?raw`) as { default: string }
              } catch {
                mod = await import(`@/content/posts/${loadSlug}.summary.md?raw`) as { default: string }
              }
            } else {
              mod = await import(`@/content/posts/${loadSlug}.summary.md?raw`) as { default: string }
            }
            return mod.default?.trim() ?? null
          } catch {
            return null
          }
        }

        const tryLoadTweetMarkdown = async (): Promise<string | null> => {
          const loadSlug = canonicalSlug ?? slug
          try {
            let mod: { default: string }
            try {
              mod = await import(`@/content/posts/drafts/${loadSlug}.tweet.md?raw`) as { default: string }
            } catch {
              mod = await import(`@/content/posts/${loadSlug}.tweet.md?raw`) as { default: string }
            }
            return mod.default?.trim() ?? null
          } catch {
            return null
          }
        }

        if (isDev) {
          // Dev preview: markdown takes priority over parquet content
          content = await tryLoadMarkdown()
          if (content === null && postMeta.body) {
            content = postMeta.body
          }
          const summaryFromMd = await tryLoadSummaryMarkdown()
          setSummaryContent(summaryFromMd ?? undefined)
          if (!postMeta.published) {
            const tweetFromCache = (postMeta as Post).shareTweet?.trim()
            const tweetFromMd = await tryLoadTweetMarkdown()
            setTweetContent((tweetFromCache || tweetFromMd) ?? undefined)
          } else {
            setTweetContent(undefined)
          }
        } else {
          setSummaryContent(undefined)
          setTweetContent(undefined)
          // Production: parquet cache takes priority
          if (postMeta.body) {
            content = postMeta.body
          } else {
            content = await tryLoadMarkdown()
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
          setSummaryContent(undefined)
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
  const isHome = location.pathname === '/'
  const canonicalUrl = isHome ? `${SITE_BASE}/` : `${SITE_BASE}/posts/${post.slug}`
  const displaySummary = summaryContent !== undefined ? summaryContent : (post.summary ?? '')
  // Default OG image only on home; post pages use post-specific image or none
  const ogImage = post.ogImage
    ? `${SITE_BASE}/images/${post.ogImage}`
    : isHome
      ? OG_DEFAULT_IMAGE
      : post.heroImage
        ? `${SITE_BASE}/images/posts/${post.heroImage}`
        : null

  return (
    <>
      <Helmet>
        <title>{post.title === 'Mark Hendrickson' ? post.title : `${post.title} — Mark Hendrickson`}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonicalUrl} />
        {ogImage != null && <meta property="og:image" content={ogImage} />}
        {ogImage != null && <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />}
        {ogImage != null && <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />}
        {ogImage != null && <meta name="twitter:image" content={ogImage} />}
        {ogImage != null && <meta name="twitter:image:width" content={String(OG_IMAGE_WIDTH)} />}
        {ogImage != null && <meta name="twitter:image:height" content={String(OG_IMAGE_HEIGHT)} />}
        {post.publishedDate && (
          <meta property="article:published_time" content={post.publishedDate} />
        )}
        {post.updatedDate && (
          <meta property="article:modified_time" content={post.updatedDate} />
        )}
        <meta property="article:author" content={SITE_BASE} />
        <meta property="og:article:author" content="Mark Hendrickson" />
        <meta name="twitter:creator" content="@markmhendrickson" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={desc} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: desc,
            url: canonicalUrl,
            mainEntityOfPage: canonicalUrl,
            ...(ogImage != null && { image: ogImage }),
            ...(post.publishedDate && { datePublished: post.publishedDate }),
            ...(post.updatedDate && { dateModified: post.updatedDate }),
            author: { '@type': 'Person', name: 'Mark Hendrickson', url: SITE_BASE },
            publisher: { '@type': 'Organization', name: 'Mark Hendrickson', logo: { '@type': 'ImageObject', url: `${SITE_BASE}/profile.jpg` } },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_BASE },
              { '@type': 'ListItem', position: 2, name: 'Posts', item: `${SITE_BASE}/posts` },
              { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
            ],
          })}
        </script>
      </Helmet>
    <div className="flex justify-center items-center min-h-content pt-8 pb-8 px-4 md:pt-8 md:pb-8 md:px-8">
      <div className="max-w-[600px] w-full">
        {isHome && latestPost && (
          <Link
            to={`/posts/${latestPost.slug}`}
            className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
          >
            <Alert className="mb-8 flex flex-row items-stretch gap-4 cursor-pointer">
              <div className="min-w-0 flex-1 flex flex-col gap-1">
                <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Latest post
                </AlertTitle>
                <AlertDescription className="py-px">
                  <span className="font-medium text-foreground">{latestPost.title}</span>
                  {latestPost.excerpt && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {stripLinksFromExcerpt(latestPost.excerpt)}
                    </p>
                  )}
                  <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                    Read more →
                  </span>
                </AlertDescription>
              </div>
              {latestPost.heroImage && (
                <img
                  src={`/images/posts/${latestPost.heroImageSquare ?? latestPost.heroImage}`}
                  alt=""
                  className="hidden md:block shrink-0 w-[148px] h-[148px] rounded object-cover"
                />
              )}
            </Alert>
          </Link>
        )}
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

          {displaySummary && (() => {
            const normalizedSummary = displaySummary.trim().replace(/\s+/g, ' ')
            const normalizedExcerpt = post.excerpt ? post.excerpt.trim().replace(/\s+/g, ' ') : ''
            const repeatsExcerpt = normalizedExcerpt && normalizedSummary === normalizedExcerpt
            return !repeatsExcerpt && (
            <Alert className="mb-8">
              <AlertTitle className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Key takeaways
              </AlertTitle>
              <AlertDescription asChild>
                <div className="post-prose-summary prose prose-sm max-w-none text-sm [&_p]:leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{displaySummary}</ReactMarkdown>
                </div>
              </AlertDescription>
            </Alert>
          );
          })()}

          {post.heroImage && post.heroImageStyle !== 'float-right' && (
            <div className="mb-8 md:-mx-8">
              <img
                src={`/images/posts/${post.heroImage}`}
                alt={post.title}
                className={
                  post.heroImageStyle === 'keep-proportions'
                    ? 'w-full max-h-[70vh] h-auto object-contain'
                    : 'w-full aspect-square object-cover'
                }
              />
            </div>
          )}

          <div className="post-prose prose prose-sm max-w-none">
            {post.heroImage && post.heroImageStyle === 'float-right' && (
              <div className="w-full mb-8 md:mb-4 md:float-right md:ml-8 md:max-w-[300px]">
                <img
                  src={`/images/posts/${post.heroImage}`}
                  alt={post.title}
                  className="w-full aspect-square object-cover rounded"
                />
              </div>
            )}
            {(() => {
              const markdownComponents = {
                table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
                  <div className="overflow-x-auto my-6 rounded-lg border border-border">
                    <table {...props}>{children}</table>
                  </div>
                ),
                p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => {
                  const arr = React.Children.toArray(children)
                  const allImg = arr.length >= 1 && arr.every((c) => React.isValidElement(c) && (c.type === 'img' || c.type === 'button'))
                  if (allImg) {
                    return (
                      <div className="grid grid-cols-3 gap-3 my-4" {...props}>
                        {children}
                      </div>
                    )
                  }
                  return <p {...props}>{children}</p>
                },
                img: ({ src, alt, ...props }: React.ComponentPropsWithoutRef<'img'>) => {
                  const index = postImages.findIndex((im) => im.src === src)
                  const safeIndex = index >= 0 ? index : 0
                  if (postImages.length === 0) {
                    return (
                      <div className="aspect-square w-full overflow-hidden rounded-lg">
                        <img src={src} alt={alt ?? ''} className="w-full h-full object-cover block" loading="lazy" {...props} />
                      </div>
                    )
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => openImageViewer(safeIndex)}
                      className="w-full text-left rounded-lg overflow-hidden border border-[#e0e0e0] hover:border-[#999] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors aspect-square"
                    >
                      <img
                        src={src}
                        alt={alt ?? ''}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                        {...props}
                      />
                    </button>
                  )
                },
              }
              return barcelonaContentSplit ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {barcelonaContentSplit.contentBefore}
                </ReactMarkdown>
                <AmenitiesCards />
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {barcelonaContentSplit.contentAfter}
                </ReactMarkdown>
              </>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {content}
                </ReactMarkdown>
              );
            })()}
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

        {isDev && !post.published && (post.shareTweet?.trim() || tweetContent) && (
          <Alert className="mt-12 pt-8 border-t border-[#e0e0e0]" aria-label="Share tweet draft">
            <AlertTitle className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Share tweet
            </AlertTitle>
            <AlertDescription asChild>
              <div className="post-prose-summary prose prose-sm max-w-none text-sm [&_p]:leading-relaxed whitespace-pre-wrap">
                {post.shareTweet?.trim() || tweetContent}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {imageViewer.open && postImages.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
            onClick={closeImageViewer}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closeImageViewer() }}
              className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            {imageViewer.index > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {imageViewer.index < postImages.length - 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
            <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center p-12" onClick={(e) => e.stopPropagation()}>
              <img
                src={postImages[imageViewer.index].src}
                alt={postImages[imageViewer.index].alt}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded"
              />
            </div>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {imageViewer.index + 1} / {postImages.length}
            </span>
          </div>
        )}

        {!isHome && !post?.excludeFromListing && (prevPost || nextPost) && (
          <nav
            className="mt-8 flex flex-col gap-4"
            aria-label="Previous and next posts"
          >
            {prevPost && (
              <Link
                to={`/posts/${prevPost.slug}`}
                className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
              >
                <Alert className="flex flex-row items-stretch gap-4 cursor-pointer h-full">
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      Previous post
                    </AlertTitle>
                    <AlertDescription className="py-px">
                      <span className="font-medium text-foreground">{prevPost.title}</span>
                      {prevPost.excerpt && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {stripLinksFromExcerpt(prevPost.excerpt)}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                        Read more →
                      </span>
                    </AlertDescription>
                  </div>
                  {prevPost.heroImage && (
                    <img
                      src={`/images/posts/${prevPost.heroImageSquare ?? prevPost.heroImage}`}
                      alt=""
                      className="shrink-0 w-[148px] h-[148px] rounded object-cover"
                    />
                  )}
                </Alert>
              </Link>
            )}
            {nextPost && (
              <Link
                to={`/posts/${nextPost.slug}`}
                className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
              >
                <Alert className="flex flex-row items-stretch gap-4 cursor-pointer h-full">
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      Next post
                    </AlertTitle>
                    <AlertDescription className="py-px">
                      <span className="font-medium text-foreground">{nextPost.title}</span>
                      {nextPost.excerpt && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {stripLinksFromExcerpt(nextPost.excerpt)}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                        Read more →
                      </span>
                    </AlertDescription>
                  </div>
                  {nextPost.heroImage && (
                    <img
                      src={`/images/posts/${nextPost.heroImageSquare ?? nextPost.heroImage}`}
                      alt=""
                      className="shrink-0 w-[148px] h-[148px] rounded object-cover"
                    />
                  )}
                </Alert>
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
    </>
  )
}
