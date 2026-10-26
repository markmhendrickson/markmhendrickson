import React from 'react'
import { useLocation } from 'react-router-dom'

/** Post list item shape used for SSR; minimal so JSON stays small. */
export interface PostListItemSSR {
  slug: string
  title: string
  excerpt?: string
  publishedDate?: string
  updatedDate?: string
  category?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageSquare?: string
  ogImage?: string
  excludeFromListing?: boolean
  linkedTweetUrl?: string
  /** Present when post belongs to a series (for /posts index grouping + filtering). */
  series?: string
  seriesSlug?: string
  seriesPart?: number
  seriesTotal?: number
}

const PostsListSSRContext = React.createContext<{ posts: PostListItemSSR[] | null; sourcePath: string } | null>(null)

const SCRIPT_ID = 'posts-ssr-data'

export function PostsListSSRProvider({
  posts,
  sourcePath,
  children,
}: {
  posts: PostListItemSSR[] | null
  sourcePath: string
  children: React.ReactNode
}) {
  return (
    <PostsListSSRContext.Provider value={{ posts, sourcePath }}>
      {posts != null && posts.length > 0 && (
        <script
          type="application/json"
          id={SCRIPT_ID}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(posts) }}
        />
      )}
      {children}
    </PostsListSSRContext.Provider>
  )
}

export function usePostsListSSR(): PostListItemSSR[] | null {
  const source = React.useContext(PostsListSSRContext)
  const { pathname } = useLocation()
  return source?.sourcePath === pathname ? source.posts : null
}

export function getPostsListSSRFromDom(): PostListItemSSR[] | null {
  if (typeof document === 'undefined') return null
  const el = document.getElementById(SCRIPT_ID)
  if (!el?.textContent) return null
  try {
    const parsed = JSON.parse(el.textContent) as PostListItemSSR[]
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}
