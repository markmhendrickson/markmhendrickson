import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import React from 'react'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import publicPostsData from '@cache/posts.json'
import { usePostSSR } from '@/contexts/PostSSRContext'
import { stripLinksFromExcerpt, getPostImageSrc } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Linkedin, Facebook, Mail, Copy, ExternalLink, Link as LinkIcon } from 'lucide-react'
import AmenitiesCards from '@/components/AmenitiesCards'

/** X (formerly Twitter) logo for share button. */
function XLogo({ className, ...props }: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

/** Hacker News Y logo for share button. */
function HNLogo({ className, ...props }: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M62.176 23.743H72.686L54.395 51.652V76.94h-8.79V51.655L27.314 23.743h10.509L49.999 42.323 62.176 23.743Z" />
    </svg>
  )
}

/** Reddit (snoo) logo for share button. */
function RedditLogo({ className, ...props }: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.88-7.004 4.88-3.874 0-7.004-2.186-7.004-4.88 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.323.323 0 0 0 0 .457c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.322.322 0 0 0-.001-.457.326.326 0 0 0-.232-.095c-.08 0-.159.032-.218.09a1.903 1.903 0 0 1-2.437 0 .295.295 0 0 0-.218-.09z" />
    </svg>
  )
}

/** Bluesky butterfly logo for share button (from Simple Icons). */
function BlueskyLogo({ className, ...props }: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
      <path d="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026" />
    </svg>
  )
}

/** Extract plain text from React node(s) for heading slug. */
function getHeadingText(children: React.ReactNode): string {
  const parts: string[] = []
  React.Children.forEach(children, (child) => {
    if (typeof child === 'string') parts.push(child)
    else if (React.isValidElement(child) && child.props?.children != null)
      parts.push(getHeadingText(child.props.children))
  })
  return parts.join('')
}

/** URL-safe id from heading text (lowercase, spaces to hyphens, strip non-alphanumeric). */
function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section'
}

/** Wraps markdown tables with horizontal scroll and shows a hint when table overflows viewport. */
function PostTableWrapper({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)
  const [scrollDir, setScrollDir] = useState<'left' | 'right' | 'both'>(() => 'right')
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => {
      const scrollable = el.scrollWidth > el.clientWidth
      setIsScrollable(scrollable)
      if (scrollable) {
        const left = el.scrollLeft > 4
        const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
        setScrollDir(left && right ? 'both' : left ? 'left' : 'right')
      }
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])
  return (
    <div className={`my-6 rounded-lg border border-border table-scroll-outer${isScrollable ? ' table-scrollable' : ''}`}>
      <div
        ref={wrapperRef}
        className="overflow-x-auto table-scroll-viewport"
      >
        <div className="table-scroll-inner">
          <table {...props}>{children}</table>
        </div>
      </div>
      {isScrollable && (
        <div className="table-scroll-edge" aria-hidden="true">
          <span className="table-scroll-hint">
            {scrollDir === 'left' && (
              <>
                <ChevronsLeft className="h-4 w-4" />
                Scroll left
              </>
            )}
            {scrollDir === 'right' && (
              <>
                Scroll right
                <ChevronsRight className="h-4 w-4" />
              </>
            )}
            {scrollDir === 'both' && (
              <>
                <ChevronsLeft className="h-4 w-4" />
                Scroll
                <ChevronsRight className="h-4 w-4" />
              </>
            )}
          </span>
        </div>
      )}
    </div>
  )
}

const SITE_BASE = 'https://markmhendrickson.com'
/** Always use for share bar and copy-link so shared URLs are production, not dev origin. */
const PROD_SITE_BASE = 'https://markmhendrickson.com'
const OG_DEFAULT_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

/** In dev, load private cache so draft posts can be viewed by slug.
 * Merge in any post from posts.json that is not already in the private list (e.g. new or file-only posts not yet in Neotoma export). */
async function loadPostsDataForSlug(includeDrafts: boolean): Promise<Post[]> {
  if (!includeDrafts || import.meta.env.PROD) return publicPostsData as Post[]
  try {
    const privateData = await import('@cache/posts.private.json')
    const privateList = (privateData.default ?? privateData) as Post[]
    const privateSlugs = new Set(privateList.map((p) => p.slug).filter(Boolean))
    const fromPublicOnly = (publicPostsData as Post[]).filter((p) => p.slug && !privateSlugs.has(p.slug))
    return [...privateList, ...fromPublicOnly]
  } catch {
    return publicPostsData as Post[]
  }
}

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
  /** URL of the post's tweet on X (shown in footer when set). */
  linkedTweetUrl?: string
  /** URL of an X profile or list timeline to embed (see https://help.x.com/en/using-x/embed-x-feed). */
  xTimelineUrl?: string
  /** Tweet metadata (images, engagement) for X posts. */
  tweetMetadata?: { images?: string[] }
}

/** Share bar: common platforms + content strategy targets (X, LinkedIn, Facebook, HN, Reddit, Email, Copy link). */
function PostShareBar({
  shareUrl,
  title,
  onCopyFeedback,
  copySuccess,
  noTopBorder,
}: {
  shareUrl: string
  title: string
  onCopyFeedback: () => void
  copySuccess: boolean
  /** When true, omit top margin and border (e.g. when share is first in footer). */
  noTopBorder?: boolean
}) {
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)
  const blueskyText = `${title} ${shareUrl}`
  const shareLinks = [
    { label: 'Bluesky', href: `https://bsky.app/intent/compose?text=${encodeURIComponent(blueskyText)}`, icon: BlueskyLogo },
    { label: 'Email', href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`, icon: Mail },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: Facebook },
    { label: 'Hacker News', href: 'https://news.ycombinator.com/submit', icon: HNLogo, title: 'Opens HN submit page. Use the Copy button above, then paste the link into the URL field.' },
    { label: 'LinkedIn', href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`, icon: Linkedin },
    { label: 'Reddit', href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`, icon: RedditLogo },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, icon: XLogo },
  ]

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      onCopyFeedback()
    } catch {
      // ignore
    }
  }

  return (
    <div className={noTopBorder ? 'pt-2' : 'mt-6 pt-6 border-t border-[#eee]'}>
      <span className="text-[13px] text-[#999] font-medium uppercase tracking-wide block mb-3">Share</span>
      <div className="flex flex-wrap items-center gap-2">
        {shareLinks.map(({ label, href, icon: Icon, title: linkTitle }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#e0e0e0] text-[#555] hover:bg-[#f5f5f5] hover:border-[#ccc] transition-colors"
            aria-label={linkTitle ?? `Share on ${label}`}
            title={linkTitle ?? `Share on ${label}`}
          >
            <Icon className="w-4 h-4" />
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#e0e0e0] text-[#555] hover:bg-[#f5f5f5] hover:border-[#ccc] transition-colors"
          aria-label="Copy link"
          title="Copy link"
        >
          {copySuccess ? (
            <span className="text-[11px] text-green-600 font-medium">OK</span>
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
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
  const [postscriptContent, setPostscriptContent] = useState<string | undefined>(undefined)
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
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false)
  const timelineEmbedRef = useRef<HTMLDivElement>(null)

  // Load X (Twitter) widgets script when xTimelineUrl is set (timeline embed only)
  useEffect(() => {
    if (!post?.xTimelineUrl) return
    const runWidgets = () => {
      const twttr = (window as unknown as { twttr?: { widgets?: { load: (el?: HTMLElement) => void } } }).twttr
      twttr?.widgets?.load()
    }
    const existing = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')
    if (existing) {
      // Script already on page; defer so blockquote is in DOM (React may not have committed yet)
      const t = setTimeout(runWidgets, 150)
      return () => clearTimeout(t)
    }
    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.onload = () => {
      setTimeout(runWidgets, 100)
    }
    document.body.appendChild(script)
    return () => { /* script stays for other embeds */ }
  }, [post?.xTimelineUrl])

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

  // Scroll to linked section when page loads with anchor hash (e.g. /posts/slug#section-id)
  useEffect(() => {
    const hash = location.hash?.slice(1)
    if (!hash || !content || !post) return
    const scrollToAnchor = () => {
      const el = document.getElementById(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToAnchor)
    })
    return () => cancelAnimationFrame(t)
  }, [content, post, location.hash])

  /** Canonical published-list order: newest first by publishedDate, then slug asc for ties. Must match Posts.tsx and cache script. */
  const publishedListOrder = (a: Post, b: Post) => {
    const tA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0
    const tB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0
    if (tB !== tA) return tB - tA
    return (a.slug || '').localeCompare(b.slug || '')
  }

  /** Only published posts (exclude drafts). Used for latest link and prev/next footer. */
  const publishedOnly = useMemo(
    () =>
      (publicPostsData as Post[])
        .filter((p) => p.published === true && !p.excludeFromListing)
        .sort(publishedListOrder),
    []
  )

  const latestPost = useMemo(() => {
    const list = publishedOnly.filter((p) => p.slug !== (resolvedCanonicalSlug ?? ''))
    return list[0] ?? null
  }, [publishedOnly, resolvedCanonicalSlug])

  const { prevPost, nextPost } = useMemo(() => {
    const seen = new Set<string>()
    const list = publishedOnly.filter((p) => {
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
  }, [publishedOnly, resolvedCanonicalSlug])

  useEffect(() => {
    const loadPost = async () => {
      try {
        const postsData: Post[] = await loadPostsDataForSlug(isDev)

        const slugToPost = buildSlugToPostMap(postsData)
        const postMeta = slug ? slugToPost.get(slug) ?? postsData.find(p => p.slug === slug) : undefined
        const canonicalSlug = postMeta?.slug

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

        const tryLoadPostscriptMarkdown = async (): Promise<string | null> => {
          const loadSlug = canonicalSlug ?? slug
          try {
            let mod: { default: string }
            if (!postMeta.published && isDev) {
              try {
                mod = await import(`@/content/posts/drafts/${loadSlug}.postscript.md?raw`) as { default: string }
              } catch {
                mod = await import(`@/content/posts/${loadSlug}.postscript.md?raw`) as { default: string }
              }
            } else {
              mod = await import(`@/content/posts/${loadSlug}.postscript.md?raw`) as { default: string }
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
          const postscriptFromMd = await tryLoadPostscriptMarkdown()
          setPostscriptContent(postscriptFromMd ?? undefined)
          if (!postMeta.published) {
            const tweetFromCache = (postMeta as Post).shareTweet?.trim()
            const tweetFromMd = await tryLoadTweetMarkdown()
            setTweetContent((tweetFromCache || tweetFromMd) ?? undefined)
          } else {
            setTweetContent(undefined)
          }
        } else {
          setSummaryContent(undefined)
          const postscriptFromMd = await tryLoadPostscriptMarkdown()
          setPostscriptContent(postscriptFromMd ?? undefined)
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

  /** Only treat as tweet post when category is tweet; linkedTweetUrl is for footer "share" link. */
  const isTweetPost = post.category === 'tweet'
  const metaDescription = post.shareDescription
    ? post.shareDescription
    : post.excerpt
      ? stripLinksFromExcerpt(post.excerpt)
      : (post.summary && post.summary.replace(/\s+/g, ' ').replace(/^[-*]\s*/gm, '').trim().slice(0, 160))
  const desc = (metaDescription || post.title || (post.body ?? '')).slice(0, 160)
  const isHome = location.pathname === '/'
  const canonicalUrl = isHome ? `${SITE_BASE}/` : `${SITE_BASE}/posts/${post.slug}`
  const displaySummary = summaryContent !== undefined ? summaryContent : (post.summary ?? '')
  const displayTweet = (post.shareTweet ?? '').trim() || (tweetContent ?? '').trim()
  // Default OG image only on home; post pages use post-specific image or none
  const ogImage = post.ogImage
    ? `${SITE_BASE}/images/${post.ogImage}`
    : isHome
      ? OG_DEFAULT_IMAGE
      : post.heroImage
        ? (post.heroImage.startsWith('http') ? post.heroImage : `${SITE_BASE}/images/posts/${post.heroImage}`)
        : null

  return (
    <>
      <Helmet>
        <title>{!post.title ? (isTweetPost ? 'X Post — Mark Hendrickson' : 'Mark Hendrickson') : (post.title === 'Mark Hendrickson' ? post.title : `${post.title} — Mark Hendrickson`)}</title>
        <meta name="description" content={desc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title || (isTweetPost ? 'X Post' : '')} />
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
        <meta name="twitter:title" content={post.title || (isTweetPost ? 'X Post' : '')} />
        <meta name="twitter:description" content={desc} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title || (isTweetPost ? (post.body ?? '').slice(0, 100) : ''),
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
              { '@type': 'ListItem', position: 3, name: post.title || (isTweetPost ? 'X Post' : post.slug), item: canonicalUrl },
            ],
          })}
        </script>
      </Helmet>
    <div className="flex justify-center items-center min-h-content pt-8 pb-8 px-4 md:pt-8 md:pb-8 md:px-8 overflow-x-hidden">
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
                  <span className="font-medium text-foreground">
                    {latestPost.category === 'tweet'
                      ? (latestPost.body ?? '').slice(0, 80) + ((latestPost.body ?? '').length > 80 ? '…' : '')
                      : latestPost.title}
                  </span>
                  {latestPost.excerpt && (
                    <p className="mt-1 text-sm text-muted-foreground">
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
                  src={getPostImageSrc(latestPost.heroImageSquare ?? latestPost.heroImage ?? '')}
                  alt=""
                  className="hidden md:block shrink-0 w-[148px] h-[148px] rounded object-cover"
                />
              )}
            </Alert>
          </Link>
        )}
        <article>
          {!isTweetPost && (
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
          )}

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

          {post.heroImage && !isTweetPost && post.heroImageStyle !== 'float-right' && (
            <div className="mb-8 w-full">
              <img
                src={getPostImageSrc(post.heroImage)}
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
                  src={getPostImageSrc(post.heroImage)}
                  alt={post.title}
                  className="w-full aspect-square object-cover rounded"
                />
              </div>
            )}
            {(() => {
              const makeHeading = (Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') =>
                ({ children, ...props }: React.ComponentPropsWithoutRef<typeof Tag>) => {
                  const slug = slugifyHeading(getHeadingText(children))
                  return (
                    <Tag id={slug} className="group scroll-mt-6" {...props}>
                      {children}
                      <a
                        href={`#${slug}`}
                        className="post-heading-anchor ml-2 inline-flex align-middle opacity-40 group-hover:opacity-70 hover:opacity-100 text-[#999] hover:text-[#333] no-underline"
                        aria-label="Link to section"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </a>
                    </Tag>
                  )
                }
              const markdownComponents = {
                h1: makeHeading('h1'),
                h2: makeHeading('h2'),
                h3: makeHeading('h3'),
                h4: makeHeading('h4'),
                h5: makeHeading('h5'),
                h6: makeHeading('h6'),
                table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
                  <PostTableWrapper {...props}>{children}</PostTableWrapper>
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

          {postscriptContent && (
            <div className="post-prose postscript-prose prose prose-sm max-w-none mt-12 pt-8 border-t border-[#e0e0e0]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{postscriptContent}</ReactMarkdown>
            </div>
          )}

          {isTweetPost && post.tweetMetadata?.images && post.tweetMetadata.images.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {post.tweetMetadata.images.map((url, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-lg border border-[#e0e0e0]">
                  <img
                    src={getPostImageSrc(url)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {post.heroImageStyle === 'float-right' && <div className="clear-both"></div>}

          {(post.published || post.showMetadata !== false) && (
            <footer className="mt-12 pt-8 border-t border-[#e0e0e0]">
              {!post.published && isDev && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 text-[11px] font-medium bg-yellow-100 text-yellow-800 rounded">
                    Draft
                  </span>
                </div>
              )}
              {!isHome && (
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
                    <span className="capitalize">
                      {(post.category || '').toLowerCase() === 'tweet' ? 'X Post' : post.category}
                    </span>
                  )}
                </div>
              )}
              <PostShareBar
                shareUrl={isHome ? `${PROD_SITE_BASE}/` : `${PROD_SITE_BASE}/posts/${post.slug}`}
                title={post.title}
                onCopyFeedback={() => {
                  setCopyLinkSuccess(true)
                  setTimeout(() => setCopyLinkSuccess(false), 2000)
                }}
                copySuccess={copyLinkSuccess}
                noTopBorder={isHome}
              />
            </footer>
          )}
        </article>

        {post.linkedTweetUrl && (
          <section className="mt-12 pt-8 border-t border-[#e0e0e0]" aria-label="Related X post">
            <a
              href={post.linkedTweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
              View X post
            </a>
          </section>
        )}

        {post.xTimelineUrl && (
          <section className="mt-12 pt-8 border-t border-[#e0e0e0]" aria-label="X timeline">
            <h2 className="text-[13px] text-muted-foreground font-medium uppercase tracking-wide mb-4">
              Follow on X
            </h2>
            <div ref={timelineEmbedRef} className="flex flex-col items-center">
              <blockquote className="twitter-timeline" data-dnt="true">
                <a href={post.xTimelineUrl}>X Posts</a>
              </blockquote>
            </div>
          </section>
        )}

        {isDev && displayTweet && (
          <Alert className="mt-12 pt-8 border-t border-[#e0e0e0]" aria-label="Share X post draft">
            <AlertTitle className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Share X post
            </AlertTitle>
            <AlertDescription asChild>
              <div className="post-prose-summary prose prose-sm max-w-none text-sm [&_p]:leading-relaxed whitespace-pre-wrap">
                {displayTweet}
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
                      <span className="font-medium text-foreground">
                        {nextPost.category === 'tweet'
                          ? (nextPost.body ?? '').slice(0, 80) + ((nextPost.body ?? '').length > 80 ? '…' : '')
                          : nextPost.title}
                      </span>
                      {nextPost.excerpt && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {stripLinksFromExcerpt(nextPost.excerpt)}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                        Read more →
                      </span>
                    </AlertDescription>
                  </div>
                  {(nextPost.heroImage || nextPost.tweetMetadata?.images?.[0]) && (
                    <img
                      src={getPostImageSrc(nextPost.heroImageSquare ?? nextPost.heroImage ?? nextPost.tweetMetadata?.images?.[0] ?? '')}
                      alt=""
                      className="shrink-0 w-[148px] h-[148px] rounded object-cover"
                    />
                  )}
                </Alert>
              </Link>
            )}
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
                      <span className="font-medium text-foreground">
                        {prevPost.category === 'tweet'
                          ? (prevPost.body ?? '').slice(0, 80) + ((prevPost.body ?? '').length > 80 ? '…' : '')
                          : prevPost.title}
                      </span>
                      {prevPost.excerpt && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {stripLinksFromExcerpt(prevPost.excerpt)}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                        Read more →
                      </span>
                    </AlertDescription>
                  </div>
                  {(prevPost.heroImage || prevPost.tweetMetadata?.images?.[0]) && (
                    <img
                      src={getPostImageSrc(prevPost.heroImageSquare ?? prevPost.heroImage ?? prevPost.tweetMetadata?.images?.[0] ?? '')}
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
