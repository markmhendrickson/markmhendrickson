import { useMemo } from 'react'
import { useLocale } from '@/i18n/LocaleContext'
import { usePostsListSSR } from '@/contexts/PostsListSSRContext'
import {
  buildDefaultFeed,
  loadPostsData,
  paginateFeed,
  postsIncludeDrafts,
  selectListingPosts,
  ssrPostToPost,
  type FeedItem,
} from '@/lib/postsFeed'

export interface PostsFeedPage {
  items: FeedItem[]
  currentPage: number
  totalPages: number
}

/**
 * One page of the published /posts feed (no search, no drafts), computed synchronously so it
 * renders identically during SSR/prerender and on the client. Uses the same data sources and the
 * same derivation as the /posts index page; the homepage uses `usePostsFeedPage(1)`.
 */
export function usePostsFeedPage(page = 1): PostsFeedPage {
  const { locale } = useLocale()
  const ssrPosts = usePostsListSSR()
  return useMemo(() => {
    const listingPosts =
      ssrPosts != null && ssrPosts.length > 0
        ? ssrPosts.map(ssrPostToPost)
        : selectListingPosts(loadPostsData(postsIncludeDrafts, locale), false)
    return paginateFeed(buildDefaultFeed(listingPosts), page)
  }, [ssrPosts, locale, page])
}
