import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import React from 'react'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { usePostSSR } from '@/contexts/PostSSRContext'
import {
  stripLinksFromExcerpt,
  getPostImageSrc,
  getZoomImageSrc,
  stripFrontmatter,
  limitSummaryToFiveBullets,
  parseFrontmatter,
  isExcludedFromListing,
  isPublishedPost,
  normalizeMarkdownFormatting,
  splitEmbeddedKeyTakeawaysFromBody,
  stripRedundantThematicBreaks,
  stripSeriesMarkdownBookends,
  stripMarkdownBold,
  stripSeriesPrefixFromTitle,
  cn,
  formatPostPublishedDate,
  parseCalendarOrIsoDateString,
} from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Linkedin, Facebook, Mail, Copy, ExternalLink, Link as LinkIcon } from 'lucide-react'
import AmenitiesCards from '@/components/AmenitiesCards'
import SeriesNav from '@/components/SeriesNav'
import { defaultLocale, supportedLocales, type SupportedLocale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleContext'
import { localizePath } from '@/i18n/routing'
import { getLocalizedPublicPosts } from '@/lib/postsLocaleData'
import { mergeLocalizedPublicWithPrivatePosts } from '@/lib/mergeDevPostCaches'
import privatePostsJson from '@cache/posts.private.json'
import { markNavigatingToRawMarkdown } from '@/lib/rawMarkdownNav'
import { trackUmamiEvent } from '@/lib/umami'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { buildSeriesOrderedPartSlugs } from '@/lib/resolveSeriesSlug'

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

/** Plain text from ReactMarkdown `children` (for conditional styling). */
function markdownPlainText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(markdownPlainText).join('')
  if (React.isValidElement(node)) {
    const ch = (node.props as { children?: React.ReactNode }).children
    return markdownPlainText(ch)
  }
  return ''
}

/** Seasons / special-events blurbs under the Barcelona pricing table (en/es/ca). */
function isBarcelonaGuestFloorPricingFinePrint(
  postSlug: string | null | undefined,
  plain: string
): boolean {
  if (postSlug !== 'barcelona-guest-floor') return false
  const t = plain.replace(/\s+/g, ' ').trim()
  return (
    t.startsWith('Seasons') ||
    t.startsWith('Temporadas') ||
    t.startsWith('Temporades') ||
    t.startsWith('Special events') ||
    t.startsWith('Eventos especiales') ||
    t.startsWith('Esdeveniments especials')
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

/** Mastodon (M) logo for share button (from Simple Icons). */
function MastodonLogo({ className, ...props }: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
      <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" />
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

/** Split inline postscript section from markdown body (heading: "## Postscript..."). */
function splitInlinePostscript(markdown: string): { main: string; postscript?: string } {
  if (!markdown) return { main: '' }
  const match = /(?:^|\n)(##\s+postscript\b[\s\S]*)/i.exec(markdown)
  if (!match) return { main: markdown }
  const startsWithNewline = match[0].startsWith('\n')
  const startIndex = match.index + (startsWithNewline ? 1 : 0)
  const main = markdown.slice(0, startIndex).trimEnd()
  const postscript = match[1].trim()
  return { main, postscript: postscript || undefined }
}

function splitMarkdownByH2(markdown: string): { intro: string; sections: string[] } {
  if (!markdown) return { intro: '', sections: [] }
  const parts = markdown.split(/(?=^##\s+)/m).filter(Boolean)
  if (parts.length === 0) return { intro: markdown, sections: [] }
  if (parts[0].startsWith('## ')) return { intro: '', sections: parts }
  return { intro: parts[0], sections: parts.slice(1) }
}

function splitSectionHeading(section: string): { heading: string; body: string } {
  const trimmed = section.trim()
  const match = /^(## [^\n]+\n\n)([\s\S]*)$/.exec(trimmed)
  if (!match) return { heading: trimmed, body: '' }
  return { heading: match[1], body: match[2].trim() }
}

function extractMarkdownBullets(body: string): string[] {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
}

function splitMarkdownParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
}

function MarkdownBulletCards({ items }: { items: string[] }) {
  return (
    <div className="my-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {items.map((item) => (
          <Card key={item} className="overflow-hidden">
            <CardContent className="p-4 flex items-center">
              <span className="text-[15px] leading-snug">{item}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ContactCards({
  items,
  footnoteOptions,
}: {
  items: string[]
  footnoteOptions: { footnoteLabel: string; footnoteBackLabel: string }
}) {
  return (
    <div className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {items.map((item) => {
        const match = /^\*\*(.+?):\*\*\s*(.*)$/.exec(item.trim())
        const label = match?.[1] ?? ''
        const body = match?.[2] ?? item
        return (
          <Card key={item} className="overflow-hidden">
            <CardContent className="p-4">
              {label ? <div className="mb-2 text-sm font-medium">{label}</div> : null}
              <div className="text-[15px] leading-relaxed text-muted-foreground [&_p]:m-0 [&_a]:break-all [&_a]:text-foreground [&_a]:no-underline hover:[&_a]:text-foreground/80">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  remarkRehypeOptions={footnoteOptions}
                  components={{
                    p: ({ children }) => <>{children}</>,
                  }}
                >
                  {body}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function isBarcelonaGuestFloorEmailCtaLink(
  postSlug: string | null | undefined,
  href: string | undefined,
  label: string,
): boolean {
  if (postSlug !== 'barcelona-guest-floor' || !href?.startsWith('mailto:markmhendrickson@gmail.com')) return false
  const normalized = label.trim().toLowerCase()
  return (
    normalized === 'email us' ||
    normalized === 'escríbenos por email' ||
    normalized === 'escriu-nos per correu'
  )
}

function isBarcelonaGuestFloorEmailCtaParagraph(
  postSlug: string | null | undefined,
  children: React.ReactNode,
): boolean {
  if (postSlug !== 'barcelona-guest-floor') return false
  const plain = markdownPlainText(children).toLowerCase()
  return (
    plain.includes('email us') ||
    plain.includes('escríbenos por email') ||
    plain.includes('escriu-nos per correu')
  )
}

function PostscriptSection({
  markdown,
  footnoteOptions,
  linkLabel,
}: {
  markdown: string
  footnoteOptions: { footnoteLabel: string; footnoteBackLabel: string }
  linkLabel: string
}) {
  const makePostscriptHeading = (Tag: 'h2' | 'h3' | 'h4' | 'h5' | 'h6') =>
    ({ children, ...props }: React.ComponentPropsWithoutRef<typeof Tag>) => {
      const slug = slugifyHeading(getHeadingText(children))
      return (
        <Tag id={slug} className="group scroll-mt-6" {...props}>
          {children}
          <a
            href={`#${slug}`}
            className="post-heading-anchor ml-2 inline-flex align-middle opacity-40 group-hover:opacity-70 hover:opacity-100 text-muted-foreground hover:text-foreground no-underline"
            aria-label={linkLabel}
          >
            <LinkIcon className="h-4 w-4" />
          </a>
        </Tag>
      )
    }

  return (
    <section className="postscript-shell" aria-label="Postscript">
      <div className="postscript-prose prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          remarkRehypeOptions={footnoteOptions}
          components={{
            h2: makePostscriptHeading('h2'),
            h3: makePostscriptHeading('h3'),
            h4: makePostscriptHeading('h4'),
            h5: makePostscriptHeading('h5'),
            h6: makePostscriptHeading('h6'),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </section>
  )
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

/**
 * Markdown fences are often hard-wrapped in the source for editor width. Those single newlines
 * are not semantic line breaks; preserve only blank-line paragraph gaps so display and copy match prose.
 */
function unwrapHardWrappedFenceBody(s: string): string {
  const trimmed = s.trimEnd()
  return trimmed
    .split(/\n\s*\n+/)
    .map((para) => para.replace(/[ \t]*\r?\n[ \t]*/g, ' ').replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n\n')
}

/**
 * Fenced blocks opened with ```copy or ```prompt in post markdown render with a copy control.
 * Other fenced languages keep default prose styling.
 */
function PostCopyableCodeFence({
  text,
  copyLabel,
  copiedLabel,
  postSlug,
}: {
  text: string
  copyLabel: string
  copiedLabel: string
  /** For Umami `post_copy_fence` (optional when slug unknown). */
  postSlug?: string | null
}) {
  const [didCopy, setDidCopy] = useState(false)
  useEffect(() => {
    if (!didCopy) return
    const id = window.setTimeout(() => setDidCopy(false), 2000)
    return () => clearTimeout(id)
  }, [didCopy])

  return (
    <div className="post-copyable-fence not-prose my-5 overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-1.5">
        <div className="min-w-0 text-[11px] font-medium uppercase leading-none tracking-[0.14em] text-muted-foreground">
          Agent prompt
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 shrink-0 rounded-full border border-border/70 bg-background/95 gap-1.5 px-2.5 text-xs font-medium shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80"
          onClick={() => {
            void navigator.clipboard.writeText(text).then(
              () => {
                trackUmamiEvent('post_copy_fence', { slug: postSlug ?? '' })
                setDidCopy(true)
              },
              () => {},
            )
          }}
          aria-label={didCopy ? copiedLabel : copyLabel}
        >
          <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {didCopy ? copiedLabel : copyLabel}
        </Button>
      </div>
      <pre className="m-0 overflow-x-auto !bg-muted/55 !p-4 text-[14px] font-mono font-medium leading-[1.45] text-muted-foreground sm:text-[15px] sm:leading-[1.45] dark:!bg-muted/25">
        <code className="block break-words whitespace-pre-wrap !m-0 !rounded-none !bg-transparent !p-0 !shadow-none">
          {text}
        </code>
      </pre>
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
 * Default locale: private overwrites public per slug (`mergeDevPostCaches`).
 * Other locales: localized public wins on overlap so es/ca stay correct. */
async function loadPostsDataForSlug(includeDrafts: boolean, locale: SupportedLocale): Promise<Post[]> {
  const localizedPublicPosts = getLocalizedPublicPosts(locale) as unknown as Post[]
  if (!includeDrafts || (import.meta.env.PROD && import.meta.env.VITE_SHOW_DRAFTS !== 'true')) return localizedPublicPosts
  // Use eagerly-bundled private posts (avoids dead-code elimination of dynamic import)
  const privateList = (privatePostsJson as unknown as Post[])
  return mergeLocalizedPublicWithPrivatePosts(localizedPublicPosts, privateList, locale)
}

interface Post {
  slug: string
  postId?: string
  canonicalSlug?: string
  /** Alternative URL slugs (e.g. short or share-friendly); canonical URL uses slug. */
  alternativeSlugs?: string[]
  title: string
  excerpt?: string
  summary?: string
  /** Optional 110–160 char description for og:description and meta description when shared. */
  shareDescription?: string
  /** Optional path (under public/images/) to a 1200x630, under 600KB og:image for this post (e.g. og/foo.jpg). */
  ogImage?: string
  published: boolean | number | string
  publishedDate?: string
  updatedDate?: string
  category?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageSquare?: string
  heroImageStyle?: string
  excludeFromListing?: boolean | number | string
  showMetadata?: boolean
  body?: string
  /** Draft share tweet (dev only, from .tweet.md / parquet). */
  shareTweet?: string
  /** Optional locale-specific postscript markdown (e.g., disclosure/footnote blocks). */
  postscript?: string
  /** URL of the post's tweet on X (shown in footer when set). */
  linkedTweetUrl?: string
  /** URL of an X profile or list timeline to embed (see https://help.x.com/en/using-x/embed-x-feed). */
  xTimelineUrl?: string
  /** Tweet metadata (images, engagement) for X posts. */
  tweetMetadata?: { images?: string[] }
  /** Series name, e.g. "The Human Inversion" */
  series?: string
  /** Slug for the series index page, e.g. "the-human-inversion" */
  seriesSlug?: string
  /** Which part in the series (1-based) */
  seriesPart?: number
  /** Total parts in the series */
  seriesTotal?: number
}

/** Share bar: common platforms + content strategy targets (Bluesky, Mastodon, X, LinkedIn, Facebook, HN, Reddit, Email, Copy link). */
function PostShareBar({
  shareUrl,
  title,
  onCopyFeedback,
  copySuccess,
  noTopBorder,
  labels,
  umamiSlug,
}: {
  shareUrl: string
  title: string
  onCopyFeedback: () => void
  copySuccess: boolean
  /** When true, omit top margin and border (e.g. when share is first in footer). */
  noTopBorder?: boolean
  /** Passed to Umami as `slug` on copy-link (`home` on index). */
  umamiSlug?: string | null
  labels: {
    share: string
    shareOn: string
    copyLink: string
    copied: string
  }
}) {
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)
  const blueskyText = `${title} ${shareUrl}`
  const mastodonText = `${title} ${shareUrl}`
  const shareLinks = [
    { label: 'Bluesky', href: `https://bsky.app/intent/compose?text=${encodeURIComponent(blueskyText)}`, icon: BlueskyLogo },
    { label: 'Email', href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`, icon: Mail },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: Facebook },
    { label: 'Hacker News', href: 'https://news.ycombinator.com/submit', icon: HNLogo, title: 'Opens HN submit page. Use the Copy button above, then paste the link into the URL field.' },
    { label: 'LinkedIn', href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`, icon: Linkedin },
    { label: 'Mastodon', href: `https://mastodonshare.com/?url=${encodedUrl}&text=${encodeURIComponent(mastodonText)}`, icon: MastodonLogo },
    { label: 'Reddit', href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`, icon: RedditLogo },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, icon: XLogo },
  ]

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      trackUmamiEvent('post_copy_share_link', { slug: umamiSlug ?? '' })
      onCopyFeedback()
    } catch {
      // ignore
    }
  }

  return (
    <div className={noTopBorder ? 'pt-2' : 'mt-6 pt-6 border-t border-border'}>
      <span className="text-[13px] text-muted-foreground font-medium uppercase tracking-wide block mb-3">{labels.share}</span>
      <div className="flex flex-wrap items-center gap-2">
        {shareLinks.map(({ label, href, icon: Icon, title: linkTitle }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground transition-colors"
            aria-label={linkTitle ?? `${labels.shareOn} ${label}`}
            title={linkTitle ?? `${labels.shareOn} ${label}`}
          >
            <Icon className="w-4 h-4" />
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground transition-colors"
          aria-label={labels.copyLink}
          title={labels.copyLink}
        >
          {copySuccess ? (
            <span className="text-[11px] text-green-600 font-medium">{labels.copied}</span>
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}

/** Resolve markdown image URLs for dev preview (paths may already be absolute under /images/). */
function devResolveContentImageSrc(raw: string): string {
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('/')) return raw
  return getPostImageSrc(raw)
}

function devPublicPathForPostsDirField(filename: string): string {
  if (!filename) return ''
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename
  if (filename.startsWith('/')) return filename
  return `/images/posts/${filename}`
}

type DevAssetFrame = 'hero' | 'square' | 'og' | 'natural'

/** Dev-only: one image asset with path + optional preview (shows error if file 404). */
function DevPostImageAssetRow({
  label,
  publicPath,
  src,
  frame,
}: {
  label: string
  publicPath: string
  src: string | null
  frame: DevAssetFrame
}) {
  const [loadFailed, setLoadFailed] = useState(false)
  const frameClass =
    frame === 'og'
      ? 'aspect-[1200/630] w-full max-w-xl overflow-hidden rounded border border-border bg-black'
      : frame === 'square'
        ? 'aspect-square w-full max-w-[280px] overflow-hidden rounded border border-border bg-black'
        : frame === 'hero'
          ? 'w-full max-w-xl overflow-hidden rounded border border-border bg-black flex items-center justify-center min-h-[120px]'
          : 'w-full max-w-xl overflow-hidden rounded border border-border bg-muted/30'

  return (
    <div className="space-y-2">
      <p className="text-[12px] text-muted-foreground font-medium">{label}</p>
      <p className="text-[11px] font-mono text-muted-foreground/80 break-all">
        {publicPath || '— (not set)'}
      </p>
      {src && !loadFailed ? (
        <div className={frameClass}>
          <img
            src={src}
            alt=""
            className={
              frame === 'hero'
                ? 'max-h-[50vh] w-full object-contain'
                : frame === 'natural'
                  ? 'max-h-[40vh] w-full object-contain'
                  : 'h-full w-full object-contain'
            }
            onError={() => setLoadFailed(true)}
          />
        </div>
      ) : null}
      {src && loadFailed ? (
        <p className="text-[11px] text-amber-800 dark:text-amber-200/90">
          Preview failed (file missing or not served in dev).
        </p>
      ) : null}
      {!src ? (
        <p className="text-[11px] text-muted-foreground">No URL for this slot in post metadata.</p>
      ) : null}
    </div>
  )
}

/** Dev-only: all image assets tied to this post (hero, thumbs, OG pipeline, tweet embeds, markdown images). */
function PostFooterOgPreviewDev({
  isHome,
  slug,
  postOgImage,
  heroImage,
  heroImageSquare,
  metaOgAbsolute,
  tweetImages,
  contentImages,
}: {
  isHome: boolean
  slug: string
  postOgImage?: string
  heroImage?: string
  heroImageSquare?: string
  metaOgAbsolute: string | null
  tweetImages?: string[]
  contentImages: { src: string; alt: string }[]
}) {
  const metaLocalSrc =
    postOgImage != null && postOgImage !== ''
      ? getPostImageSrc(postOgImage)
      : isHome
        ? '/images/og-default-1200x630.jpg'
        : heroImage
          ? getPostImageSrc(heroImage)
          : null

  const heroPublicPath =
    heroImage != null && heroImage !== '' ? devPublicPathForPostsDirField(heroImage) : ''
  const heroSrc = heroImage != null && heroImage !== '' ? getPostImageSrc(heroImage) : null

  const squarePublicPath =
    heroImageSquare != null && heroImageSquare !== ''
      ? devPublicPathForPostsDirField(heroImageSquare)
      : ''
  const squareSrc =
    heroImageSquare != null && heroImageSquare !== '' ? getPostImageSrc(heroImageSquare) : null

  const heroOgFilename = !isHome && slug ? `${slug}-hero-og.png` : null
  const heroOgPublicPath = heroOgFilename ? `/images/posts/${heroOgFilename}` : null
  const heroOgSrc = heroOgFilename ? getPostImageSrc(heroOgFilename) : null

  const metaOgPublicPath =
    postOgImage != null && postOgImage !== ''
      ? postOgImage.startsWith('http')
        ? postOgImage
        : postOgImage.startsWith('/')
          ? postOgImage
          : `/images/${postOgImage}`
      : isHome
        ? '/images/og-default-1200x630.jpg'
        : metaLocalSrc ?? ''

  return (
    <Collapsible
      defaultOpen={false}
      className="group mt-6 pt-6 border-t border-dashed border-amber-600/35 rounded-md bg-amber-500/[0.06] dark:bg-amber-500/10 p-4"
      data-dev-og-preview
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-sm py-1 text-left',
          'outline-none hover:bg-amber-500/15 dark:hover:bg-amber-500/15',
          'focus-visible:ring-2 focus-visible:ring-amber-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <span className="text-[11px] font-medium uppercase tracking-wide text-amber-900 dark:text-amber-100/90">
          Dev — post images &amp; Open Graph
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-amber-900/80 dark:text-amber-100/80 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="space-y-6 pt-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Metadata and body images for this post. Paths are site-root URLs as in production (
            <code className="text-[10px]">/images/…</code>
            ).
          </p>

          <DevPostImageAssetRow
            label="Hero (post header)"
            publicPath={heroPublicPath}
            src={heroSrc}
            frame="hero"
          />

          <DevPostImageAssetRow
            label="Hero square (list / prev-next thumbnails)"
            publicPath={squarePublicPath}
            src={squareSrc}
            frame="square"
          />

          {!isHome && slug ? (
            <DevPostImageAssetRow
              label={`OG composition source (${slug}-hero-og.png)`}
              publicPath={heroOgPublicPath ?? ''}
              src={heroOgSrc}
              frame="og"
            />
          ) : null}

          <div className="space-y-2">
            <p className="text-[12px] text-muted-foreground font-medium">
              Meta og:image (built JPEG used in &lt;meta property=&quot;og:image&quot;&gt;)
            </p>
            {metaOgAbsolute ? (
              <p className="text-[11px] font-mono text-muted-foreground/80 break-all">{metaOgAbsolute}</p>
            ) : null}
            <p className="text-[11px] font-mono text-muted-foreground/80 break-all">{metaOgPublicPath}</p>
            {metaLocalSrc ? (
              <div className="aspect-[1200/630] w-full max-w-xl overflow-hidden rounded border border-border bg-black">
                <img src={metaLocalSrc} alt="" className="h-full w-full object-contain" />
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                No og:image in meta for this view (no post ogImage, hero, or home default path).
              </p>
            )}
          </div>

          {tweetImages && tweetImages.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[12px] text-muted-foreground font-medium">Tweet / X metadata images</p>
              {tweetImages.map((url, i) => (
                <DevPostImageAssetRow
                  key={`tw-${i}-${url}`}
                  label={`Tweet image ${i + 1}`}
                  publicPath={url}
                  src={url}
                  frame="natural"
                />
              ))}
            </div>
          ) : null}

          {contentImages.length > 0 ? (
            <div className="space-y-4">
              <p className="text-[12px] text-muted-foreground font-medium">
                Inline markdown images ({contentImages.length})
              </p>
              {contentImages.map((im, i) => {
                const resolved = devResolveContentImageSrc(im.src)
                const display =
                  im.src.startsWith('/') || im.src.startsWith('http')
                    ? im.src
                    : im.src.startsWith('og/')
                      ? `/images/${im.src}`
                      : `/images/posts/${im.src}`
                return (
                  <DevPostImageAssetRow
                    key={`md-${i}-${im.src}`}
                    label={im.alt?.trim() ? `Markdown: ${im.alt.trim()}` : `Markdown image ${i + 1}`}
                    publicPath={display}
                    src={resolved || null}
                    frame="natural"
                  />
                )
              })}
            </div>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
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
  const { locale, languageTag, t } = useLocale()
  const isDev = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === 'true'
  const publicPostsData = getLocalizedPublicPosts(locale) as unknown as Post[]
  const privateListStatic = privatePostsJson as unknown as Post[]
  const postsForSeriesRouting = useMemo(() => {
    if (isDev) {
      return mergeLocalizedPublicWithPrivatePosts(publicPostsData as Post[], privateListStatic, locale)
    }
    return publicPostsData as Post[]
  }, [isDev, publicPostsData, privateListStatic, locale])
  const slugToPostForRoute = useMemo(() => {
    if (isDev) return buildSlugToPostMap(postsForSeriesRouting)
    return buildSlugToPostMap(publicPostsData as Post[])
  }, [isDev, publicPostsData, postsForSeriesRouting])
  const resolvedCanonicalSlug = slug ? (slugToPostForRoute.get(slug)?.slug ?? slug) : null
  const ssrPost = usePostSSR() as Post | null
  const [post, setPost] = useState<Post | null>(ssrPost ?? null)
  const [content, setContent] = useState(
    ssrPost?.body ? normalizeMarkdownFormatting(ssrPost.body) : ''
  )
  const [summaryContent, setSummaryContent] = useState<string | undefined>(undefined)
  const [postscriptContent, setPostscriptContent] = useState<string | undefined>(undefined)
  const [excerptFromMd, setExcerptFromMd] = useState<string | undefined>(undefined)
  const [titleFromMd, setTitleFromMd] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(!ssrPost)
  const [animationPhase, setAnimationPhase] = useState<'title' | 'excerpt' | 'heroImage' | 'content' | 'complete' | null>(null)
  const [contentParagraphIndex, setContentParagraphIndex] = useState(0)
  const [heroImageProgress, setHeroImageProgress] = useState(0) // 0-100 for progressive reveal
  const contentParagraphsRef = useRef<string[]>([])

  const seriesOrderedSlugs = useMemo(
    () =>
      post?.seriesSlug ? buildSeriesOrderedPartSlugs(postsForSeriesRouting, post.seriesSlug) : undefined,
    [post?.seriesSlug, postsForSeriesRouting],
  )

  /** Adjacent series parts as full post rows (same card data as global prev/next). */
  const seriesNeighborPosts = useMemo(() => {
    if (!post?.seriesSlug || post.seriesPart == null) {
      return { prev: null as Post | null, next: null as Post | null }
    }
    const total = post.seriesTotal ?? post.seriesPart
    const slugForPart = (partNum: number) => {
      if (
        seriesOrderedSlugs &&
        seriesOrderedSlugs.length === total &&
        seriesOrderedSlugs[partNum - 1]
      ) {
        return seriesOrderedSlugs[partNum - 1]!
      }
      return `${post.seriesSlug}-part-${partNum}`
    }
    const slugPrev = post.seriesPart > 1 ? slugForPart(post.seriesPart - 1) : null
    const slugNext = post.seriesPart < total ? slugForPart(post.seriesPart + 1) : null
    const map = buildSlugToPostMap(postsForSeriesRouting as Post[])
    return {
      prev: slugPrev ? map.get(slugPrev) ?? null : null,
      next: slugNext ? map.get(slugNext) ?? null : null,
    }
  }, [post, seriesOrderedSlugs, postsForSeriesRouting])

  const { body: bodyWithoutEmbeddedKt, takeawaysBullets: embeddedTakeawaysBullets } = useMemo(
    () => splitEmbeddedKeyTakeawaysFromBody(content),
    [content],
  )
  const bodyAfterThematicCleanup = useMemo(
    () => stripRedundantThematicBreaks(bodyWithoutEmbeddedKt),
    [bodyWithoutEmbeddedKt],
  )
  const bodyAfterSeriesBookends = useMemo(() => {
    if (!post?.seriesSlug || post.seriesPart == null) return bodyAfterThematicCleanup
    return stripSeriesMarkdownBookends(bodyAfterThematicCleanup)
  }, [bodyAfterThematicCleanup, post?.seriesSlug, post?.seriesPart])
  const { main: mainContent, postscript: inlinePostscriptContent } = useMemo(
    () => splitInlinePostscript(bodyAfterSeriesBookends),
    [bodyAfterSeriesBookends],
  )
  const effectivePostscriptContent = normalizeMarkdownFormatting(postscriptContent ?? inlinePostscriptContent ?? '')

  // Extract ordered list of images from markdown for gallery viewer
  const postImages = useMemo(() => {
    if (!mainContent) return []
    const list: { src: string; alt: string }[] = []
    // Match markdown image syntax and capture only the URL part (excluding optional title).
    const re = /!\[([^\]]*)\]\(\s*(?:<([^>\s]+)>|(\S+?))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(mainContent)) !== null) {
      const src = m[2] ?? m[3] ?? ''
      list.push({ alt: m[1] ?? '', src })
    }
    return list
  }, [mainContent])

  const [imageViewer, setImageViewer] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })
  const [zoomFallbackIndexes, setZoomFallbackIndexes] = useState<Set<number>>(new Set())
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

  // For barcelona-guest-floor, render the first and third H2 sections as cards.
  const barcelonaSectionLayout = useMemo(() => {
    if (resolvedCanonicalSlug !== 'barcelona-guest-floor') return null
    const { intro, sections } = splitMarkdownByH2(mainContent)
    if (sections.length < 3) return null

    const homeSection = splitSectionHeading(sections[0])
    const homeItems = extractMarkdownBullets(homeSection.body)
    const contactSection = splitSectionHeading(sections[1])
    const contactParagraphs = splitMarkdownParagraphs(contactSection.body)
    const contactCards = contactParagraphs.filter((paragraph) =>
      paragraph.startsWith('**') && (paragraph.includes('tel:') || paragraph.includes('mailto:'))
    )
    const contactCopy = contactParagraphs
      .filter((paragraph) => !contactCards.includes(paragraph))
      .join('\n\n')
    const amenitiesSection = splitSectionHeading(sections[2])

    if (homeItems.length === 0 || !amenitiesSection.heading) return null

    return {
      intro,
      homeHeading: homeSection.heading,
      homeItems,
      contactHeading: contactSection.heading,
      contactCopy,
      contactCards,
      amenitiesHeading: amenitiesSection.heading,
      afterAmenities: sections.slice(3).join('\n\n'),
    }
  }, [resolvedCanonicalSlug, mainContent])

  const openImageViewer = (index: number) => {
    setImageViewer({ open: true, index })
  }
  const closeImageViewer = () => {
    setImageViewer((v) => ({ ...v, open: false }))
    setZoomFallbackIndexes(new Set())
  }
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
    const tA = a.publishedDate ? parseCalendarOrIsoDateString(a.publishedDate).getTime() : 0
    const tB = b.publishedDate ? parseCalendarOrIsoDateString(b.publishedDate).getTime() : 0
    if (tB !== tA) return tB - tA
    return (a.slug || '').localeCompare(b.slug || '')
  }

  /** Only published posts (exclude drafts). Used for latest link and prev/next footer. */
  const publishedOnly = useMemo(
    () =>
      (publicPostsData as Post[])
        .filter((p) => isPublishedPost(p) && !isExcludedFromListing(p))
        .sort(publishedListOrder),
    [publicPostsData]
  )

  const latestPost = useMemo(() => {
    const list = publishedOnly.filter((p) => p.slug !== (resolvedCanonicalSlug ?? ''))
    return list[0] ?? null
  }, [publishedOnly, resolvedCanonicalSlug])

  const { prevPost, prevPost2, nextPost } = useMemo(() => {
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
        prevPost2: list[1] ?? null,
        nextPost: null,
      }
    }
    return {
      prevPost: list[idx + 1] ?? null,
      prevPost2: list[idx + 2] ?? null,
      nextPost: list[idx - 1] ?? null,
    }
  }, [publishedOnly, resolvedCanonicalSlug])

  useEffect(() => {
    let isCancelled = false

    const loadPost = async () => {
      try {
        setLoading(true)
        setExcerptFromMd(undefined)
        setTitleFromMd(undefined)

        const postsData: Post[] = await loadPostsDataForSlug(isDev, locale)
        if (isCancelled) return

        const slugToPost = buildSlugToPostMap(postsData)
        const postMeta = slug ? slugToPost.get(slug) ?? postsData.find(p => p.slug === slug) : undefined
        const canonicalSlug = postMeta?.slug

        if (!postMeta) {
          // Only navigate away if we have a slug param (not for home route)
          if (slugParam) {
            navigate(localizePath('/posts', locale), { replace: true })
          }
          return
        }

        // Check if post is published (or if we're in dev mode)
        if (!isPublishedPost(postMeta) && !isDev) {
          // Only navigate away if we have a slug param (not for home route)
          if (slugParam) {
            navigate(localizePath('/posts', locale), { replace: true })
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
          if (!isPublishedPost(postMeta) && isDev) {
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
            const raw = await loadMarkdownContent()
            return stripFrontmatter(raw)
          } catch (error) {
            console.error('Error loading post content from markdown:', error)
            return null
          }
        }

        const tryLoadSummaryMarkdown = async (): Promise<string | null> => {
          const loadSlug = canonicalSlug ?? slug
          try {
            let mod: { default: string }
            if (!isPublishedPost(postMeta) && isDev) {
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

        const tryLoadPostscriptMarkdown = async (): Promise<string | null> => {
          const loadSlug = canonicalSlug ?? slug
          try {
            let mod: { default: string }
            if (!isPublishedPost(postMeta) && isDev) {
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
          // For non-default locales, prefer localized cache body for published posts.
          const preferLocalizedCacheBody = locale !== defaultLocale && isPublishedPost(postMeta)
          if (preferLocalizedCacheBody && postMeta.body) {
            content = postMeta.body
          } else {
            // Dev preview: markdown takes priority for default locale and drafts.
            content = await tryLoadMarkdown()
            if (content === null && postMeta.body) {
              content = postMeta.body
            }
          }
          // In dev, show excerpt/title from draft frontmatter only for default locale so localized cache titles show for es/ca
          try {
            const raw = await loadMarkdownContent()
            const fm = parseFrontmatter(raw)
            if (isCancelled) return
            if (locale === defaultLocale) {
              setExcerptFromMd(fm.excerpt !== undefined ? fm.excerpt : undefined)
              setTitleFromMd(fm.title !== undefined ? fm.title : undefined)
            } else {
              setExcerptFromMd(undefined)
              setTitleFromMd(undefined)
            }
          } catch {
            if (isCancelled) return
            setExcerptFromMd(undefined)
            setTitleFromMd(undefined)
          }
          const summaryFromMd = await tryLoadSummaryMarkdown()
          if (isCancelled) return
          setSummaryContent(locale === defaultLocale ? (summaryFromMd ?? undefined) : undefined)
          const shouldUseLocalizedPostscript = locale !== defaultLocale && isPublishedPost(postMeta)
          if (shouldUseLocalizedPostscript && postMeta.postscript) {
            setPostscriptContent(normalizeMarkdownFormatting(postMeta.postscript))
          } else {
            const postscriptFromMd = await tryLoadPostscriptMarkdown()
            if (isCancelled) return
            setPostscriptContent(postscriptFromMd ? normalizeMarkdownFormatting(postscriptFromMd) : undefined)
          }
        } else {
          setSummaryContent(undefined)
          const shouldUseLocalizedPostscript = locale !== defaultLocale && isPublishedPost(postMeta)
          if (shouldUseLocalizedPostscript && postMeta.postscript) {
            setPostscriptContent(normalizeMarkdownFormatting(postMeta.postscript))
          } else {
            const postscriptFromMd = await tryLoadPostscriptMarkdown()
            if (isCancelled) return
            setPostscriptContent(postscriptFromMd ? normalizeMarkdownFormatting(postscriptFromMd) : undefined)
          }
          // Production: parquet cache takes priority
          if (postMeta.body) {
            content = postMeta.body
          } else {
            content = await tryLoadMarkdown()
            if (isCancelled) return
          }
        }
        if (isCancelled) return

        if (content) {
          setContent(normalizeMarkdownFormatting(content))
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
        if (isCancelled) return
        console.error('Error loading post:', error)
        // Only navigate away if we have a slug param (not for home route)
        if (slugParam) {
          navigate(localizePath('/posts', locale), { replace: true })
        }
      } finally {
        if (isCancelled) return
        setLoading(false)
      }
    }

    if (slug) {
      loadPost()
    }

    return () => {
      isCancelled = true
    }
  }, [slug, slugParam, navigate, isDev, locale])

  const formatDate = (dateString: string | undefined): string =>
    formatPostPublishedDate(dateString, languageTag)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-content pt-8 pb-8 px-4 md:pt-8 md:pb-8 md:px-8">
        <div className="max-w-[600px] w-full">
          <p className="text-[15px] text-muted-foreground dark:text-foreground/80">{t.postLoading}</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  /** Only treat as tweet post when category is tweet; linkedTweetUrl is for footer "share" link. */
  const isTweetPost = post.category === 'tweet'
  const displayTitle = stripSeriesPrefixFromTitle(
    titleFromMd ?? post.title ?? '',
    post.series,
  )
  const displayExcerpt = excerptFromMd ?? post.excerpt
  const metaDescription = post.shareDescription
    ? post.shareDescription
    : displayExcerpt
      ? stripLinksFromExcerpt(displayExcerpt)
      : (post.summary && post.summary.replace(/\s+/g, ' ').replace(/^[-*]\s*/gm, '').trim().slice(0, 160))
  const desc = (metaDescription || displayTitle || (post.body ?? '')).slice(0, 160)
  const isHome = location.pathname === localizePath('/', locale)
  const hideHomeMetaBoxes = isHome && locale !== defaultLocale
  const canonicalUrl = isHome
    ? `${SITE_BASE}${localizePath('/', locale)}`
    : `${SITE_BASE}${localizePath(`/posts/${post.slug}`, locale)}`
  const markdownUrl = `${SITE_BASE}${localizePath(`/posts/${post.slug}.md`, locale)}`
  const postIdentity = post.postId ?? post.canonicalSlug ?? post.slug
  const localizedAlternateUrls = supportedLocales.map((altLocale) => {
    const localizedPosts = getLocalizedPublicPosts(altLocale) as unknown as Post[]
    const localizedPost = localizedPosts.find((candidate) =>
      (candidate.postId && candidate.postId === postIdentity) ||
      (candidate.canonicalSlug && candidate.canonicalSlug === postIdentity) ||
      candidate.slug === postIdentity
    )
    const localizedSlug = localizedPost?.slug ?? post.slug
    return {
      locale: altLocale,
      href: `${SITE_BASE}${localizePath(`/posts/${localizedSlug}`, altLocale)}`,
    }
  })
  const summaryBulletLimit = post.slug === 'six-agentic-trends-betting-on' ? 6 : 5
  const summaryFromFileOrCache = normalizeMarkdownFormatting(
    summaryContent !== undefined ? summaryContent : (post.summary ?? ''),
  )
  const embeddedTakeawaysMd = embeddedTakeawaysBullets
    ? normalizeMarkdownFormatting(embeddedTakeawaysBullets)
    : ''
  const displaySummary = stripMarkdownBold(
    limitSummaryToFiveBullets(
      summaryFromFileOrCache.trim() ? summaryFromFileOrCache : embeddedTakeawaysMd,
      summaryBulletLimit,
    ),
  )
  const markdownFootnoteOptions = {
    footnoteLabel: t.footnotesHeading,
    footnoteBackLabel: t.footnoteBackLabel,
  }
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
        <title>{!displayTitle ? (isTweetPost ? 'X Post — Mark Hendrickson' : 'Mark Hendrickson') : (displayTitle === 'Mark Hendrickson' ? displayTitle : `${displayTitle} — Mark Hendrickson`)}</title>
        <meta name="description" content={desc} />
        <meta name="author" content="Mark Hendrickson" />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" type="text/markdown" href={markdownUrl} />
        {localizedAlternateUrls.map((alt) => (
          <link key={alt.locale} rel="alternate" hrefLang={alt.locale} href={alt.href} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_BASE}/`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={displayTitle || (isTweetPost ? 'X Post' : '')} />
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
        <meta name="twitter:title" content={displayTitle || (isTweetPost ? 'X Post' : '')} />
        <meta name="twitter:description" content={desc} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: displayTitle || (isTweetPost ? (post.body ?? '').slice(0, 100) : ''),
            description: desc,
            url: canonicalUrl,
            mainEntityOfPage: canonicalUrl,
            ...(ogImage != null && { image: ogImage }),
            ...(post.publishedDate && { datePublished: post.publishedDate }),
            ...(post.updatedDate && { dateModified: post.updatedDate }),
            author: {
              '@type': 'Person',
              name: 'Mark Hendrickson',
              url: SITE_BASE,
              sameAs: [
                'https://www.linkedin.com/in/markmhendrickson',
                'https://github.com/markmhendrickson',
                'https://x.com/markymark',
              ],
            },
            publisher: { '@type': 'Organization', name: 'Mark Hendrickson', logo: { '@type': 'ImageObject', url: `${SITE_BASE}/profile.jpg` } },
            speakable: {
              '@type': 'SpeakableSpecification',
              cssSelector: ['article header h1', 'article header p', '.post-prose-summary'],
            },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: t.navHome, item: `${SITE_BASE}${localizePath('/', locale)}` },
              { '@type': 'ListItem', position: 2, name: t.navPosts, item: `${SITE_BASE}${localizePath('/posts', locale)}` },
              { '@type': 'ListItem', position: 3, name: displayTitle || (isTweetPost ? 'X Post' : post.slug), item: canonicalUrl },
            ],
          })}
        </script>
      </Helmet>
    <div className="flex justify-center items-center min-h-content pt-8 pb-8 px-4 md:pt-8 md:pb-8 md:px-8 overflow-x-hidden">
      <div className="max-w-[600px] w-full">
        {isHome && latestPost && (
          <Link
            to={localizePath(`/posts/${latestPost.slug}`, locale)}
            className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
          >
            <Alert className="mb-8 flex flex-col md:flex-row items-stretch gap-4 cursor-pointer h-full">
              {(latestPost.heroImage || latestPost.ogImage || latestPost.tweetMetadata?.images?.[0]) && (
                <div className="order-1 md:order-2 shrink-0 w-full aspect-[4/2.5] md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center">
                  <img
                    src={getPostImageSrc(latestPost.heroImageSquare ?? latestPost.heroImage ?? latestPost.ogImage ?? latestPost.tweetMetadata?.images?.[0] ?? '')}
                    alt={stripSeriesPrefixFromTitle(latestPost.title || '', latestPost.series) || ''}
                    className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                    style={{ objectPosition: 'center center' }}
                  />
                </div>
              )}
              <div className="order-2 md:order-1 min-w-0 flex-1 flex flex-col gap-1">
                <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {t.latestPost}
                </AlertTitle>
                <AlertDescription className="py-px">
                  <span className="font-medium text-foreground">
                    {latestPost.category === 'tweet'
                      ? (latestPost.body ?? '').slice(0, 80) + ((latestPost.body ?? '').length > 80 ? '…' : '')
                      : stripSeriesPrefixFromTitle(latestPost.title, latestPost.series)}
                  </span>
                  {latestPost.excerpt && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {stripLinksFromExcerpt(latestPost.excerpt)}
                    </p>
                  )}
                  <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                    {t.readMore} →
                  </span>
                </AlertDescription>
              </div>
            </Alert>
          </Link>
        )}
        <article>
          <header className="mb-8">
            <div className="mb-2 flex flex-col-reverse items-start gap-2 md:flex-row md:flex-wrap md:items-baseline md:justify-between md:gap-x-4 md:gap-y-2">
              <h1 className="m-0 min-w-0 w-full text-[28px] font-medium tracking-tight md:flex-1">
                {isTweetPost
                  ? displayTitle?.trim()
                    ? displayTitle
                    : t.xPost
                  : displayTitle}
              </h1>
              {post.slug && (
                <Button variant="outline" size="sm" className="h-8 shrink-0 rounded-full px-3 text-xs font-medium" asChild>
                  <a
                    href={localizePath(`/posts/${post.slug}.md`, locale)}
                    onClick={() => {
                      markNavigatingToRawMarkdown()
                    }}
                  >
                    {t.pageRawMarkdown}
                  </a>
                </Button>
              )}
            </div>
            {!isTweetPost && displayExcerpt && (
              <p className="text-[15px] leading-[1.75] text-muted-foreground dark:text-foreground/80 mb-3">
                {stripLinksFromExcerpt(displayExcerpt)}
              </p>
            )}
            {!isTweetPost && post.series && post.seriesSlug && (
              <Link
                to={localizePath(`/posts/series/${post.seriesSlug}`, locale)}
                className={cn(
                  badgeVariants({ variant: 'outline' }),
                  'mb-4 max-w-full no-underline hover:bg-muted/60',
                  !displayExcerpt && 'mt-1',
                )}
              >
                {post.series}
              </Link>
            )}
          </header>

          {!hideHomeMetaBoxes && displaySummary && (() => {
            const normalizedSummary = displaySummary.trim().replace(/\s+/g, ' ')
            const normalizedExcerpt = displayExcerpt
              ? stripLinksFromExcerpt(displayExcerpt).trim().replace(/\s+/g, ' ')
              : ''
            const repeatsExcerpt = normalizedExcerpt && normalizedSummary === normalizedExcerpt
            return !repeatsExcerpt && (
            <Alert className="mb-8">
              <AlertTitle className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {t.keyTakeaways}
              </AlertTitle>
              <AlertDescription asChild>
                <div className="post-prose-summary prose prose-sm max-w-none text-sm [&_p]:leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} remarkRehypeOptions={markdownFootnoteOptions}>{displaySummary}</ReactMarkdown>
                </div>
              </AlertDescription>
            </Alert>
          );
          })()}

          {post.heroImage && !isTweetPost && post.heroImageStyle !== 'float-right' && (
            <div className="mb-8 w-full">
              <img
                src={getPostImageSrc(post.heroImage)}
                alt={displayTitle}
                className="w-full max-h-[70vh] h-auto object-contain rounded dark:border dark:border-border"
              />
            </div>
          )}

          <div
            className={cn(
              'post-prose prose prose-sm max-w-none',
              resolvedCanonicalSlug === 'barcelona-guest-floor' && [
                '[&_h2]:mb-4',
                '[&_h3]:mb-3',
                '[&_h3]:mt-8',
                '[&_p]:leading-[1.8]',
                '[&_table]:my-4',
                '[&_th]:align-top',
                '[&_td]:align-top',
              ].join(' ')
            )}
          >
            {post.heroImage && post.heroImageStyle === 'float-right' && (
              <div className="w-full mb-8 md:mb-4 md:float-right md:ml-8 md:max-w-[300px]">
                <img
                  src={getPostImageSrc(post.heroImage)}
                  alt={displayTitle}
                  className="w-full aspect-square object-cover rounded dark:border dark:border-border"
                />
              </div>
            )}
            {(() => {
              const makeHeading = (Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') =>
                ({ children, ...props }: React.ComponentPropsWithoutRef<typeof Tag>) => {
                  const slug = slugifyHeading(getHeadingText(children))
                  const showAnchor = Tag !== 'h3'
                  const headingNode = (
                    <Tag id={slug} className="group scroll-mt-6" {...props}>
                      {children}
                      {showAnchor && (
                        <a
                          href={`#${slug}`}
                          className="post-heading-anchor ml-2 inline-flex align-middle opacity-40 group-hover:opacity-70 hover:opacity-100 text-muted-foreground hover:text-foreground no-underline"
                          aria-label={t.linkToSection}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      )}
                    </Tag>
                  )
                  if (Tag === 'h2') {
                    return (
                      <>
                        <hr
                          className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-zinc-700 relative overflow-visible before:content-['◆'] before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:px-2 before:text-[10px] before:leading-none before:text-zinc-500 before:bg-background dark:before:text-zinc-400 dark:before:bg-background"
                          aria-hidden="true"
                        />
                        {headingNode}
                      </>
                    )
                  }
                  return (
                    headingNode
                  )
                }
              const markdownComponents = {
                h1: makeHeading('h2'),
                h2: makeHeading('h2'),
                h3: makeHeading('h3'),
                h4: makeHeading('h4'),
                h5: makeHeading('h5'),
                h6: makeHeading('h6'),
                hr: (props: React.ComponentPropsWithoutRef<'hr'>) => (
                  <hr
                    {...props}
                    className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-zinc-700 relative overflow-visible before:content-['◆'] before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:px-2 before:text-[10px] before:leading-none before:text-zinc-500 before:bg-background dark:before:text-zinc-400 dark:before:bg-background"
                  />
                ),
                a: ({ href, children, className: linkClassName, ...props }: React.ComponentPropsWithoutRef<'a'>) => {
                  const plain = markdownPlainText(children)
                  const isEmailCta = isBarcelonaGuestFloorEmailCtaLink(resolvedCanonicalSlug, href, plain)
                  if (isEmailCta) {
                    return (
                      <Button
                        asChild
                        size="lg"
                        className="h-11 min-h-11 w-full rounded-full px-6 text-[15px] font-semibold text-white shadow-sm hover:text-white sm:w-auto [&_strong]:font-semibold [&_strong]:text-white [&_svg]:text-white border-0 no-underline"
                      >
                        <a
                          href={href}
                          {...props}
                          className={cn(
                            linkClassName,
                            '!text-white hover:!text-white border-0 border-b-0 pb-0 no-underline',
                          )}
                        >
                          <Mail className="size-[18px] shrink-0" aria-hidden />
                          {children}
                        </a>
                      </Button>
                    )
                  }
                  return (
                    <a href={href} className={linkClassName} {...props}>
                      {children}
                    </a>
                  )
                },
                table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
                  <PostTableWrapper {...props}>{children}</PostTableWrapper>
                ),
                pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => {
                  const childArray = React.Children.toArray(children)
                  const codeEl = childArray.find(
                    (c): c is React.ReactElement<{ className?: string; children?: React.ReactNode }> =>
                      React.isValidElement(c) && c.type === 'code',
                  )
                  if (!codeEl) {
                    return <pre {...props}>{children}</pre>
                  }
                  const codeClass = codeEl.props.className ?? ''
                  if (!/\blanguage-(copy|prompt)\b/.test(codeClass)) {
                    return <pre {...props}>{children}</pre>
                  }
                  const rawText = markdownPlainText(codeEl.props.children)
                  const text = unwrapHardWrappedFenceBody(rawText.replace(/\n$/, ''))
                  return (
                    <PostCopyableCodeFence
                      text={text}
                      copyLabel={t.postCopyCode}
                      copiedLabel={t.postCodeCopied}
                      postSlug={resolvedCanonicalSlug ?? post.slug}
                    />
                  )
                },
                p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => {
                  const arr = React.Children.toArray(children)
                  const nonEmpty = arr.filter((c) => !(typeof c === 'string' && c.trim() === ''))
                  const allImg = nonEmpty.length >= 1 && nonEmpty.every((c) => {
                    if (!React.isValidElement(c)) return false
                    const elementProps = c.props as { src?: string } | undefined
                    return c.type === 'img' || c.type === 'button' || typeof elementProps?.src === 'string'
                  })
                  if (allImg) {
                    if (nonEmpty.length === 1) {
                      return <p {...props}>{children}</p>
                    }
                    if (nonEmpty.length === 2) {
                      return (
                        <div
                          className="grid grid-cols-2 gap-3 sm:gap-4 my-4 [&>button]:min-w-0"
                          {...props}
                        >
                          {children}
                        </div>
                      )
                    }
                    return (
                      <div
                        className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 my-4 [&>button]:min-w-0"
                        {...props}
                      >
                        {children}
                      </div>
                    )
                  }
                  const plain = markdownPlainText(children)
                  const finePrint = isBarcelonaGuestFloorPricingFinePrint(resolvedCanonicalSlug, plain)
                  const isEmailCtaParagraph = isBarcelonaGuestFloorEmailCtaParagraph(resolvedCanonicalSlug, children)
                  if (isEmailCtaParagraph) {
                    const [ctaNode, ...restNodes] = nonEmpty
                    return (
                      <div
                        className="my-5 flex flex-col gap-4 rounded-xl border border-border/80 bg-muted/35 p-5 not-prose sm:flex-row sm:items-start sm:justify-between sm:gap-8"
                      >
                        <div className="w-full shrink-0 sm:w-auto">{ctaNode}</div>
                        {restNodes.length > 0 && (
                          <div className="min-w-0 flex-1 text-pretty text-[15px] leading-[1.65] text-muted-foreground">
                            {restNodes}
                          </div>
                        )}
                      </div>
                    )
                  }
                  return (
                    <p
                      {...props}
                      className={cn(
                        finePrint && 'text-[13px] leading-snug text-muted-foreground my-2',
                        props.className
                      )}
                    >
                      {children}
                    </p>
                  )
                },
                img: ({ src, alt, title, ...props }: React.ComponentPropsWithoutRef<'img'>) => {
                  const index = postImages.findIndex((im) => im.src === src)
                  const safeIndex = index >= 0 ? index : 0
                  const showFullFrame = post.slug === 'your-ai-remembers-your-vibe-but-not-your-work'
                  const screenshotHint = `${alt ?? ''} ${title ?? ''}`.toLowerCase()
                  const isScreenshotEmbed =
                    screenshotHint.includes('screenshot') ||
                    (src?.includes('/screenshots/') ?? false)
                  if (postImages.length === 0) {
                    return (
                      <div className={showFullFrame || isScreenshotEmbed ? 'w-full' : 'aspect-square w-full overflow-hidden rounded-lg'}>
                        <img
                          src={src}
                          alt={alt ?? ''}
                          className={showFullFrame || isScreenshotEmbed ? 'w-full h-auto max-h-[85vh] object-contain block rounded-lg' : 'w-full h-full object-cover block'}
                          loading="lazy"
                          title={title}
                          {...props}
                        />
                      </div>
                    )
                  }
                  if (showFullFrame || isScreenshotEmbed) {
                    return (
                      <button
                        type="button"
                        onClick={() => openImageViewer(safeIndex)}
                        className={showFullFrame
                          ? 'w-full text-left rounded-2xl overflow-hidden border border-border hover:border-muted-foreground p-4 bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-zoom-in'
                          : 'not-prose block mx-auto w-[min(calc(100vw-3rem),900px)] max-w-full text-left rounded-2xl overflow-hidden border border-border hover:border-muted-foreground p-2 md:p-3 bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-zoom-in'
                        }
                      >
                        <img
                          src={src}
                          alt={alt ?? ''}
                          className="w-full h-auto max-h-[85vh] object-contain block rounded-2xl"
                          loading="lazy"
                          title={title}
                          {...props}
                        />
                      </button>
                    )
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => openImageViewer(safeIndex)}
                      className="w-full text-left rounded-lg overflow-hidden border border-border hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors aspect-square"
                    >
                      <img
                        src={src}
                        alt={alt ?? ''}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                        title={title}
                        {...props}
                      />
                    </button>
                  )
                },
              }
              return barcelonaSectionLayout ? (
                <>
                  {barcelonaSectionLayout.intro && (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      remarkRehypeOptions={markdownFootnoteOptions}
                      components={markdownComponents}
                    >
                      {barcelonaSectionLayout.intro}
                    </ReactMarkdown>
                  )}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    remarkRehypeOptions={markdownFootnoteOptions}
                    components={markdownComponents}
                  >
                    {barcelonaSectionLayout.homeHeading}
                  </ReactMarkdown>
                  <MarkdownBulletCards items={barcelonaSectionLayout.homeItems} />
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    remarkRehypeOptions={markdownFootnoteOptions}
                    components={markdownComponents}
                  >
                    {barcelonaSectionLayout.contactHeading}
                  </ReactMarkdown>
                  {barcelonaSectionLayout.contactCopy && (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      remarkRehypeOptions={markdownFootnoteOptions}
                      components={markdownComponents}
                    >
                      {barcelonaSectionLayout.contactCopy}
                    </ReactMarkdown>
                  )}
                  {barcelonaSectionLayout.contactCards.length > 0 && (
                    <ContactCards
                      items={barcelonaSectionLayout.contactCards}
                      footnoteOptions={markdownFootnoteOptions}
                    />
                  )}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    remarkRehypeOptions={markdownFootnoteOptions}
                    components={markdownComponents}
                  >
                    {barcelonaSectionLayout.amenitiesHeading}
                  </ReactMarkdown>
                  <AmenitiesCards />
                  {barcelonaSectionLayout.afterAmenities && (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      remarkRehypeOptions={markdownFootnoteOptions}
                      components={markdownComponents}
                    >
                      {barcelonaSectionLayout.afterAmenities}
                    </ReactMarkdown>
                  )}
                </>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  remarkRehypeOptions={markdownFootnoteOptions}
                  components={markdownComponents}
                >
                  {mainContent}
                </ReactMarkdown>
              );
            })()}
          </div>

          {effectivePostscriptContent && (
            <PostscriptSection
              markdown={effectivePostscriptContent}
              footnoteOptions={markdownFootnoteOptions}
              linkLabel={t.linkToSection}
            />
          )}

          {post.series && post.seriesSlug != null && post.seriesPart != null && (
            <SeriesNav post={post} locale={locale} orderedSeriesSlugs={seriesOrderedSlugs} />
          )}

          {isTweetPost && post.tweetMetadata?.images && post.tweetMetadata.images.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {post.tweetMetadata.images.map((url, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-lg border border-border">
                  <img
                    src={getPostImageSrc(url)}
                    alt={`${t.xPost} ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {post.heroImageStyle === 'float-right' && <div className="clear-both"></div>}

          {(isPublishedPost(post) || post.showMetadata !== false) && (
            <footer className="mt-8 pt-6 border-t border-border">
              {!isPublishedPost(post) && isDev && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 text-[11px] font-medium bg-yellow-100 text-yellow-800 rounded">
                    Draft
                  </span>
                </div>
              )}
              {!isHome && (
                <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                  {post.publishedDate && (
                    <time dateTime={post.publishedDate}>
                      {formatDate(post.publishedDate)}
                    </time>
                  )}
                  {post.readTime && (
                    <span>{post.readTime} {t.minRead}</span>
                  )}
                  {post.category && (
                    <span className="capitalize">
                      {(post.category || '').toLowerCase() === 'tweet'
                        ? t.xPost
                        : (post.category || '').toLowerCase() === 'essay'
                          ? t.categoryEssay
                          : post.category}
                    </span>
                  )}
                </div>
              )}
              {!hideHomeMetaBoxes && (
                <PostShareBar
                  shareUrl={isHome ? `${PROD_SITE_BASE}/` : `${PROD_SITE_BASE}/posts/${post.slug}`}
                  title={displayTitle}
                  onCopyFeedback={() => {
                    setCopyLinkSuccess(true)
                    setTimeout(() => setCopyLinkSuccess(false), 2000)
                  }}
                  copySuccess={copyLinkSuccess}
                  noTopBorder={isHome}
                  umamiSlug={isHome ? 'home' : post.slug}
                  labels={{
                    share: t.share,
                    shareOn: t.shareOn,
                    copyLink: t.copyLink,
                    copied: t.copied,
                  }}
                />
              )}
              {isDev && !hideHomeMetaBoxes && (
                <PostFooterOgPreviewDev
                  isHome={isHome}
                  slug={post.slug}
                  postOgImage={post.ogImage}
                  heroImage={post.heroImage}
                  heroImageSquare={post.heroImageSquare}
                  metaOgAbsolute={ogImage}
                  tweetImages={post.tweetMetadata?.images}
                  contentImages={postImages}
                />
              )}
            </footer>
          )}
        </article>

        {post.linkedTweetUrl && (
          <section className="mt-8 pt-6 border-t border-border" aria-label={t.relatedXPost}>
            <a
              href={post.linkedTweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
              {t.viewXPost}
            </a>
          </section>
        )}

        {post.xTimelineUrl && (
          <section className="mt-8 pt-6 border-t border-border" aria-label={t.xTimeline}>
            <h2 className="text-[13px] text-muted-foreground font-medium uppercase tracking-wide mb-4">
              {t.followOnX}
            </h2>
            <div ref={timelineEmbedRef} className="flex flex-col items-center">
              <blockquote className="twitter-timeline" data-dnt="true">
                <a href={post.xTimelineUrl}>{t.xPosts}</a>
              </blockquote>
            </div>
          </section>
        )}

        {imageViewer.open && postImages.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            role="dialog"
            aria-modal="true"
            aria-label={t.imageViewer}
            onClick={closeImageViewer}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closeImageViewer() }}
              className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label={t.close}
            >
              <X className="w-6 h-6" />
            </button>
            {imageViewer.index > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={t.previousImage}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {imageViewer.index < postImages.length - 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={t.nextImage}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
            <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center p-12" onClick={(e) => e.stopPropagation()}>
              <img
                src={
                  zoomFallbackIndexes.has(imageViewer.index)
                    ? postImages[imageViewer.index].src
                    : getZoomImageSrc(postImages[imageViewer.index].src)
                }
                alt={postImages[imageViewer.index].alt}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded"
                onError={() => setZoomFallbackIndexes((s) => new Set(s).add(imageViewer.index))}
              />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 max-w-[90vw] px-4 text-center">
              <span className="text-white/70 text-sm">
                {imageViewer.index + 1} / {postImages.length}
              </span>
              {postImages[imageViewer.index].alt?.trim() && (
                <span className="text-white/90 text-sm max-w-[85ch]">
                  {postImages[imageViewer.index].alt}
                </span>
              )}
            </div>
          </div>
        )}

        {!isHome && !isExcludedFromListing(post) && post.seriesPart && post.seriesSlug ? (
          <nav className="mt-8 flex flex-col gap-4" aria-label={t.previousAndNextPosts}>
            {seriesNeighborPosts.next && (
              <Link
                to={localizePath(`/posts/${seriesNeighborPosts.next.slug}`, locale)}
                className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
              >
                <Alert className="flex flex-col md:flex-row items-stretch gap-4 cursor-pointer h-full">
                  {(seriesNeighborPosts.next.heroImage ||
                    seriesNeighborPosts.next.ogImage ||
                    seriesNeighborPosts.next.tweetMetadata?.images?.[0]) && (
                    <div className="order-1 md:order-2 shrink-0 w-full aspect-[4/2.5] md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={getPostImageSrc(
                          seriesNeighborPosts.next.heroImageSquare ??
                            seriesNeighborPosts.next.heroImage ??
                            seriesNeighborPosts.next.ogImage ??
                            seriesNeighborPosts.next.tweetMetadata?.images?.[0] ??
                            '',
                        )}
                        alt={
                          stripSeriesPrefixFromTitle(
                            seriesNeighborPosts.next.title || '',
                            seriesNeighborPosts.next.series,
                          ) || ''
                        }
                        className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                        style={{ objectPosition: 'center center' }}
                      />
                    </div>
                  )}
                  <div className="order-2 md:order-1 min-w-0 flex-1 flex flex-col gap-1">
                    <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground dark:text-foreground/80">
                      {t.nextPost}
                    </AlertTitle>
                    <AlertDescription className="py-px">
                      <span className="font-medium text-foreground">
                        {seriesNeighborPosts.next.category === 'tweet'
                          ? (seriesNeighborPosts.next.body ?? '').slice(0, 80) +
                            ((seriesNeighborPosts.next.body ?? '').length > 80 ? '…' : '')
                          : stripSeriesPrefixFromTitle(
                              seriesNeighborPosts.next.title,
                              seriesNeighborPosts.next.series,
                            )}
                      </span>
                      {seriesNeighborPosts.next.excerpt && (
                        <p className="mt-1 text-sm text-muted-foreground dark:text-foreground/80">
                          {stripLinksFromExcerpt(seriesNeighborPosts.next.excerpt)}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                        {t.readMore} →
                      </span>
                    </AlertDescription>
                  </div>
                </Alert>
              </Link>
            )}
            {seriesNeighborPosts.prev && (
              <Link
                to={localizePath(`/posts/${seriesNeighborPosts.prev.slug}`, locale)}
                className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
              >
                <Alert className="flex flex-col md:flex-row items-stretch gap-4 cursor-pointer h-full">
                  {(seriesNeighborPosts.prev.heroImage ||
                    seriesNeighborPosts.prev.ogImage ||
                    seriesNeighborPosts.prev.tweetMetadata?.images?.[0]) && (
                    <div className="order-1 md:order-2 shrink-0 w-full aspect-[4/2.5] md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={getPostImageSrc(
                          seriesNeighborPosts.prev.heroImageSquare ??
                            seriesNeighborPosts.prev.heroImage ??
                            seriesNeighborPosts.prev.ogImage ??
                            seriesNeighborPosts.prev.tweetMetadata?.images?.[0] ??
                            '',
                        )}
                        alt={
                          stripSeriesPrefixFromTitle(
                            seriesNeighborPosts.prev.title || '',
                            seriesNeighborPosts.prev.series,
                          ) || ''
                        }
                        className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                        style={{ objectPosition: 'center center' }}
                      />
                    </div>
                  )}
                  <div className="order-2 md:order-1 min-w-0 flex-1 flex flex-col gap-1">
                    <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground dark:text-foreground/80">
                      {t.previousPost}
                    </AlertTitle>
                    <AlertDescription className="py-px">
                      <span className="font-medium text-foreground">
                        {seriesNeighborPosts.prev.category === 'tweet'
                          ? (seriesNeighborPosts.prev.body ?? '').slice(0, 80) +
                            ((seriesNeighborPosts.prev.body ?? '').length > 80 ? '…' : '')
                          : stripSeriesPrefixFromTitle(
                              seriesNeighborPosts.prev.title,
                              seriesNeighborPosts.prev.series,
                            )}
                      </span>
                      {seriesNeighborPosts.prev.excerpt && (
                        <p className="mt-1 text-sm text-muted-foreground dark:text-foreground/80">
                          {stripLinksFromExcerpt(seriesNeighborPosts.prev.excerpt)}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                        {t.readMore} →
                      </span>
                    </AlertDescription>
                  </div>
                </Alert>
              </Link>
            )}
          </nav>
        ) : (
        !isHome && !isExcludedFromListing(post) && (prevPost || nextPost || (!nextPost && prevPost2)) && (
          <nav
            className="mt-8 flex flex-col gap-4"
            aria-label={t.previousAndNextPosts}
          >
            {nextPost && (
              <Link
                to={localizePath(`/posts/${nextPost.slug}`, locale)}
                className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
              >
                <Alert className="flex flex-col md:flex-row items-stretch gap-4 cursor-pointer h-full">
                  {(nextPost.heroImage || nextPost.ogImage || nextPost.tweetMetadata?.images?.[0]) && (
                    <div className="order-1 md:order-2 shrink-0 w-full aspect-[4/2.5] md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={getPostImageSrc(nextPost.heroImageSquare ?? nextPost.heroImage ?? nextPost.ogImage ?? nextPost.tweetMetadata?.images?.[0] ?? '')}
                        alt={stripSeriesPrefixFromTitle(nextPost.title || '', nextPost.series) || ''}
                        className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                        style={{ objectPosition: 'center center' }}
                      />
                    </div>
                  )}
                  <div className="order-2 md:order-1 min-w-0 flex-1 flex flex-col gap-1">
                    <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground dark:text-foreground/80">
                      {t.nextPost}
                    </AlertTitle>
                    <AlertDescription className="py-px">
                      <span className="font-medium text-foreground">
                        {nextPost.category === 'tweet'
                          ? (nextPost.body ?? '').slice(0, 80) + ((nextPost.body ?? '').length > 80 ? '…' : '')
                          : stripSeriesPrefixFromTitle(nextPost.title, nextPost.series)}
                      </span>
                      {nextPost.excerpt && (
                        <p className="mt-1 text-sm text-muted-foreground dark:text-foreground/80">
                          {stripLinksFromExcerpt(nextPost.excerpt)}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                        {t.readMore} →
                      </span>
                    </AlertDescription>
                  </div>
                </Alert>
              </Link>
            )}
            {prevPost && (
              <Link
                to={localizePath(`/posts/${prevPost.slug}`, locale)}
                className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
              >
                <Alert className="flex flex-col md:flex-row items-stretch gap-4 cursor-pointer h-full">
                  {(prevPost.heroImage || prevPost.ogImage || prevPost.tweetMetadata?.images?.[0]) && (
                    <div className="order-1 md:order-2 shrink-0 w-full aspect-[4/2.5] md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={getPostImageSrc(prevPost.heroImageSquare ?? prevPost.heroImage ?? prevPost.ogImage ?? prevPost.tweetMetadata?.images?.[0] ?? '')}
                        alt={stripSeriesPrefixFromTitle(prevPost.title || '', prevPost.series) || ''}
                        className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                        style={{ objectPosition: 'center center' }}
                      />
                    </div>
                  )}
                  <div className="order-2 md:order-1 min-w-0 flex-1 flex flex-col gap-1">
                    <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground dark:text-foreground/80">
                      {t.previousPost}
                    </AlertTitle>
                    <AlertDescription className="py-px">
                      <span className="font-medium text-foreground">
                        {prevPost.category === 'tweet'
                          ? (prevPost.body ?? '').slice(0, 80) + ((prevPost.body ?? '').length > 80 ? '…' : '')
                          : stripSeriesPrefixFromTitle(prevPost.title, prevPost.series)}
                      </span>
                      {prevPost.excerpt && (
                        <p className="mt-1 text-sm text-muted-foreground dark:text-foreground/80">
                          {stripLinksFromExcerpt(prevPost.excerpt)}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                        {t.readMore} →
                      </span>
                    </AlertDescription>
                  </div>
                </Alert>
              </Link>
            )}
            {!nextPost && prevPost2 && (
              <Link
                to={localizePath(`/posts/${prevPost2.slug}`, locale)}
                className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
              >
                <Alert className="flex flex-col md:flex-row items-stretch gap-4 cursor-pointer h-full">
                  {(prevPost2.heroImage || prevPost2.ogImage || prevPost2.tweetMetadata?.images?.[0]) && (
                    <div className="order-1 md:order-2 shrink-0 w-full aspect-[4/2.5] md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={getPostImageSrc(prevPost2.heroImageSquare ?? prevPost2.heroImage ?? prevPost2.ogImage ?? prevPost2.tweetMetadata?.images?.[0] ?? '')}
                        alt={stripSeriesPrefixFromTitle(prevPost2.title || '', prevPost2.series) || ''}
                        className="min-w-0 min-h-0 w-full h-full object-cover object-center"
                        style={{ objectPosition: 'center center' }}
                      />
                    </div>
                  )}
                  <div className="order-2 md:order-1 min-w-0 flex-1 flex flex-col gap-1">
                    <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground dark:text-foreground/80">
                      {t.previousPost}
                    </AlertTitle>
                    <AlertDescription className="py-px">
                      <span className="font-medium text-foreground">
                        {prevPost2.category === 'tweet'
                          ? (prevPost2.body ?? '').slice(0, 80) + ((prevPost2.body ?? '').length > 80 ? '…' : '')
                          : stripSeriesPrefixFromTitle(prevPost2.title, prevPost2.series)}
                      </span>
                      {prevPost2.excerpt && (
                        <p className="mt-1 text-sm text-muted-foreground dark:text-foreground/80">
                          {stripLinksFromExcerpt(prevPost2.excerpt)}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                        {t.readMore} →
                      </span>
                    </AlertDescription>
                  </div>
                </Alert>
              </Link>
            )}
          </nav>
        )
        )}
      </div>
    </div>
    </>
  )
}
