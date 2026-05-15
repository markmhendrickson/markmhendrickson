import type { SupportedLocale } from '@/i18n/config'
import { seriesOverviewTextForProse } from '@/components/SeriesOverviewProse'
import { getSeriesOverview } from '@/lib/seriesOverview'
import { isSeriesPartForPostsIndex, resolveSeriesSlug } from '@/lib/resolveSeriesSlug'
import { seriesSeriesHeroBasename } from '@/lib/seriesListThumb'
import { isExcludedFromListing, isPublishedPost, parseCalendarOrIsoDateString } from '@/lib/utils'

/** Minimal post shape for the home / post-page “latest” alert. */
export type LatestFeaturedPost = {
  slug: string
  title: string
  excerpt?: string
  publishedDate?: string
  category?: string
  body?: string
  published?: boolean | number | string
  excludeFromListing?: boolean | number | string
  heroImage?: string
  heroImageSquare?: string
  ogImage?: string
  tweetMetadata?: { images?: string[] }
  series?: string
  seriesSlug?: string
  seriesPart?: number
  seriesTotal?: number
  seriesDescription?: string
}

export type LatestFeaturedItem<P extends LatestFeaturedPost = LatestFeaturedPost> =
  | { type: 'post'; post: P }
  | {
      type: 'series'
      slug: string
      title: string
      excerpt?: string
      imageBasename?: string
      latestDate?: string
    }

function publishedListOrder(a: LatestFeaturedPost, b: LatestFeaturedPost): number {
  const tA = a.publishedDate ? parseCalendarOrIsoDateString(a.publishedDate).getTime() : 0
  const tB = b.publishedDate ? parseCalendarOrIsoDateString(b.publishedDate).getTime() : 0
  if (tB !== tA) return tB - tA
  return (a.slug || '').localeCompare(b.slug || '')
}

/**
 * “Latest publication” for home and the post-page alert: when the newest
 * published row is a series installment, prefer the series (title + overview
 * + series hero) over the part title by comparing the newest part’s date to
 * the newest standalone post’s date.
 */
export function computeLatestFeaturedItem<P extends LatestFeaturedPost>(
  posts: readonly P[],
  locale: SupportedLocale,
  excludeSlug?: string | null,
): LatestFeaturedItem<P> | null {
  const publishedOnly = [...posts]
    .filter((p) => isPublishedPost(p) && !isExcludedFromListing(p))
    .sort(publishedListOrder)

  const standalonePublishedOnly = publishedOnly.filter((p) => !isSeriesPartForPostsIndex(p))
  const exclude = (excludeSlug ?? '').trim()
  const latestStandalone =
    standalonePublishedOnly.filter((p) => p.slug !== exclude)[0] ?? null

  const grouped = new Map<string, P[]>()
  for (const candidate of publishedOnly) {
    const sSlug = resolveSeriesSlug(candidate)
    if (!sSlug || !candidate.series?.trim()) continue
    const list = grouped.get(sSlug) ?? []
    list.push(candidate)
    grouped.set(sSlug, list)
  }

  const seriesItems = Array.from(grouped.entries()).map(([sSlug, parts]) => {
    const partsByPart = [...parts].sort((a, b) => (a.seriesPart ?? 0) - (b.seriesPart ?? 0))
    const partsByDate = [...parts].sort(publishedListOrder)
    const title = parts.find((p) => p.series?.trim())?.series?.trim() ?? sSlug
    const overviewRaw = getSeriesOverview(sSlug, partsByPart, locale)
    return {
      slug: sSlug,
      title,
      excerpt: overviewRaw ? seriesOverviewTextForProse(overviewRaw) : partsByDate[0]?.excerpt,
      imageBasename: seriesSeriesHeroBasename(sSlug),
      latestDate: partsByDate[0]?.publishedDate,
    }
  })

  seriesItems.sort((a, b) => {
    const tA = a.latestDate ? parseCalendarOrIsoDateString(a.latestDate).getTime() : 0
    const tB = b.latestDate ? parseCalendarOrIsoDateString(b.latestDate).getTime() : 0
    if (tB !== tA) return tB - tA
    return a.title.localeCompare(b.title)
  })

  const latestSeries = seriesItems[0] ?? null

  if (!latestStandalone) return latestSeries ? { type: 'series', ...latestSeries } : null
  if (!latestSeries?.latestDate) return { type: 'post', post: latestStandalone }

  const postTime = latestStandalone.publishedDate
    ? parseCalendarOrIsoDateString(latestStandalone.publishedDate).getTime()
    : 0
  const seriesTime = parseCalendarOrIsoDateString(latestSeries.latestDate).getTime()
  return seriesTime >= postTime ? { type: 'series', ...latestSeries } : { type: 'post', post: latestStandalone }
}
