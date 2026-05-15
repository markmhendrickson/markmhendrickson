import { defaultLocale, type SupportedLocale } from '@/i18n/config'

/**
 * Merge localized public posts with `posts.private.json` for dev / VITE_SHOW_DRAFTS.
 *
 * When a slug exists in both caches:
 * - **Default locale (en):** private wins for content fields so edits to `posts.private.json`
 *   show immediately in dev without syncing `posts.json`. However, if the public cache marks a
 *   post as published, that status is preserved — private cache draft flags never suppress a
 *   post that is already live.
 * - **Other locales:** public wins so `posts.{locale}.json` stays authoritative for localized copy.
 */
export function mergeLocalizedPublicWithPrivatePosts<T extends { slug?: string; published?: unknown }>(
  localizedPublicPosts: T[],
  privatePosts: T[],
  locale: SupportedLocale,
): T[] {
  const publicBySlug = new Map<string, T>()
  for (const post of localizedPublicPosts) {
    if (post.slug) publicBySlug.set(post.slug, post)
  }

  const mergedBySlug = new Map<string, T>(publicBySlug)
  const privateWinsOnSlugOverlap = locale === defaultLocale
  for (const post of privatePosts) {
    if (!post.slug) continue
    if (privateWinsOnSlugOverlap || !mergedBySlug.has(post.slug)) {
      const publicEntry = publicBySlug.get(post.slug)
      if (publicEntry && publicEntry.published) {
        // Public says this post is live — keep the private content but restore published status
        mergedBySlug.set(post.slug, { ...post, published: publicEntry.published })
      } else {
        mergedBySlug.set(post.slug, post)
      }
    }
  }
  return Array.from(mergedBySlug.values())
}
