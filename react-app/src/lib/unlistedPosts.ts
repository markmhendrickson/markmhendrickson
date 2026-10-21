/**
 * Unlisted ("review link") posts.
 *
 * An unlisted post is reachable at /posts/<slug> by anyone with the URL, carries a noindex robots meta tag,
 * and is absent from every list (home, /posts, series, search, previous/next, RSS, sitemap, llms files, the
 * public JSON API). The records live ONLY in `cache/unlisted-posts.json`, never in `cache/posts*.json`, so a
 * list consumer that forgets to filter still cannot leak one.
 *
 * Only the post page (Post.tsx) and the breadcrumb (Layout.tsx) read them, and only through this lazy loader:
 * the JSON becomes its own chunk that is fetched when the requested slug is not in the public list. Do not
 * import the JSON statically anywhere under src/ (it would land in the main chunk), and do not read it from a
 * list page.
 *
 * To publish: see "Unlisted preview pages" in src/content/posts/README.md.
 */

export interface UnlistedPostRecord {
  slug: string
  alternativeSlugs?: string[]
  title: string
  published: boolean
  unlisted: true
  body?: string
  [key: string]: unknown
}

let cached: Promise<UnlistedPostRecord[]> | null = null

export function loadUnlistedPosts(): Promise<UnlistedPostRecord[]> {
  if (!cached) {
    cached = import('@cache/unlisted-posts.json')
      .then((mod) => {
        const payload = (mod as { default?: unknown }).default ?? mod
        return Array.isArray(payload) ? (payload as UnlistedPostRecord[]) : []
      })
      .catch(() => [])
  }
  return cached
}

export async function findUnlistedPost(slug: string | undefined): Promise<UnlistedPostRecord | undefined> {
  if (!slug) return undefined
  const posts = await loadUnlistedPosts()
  return posts.find((post) => post.slug === slug || (post.alternativeSlugs ?? []).includes(slug))
}
