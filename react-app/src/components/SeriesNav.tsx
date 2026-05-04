import { Link } from 'react-router-dom'
import { localizePath } from '@/i18n/routing'
import { type SupportedLocale } from '@/i18n/config'
import { cn } from '@/lib/utils'

interface SeriesPost {
  series?: string
  seriesSlug?: string
  seriesPart?: number
  seriesTotal?: number
}

interface SeriesNavProps {
  post: SeriesPost
  locale: SupportedLocale
  /** Part 1 slug at index 0, … when series uses non–`{seriesSlug}-part-{n}` URLs. */
  orderedSeriesSlugs?: string[]
}

export default function SeriesNav({ post, locale, orderedSeriesSlugs }: SeriesNavProps) {
  const { series, seriesSlug, seriesPart, seriesTotal } = post

  if (!series || !seriesSlug || !seriesPart) return null

  const total = seriesTotal ?? seriesPart
  const useOrdered =
    orderedSeriesSlugs &&
    orderedSeriesSlugs.length === total &&
    orderedSeriesSlugs.every(Boolean)

  const slugForPart = (part: number) => {
    if (useOrdered) return orderedSeriesSlugs![part - 1]!
    return `${seriesSlug}-part-${part}`
  }

  return (
    <div className="mt-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm dark:bg-muted/20">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
        <Link
          to={localizePath(`/posts/series/${seriesSlug}`, locale)}
          className="font-medium text-foreground hover:underline"
        >
          {series}
        </Link>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {seriesPart} / {total}
        </span>
      </div>

      {total > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {Array.from({ length: total }, (_, i) => {
            const part = i + 1
            const isCurrent = part === seriesPart
            const partSlug = slugForPart(part)
            return (
              <Link
                key={partSlug}
                to={localizePath(`/posts/${partSlug}`, locale)}
                aria-label={`${part} / ${total}${isCurrent ? ' current' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'inline-flex h-7 min-w-[28px] items-center justify-center rounded-full px-2.5 text-xs font-medium transition-colors',
                  isCurrent
                    ? 'bg-foreground text-background pointer-events-none'
                    : 'border border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                )}
              >
                {part}
              </Link>
            )
          })}
        </div>
      )}

      {total <= 1 && (
        <div className="flex items-center gap-3 mt-1">
          {seriesPart > 1 && (
            <Link
              to={localizePath(`/posts/${slugForPart(seriesPart - 1)}`, locale)}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              ← {seriesPart - 1}
            </Link>
          )}
          <Link
            to={localizePath(`/posts/${slugForPart(seriesPart + 1)}`, locale)}
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            {seriesPart + 1} →
          </Link>
        </div>
      )}
    </div>
  )
}
