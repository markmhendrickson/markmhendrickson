function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Series index slug from explicit `seriesSlug`, else inferred from `slug` via legacy `-part-N` suffix (e.g. `the-human-inversion-part-3`). */
export function resolveSeriesSlug(post: { slug?: string; seriesSlug?: string }): string | null {
  const explicit = post.seriesSlug?.trim()
  if (explicit) return explicit
  const slug = post.slug?.trim()
  if (!slug) return null
  const m = slug.match(/^(.*)-part-\d+$/i)
  if (m?.[1]) return m[1]
  return null
}

/** Same membership as `seriesIndexBundles` in Posts: part of a named multi-part series, not a standalone post row. */
export function isSeriesPartForPostsIndex(post: {
  slug?: string
  series?: string
  seriesSlug?: string
}): boolean {
  const sSlug = resolveSeriesSlug(post)
  return Boolean(sSlug && post.series?.trim())
}

/**
 * When every part slug is `{seriesSlug}-part-{n}`, returns `undefined` so callers keep using that URL shape.
 * Otherwise returns part slugs in order (index 0 = part 1) for custom per-part slugs under the same series.
 */
export function buildSeriesOrderedPartSlugs(
  posts: { slug?: string; seriesSlug?: string; seriesPart?: number }[],
  seriesSlug: string,
): string[] | undefined {
  const parts = posts
    .filter((p) => p.seriesSlug === seriesSlug && typeof p.seriesPart === 'number' && p.slug?.trim())
    .sort((a, b) => (a.seriesPart ?? 0) - (b.seriesPart ?? 0))
  if (parts.length === 0) return undefined
  const legacyRe = new RegExp(`^${escapeRegex(seriesSlug)}-part-\\d+$`, 'i')
  const allLegacy = parts.every((p) => legacyRe.test(p.slug!.trim()))
  if (allLegacy) return undefined
  return parts.map((p) => p.slug!.trim())
}
