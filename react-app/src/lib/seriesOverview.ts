import seriesOverviews from '@/data/series_overviews.json'

/** Repo-owned copy keyed by `seriesSlug` (e.g. `the-human-inversion`). */
const OVERVIEWS = seriesOverviews as Record<string, string>

/**
 * Series landing copy: prefer `src/data/series_overviews.json`, then any part’s
 * optional `seriesDescription` from post metadata / frontmatter (cache).
 */
export function getSeriesOverview(
  seriesSlug: string,
  postsInSeries: { seriesDescription?: string }[],
): string | undefined {
  const fromFile = OVERVIEWS[seriesSlug]
  if (typeof fromFile === 'string' && fromFile.trim()) return fromFile.trim()
  const fromPost = postsInSeries.find((p) => p.seriesDescription?.trim())
  const s = fromPost?.seriesDescription?.trim()
  return s || undefined
}
