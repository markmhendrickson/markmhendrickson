import React from 'react'
import { renderToString } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { PostSSRProvider } from './contexts/PostSSRContext'
import { PostsListSSRProvider, type PostListItemSSR } from './contexts/PostsListSSRContext'
import { getLocalizedPublicPosts } from './lib/postsLocaleData'
import { defaultLocale, isSupportedLocale } from './i18n/config'
import { isExcludedFromListing, isPublishedPost } from './lib/utils'

export interface HelmetContext {
  helmet?: {
    title: { toString(): string }
    meta: { toString(): string }
    link: { toString(): string }
    script: { toString(): string }
    priority?: { toString(): string }
  }
}

function buildSlugToPostMap(posts: { slug: string; alternativeSlugs?: string[]; published?: boolean }[]) {
  const map = new Map<string, (typeof posts)[0]>()
  for (const post of posts) {
    if (post.slug) map.set(post.slug, post)
    for (const alt of post.alternativeSlugs ?? []) {
      if (alt) map.set(alt, post)
    }
  }
  return map
}

function getSSRPostForUrl(url: string) {
  const pathname = (url.split('?')[0] || '/').replace(/\/$/, '')
  const segments = pathname.split('/').filter(Boolean)
  const offset = isSupportedLocale(segments[0]) ? 1 : 0
  if (segments[offset] !== 'posts') return null
  const slug = segments[offset + 1]
  if (!slug) return null
  const routeLocale = isSupportedLocale(segments[0]) ? segments[0] : defaultLocale
  const posts = getLocalizedPublicPosts(routeLocale) as {
    slug: string
    alternativeSlugs?: string[]
    published?: boolean
  }[]
  const slugToPost = buildSlugToPostMap(posts)
  const post = slugToPost.get(slug)
  return post && post.published !== false ? post : null
}

function isPostsIndexUrl(url: string): boolean {
  const pathname = (url.split('?')[0] || '/').replace(/\/$/, '')
  const segments = pathname.split('/').filter(Boolean)
  const offset = isSupportedLocale(segments[0]) ? 1 : 0
  return segments[offset] === 'posts' && segments[offset + 1] == null
}

function getPostsIndexLocale(url: string): string {
  const pathname = (url.split('?')[0] || '/').replace(/\/$/, '')
  const segments = pathname.split('/').filter(Boolean)
  return isSupportedLocale(segments[0]) ? segments[0] : defaultLocale
}

/** Build the same list as Posts.tsx for /posts (published, not excludeFromListing, sorted). */
function getPostsListForSSR(locale: string): PostListItemSSR[] {
  const posts = getLocalizedPublicPosts(locale as 'en') as {
    slug: string
    title?: string
    excerpt?: string
    published?: boolean
    publishedDate?: string
    updatedDate?: string
    createdDate?: string
    category?: string
    readTime?: number
    tags?: string[]
    heroImage?: string
    heroImageSquare?: string
    ogImage?: string
    excludeFromListing?: boolean
    linkedTweetUrl?: string
  }[]
  const filtered = posts
    .filter((p) => !isExcludedFromListing(p))
    .filter((p) => isPublishedPost(p))
  const sorted = [...filtered].sort((a, b) => {
    const tA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0
    const tB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0
    if (tB !== tA) return tB - tA
    return (a.slug || '').localeCompare(b.slug || '')
  })
  return sorted.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    publishedDate: p.publishedDate,
    updatedDate: p.updatedDate,
    category: p.category,
    readTime: p.readTime,
    tags: p.tags,
    heroImage: p.heroImage,
    heroImageSquare: p.heroImageSquare,
    ogImage: p.ogImage,
    excludeFromListing: p.excludeFromListing,
    linkedTweetUrl: p.linkedTweetUrl,
  }))
}

export interface RenderOptions {
  postBody?: string | null
}

export function render(url: string, helmetContext?: HelmetContext, options?: RenderOptions): string {
  const context = helmetContext ?? {}
  let ssrPost = getSSRPostForUrl(url)
  if (ssrPost != null && options?.postBody != null) {
    ssrPost = { ...ssrPost, body: options.postBody }
  }
  const postsForList =
    isPostsIndexUrl(url) ? getPostsListForSSR(getPostsIndexLocale(url)) : null
  return renderToString(
    <HelmetProvider context={context}>
      <PostSSRProvider postMeta={ssrPost}>
        <PostsListSSRProvider posts={postsForList}>
          <App url={url} />
        </PostsListSSRProvider>
      </PostSSRProvider>
    </HelmetProvider>
  )
}
