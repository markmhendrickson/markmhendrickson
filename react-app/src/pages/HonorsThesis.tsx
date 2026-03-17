import React, { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileDown, ChevronLeft, ChevronRight, List } from 'lucide-react'
import honorsThesisPageData from '@/data/pages/honors-thesis.json'
import thesisBody from '@/content/honors-thesis-body.md?raw'
import { useLocale } from '@/i18n/LocaleContext'
import { supportedLocales } from '@/i18n/config'
import { localizePath } from '@/i18n/routing'

const SITE_BASE = 'https://markmhendrickson.com'
const DEFAULT_OG_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

/** PDF served from public/documents/ */
const PDF_PATH = '/documents/honors-thesis-nietzsche-morality.pdf'

const LINK_CLASS =
  'text-foreground underline underline-offset-2 decoration-muted-foreground hover:decoration-foreground'

interface TocItem {
  label: string
  page: string
  slug: string
}

interface HonorsThesisCopy {
  title: string
  subtitle: string
  pageDesc: string
  institution: string
  department: string
  year: string
  author: string
  downloadLabel: string
  tocHeading: string
  backToContents: string
  prevChapter: string
  nextChapter: string
  toc: TocItem[]
}

const copy = (honorsThesisPageData as { copy: Record<string, HonorsThesisCopy> }).copy

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
  return md
    .split('\n')
    .map((line) => {
      if (!line.startsWith('### ')) return line
      const text = line.slice(4).trim()
      return isValidSubheading(text) ? line : text
    })
    .join('\n')
}

/** Convert extracted numeric markers to markdown footnote refs and append definitions. */
function normalizeFootnotes(md: string): string {
  const defsByRef = new Map<string, string>()
  let out = md
    // Typical inline marker in extracted text: "... become an 1 international ..."
    // We only convert when nearby text looks like citation content (to avoid page-number false positives).
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
    // Repair broken URL pattern produced by PDF extraction: "/1 entries/foo" -> "/entries/foo"
    .replace(/\/\d+\s+entries\//g, '/entries/')
    // Repair publisher fragments: "Company, 2 Inc." -> "Company, Inc."
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
    // Mid-block citation: "Sentence. (EH, 326) Next sentence" → blockquote first part, keep rest
    const midMatch = trimmed.match(MID_CITATION)
    if (midMatch) {
      const [, quote, citation, rest] = midMatch
      const quoted = `> ${quote} ${citation}`
      blocks.push(quoted, rest)
      continue
    }
    // Whole block ends with citation → wrap entire block as blockquote
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
  return normalizeFootnotes(formatThesisQuotes(normalizeSubheadings(md)))
}

/** Split full thesis markdown by ## headings; return array of { slug, label, content } in TOC order. */
function parseChapters(body: string, toc: TocItem[]): Array<{ slug: string; label: string; content: string }> {
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

export default function HonorsThesis() {
  const { locale } = useLocale()
  const { chapterSlug } = useParams<{ chapterSlug?: string }>()
  const navigate = useNavigate()
  const text = copy[locale] ?? copy.en

  const chapters = useMemo(
    () => parseChapters(thesisBody, text.toc),
    [text.toc]
  )

  const chapterIndex = chapterSlug != null ? chapters.findIndex((c) => c.slug === chapterSlug) : -1
  const currentChapter = chapterIndex >= 0 ? chapters[chapterIndex]! : null
  const isChapterPage = currentChapter != null

  const basePath = localizePath('/honors-thesis', locale)
  const canonicalUrl = isChapterPage
    ? `${SITE_BASE}${basePath}/chapter/${currentChapter.slug}`
    : `${SITE_BASE}${basePath}`
  const pageTitle = isChapterPage
    ? `${currentChapter.label} — ${text.title} — Mark Hendrickson`
    : `${text.title} — Mark Hendrickson`
  const markdownFootnoteOptions = {
    footnoteLabel: 'Footnotes',
    footnoteBackLabel: 'Back to reference',
  }

  // Invalid chapter slug: redirect to contents
  if (chapterSlug != null && currentChapter == null) {
    navigate(basePath, { replace: true })
    return null
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={text.pageDesc} />
        <meta name="author" content={text.author} />
        <link rel="canonical" href={canonicalUrl} />
        {supportedLocales.map((altLocale) => (
          <link
            key={altLocale}
            rel="alternate"
            hrefLang={altLocale}
            href={
              isChapterPage
                ? `${SITE_BASE}${localizePath('/honors-thesis', altLocale)}/chapter/${currentChapter!.slug}`
                : `${SITE_BASE}${localizePath('/honors-thesis', altLocale)}`
            }
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_BASE}/honors-thesis${isChapterPage ? `/chapter/${currentChapter!.slug}` : ''}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={text.pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={text.pageDesc} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      </Helmet>
      <div className="flex justify-center items-start min-h-content pt-10 pb-20 px-5 md:py-28 md:px-8">
        <div className="max-w-[42rem] w-full">
          <header className={isChapterPage ? 'mb-10' : 'mb-16'}>
            <h1 className="text-[28px] font-medium mb-2 tracking-tight text-foreground">
              {text.title}
            </h1>
            {!isChapterPage && (
              <>
                <p className="text-[17px] text-muted-foreground dark:text-foreground/80 font-normal tracking-wide max-w-[32rem] mb-4">
                  {text.subtitle}
                </p>
                <p className="text-[15px] text-muted-foreground dark:text-foreground/70">
                  {text.department}, {text.institution}, {text.year}
                </p>
              </>
            )}
            {isChapterPage && (
              <p className="text-[17px] text-muted-foreground dark:text-foreground/80 font-medium">
                {currentChapter.label}
              </p>
            )}
          </header>

          <div className="space-y-12">
            {/* Download PDF: show on both contents and chapter pages */}
            <section>
              <a
                href={PDF_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS + ' inline-flex items-center gap-2 font-medium'}
              >
                <FileDown className="w-4 h-4 shrink-0" />
                <span>{text.downloadLabel}</span>
              </a>
            </section>

            {!isChapterPage ? (
              /* Contents page: TOC as links to chapter pages */
              <section className="space-y-5">
                <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                  {text.tocHeading}
                </h2>
                <ul className="list-none pl-0 space-y-2 text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed">
                  {text.toc.map((item, i) => (
                    <li key={i} className="flex justify-between gap-4 max-w-[65ch] items-center">
                      <Link
                        to={`${basePath}/chapter/${item.slug}`}
                        className={LINK_CLASS + ' font-medium text-foreground'}
                      >
                        {item.label}
                      </Link>
                      <span className="shrink-0 tabular-nums">{item.page}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              /* Chapter page: content + prev/next nav */
              <>
                <section className="mt-4">
                  <div className="post-prose prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} remarkRehypeOptions={markdownFootnoteOptions}>
                      {currentChapter.content}
                    </ReactMarkdown>
                  </div>
                </section>

                <nav
                  className="flex flex-wrap items-center justify-between gap-4 pt-12 mt-12 border-t border-border"
                  aria-label="Chapter navigation"
                >
                  <div className="flex items-center gap-2">
                    {chapterIndex > 0 ? (
                      <Link
                        to={`${basePath}/chapter/${chapters[chapterIndex - 1]!.slug}`}
                        className={LINK_CLASS + ' inline-flex items-center gap-1 font-medium'}
                      >
                        <ChevronLeft className="w-4 h-4 shrink-0" />
                        <span>{text.prevChapter}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground" />
                    )}
                  </div>
                  <Link
                    to={basePath}
                    className={LINK_CLASS + ' inline-flex items-center gap-1 font-medium'}
                  >
                    <List className="w-4 h-4 shrink-0" />
                    <span>{text.backToContents}</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    {chapterIndex < chapters.length - 1 ? (
                      <Link
                        to={`${basePath}/chapter/${chapters[chapterIndex + 1]!.slug}`}
                        className={LINK_CLASS + ' inline-flex items-center gap-1 font-medium'}
                      >
                        <span>{text.nextChapter}</span>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground" />
                    )}
                  </div>
                </nav>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
