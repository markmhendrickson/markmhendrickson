import seriesOverviews from '@/data/series_overviews.json'
import { defaultLocale, type SupportedLocale } from '@/i18n/config'

/** Repo-owned copy keyed by `seriesSlug` (e.g. `the-human-inversion`). */
const OVERVIEWS = seriesOverviews as Record<string, string | Partial<Record<SupportedLocale, string>>>

/**
 * Series landing copy: prefer `src/data/series_overviews.json`, then any part’s
 * optional `seriesDescription` from post metadata / frontmatter (cache).
 */
export function getSeriesOverview(
  seriesSlug: string,
  postsInSeries: { seriesDescription?: string }[],
  locale: SupportedLocale = defaultLocale,
): string | undefined {
  const fromFile = OVERVIEWS[seriesSlug]
  if (typeof fromFile === 'string' && fromFile.trim()) return fromFile.trim()
  if (fromFile && typeof fromFile === 'object') {
    const localized = fromFile[locale]?.trim() || fromFile[defaultLocale]?.trim()
    if (localized) return localized
  }
  const fromPost = postsInSeries.find((p) => p.seriesDescription?.trim())
  const s = fromPost?.seriesDescription?.trim()
  return s || undefined
}
