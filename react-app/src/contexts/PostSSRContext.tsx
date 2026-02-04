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

export function PostSSRProvider({
  postMeta,
  children,
}: {
  postMeta: PostMeta | null
  children: React.ReactNode
}) {
  return (
    <PostSSRContext.Provider value={{ postMeta }}>{children}</PostSSRContext.Provider>
  )
}

export function usePostSSR() {
  return React.useContext(PostSSRContext).postMeta
}
