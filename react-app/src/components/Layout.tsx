import React, { useEffect, useState } from 'react'
import { useLocation, useParams, type Params } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Layout as SharedLayout } from '@shared/components/Layout'
import { Home, FileText, Share2, Clock, Bot } from 'lucide-react'
import publicPostsData from '@cache/posts.json'

interface Post {
  slug: string
  alternativeSlugs?: string[]
  title: string
}

function buildSlugToPostMap(posts: Post[]): Map<string, Post> {
  const map = new Map<string, Post>()
  for (const post of posts) {
    if (post.slug) map.set(post.slug, post)
    for (const alt of post.alternativeSlugs ?? []) {
      if (alt) map.set(alt, post)
    }
  }
  return map
}

// Route name mapping for friendly breadcrumb labels
const routeNames: Record<string, string> = {
  'posts': 'Posts',
  'draft': 'Drafts',
  'timeline': 'Timeline',
  'newsletter': 'Newsletter',
  'links': 'Links',
  'agent': 'Agent',
  'test-error': 'Test Error',
}

const menuItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/posts', label: 'Posts', icon: FileText },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/agent', label: 'Agent', icon: Bot },
  { path: '/links', label: 'Links', icon: Share2 },
]

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const params = useParams()
  const [postTitle, setPostTitle] = useState<string | null>(null)
  const isHome = location.pathname === '/'

  // Load post title if we're on a post page (resolve primary or alternative slug)
  useEffect(() => {
    if (params.slug) {
      const publicMap = buildSlugToPostMap(publicPostsData as Post[])
      let post = publicMap.get(params.slug)

      setPostTitle(post ? post.title : null)
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

  // Home (/) uses the default Helmet here; all other routes should supply their own Helmet.
  const hasPageHelmet = location.pathname !== '/'

  const defaultTitle = 'Mark Hendrickson'
  const defaultDescription = 'Essays on user-owned agent memory, personal infrastructure, and building systems that restore sovereignty in an age of AI, crypto, and complexity.'
  const defaultUrl = 'https://markmhendrickson.com/'
  const defaultImage = 'https://markmhendrickson.com/images/og-default-1200x630.jpg'
  const ogImageWidth = 1200
  const ogImageHeight = 630

  return (
    <>
      {!hasPageHelmet && (
        <Helmet>
          <title>{defaultTitle}</title>
          <meta name="description" content={defaultDescription} />
          <meta name="author" content="Mark Hendrickson" />
          <link rel="canonical" href={defaultUrl} />
          <link rel="alternate" type="application/rss+xml" title={`${defaultTitle} RSS`} href="https://markmhendrickson.com/rss.xml" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={defaultTitle} />
          <meta property="og:description" content={defaultDescription} />
          <meta property="og:url" content={defaultUrl} />
          <meta property="og:image" content={defaultImage} />
          <meta property="og:image:width" content={String(ogImageWidth)} />
          <meta property="og:image:height" content={String(ogImageHeight)} />
          <meta name="twitter:title" content={defaultTitle} />
          <meta name="twitter:description" content={defaultDescription} />
          <meta name="twitter:image" content={defaultImage} />
          <meta name="twitter:image:width" content={String(ogImageWidth)} />
          <meta name="twitter:image:height" content={String(ogImageHeight)} />
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: defaultTitle,
              url: defaultUrl,
              description: defaultDescription,
            })}
          </script>
        </Helmet>
      )}
      <SharedLayout
        siteName="Mark Hendrickson"
        menuItems={menuItems}
        routeNames={routeNames}
        getBreadcrumbLabel={getBreadcrumbLabel}
      >
        {children}
      </SharedLayout>
    </>
  )
}
