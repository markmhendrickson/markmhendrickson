import React, { useEffect, useState } from 'react'
import { useLocation, useParams, type Params } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Layout as SharedLayout } from '@shared/components/Layout'
import { Home, FileText, Share2, Clock, Bot, Briefcase, TrendingUp, CalendarPlus } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { localeToOgLocale, localeToLanguageName, supportedLocales } from '@/i18n/config'
import { localizePath, saveLocale, stripLocaleFromPath } from '@/i18n/routing'
import { getLocalizedPublicPosts } from '@/lib/postsLocaleData'

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

interface LayoutProps {
  children: React.ReactNode
}

const primaryLanguageLocales = new Set(['en', 'es', 'ca'])

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const params = useParams()
  const { locale, languageTag, direction, t } = useLocale()
  const publicPostsData = getLocalizedPublicPosts(locale) as Post[]
  const [postTitle, setPostTitle] = useState<string | null>(null)
  const isHome = location.pathname === localizePath('/', locale)

  // Load post title if we're on a post page (resolve primary or alternative slug).
  // In dev, also resolve from private cache so draft post titles show in the breadcrumb.
  useEffect(() => {
    if (params.slug) {
      const publicMap = buildSlugToPostMap(publicPostsData as Post[])
      const post = publicMap.get(params.slug)
      if (post) {
        setPostTitle(post.title)
      } else if (import.meta.env.DEV) {
        import('@cache/posts.private.json').then((mod: { default: Post[] }) => {
          const privateMap = buildSlugToPostMap(mod.default)
          const draftPost = privateMap.get(params.slug!)
          setPostTitle(draftPost ? draftPost.title : null)
        }).catch(() => setPostTitle(null))
      } else {
        setPostTitle(null)
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

  const routeNames: Record<string, string> = {
    'posts': t.navPosts,
    'draft': t.drafts,
    'timeline': t.navTimeline,
    'newsletter': t.newsletter,
    'links': t.navLinks,
    'meet': t.navMeet,
    'agent': t.navAgent,
    'consulting': t.navConsulting,
    'investing': t.navInvesting,
    'test-error': t.testError,
  }

  const menuItems = [
    { path: localizePath('/', locale), label: t.navHome, icon: Home },
    { path: localizePath('/posts', locale), label: t.navPosts, icon: FileText },
    { path: localizePath('/timeline', locale), label: t.navTimeline, icon: Clock },
    { path: localizePath('/agent', locale), label: t.navAgent, icon: Bot },
    { path: localizePath('/consulting', locale), label: t.navConsulting, icon: Briefcase },
    { path: localizePath('/investing', locale), label: t.navInvesting, icon: TrendingUp },
    { path: localizePath('/meet', locale), label: t.navMeet, icon: CalendarPlus },
    { path: localizePath('/links', locale), label: t.navLinks, icon: Share2 },
  ]

  const visibleLanguageLocales = import.meta.env.PROD
    ? supportedLocales.filter((nextLocale) => primaryLanguageLocales.has(nextLocale))
    : supportedLocales

  const languageMenuItems = visibleLanguageLocales.map((nextLocale) => {
    const isPrimaryLocale = primaryLanguageLocales.has(nextLocale)
    return {
      path: localizePath(stripLocaleFromPath(location.pathname), nextLocale),
      label: localeToLanguageName[nextLocale],
      isActive: nextLocale === locale,
      onSelect: () => saveLocale(nextLocale),
      className: !isPrimaryLocale && import.meta.env.DEV ? 'opacity-50' : undefined,
    }
  })

  // Home (/:locale) uses the default Helmet here; all other routes should supply their own Helmet.
  const hasPageHelmet = !isHome

  const defaultTitle = 'Mark Hendrickson'
  const defaultDescription = t.defaultHomeDescription
  const defaultUrl = `https://markmhendrickson.com${localizePath('/', locale)}`
  const defaultImage = 'https://markmhendrickson.com/images/og-default-1200x630.jpg'
  const ogImageWidth = 1200
  const ogImageHeight = 630

  return (
    <>
      {!hasPageHelmet && (
        <Helmet>
          <html lang={languageTag} dir={direction} />
          <title>{defaultTitle}</title>
          <meta name="description" content={defaultDescription} />
          <meta name="author" content="Mark Hendrickson" />
          <link rel="canonical" href={defaultUrl} />
          <meta property="og:locale" content={localeToOgLocale[locale]} />
          {supportedLocales.map((altLocale) => (
            <link
              key={altLocale}
              rel="alternate"
              hrefLang={altLocale}
              href={`https://markmhendrickson.com${localizePath('/', altLocale)}`}
            />
          ))}
          <link rel="alternate" hrefLang="x-default" href="https://markmhendrickson.com/" />
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
        direction={direction}
        siteName="Mark Hendrickson"
        menuItems={menuItems}
        routeNames={routeNames}
        getBreadcrumbLabel={getBreadcrumbLabel}
        homeHref={localizePath('/', locale)}
        homeLabel={t.navHome}
        hiddenPathSegments={supportedLocales}
        languageMenuItems={languageMenuItems}
        languageMenuLabel={t.navLanguage}
        themeMenuLabel={t.themeMenuLabel}
        themeMenuAriaLabel={t.themeMenuAriaLabel}
        themeSystem={t.themeSystem}
        themeLight={t.themeLight}
        themeDark={t.themeDark}
      >
        {children}
      </SharedLayout>
    </>
  )
}
