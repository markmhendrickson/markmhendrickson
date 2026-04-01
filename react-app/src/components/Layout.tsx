import React, { useEffect, useState } from 'react'
import { useLocation, useParams, type Params } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Layout as SharedLayout } from '@shared/components/Layout'
import { Home, FileText, Share2, Clock, Bot, Briefcase, TrendingUp, CalendarPlus } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
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
    'wisdom': t.navWisdom,
    'honors-thesis': 'Honors thesis',
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

  const defaultTitle = 'Mark Hendrickson — Building sovereign memory infrastructure for agentic systems'
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
              alternateName: 'Mark Hendrickson',
              url: defaultUrl,
              description: defaultDescription,
            })}
          </script>
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ProfilePage',
              mainEntity: {
                '@type': 'Person',
                name: 'Mark Hendrickson',
                url: 'https://markmhendrickson.com',
                jobTitle: 'Founder',
                description: defaultDescription,
                image: 'https://markmhendrickson.com/profile.jpg',
                worksFor: {
                  '@type': 'Organization',
                  name: 'Neotoma',
                  url: 'https://neotoma.io',
                },
                sameAs: [
                  'https://www.linkedin.com/in/markmhendrickson',
                  'https://github.com/markmhendrickson',
                  'https://x.com/markymark',
                  'https://www.indiehackers.com/markmhendrickson',
                  'https://medium.com/@markymark',
                  'https://substack.com/@markmhendrickson',
                ],
                knowsAbout: [
                  'AI agents',
                  'Model Context Protocol',
                  'sovereign memory infrastructure',
                  'Bitcoin',
                  'product development',
                  'agentic systems',
                ],
              },
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
        hiddenPathSegments={[...supportedLocales, 'chapter', 'section']}
        languageMenuItems={languageMenuItems}
        languageMenuLabel={t.navLanguage}
        themeMenuLabel={t.themeMenuLabel}
        themeMenuAriaLabel={t.themeMenuAriaLabel}
        themeSystem={t.themeSystem}
        themeLight={t.themeLight}
        themeDark={t.themeDark}
      >
        {children}
        <EvaluateCta locale={locale} pathname={location.pathname} />
      </SharedLayout>
    </>
  )
}

/** Packrat + record, post hero style (black / white line-art; see posts README hero guide). */
const NEOTOMA_CTA_IMAGE_SRC = '/images/neotoma_cta_packrat_hero.png'

const evaluateCtaCopy = {
  en: {
    label: 'Try Neotoma',
    title: 'Your agents forget. Neotoma makes them remember.',
    description:
      'Contacts and facts vanish between sessions and tools. Neotoma stores them once—versioned and queryable—across every agent you run, so you stop re-entering the same state.',
    imageAlt: 'Neotoma illustration — packrat holding a record',
    action: 'Evaluate with your agent',
  },
  es: {
    label: 'Prueba Neotoma',
    title: 'Tus agentes olvidan. Neotoma les hace recordar.',
    description:
      'Contactos y datos desaparecen entre sesiones y herramientas. Neotoma los guarda una vez—versionados y consultables—en todos tus agentes, para dejar de repetir el mismo estado.',
    imageAlt: 'Ilustración de Neotoma — packrat con un registro',
    action: 'Evalúa con tu agente',
  },
  ca: {
    label: 'Prova Neotoma',
    title: 'Els teus agents obliden. Neotoma els fa recordar.',
    description:
      "Contactes i fets desapareixen entre sessions i eines. Neotoma els emmagatzema una vegada—versionats i consultables—en tots els agents, per deixar de repetir el mateix estat.",
    imageAlt: "Il·lustració de Neotoma — packrat amb un registre",
    action: 'Avalua amb el teu agent',
  },
} as const

/**
 * Neotoma.io Umami reads UTM params from the landing URL (first page view).
 * @see https://docs.umami.is/docs/utm
 */
const NEOTOMA_CTA_UTM: Record<string, string> = {
  utm_source: 'markmhendrickson.com',
  utm_medium: 'website_cta',
  utm_campaign: 'neotoma_footer_card',
  utm_content: 'try_neotoma',
}

function neotomaMarketingHref(locale: string): string {
  const path = locale === 'en' ? '/' : `/${locale}`
  const url = new URL(path, 'https://neotoma.io')
  for (const [key, value] of Object.entries(NEOTOMA_CTA_UTM)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

function EvaluateCta({ locale, pathname }: { locale: string; pathname: string }) {
  const isEvaluatePage = pathname.replace(/\/$/, '').endsWith('/evaluate')
  if (isEvaluatePage) return null

  const copy = evaluateCtaCopy[locale as keyof typeof evaluateCtaCopy] ?? evaluateCtaCopy.en

  return (
    <div className="mt-16 mb-8 mx-auto max-w-[600px] w-full px-4">
      <a
        href={neotomaMarketingHref(locale)}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg [&:hover]:opacity-95 transition-opacity"
      >
        <Alert className="flex flex-col md:flex-row items-stretch gap-4 cursor-pointer h-full">
          <div className="order-1 md:order-2 shrink-0 w-full aspect-[4/2.5] md:w-[148px] md:h-[148px] md:aspect-auto rounded overflow-hidden flex items-center justify-center bg-muted">
            <img
              src={NEOTOMA_CTA_IMAGE_SRC}
              alt={copy.imageAlt}
              className="min-w-0 min-h-0 w-full h-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="order-2 md:order-1 min-w-0 flex-1 flex flex-col gap-1">
            <AlertTitle className="text-sm font-medium normal-case tracking-wide text-muted-foreground">
              {copy.label}
            </AlertTitle>
            <AlertDescription className="py-px">
              <span className="font-medium text-foreground">
                {copy.title}
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.description}
              </p>
              <span className="mt-2 inline-block text-sm font-medium text-foreground/80">
                {copy.action} →
              </span>
            </AlertDescription>
          </div>
        </Alert>
      </a>
    </div>
  )
}
