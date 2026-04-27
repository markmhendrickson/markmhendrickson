import postsDefault from '@cache/posts.json'
import { defaultLocale, type SupportedLocale } from '@/i18n/config'

type PostRecord = Record<string, unknown>

function getPostIdentity(post: PostRecord): string | null {
  const canonicalSlug = post.canonicalSlug
  if (typeof canonicalSlug === 'string' && canonicalSlug) return canonicalSlug
  const postId = post.postId
  if (typeof postId === 'string' && postId) return postId
  const slug = post.slug
  if (typeof slug === 'string' && slug) return slug
  return null
}

function dedupePostsByIdentity(posts: PostRecord[]): PostRecord[] {
  const seen = new Set<string>()
  const deduped: PostRecord[] = []
  for (const post of posts) {
    const identity = getPostIdentity(post)
    if (!identity) {
      deduped.push(post)
      continue
    }
    if (seen.has(identity)) continue
    seen.add(identity)
    deduped.push(post)
  }
  return deduped
}

const localeModules = import.meta.glob('@cache/posts.*.json', { eager: true }) as Record<
  string,
  { default?: PostRecord[] } | PostRecord[]
>

// posts.private.json is included in the glob but not matched by the locale regex
const privateModule = localeModules['/cache/posts.private.json']
const privatePostsData: PostRecord[] = privateModule
  ? ((privateModule as { default?: PostRecord[] }).default ?? (privateModule as PostRecord[]))
  : []

const localizedPostsByLocale = new Map<SupportedLocale, PostRecord[]>()
for (const [modulePath, moduleValue] of Object.entries(localeModules)) {
  const match = modulePath.match(/posts\.([a-z]{2})\.json$/)
  if (!match) continue
  const locale = match[1] as SupportedLocale
  const payload = (moduleValue as { default?: PostRecord[] }).default ?? (moduleValue as PostRecord[])
  if (Array.isArray(payload)) localizedPostsByLocale.set(locale, dedupePostsByIdentity(payload))
}

export function getLocalizedPublicPosts(locale: SupportedLocale): PostRecord[] {
  return localizedPostsByLocale.get(locale) ?? localizedPostsByLocale.get(defaultLocale) ?? (postsDefault as PostRecord[])
}

export function getDefaultPublicPosts(): PostRecord[] {
  return postsDefault as PostRecord[]
}

/** Returns all posts including drafts (from posts.private.json, eagerly bundled). */
export function getAllPostsIncludingDrafts(): PostRecord[] {
  return Array.isArray(privatePostsData) && privatePostsData.length > 0
    ? privatePostsData
    : (postsDefault as PostRecord[])
}
