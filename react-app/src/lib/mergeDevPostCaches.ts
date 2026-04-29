import { defaultLocale, type SupportedLocale } from '@/i18n/config'

/**
 * Merge localized public posts with `posts.private.json` for dev / VITE_SHOW_DRAFTS.
 *
 * When a slug exists in both caches:
 * - **Default locale (en):** private wins so edits to `posts.private.json` show immediately
 *   in dev without syncing `posts.json`.
 * - **Other locales:** public wins so `posts.{locale}.json` stays authoritative for localized copy.
 */
export function mergeLocalizedPublicWithPrivatePosts<T extends { slug?: string }>(
  localizedPublicPosts: T[],
  privatePosts: T[],
  locale: SupportedLocale,
): T[] {
  const mergedBySlug = new Map<string, T>()
  for (const post of localizedPublicPosts) {
    if (post.slug) mergedBySlug.set(post.slug, post)
  }
  const privateWinsOnSlugOverlap = locale === defaultLocale
  for (const post of privatePosts) {
    if (!post.slug) continue
    if (privateWinsOnSlugOverlap || !mergedBySlug.has(post.slug)) {
      mergedBySlug.set(post.slug, post)
    }
  }
  return Array.from(mergedBySlug.values())
}
