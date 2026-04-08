import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolve post image src: use URL as-is if absolute; og/ paths go under /images/; else prepend /images/posts/ */
export function getPostImageSrc(pathOrUrl: string): string {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  if (pathOrUrl.startsWith('og/')) {
    return `/images/${pathOrUrl}`
  }
  return `/images/posts/${pathOrUrl}`
}

/** Path to use for zoom/lightbox when an -original asset exists (e.g. .../name.png -> .../name-original.png). */
export function getZoomImageSrc(embedPath: string): string {
  if (!embedPath || typeof embedPath !== 'string') return embedPath
  return embedPath.replace(/(\.(png|jpg|jpeg|gif|webp))$/i, '-original$1')
}

/** Return markdown summary with at most the first N bullet points (key takeaways limit). Default 5; pass maxBullets to allow more for specific posts (e.g. 6 for six-agentic-trends-betting-on). */
export function limitSummaryToFiveBullets(summary: string, maxBullets: number = 5): string {
  if (!summary || typeof summary !== 'string') return summary
  const lines = summary.trim().split('\n')
  const result: string[] = []
  let count = 0
  for (const line of lines) {
    if (/^[-*]\s/.test(line.trim())) {
      if (count >= maxBullets) break
      count++
    }
    result.push(line)
  }
  return result.join('\n').trim()
}

/** Parse YAML frontmatter (---\n...\n---\n) from markdown; return { title?, excerpt? } for display overrides in dev. */
export function parseFrontmatter(markdown: string): { title?: string; excerpt?: string } {
  if (!markdown || typeof markdown !== 'string') return {}
  if (!markdown.startsWith('---\n')) return {}
  const end = markdown.indexOf('\n---\n', 4)
  if (end === -1) return {}
  const block = markdown.slice(4, end)
  const out: { title?: string; excerpt?: string } = {}
  for (const line of block.split('\n')) {
    if (line.includes(':')) {
      const k = line.split(':')[0].trim().toLowerCase()
      let v = line.split(':').slice(1).join(':').trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (k === 'title') out.title = v
      if (k === 'excerpt') out.excerpt = v
    }
  }
  return out
}

/** Strip YAML frontmatter (---\n...\n---\n) from markdown; return body only. */
export function stripFrontmatter(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown
  if (!markdown.startsWith('---\n')) return markdown
  const end = markdown.indexOf('\n---\n', 4)
  if (end === -1) return markdown
  return markdown.slice(end + 5).replace(/^\n+/, '')
}

/** Remove markdown links and bare URLs from text (e.g. post excerpts) */
export function stripLinksFromExcerpt(text: string): string {
  if (!text || typeof text !== 'string') return text
  let result = text
  // Replace markdown links [text](url) and [text] (url) with just the link text.
  result = result.replace(/\[([^\]]*)\]\s*\([^)]*\)/g, '$1')
  // Remove bare URLs (http, https, www.)
  result = result.replace(/https?:\/\/[^\s]+/g, '')
  result = result.replace(/www\.[^\s]+/g, '')
  // Clean up multiple spaces and trim
  return result.replace(/\s+/g, ' ').trim()
}

/**
 * When excerpt is only markdown bullet lines (e.g. summary pasted into excerpt),
 * return cleaned line items for list rendering; otherwise null so callers show a single paragraph.
 */
export function parseExcerptAsBulletLines(excerpt: string): string[] | null {
  if (!excerpt || typeof excerpt !== 'string') return null
  const lines = excerpt
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return null
  const bulletRe = /^[-*]\s+/
  if (!lines.every((l) => bulletRe.test(l))) return null
  return lines.map((l) => stripLinksFromExcerpt(l.replace(bulletRe, '')))
}

/** Normalize common translation markdown artifacts so links render correctly. */
export function normalizeMarkdownFormatting(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown
  // Fix malformed markdown links like: [text] (url) -> [text](url)
  return markdown.replace(/\]\s+\(/g, '](')
}

/** Normalize potentially string/number boolean flags from cache or MCP exports. */
export function isTruthyFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1'
  }
  return false
}

export function isPublishedPost(post: { published?: unknown }): boolean {
  return isTruthyFlag(post.published)
}

export function isExcludedFromListing(post: { excludeFromListing?: unknown }): boolean {
  return isTruthyFlag(post.excludeFromListing)
}

/** Strict YYYY-MM-DD (cache / Neotoma publish dates). Does not match datetimes. */
const CALENDAR_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Parse publish/list dates: plain YYYY-MM-DD uses local calendar day so the UI matches stored frontmatter.
 * (`new Date("YYYY-MM-DD")` is UTC midnight and shifts the displayed day in Americas timezones.)
 */
export function parseCalendarOrIsoDateString(value: string): Date {
  const trimmed = value.trim()
  const m = CALENDAR_DATE_ONLY.exec(trimmed)
  if (m) {
    const y = parseInt(m[1], 10)
    const month = parseInt(m[2], 10) - 1
    const day = parseInt(m[3], 10)
    return new Date(y, month, day)
  }
  return new Date(trimmed)
}

export function formatPostPublishedDate(dateString: string | undefined, languageTag: string): string {
  if (!dateString) return ''
  const d = parseCalendarOrIsoDateString(dateString)
  if (Number.isNaN(d.getTime())) return dateString
  return d.toLocaleDateString(languageTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
