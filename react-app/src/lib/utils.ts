import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolve post image src: use URL as-is if absolute, else prepend /images/posts/ */
export function getPostImageSrc(pathOrUrl: string): string {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  return `/images/posts/${pathOrUrl}`
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
  // Replace markdown links [text](url) with just the link text
  result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  // Remove bare URLs (http, https, www.)
  result = result.replace(/https?:\/\/[^\s]+/g, '')
  result = result.replace(/www\.[^\s]+/g, '')
  // Clean up multiple spaces and trim
  return result.replace(/\s+/g, ' ').trim()
}
