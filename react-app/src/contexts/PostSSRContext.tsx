import React from 'react'

export interface PostMeta {
  slug: string
  title: string
  excerpt?: string
  summary?: string
  published: boolean
  publishedDate?: string
  category?: string
  readTime?: number
  tags?: string[]
  heroImage?: string
  heroImageSquare?: string
  heroImageStyle?: string
  excludeFromListing?: boolean
  showMetadata?: boolean
  body?: string
}

const PostSSRContext = React.createContext<{ postMeta: PostMeta | null }>({ postMeta: null })
const SCRIPT_ID = 'post-ssr-data'

export function PostSSRProvider({
  postMeta,
  children,
}: {
  postMeta: PostMeta | null
  children: React.ReactNode
}) {
  return (
    <PostSSRContext.Provider value={{ postMeta }}>
      {postMeta != null && (
        <script
          type="application/json"
          id={SCRIPT_ID}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(postMeta) }}
        />
      )}
      {children}
    </PostSSRContext.Provider>
  )
}

export function usePostSSR() {
  return React.useContext(PostSSRContext).postMeta
}

export function getPostSSRFromDom(): PostMeta | null {
  if (typeof document === 'undefined') return null
  const el = document.getElementById(SCRIPT_ID)
  if (!el?.textContent) return null
  try {
    return JSON.parse(el.textContent) as PostMeta
  } catch {
    return null
  }
}
