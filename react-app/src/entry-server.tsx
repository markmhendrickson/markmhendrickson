import React from 'react'
import { renderToString } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { PostSSRProvider } from './contexts/PostSSRContext'
import publicPostsData from '@cache/posts.json'

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
  const match = pathname.match(/^\/posts\/([^/]+)$/)
  const slug = match?.[1]
  if (!slug) return null
  const posts = publicPostsData as { slug: string; alternativeSlugs?: string[]; published?: boolean }[]
  const slugToPost = buildSlugToPostMap(posts)
  const post = slugToPost.get(slug)
  return post && post.published !== false ? post : null
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
  return renderToString(
    <HelmetProvider context={context}>
      <PostSSRProvider postMeta={ssrPost}>
        <App url={url} />
      </PostSSRProvider>
    </HelmetProvider>
  )
}
