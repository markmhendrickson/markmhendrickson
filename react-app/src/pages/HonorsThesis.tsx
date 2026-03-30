import React, { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileDown } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import honorsThesisPageData from '@/data/pages/honors-thesis.json'
import thesisBody from '@/content/honors-thesis-body.md?raw'
import { useLocale } from '@/i18n/LocaleContext'
import { supportedLocales } from '@/i18n/config'
import { localizePath } from '@/i18n/routing'
import {
  parseChapters,
  parseChapterSubsections,
  type Subsection,
  type TocItem,
} from '@/lib/honorsThesisStructure'

const SITE_BASE = 'https://markmhendrickson.com'
const DEFAULT_OG_IMAGE = `${SITE_BASE}/images/og-default-1200x630.jpg`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

/** PDF served from public/documents/ */
const PDF_PATH = '/documents/honors-thesis-nietzsche-morality.pdf'

const LINK_CLASS =
  'text-foreground underline underline-offset-2 decoration-muted-foreground hover:decoration-foreground'

interface HonorsThesisCopy {
  title: string
  /** Link text to contents index from chapter/section pages (defaults to title if omitted). */
  indexLinkLabel?: string
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

interface TocItemWithSubsections extends TocItem {
  subsections: Array<{ title: string; slug: string }>
}

interface SequencedSubsection extends Subsection {
  chapterSlug: string
}

const copy = (honorsThesisPageData as { copy: Record<string, HonorsThesisCopy> }).copy

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripLeadingSubsectionHeading(markdown: string, title: string): string {
  const trimmed = markdown.trimStart()
  const heading = new RegExp(`^###\\s+${escapeRegExp(title)}\\s*\\n+`, 'i')
  if (!heading.test(trimmed)) return markdown
  return trimmed.replace(heading, '')
}

const MAX_NAV_EXCERPT_CHARS = 240

/** Plain-text preview for nav cards from subsection markdown (after optional heading strip). */
function thesisMarkdownToPlainExcerpt(markdown: string, sectionTitle: string): string {
  let body = stripLeadingSubsectionHeading(markdown, sectionTitle).trim()
  const footIdx = body.search(/\n\[\^[^\]]+]:/m)
  if (footIdx >= 0) body = body.slice(0, footIdx)
  body = body
    .replace(/^#{1,6}\s+.*/gm, ' ')
    .replace(/^[\s>*-]*[-*]\s+/gm, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[\^\d+]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (body.length <= MAX_NAV_EXCERPT_CHARS) return body
  const cut = body.slice(0, MAX_NAV_EXCERPT_CHARS)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > 60 ? cut.slice(0, sp) : cut).trim()}…`
}

function excerptForChapterEntry(
  chapterSlug: string,
  chaptersWithSubsections: Array<{ slug: string; subsections: Subsection[] }>,
): string {
  const ch = chaptersWithSubsections.find((c) => c.slug === chapterSlug)
  const first = ch?.subsections[0]
  if (first == null) return ''
  return thesisMarkdownToPlainExcerpt(first.content, first.title)
}

function getChapterPath(basePath: string, chapterSlug: string): string {
  return `${basePath}/chapter/${chapterSlug}`
}

function getSubsectionPath(basePath: string, chapterSlug: string, sectionSlug: string): string {
  return `${basePath}/chapter/${chapterSlug}/section/${sectionSlug}`
}

export default function HonorsThesis() {
  const { locale } = useLocale()
  const { chapterSlug, sectionSlug } = useParams<{ chapterSlug?: string; sectionSlug?: string }>()
  const navigate = useNavigate()
  const text = copy[locale] ?? copy.en

  const chapters = useMemo(
    () => parseChapters(thesisBody, text.toc),
    [text.toc]
  )
  const chaptersWithSubsections = useMemo(
    () => chapters.map((chapter) => ({
      ...chapter,
      subsections: parseChapterSubsections(chapter.content, chapter.label),
    })),
    [chapters]
  )
  const tocWithSubsections = useMemo<TocItemWithSubsections[]>(
    () => text.toc.map((item) => {
      const chapter = chaptersWithSubsections.find((c) => c.slug === item.slug)
      return {
        ...item,
        subsections: chapter ? chapter.subsections.map((section) => ({ title: section.title, slug: section.slug })) : [],
      }
    }),
    [chaptersWithSubsections, text.toc]
  )
  const subsectionSequence = useMemo<SequencedSubsection[]>(
    () => chaptersWithSubsections.flatMap((chapter) =>
      chapter.subsections.map((subsection) => ({
        ...subsection,
        chapterSlug: chapter.slug,
      }))
    ),
    [chaptersWithSubsections]
  )

  const chapterIndex = chapterSlug != null ? chapters.findIndex((c) => c.slug === chapterSlug) : -1
  const currentChapter = chapterIndex >= 0 ? chapters[chapterIndex]! : null
  const isChapterPage = currentChapter != null
  const chapterSubsections = useMemo(
    () => chaptersWithSubsections.find((chapter) => chapter.slug === currentChapter?.slug)?.subsections ?? [],
    [chaptersWithSubsections, currentChapter?.slug]
  )
  const subsectionIndex = sectionSlug != null ? chapterSubsections.findIndex((s) => s.slug === sectionSlug) : -1
  const currentSubsection = subsectionIndex >= 0 ? chapterSubsections[subsectionIndex]! : null
  const sequenceIndex = currentSubsection != null
    ? subsectionSequence.findIndex((s) => s.chapterSlug === currentChapter?.slug && s.slug === currentSubsection.slug)
    : -1
  const previousSequence = sequenceIndex > 0 ? subsectionSequence[sequenceIndex - 1]! : null
  const nextSequence = sequenceIndex >= 0 && sequenceIndex < subsectionSequence.length - 1
    ? subsectionSequence[sequenceIndex + 1]!
    : null
  const previousIsSameChapter = previousSequence?.chapterSlug === currentChapter?.slug
  const nextIsSameChapter = nextSequence?.chapterSlug === currentChapter?.slug
  const prevSectionLabel = text.prevChapter.replace(/chapter/i, 'section')
  const nextSectionLabel = text.nextChapter.replace(/chapter/i, 'section')
  const isSubsectionPage = currentSubsection != null
  const subsectionMarkdown = useMemo(
    () => (
      isSubsectionPage && currentSubsection != null
        ? stripLeadingSubsectionHeading(currentSubsection.content, currentSubsection.title)
        : null
    ),
    [currentSubsection, isSubsectionPage]
  )

  const basePath = localizePath('/honors-thesis', locale)
  const previousNavTarget = useMemo(() => {
    if (isSubsectionPage && currentChapter != null && previousSequence != null) {
      return {
        to: getSubsectionPath(basePath, previousSequence.chapterSlug, previousSequence.slug),
        label: previousIsSameChapter ? prevSectionLabel : text.prevChapter,
        title: previousSequence.title,
        summary: thesisMarkdownToPlainExcerpt(previousSequence.content, previousSequence.title),
      }
    }

    if (!isSubsectionPage && chapterIndex > 0) {
      const previousChapter = chapters[chapterIndex - 1]!
      return {
        to: getChapterPath(basePath, previousChapter.slug),
        label: text.prevChapter,
        title: previousChapter.label,
        summary: excerptForChapterEntry(previousChapter.slug, chaptersWithSubsections),
      }
    }

    return null
  }, [
    basePath,
    chapterIndex,
    chapters,
    chaptersWithSubsections,
    currentChapter,
    isSubsectionPage,
    prevSectionLabel,
    previousIsSameChapter,
    previousSequence,
    text.prevChapter,
  ])
  const nextNavTarget = useMemo(() => {
    if (isSubsectionPage && currentChapter != null && nextSequence != null) {
      return {
        to: getSubsectionPath(basePath, nextSequence.chapterSlug, nextSequence.slug),
        label: nextIsSameChapter ? nextSectionLabel : text.nextChapter,
        title: nextSequence.title,
        summary: thesisMarkdownToPlainExcerpt(nextSequence.content, nextSequence.title),
      }
    }

    if (!isSubsectionPage && chapterIndex >= 0 && chapterIndex < chapters.length - 1) {
      const nextChapter = chapters[chapterIndex + 1]!
      return {
        to: getChapterPath(basePath, nextChapter.slug),
        label: text.nextChapter,
        title: nextChapter.label,
        summary: excerptForChapterEntry(nextChapter.slug, chaptersWithSubsections),
      }
    }

    return null
  }, [
    basePath,
    chapterIndex,
    chapters,
    chaptersWithSubsections,
    currentChapter,
    isSubsectionPage,
    nextIsSameChapter,
    nextSectionLabel,
    nextSequence,
    text.nextChapter,
  ])
  const chapterPath = currentChapter != null ? getChapterPath(basePath, currentChapter.slug) : null
  const subsectionPath = currentChapter != null && currentSubsection != null
    ? getSubsectionPath(basePath, currentChapter.slug, currentSubsection.slug)
    : null
  const canonicalUrl = isChapterPage
    ? `${SITE_BASE}${isSubsectionPage && subsectionPath != null ? subsectionPath : chapterPath ?? basePath}`
    : `${SITE_BASE}${basePath}`
  const pageTitle = isChapterPage
    ? `${isSubsectionPage && currentSubsection != null ? currentSubsection.title : currentChapter.label} — ${text.title} — Mark Hendrickson`
    : `${text.title} — Mark Hendrickson`
  const markdownFootnoteOptions = {
    footnoteLabel: 'Footnotes',
    footnoteBackLabel: 'Back to reference',
  }

  const redirectPath =
    chapterSlug != null && currentChapter == null
      ? basePath
      : sectionSlug == null && currentChapter != null && chapterSubsections.length > 0
        ? getSubsectionPath(basePath, currentChapter.slug, chapterSubsections[0]!.slug)
        : sectionSlug != null && currentChapter != null && currentSubsection == null
          ? (
            chapterSubsections.length > 0
              ? getSubsectionPath(basePath, currentChapter.slug, chapterSubsections[0]!.slug)
              : getChapterPath(basePath, currentChapter.slug)
          )
          : null

  useEffect(() => {
    if (redirectPath == null) return
    navigate(redirectPath, { replace: true })
  }, [navigate, redirectPath])

  if (redirectPath != null) {
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
                ? `${SITE_BASE}${isSubsectionPage && currentSubsection != null
                  ? getSubsectionPath(localizePath('/honors-thesis', altLocale), currentChapter!.slug, currentSubsection.slug)
                  : getChapterPath(localizePath('/honors-thesis', altLocale), currentChapter!.slug)}`
                : `${SITE_BASE}${localizePath('/honors-thesis', altLocale)}`
            }
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${SITE_BASE}${isChapterPage
            ? (isSubsectionPage && currentSubsection != null
              ? `/honors-thesis/chapter/${currentChapter!.slug}/section/${currentSubsection.slug}`
              : `/honors-thesis/chapter/${currentChapter!.slug}`)
            : '/honors-thesis'}`}
        />
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
              {isSubsectionPage && currentSubsection != null ? currentSubsection.title : text.title}
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
              <div className="space-y-1.5 mt-0.5">
                <p className="text-[15px]">
                  <Link to={basePath} className={LINK_CLASS + ' font-medium'}>
                    {text.indexLinkLabel ?? text.title}
                  </Link>
                  <span className="text-muted-foreground/60 dark:text-foreground/50 mx-1.5" aria-hidden>
                    ·
                  </span>
                  <span className="text-muted-foreground dark:text-foreground/80 font-medium">
                    {currentChapter.label}
                  </span>
                </p>
              </div>
            )}
          </header>

          <div className="space-y-12">
            {!isChapterPage ? (
              <>
                {/* Contents page */}
                <section className="space-y-5">
                  <h2 className="text-[20px] font-medium text-foreground tracking-tight border-b border-border pb-2.5">
                    {text.tocHeading}
                  </h2>
                  <ul className="list-none pl-0 space-y-5 text-[15px] text-muted-foreground dark:text-foreground/80 leading-relaxed">
                    {tocWithSubsections.map((item) => (
                      <li key={item.slug} className="max-w-[65ch]">
                        <div className="flex justify-between gap-4 items-center font-medium text-foreground">
                          {item.subsections.length === 1 ? (
                            <Link
                              to={getSubsectionPath(basePath, item.slug, item.subsections[0]!.slug)}
                              className={LINK_CLASS}
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <span>{item.label}</span>
                          )}
                          <span className="shrink-0 tabular-nums">{item.page}</span>
                        </div>
                        {item.subsections.length > 1 && (
                          <ul className="list-none pl-4 mt-2 space-y-1.5 text-[14px] text-muted-foreground/90 dark:text-foreground/70">
                            {item.subsections.map((subsection) => (
                              <li key={`${item.slug}-${subsection.slug}`} className="flex items-baseline gap-2">
                                <span aria-hidden="true" className="text-muted-foreground/70">-</span>
                                <Link
                                  to={getSubsectionPath(basePath, item.slug, subsection.slug)}
                                  className={LINK_CLASS}
                                >
                                  {subsection.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
                {/* Download PDF: only on contents page, shown at bottom */}
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
              </>
            ) : (
              /* Chapter page: content + prev/next nav */
              <>
                <section className="mt-4">
                  <div className="post-prose prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} remarkRehypeOptions={markdownFootnoteOptions}>
                      {isSubsectionPage && subsectionMarkdown != null ? subsectionMarkdown : currentChapter.content}
                    </ReactMarkdown>
                  </div>
                </section>

                <nav className="pt-12 mt-12 border-t border-border space-y-4" aria-label={isSubsectionPage ? 'Section navigation' : 'Chapter navigation'}>
                  {nextNavTarget != null && (
                    <Link
                      to={nextNavTarget.to}
                      className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
                    >
                      <Alert className="cursor-pointer">
                        <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground dark:text-foreground/80">
                          {nextNavTarget.label}
                        </AlertTitle>
                        <AlertDescription className="py-px">
                          <span className="font-medium text-foreground">{nextNavTarget.title}</span>
                          {nextNavTarget.summary.length > 0 && (
                            <p className="mt-1 text-sm text-muted-foreground dark:text-foreground/80">
                              {nextNavTarget.summary}
                            </p>
                          )}
                          <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                            Continue reading →
                          </span>
                        </AlertDescription>
                      </Alert>
                    </Link>
                  )}
                  {previousNavTarget != null && (
                    <Link
                      to={previousNavTarget.to}
                      className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
                    >
                      <Alert className="cursor-pointer">
                        <AlertTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground dark:text-foreground/80">
                          {previousNavTarget.label}
                        </AlertTitle>
                        <AlertDescription className="py-px">
                          <span className="font-medium text-foreground">{previousNavTarget.title}</span>
                          {previousNavTarget.summary.length > 0 && (
                            <p className="mt-1 text-sm text-muted-foreground dark:text-foreground/80">
                              {previousNavTarget.summary}
                            </p>
                          )}
                          <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                            Continue reading →
                          </span>
                        </AlertDescription>
                      </Alert>
                    </Link>
                  )}
                </nav>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
