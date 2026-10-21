import { getLocalizedPublicPosts } from '@/lib/postsLocaleData'
import { mergeLocalizedPublicWithPrivatePosts } from '@/lib/mergeDevPostCaches'
import { type SearchablePost } from '@/lib/postSearch'
import { isSeriesPartForPostsIndex, resolveSeriesSlug } from '@/lib/resolveSeriesSlug'
import { isExcludedFromListing, isPublishedPost, parseCalendarOrIsoDateString } from '@/lib/utils'
import type { SupportedLocale } from '@/i18n/config'
// Direct top-level import ensures Vite bundles the JSON even with VITE_SHOW_DRAFTS=true (prevents tree-shaking)
import privatePostsJson from '@cache/posts.private.json'

/**
 * Shared feed logic for the /posts index and the homepage "latest posts" section.
 * Both surfaces derive their list from these functions so page 1 can never drift apart.
 */

export interface Post extends SearchablePost {
  slug: string
  title: string
  excerpt?: string
  body?: string
  summary?: string
  published: boolean | number | string
  publishedDate?: string
  updatedDate?: string
  createdDate?: string
  category?: string
  linkedTweetUrl?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageSquare?: string
  heroImageStyle?: string
  ogImage?: string
  excludeFromListing?: boolean | number | string
  showMetadata?: boolean
  tweetMetadata?: { images?: string[] }
  seriesPart?: number
  seriesTotal?: number
  series?: string
  seriesSlug?: string
  seriesDescription?: string
}

export interface SeriesIndexBundle {
  slug: string
  title: string
  parts: Post[]
}

export type FeedItem =
  | { kind: 'post'; post: Post; sortKey: number }
  | { kind: 'series'; bundle: SeriesIndexBundle; sortKey: number }

export const POSTS_PER_PAGE = 12

/** Dev (or VITE_SHOW_DRAFTS=true builds) may read the private cache that includes drafts. */
export const postsIncludeDrafts = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === 'true'

/**
 * Posts source for the listing. Default locale: `posts.private.json` overwrites public per slug
 * (see `mergeDevPostCaches`) when drafts are allowed. Other locales: localized public wins on overlap.
 * In production without VITE_SHOW_DRAFTS only the public cache is ever read.
 */
export function loadPostsData(includeDrafts: boolean, locale: SupportedLocale): Post[] {
  const localizedPublicPosts = getLocalizedPublicPosts(locale) as unknown as Post[]
  if (!includeDrafts) return localizedPublicPosts
  if (import.meta.env.PROD && import.meta.env.VITE_SHOW_DRAFTS !== 'true') return localizedPublicPosts
  const privateList = privatePostsJson as unknown as Post[]
  return mergeLocalizedPublicWithPrivatePosts(localizedPublicPosts, privateList, locale)
}

/** Coerce SSR list item to full Post shape for list rendering. */
export function ssrPostToPost(p: {
  slug: string
  title?: string
  excerpt?: string
  publishedDate?: string
  updatedDate?: string
  category?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageSquare?: string
  ogImage?: string
  linkedTweetUrl?: string
  series?: string
  seriesSlug?: string
  seriesPart?: number
  seriesTotal?: number
}): Post {
  return {
    slug: p.slug,
    title: p.title ?? '',
    excerpt: p.excerpt,
    published: true,
    publishedDate: p.publishedDate,
    updatedDate: p.updatedDate,
    category: p.category,
    readTime: p.readTime,
    tags: p.tags,
    heroImage: p.heroImage,
    heroImageSquare: p.heroImageSquare,
    ogImage: p.ogImage,
    linkedTweetUrl: p.linkedTweetUrl,
    series: p.series,
    seriesSlug: p.seriesSlug,
    seriesPart: p.seriesPart,
    seriesTotal: p.seriesTotal,
  }
}

/**
 * Index list: draft route shows only drafts; /posts shows only published, excluding excludeFromListing.
 * Published list is sorted by publishedDate desc (newest first), slug asc for ties. Must match
 * Post.tsx publishedListOrder and the cache script.
 */
export function selectListingPosts(postsData: Post[], draft: boolean): Post[] {
  const filtered = postsData
    .filter((post) => !isExcludedFromListing(post))
    .filter((post) => (draft ? !isPublishedPost(post) : isPublishedPost(post)))
  return [...filtered].sort((a, b) => {
    const dA = draft ? (a.updatedDate ?? a.createdDate) : a.publishedDate
    const dB = draft ? (b.updatedDate ?? b.createdDate) : b.publishedDate
    const tA = dA ? parseCalendarOrIsoDateString(dA).getTime() : 0
    const tB = dB ? parseCalendarOrIsoDateString(dB).getTime() : 0
    if (tB !== tA) return tB - tA
    return (a.slug || '').localeCompare(b.slug || '')
  })
}

/** Search pool: all published posts (including excludeFromListing), for search-only matches. */
export function selectSearchPool(postsData: Post[]): Post[] {
  return postsData
    .filter((post) => isPublishedPost(post))
    .sort((a, b) => {
      const tA = a.publishedDate ? parseCalendarOrIsoDateString(a.publishedDate).getTime() : 0
      const tB = b.publishedDate ? parseCalendarOrIsoDateString(b.publishedDate).getTime() : 0
      if (tB !== tA) return tB - tA
      return (a.slug || '').localeCompare(b.slug || '')
    })
}

/** Published /posts list: exclude series parts (they appear only under the series block). Draft index unchanged. */
export function selectStandalonePosts(posts: Post[], draft: boolean): Post[] {
  return draft ? posts : posts.filter((p) => !isSeriesPartForPostsIndex(p))
}

/** Published multi-part series on the index: parts sorted by publish date, series keyed by latest published date. */
export function buildSeriesIndexBundles(posts: Post[], draft: boolean): SeriesIndexBundle[] {
  if (draft) return []
  const grouped = new Map<string, Post[]>()
  for (const post of posts) {
    const sSlug = resolveSeriesSlug(post)
    if (!sSlug || !post.series?.trim()) continue
    if (!isPublishedPost(post)) continue
    const arr = grouped.get(sSlug) ?? []
    arr.push(post)
    grouped.set(sSlug, arr)
  }
  return Array.from(grouped.entries()).map(([slug, parts]) => {
    const partsByPub = [...parts].sort((a, b) => {
      const tA = a.publishedDate ? parseCalendarOrIsoDateString(a.publishedDate).getTime() : 0
      const tB = b.publishedDate ? parseCalendarOrIsoDateString(b.publishedDate).getTime() : 0
      if (tB !== tA) return tB - tA
      return (a.slug || '').localeCompare(b.slug || '')
    })
    const title = parts.find((p) => p.series?.trim())?.series?.trim() ?? slug
    return { slug, title, parts: partsByPub }
  })
}

/** Merged, date-sorted feed of standalone posts and series bundles (non-search, non-draft mode only). */
export function buildMergedFeed(
  draft: boolean,
  query: string,
  filteredPosts: Post[],
  seriesIndexBundles: SeriesIndexBundle[],
): FeedItem[] {
  if (draft || query.trim()) return []
  const items: FeedItem[] = [
    ...filteredPosts.map((post): FeedItem => ({
      kind: 'post',
      post,
      sortKey: post.publishedDate ? parseCalendarOrIsoDateString(post.publishedDate).getTime() : 0,
    })),
    ...seriesIndexBundles.map((bundle): FeedItem => ({
      kind: 'series',
      bundle,
      sortKey: bundle.parts[0]?.publishedDate
        ? parseCalendarOrIsoDateString(bundle.parts[0].publishedDate).getTime()
        : 0,
    })),
  ]
  items.sort((a, b) => {
    if (b.sortKey !== a.sortKey) return b.sortKey - a.sortKey
    const aSlug = a.kind === 'post' ? a.post.slug : a.bundle.slug
    const bSlug = b.kind === 'post' ? b.post.slug : b.bundle.slug
    return aSlug.localeCompare(bSlug)
  })
  return items
}

/** Clamp a requested page number against the feed length and slice that page. */
export function paginateFeed(
  feed: FeedItem[],
  requestedPage: number,
): { totalPages: number; currentPage: number; items: FeedItem[] } {
  const totalPages = Math.max(1, Math.ceil(feed.length / POSTS_PER_PAGE))
  const currentPage = Math.min(totalPages, Math.max(1, requestedPage || 1))
  const start = (currentPage - 1) * POSTS_PER_PAGE
  return { totalPages, currentPage, items: feed.slice(start, start + POSTS_PER_PAGE) }
}

/** Default (no search, not drafts) feed for a set of already-selected listing posts. */
export function buildDefaultFeed(listingPosts: Post[]): FeedItem[] {
  const standalone = selectStandalonePosts(listingPosts, false)
  const bundles = buildSeriesIndexBundles(listingPosts, false)
  return buildMergedFeed(false, '', standalone, bundles)
}
