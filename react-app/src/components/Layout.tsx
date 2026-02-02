import React, { useEffect, useState } from 'react'
import { useParams, type Params } from 'react-router-dom'
import { Layout as SharedLayout } from '@shared/components/Layout'
import { Home, FileText, FileEdit, Share2, Clock } from 'lucide-react'
import publicPostsData from '@/content/posts/posts.json'

interface Post {
  slug: string
  title: string
}

// Route name mapping for friendly breadcrumb labels
const routeNames: Record<string, string> = {
  'posts': 'Posts',
  'draft': 'Drafts',
  'timeline': 'Timeline',
  'newsletter': 'Newsletter',
  'social': 'Links',
  'test-error': 'Test Error',
}

const menuItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/posts', label: 'Posts', icon: FileText },
  ...(import.meta.env.DEV ? [{ path: '/posts/draft', label: 'Drafts', icon: FileEdit }] : []),
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/social', label: 'Links', icon: Share2 },
]

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const params = useParams()
  const [postTitle, setPostTitle] = useState<string | null>(null)

  // Load post title if we're on a post page
  useEffect(() => {
    if (params.slug) {
      // Check public posts first
      const post = (publicPostsData as Post[]).find(p => p.slug === params.slug)

      if (!post) {
        setPostTitle(null)
        // Try private posts in dev only (production build excludes drafts)
        if (import.meta.env.DEV) {
          import('@/content/posts/posts.private.json')
            .then((module: { default?: Post[] } | Post[]) => {
              const privatePosts = (module as { default?: Post[] }).default || (module as Post[])
              const privatePost = privatePosts.find(p => p.slug === params.slug)
              if (privatePost) setPostTitle(privatePost.title)
            })
            .catch(() => {})
        }
      } else {
        setPostTitle(post.title)
      }
    } else {
      setPostTitle(null)
    }
  }, [params.slug])

  // Custom breadcrumb label function for post titles
  const getBreadcrumbLabel = (pathname: string, params: Params): string | null => {
    if (params.slug && postTitle) {
      return postTitle
    }
    return null
  }

  return (
    <SharedLayout
      siteName="Mark Hendrickson"
      menuItems={menuItems}
      routeNames={routeNames}
      getBreadcrumbLabel={getBreadcrumbLabel}
    >
      {children}
    </SharedLayout>
  )
}
