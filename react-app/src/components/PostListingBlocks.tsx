import { useMemo } from 'react'
import { getHighlightedParts } from '@/lib/postSearch'
import { parseExcerptAsBulletLines, stripLinksFromExcerpt } from '@/lib/utils'

export function HighlightedText({ text, query }: { text: string; query: string }) {
  const parts = useMemo(() => getHighlightedParts(text, query), [text, query])

  return (
    <>
      {parts.map((part, index) =>
        part.highlight ? (
          <mark
            key={`${part.text}-${index}`}
            className="bg-yellow-200/70 dark:bg-yellow-500/30 text-inherit rounded-sm px-0.5"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  )
}

export function PostListingExcerpt({
  excerpt,
  isTweet,
  query,
}: {
  excerpt?: string
  isTweet: boolean
  query: string
}) {
  if (!excerpt || isTweet) return null
  const bullets = parseExcerptAsBulletLines(excerpt)
  if (bullets?.length) {
    return (
      <ul className="list-disc pl-5 mb-3 space-y-1.5 text-[15px] text-foreground leading-relaxed">
        {bullets.slice(0, 6).map((item, i) => (
          <li key={i}>
            <HighlightedText text={item} query={query} />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <p className="text-[15px] text-foreground mb-3 leading-relaxed">
      <HighlightedText text={stripLinksFromExcerpt(excerpt)} query={query} />
    </p>
  )
}
