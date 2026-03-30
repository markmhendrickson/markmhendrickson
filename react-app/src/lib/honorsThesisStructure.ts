/** Shared thesis markdown parsing (used by HonorsThesis page and prerender path generator). */

export interface TocItem {
  label: string
  page: string
  slug: string
}

export interface Subsection {
  title: string
  slug: string
  content: string
}

/** Citation pattern at end of a paragraph: (EH, 326), (BM, ix), (D, 12), etc. */
const BLOCKQUOTE_CITATION = / \((?:EH|BM|D|GM|Kant|[A-Z]{2,4}),[^)]*\)\.?\s*$/
/** Mid-paragraph citation: "…quote. (EH, 326) Following text" → split so quote is blockquoted */
const MID_CITATION = /^(.+\.)\s+(\((?:EH|BM|D|GM|Kant|[A-Z]{2,4}),[^)]*\)\.?)\s+(\S.+)$/s
const FOOTNOTE_MARKER = /([A-Za-z,;:])\s(\d{1,2})\s(?=[a-z(“"'])/g
const FOOTNOTE_CITATION_HINTS = [
  'stanford encyclopedia',
  'translated by',
  'available from',
  'internet; accessed',
  'university press',
  'hackett publishing',
  'cambridge',
  'random house',
]

const SUBHEADING_STOPWORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with', 'without',
])

function isValidSubheading(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (/[.?!]/.test(trimmed)) return false
  if (trimmed.length > 110) return false
  if (/^chapter\s+\d+/i.test(trimmed)) return true

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 14) return false

  for (const raw of words) {
    const token = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')
    if (!token) continue
    if (/^\d+$/.test(token)) continue
    if (token.toUpperCase() === token && token.length <= 5) continue

    const first = token.charAt(0)
    const lower = token.toLowerCase()
    if (SUBHEADING_STOPWORDS.has(lower)) continue
    if (first !== first.toUpperCase()) return false
  }
  return true
}

/** Demote OCR-induced false subheadings (`### ...`) back to normal paragraph lines. */
function normalizeSubheadings(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (!line.startsWith('### ')) {
      out.push(line)
      continue
    }

    const text = line.slice(4).trim()
    if (isValidSubheading(text)) {
      out.push(line)
      continue
    }

    let nextIndex = i + 1
    while (nextIndex < lines.length && lines[nextIndex]!.trim() === '') {
      nextIndex += 1
    }

    if (nextIndex < lines.length && lines[nextIndex]!.trim().startsWith('>')) {
      out.push(line)
      continue
    }

    let merged = text
    if (nextIndex < lines.length) {
      const nextLine = lines[nextIndex]!.trim()
      const shouldJoinNext =
        nextLine.length > 0 &&
        !nextLine.startsWith('### ') &&
        (!/[.!?:]$/.test(text) || /^[a-z0-9('"“]/.test(nextLine))
      if (shouldJoinNext) {
        merged = `${text} ${nextLine}`.replace(/\s+/g, ' ').trim()
        i = nextIndex
      }
    }

    out.push(merged)
  }

  return out.join('\n')
}

/** Remove common OCR/PDF extraction page-number debris from paragraph ends. */
function stripOcrPageNumbers(md: string): string {
  return md
    .replace(/([.!?])\s+\d{1,3}(?=\s*$)/gm, '$1')
    .replace(/^\s*\d{1,3}\s*$/gm, '')
    .replace(/,\s+\d{1,3}\s+(?=[a-z])/g, ', ')
    .replace(/\s+\d{1,3}\s+(?=[“"][a-z])/g, ' ')
}

function splitFlattenedParagraphs(md: string): string {
  const starters = [
    'In several places',
    'I will',
    'My overview',
    'However,',
    'Therefore,',
    'Thus,',
    'Accordingly,',
    'Consequently,',
    'First,',
    'Secondly,',
    'Finally,',
    'On the other hand,',
    'With regard to',
    'Before',
    'After',
    'Meanwhile,',
    'Out of',
    'For these reasons,',
  ]
  const starterPattern = starters
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const starterRegex = new RegExp(`([.!?])\\s+(${starterPattern})\\b`, 'g')

  return md
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>')) return block
      if (trimmed.length < 1200) return block
      return trimmed.replace(starterRegex, '$1\n\n$2')
    })
    .join('\n\n')
}

/** Convert extracted numeric markers to markdown footnote refs and append definitions. */
function normalizeFootnotes(md: string): string {
  const defsByRef = new Map<string, string>()
  let out = md
    .replace(FOOTNOTE_MARKER, (m: string, left: string, n: string, offset: number, source: string) => {
      const contextWindow = source.slice(Math.max(0, offset - 500), Math.min(source.length, offset + 900)).toLowerCase()
      const looksLikeCitation = FOOTNOTE_CITATION_HINTS.some((hint) => contextWindow.includes(hint))
      if (!looksLikeCitation) return m

      if (!defsByRef.has(n)) {
        const localWindow = source.slice(Math.max(0, offset - 500), Math.min(source.length, offset + 1100))
        const citationMatch = localWindow.match(
          /([A-Z][^.!?]{0,220}(?:Stanford Encyclopedia|Translated by|available from|Internet; accessed|University Press|Hackett Publishing)[^.!?]{0,240}[.!?])/i
        )
        if (citationMatch?.[1]) {
          const cleaned = citationMatch[1]
            .replace(/\s+/g, ' ')
            .replace(/\/\d+\s+entries\//g, '/entries/')
            .replace(/,\s*\d+\s+Inc\./g, ', Inc.')
            .trim()
          defsByRef.set(n, cleaned)
        }
      }
      return `${left} [^${n}] `
    })
    .replace(/\/\d+\s+entries\//g, '/entries/')
    .replace(/,\s*\d+\s+Inc\./g, ', Inc.')

  const defs = [...defsByRef.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .filter(([n]) => !new RegExp(`\\[\\^${n}\\]:`).test(out))
    .map(([n, txt]) => `[^${n}]: ${txt}`)
  if (defs.length) {
    out = `${out}\n\n## Footnotes\n\n${defs.join('\n')}\n`
  }
  return out
}

/** Wrap paragraphs that end with a source citation (or contain one mid-block) in blockquote syntax. */
function formatThesisQuotes(md: string): string {
  const blocks: string[] = []
  const rawBlocks = md.split(/\n\n+/)
  for (const block of rawBlocks) {
    let trimmed = block.trim()
    if (!trimmed) {
      blocks.push(block)
      continue
    }
    if (trimmed.startsWith('#') || trimmed.startsWith('>')) {
      blocks.push(block)
      continue
    }
    const midMatch = trimmed.match(MID_CITATION)
    if (midMatch) {
      const [, quote, citation, rest] = midMatch
      const quoted = `> ${quote} ${citation}`
      blocks.push(quoted, rest)
      continue
    }
    if (BLOCKQUOTE_CITATION.test(trimmed)) {
      const quoted = trimmed
        .split('\n')
        .map((line) => (line.startsWith('>') ? line : `> ${line}`))
        .join('\n')
      blocks.push(quoted)
    } else {
      blocks.push(block)
    }
  }
  return blocks.join('\n\n')
}

function normalizeChapterMarkdown(md: string): string {
  return normalizeFootnotes(
    formatThesisQuotes(
      splitFlattenedParagraphs(
        normalizeSubheadings(stripOcrPageNumbers(md))
      )
    )
  )
}

/** Split full thesis markdown by ## headings; return array of { slug, label, content } in TOC order. */
export function parseChapters(body: string, toc: TocItem[]): Array<{ slug: string; label: string; content: string }> {
  const parts = body.trim().split(/\n(?=## )/m)
  const sectionParts = parts.filter((p) => p.trim().length > 0)
  const chapters: Array<{ slug: string; label: string; content: string }> = []
  for (let i = 0; i < toc.length && i < sectionParts.length; i++) {
    const raw = sectionParts[i].trim()
    const content = raw.startsWith('## ') ? raw : `## ${raw}`
    chapters.push({
      slug: toc[i].slug,
      label: toc[i].label,
      content: normalizeChapterMarkdown(content),
    })
  }
  return chapters
}

function slugifySectionTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function parseChapterSubsections(chapterMarkdown: string, fallbackTitle?: string): Subsection[] {
  const matches = [...chapterMarkdown.matchAll(/^###\s+(.+)$/gm)]
  if (matches.length === 0) {
    if (fallbackTitle && fallbackTitle.trim().length > 0) {
      return [{
        title: fallbackTitle,
        slug: slugifySectionTitle(fallbackTitle) || 'section',
        content: chapterMarkdown.trim(),
      }]
    }
    return []
  }

  const baseSections: Array<{ title: string; content: string }> = []
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]!
    const start = match.index ?? 0
    const end = i + 1 < matches.length ? (matches[i + 1]!.index ?? chapterMarkdown.length) : chapterMarkdown.length
    const title = (match[1] ?? '').trim()
    const content = chapterMarkdown.slice(start, end).trim()
    if (!title || !content) continue
    if (/^chapter\s+\d+\s*[–-]/i.test(title)) continue
    baseSections.push({ title, content })
  }

  const slugCounts = new Map<string, number>()
  const parsedSections = baseSections.map((section) => {
    const base = slugifySectionTitle(section.title) || 'section'
    const count = (slugCounts.get(base) ?? 0) + 1
    slugCounts.set(base, count)
    return {
      title: section.title,
      slug: count === 1 ? base : `${base}-${count}`,
      content: section.content,
    }
  })

  if (parsedSections.length === 0 && fallbackTitle && fallbackTitle.trim().length > 0) {
    return [{
      title: fallbackTitle,
      slug: slugifySectionTitle(fallbackTitle) || 'section',
      content: chapterMarkdown.trim(),
    }]
  }

  return parsedSections
}
