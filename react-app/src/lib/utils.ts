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

/**
 * Relative path segment after `/images/` for absolute og:image URLs.
 * Matches {@link getPostImageSrc}: `og/*` stays under `/images/og/`; bare filenames live under `/images/posts/`.
 */
export function normalizeOgImageRelativePath(ogImage: string): string {
  const t = (ogImage ?? '').trim()
  if (!t) return t
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  if (t.startsWith('og/') || t.startsWith('posts/')) return t
  return `posts/${t}`
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

/**
 * Remove `**bold**` and `__bold__` pairs from markdown (non-greedy, repeated until stable).
 * Used for key takeaways so list items stay plain while links/italics can remain.
 */
export function stripMarkdownBold(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown
  let s = markdown
  let prev = ''
  let guard = 0
  while (s !== prev && guard++ < 64) {
    prev = s
    s = s.replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    s = s.replace(/__([\s\S]*?)__/g, '$1')
  }
  return s
}

/**
 * When `title` begins with `{series}: ` (exact series label from metadata), return the rest.
 * Avoids repeating the series name in part titles (e.g. "The Inversion" instead of "The Human Inversion: The Inversion").
 */
function capitalizeStandaloneTitle(title: string): string {
  return title.replace(
    /^(\s*["'“‘(\[]?)(\p{Ll})/u,
    (_, prefix: string, firstLetter: string) => `${prefix}${firstLetter.toLocaleUpperCase()}`,
  )
}

export function stripSeriesPrefixFromTitle(
  title: string,
  series: string | undefined | null,
): string {
  if (!title || typeof title !== 'string') return title
  if (series == null || typeof series !== 'string') return title
  const s = series.trim()
  if (!s) return title
  const prefix = `${s}: `
  if (!title.startsWith(prefix)) return title
  const rest = title.slice(prefix.length).trim()
  return rest ? capitalizeStandaloneTitle(rest) : title
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

/** Remove markdown links and bare URLs from text (e.g. post excerpts). Normalizes typographic dashes for plain excerpt display. */
export function stripLinksFromExcerpt(text: string): string {
  if (!text || typeof text !== 'string') return text
  let result = text
  // Em dash (—) and en dash (–): excerpts are plain text; avoid literal U+2014 in UI (see content_style).
  result = result.replace(/\u2014/g, ': ').replace(/\u2013/g, '-')
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

/**
 * Remove HTML comments `<!-- ... -->` (including multiline).
 * ReactMarkdown does not treat them as invisible; stripping avoids author notes leaking into the UI.
 */
export function stripHtmlComments(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown
  return markdown.replace(/<!--[\s\S]*?-->/g, '')
}

/** Normalize common translation markdown artifacts so links render correctly. */
export function normalizeMarkdownFormatting(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown
  let s = stripHtmlComments(markdown)
  // Fix malformed markdown links like: [text] (url) -> [text](url)
  return s.replace(/\]\s+\(/g, '](')
}

const KEY_TAKEAWAYS_HEADING_LINE_RE =
  /^##\s+(?:Key\s+takeaways|Conclusiones\s+clave|Mencions\s+clau\s+per\s+emportar|要点|मुख्य\s+बातें|الوجبات\s+الرئيسية|Points\s+clés\s+à\s+retenir|Principais\s+conclusões|Ключевые\s+выводы|মূল\s+উপায়|اہم\s+نکات|Poin-poin\s+penting|Wichtige\s+Erkenntnisse)\s*$/i
const MARKDOWN_LIST_ITEM_RE = /^[\t ]*([-*+]|\d+\.)\s/

/**
 * Remove embedded `## Key takeaways` (and optional `---` rule above it) from the post body.
 * Bullet lines are returned for the Key takeaways Alert; the heading is omitted (UI supplies the title).
 */
export function splitEmbeddedKeyTakeawaysFromBody(markdown: string): {
  body: string
  /** Bullet markdown only (lines starting with `- ` / `* ` / `+ ` / ordered). */
  takeawaysBullets?: string
} {
  if (!markdown || typeof markdown !== 'string') return { body: markdown }

  const lines = markdown.split(/\r?\n/)
  let headingLineIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (KEY_TAKEAWAYS_HEADING_LINE_RE.test(lines[i].trim())) {
      headingLineIndex = i
      break
    }
  }
  if (headingLineIndex === -1) return { body: markdown }

  let removeStart = headingLineIndex
  if (removeStart > 0) {
    let j = removeStart - 1
    while (j >= 0 && lines[j].trim() === '') j--
    if (j >= 0 && /^---\s*$/.test(lines[j].trim())) {
      removeStart = j
    }
  }

  const bulletLines: string[] = []
  let i = headingLineIndex + 1
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === '') {
      if (bulletLines.length > 0) break
      i++
      continue
    }
    if (MARKDOWN_LIST_ITEM_RE.test(line)) {
      bulletLines.push(line)
      i++
      continue
    }
    break
  }
  if (bulletLines.length === 0) return { body: markdown }

  const removeEnd = i
  const newLines = [...lines.slice(0, removeStart), ...lines.slice(removeEnd)]
  let body = newLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  return { body, takeawaysBullets: bulletLines.join('\n').trim() }
}

/**
 * Drop redundant `---` rules: doubles, and a trailing rule before italic series footers.
 */
export function stripRedundantThematicBreaks(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown
  let s = markdown
  s = s.replace(/\n---\s*\n+---\s*\n+/g, '\n\n')
  s = s.replace(/\n---\s*\n+(\*(?:Continue reading|Read the full series)[\s\S]*)$/i, '\n\n$1')
  return s.replace(/\n{3,}/g, '\n\n').trimEnd()
}

/**
 * Remove series chrome duplicated by `SeriesNav`: leading *Part N of M in [Series](/posts/series/...)*
 * and trailing *Continue reading:* / *Read the full series:* italic lines (optional `---` before them).
 * Call only for posts with `seriesSlug` + `seriesPart` in metadata.
 */
export function stripSeriesMarkdownBookends(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown
  let s = markdown
  // Localized bodies translate the surrounding text but keep the canonical series URL.
  // Drop the whole italic prelude rather than trying to enumerate every language.
  s = s.replace(/^\*[^*\n]*\]\(\/posts\/series\/[^)]+\)[^*\n]*\*\s*\n+/im, '')
  s = s.replace(
    /^\*Part\s+\d+\s+of\s+\d+\s+in\s+\[[^\]]+\]\(\/posts\/series\/[^)]+\)\s+series\.[^\n]*\*\s*\n+/im,
    '',
  )
  s = s.replace(/^\s*---\s*\n+/, '')
  s = s.replace(/\n+\*(?:Continue reading|Read the full series):[^\n]*\*\s*$/i, '')
  s = s.replace(/\n---\s*\n+\*(?:Continue reading|Read the full series):[^\n]*\*\s*$/i, '')
  s = s.replace(/\n---\s*\n+\*[^*\n]*\]\(\/posts\/[^)]+\)[^*\n]*\*\s*$/i, '')
  s = s.replace(/\n+\*[^*\n]*\]\(\/posts\/[^)]+\)[^*\n]*\*\s*$/i, '')
  return s.replace(/\n{3,}/g, '\n\n').trim()
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

/** True when `value` is a non-empty string that parses to a real instant (excludes literal `"null"` from bad exports). */
export function isParsablePublishedDate(value: string | undefined | null): boolean {
  if (value == null || typeof value !== 'string') return false
  const t = value.trim()
  if (!t || /^null$/i.test(t)) return false
  const d = parseCalendarOrIsoDateString(t)
  return !Number.isNaN(d.getTime())
}

export function formatPostPublishedDate(dateString: string | undefined, languageTag: string): string {
  if (!isParsablePublishedDate(dateString)) return ''
  const d = parseCalendarOrIsoDateString(dateString!)
  return d.toLocaleDateString(languageTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
