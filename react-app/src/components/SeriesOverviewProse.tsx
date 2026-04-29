import { stripLinksFromExcerpt } from '@/lib/utils'

/** Split repo / post `seriesDescription` on blank lines; trim each block (single newlines → space). */
export function seriesOverviewParagraphs(raw: string): string[] {
  return raw
    .split(/\n\s*\n+/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
        .trim(),
    )
    .filter((p) => p.length > 0)
}

/**
 * `stripLinksFromExcerpt` collapses all whitespace to spaces, which destroys `\n\n` paragraph breaks.
 * Strip links per paragraph so overview prose can render as multiple `<p>` nodes.
 */
export function seriesOverviewTextForProse(raw: string): string {
  return seriesOverviewParagraphs(raw)
    .map((p) => stripLinksFromExcerpt(p))
    .join('\n\n')
}

export function SeriesOverviewProse({
  text,
  /** Paragraph classes for `card` variant (listings). Ignored when `variant` is `postBody`. */
  paragraphClassName = 'text-[15px] text-muted-foreground leading-relaxed',
  /** When set (e.g. `1`), only the first paragraph is shown (posts index series cards). */
  maxParagraphs,
  /**
   * `postBody`: same `.post-prose` wrapper as article body (`index.css` paragraph rules).
   * `card`: compact muted paragraphs for index cards.
   */
  variant = 'card',
}: {
  text: string
  paragraphClassName?: string
  maxParagraphs?: number
  variant?: 'card' | 'postBody'
}) {
  let paras = seriesOverviewParagraphs(text)
  if (paras.length === 0) return null
  if (typeof maxParagraphs === 'number' && maxParagraphs > 0) {
    paras = paras.slice(0, maxParagraphs)
  }

  if (variant === 'postBody') {
    return (
      <div className="post-prose prose prose-sm max-w-none text-pretty mb-8">
        {paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    )
  }

  const single = paras.length === 1
  return (
    <div className={single ? 'mb-3' : 'space-y-3 mb-3'}>
      {paras.map((p, i) => (
        <p key={i} className={paragraphClassName}>
          {p}
        </p>
      ))}
    </div>
  )
}
