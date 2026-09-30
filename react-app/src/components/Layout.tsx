import React, { useEffect, useState } from 'react'
import { useLocation, useParams, type Params } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Layout as SharedLayout } from '@shared/components/Layout'
import { Home, FileText, Share2, Clock, Bot, Briefcase, TrendingUp, CalendarPlus } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { localeToOgLocale, localeToLanguageName, localeToLanguageTag, supportedLocales } from '@/i18n/config'
import { localizePath, saveLocale, stripLocaleFromPath } from '@/i18n/routing'
import { getLocalizedPublicPosts } from '@/lib/postsLocaleData'
import { trackUmamiEvent } from '@/lib/analytics'
import { HeaderActionsProvider } from '@/lib/headerActions'
import { stripSeriesPrefixFromTitle } from '@/lib/utils'
import { resolveSeriesSlug } from '@/lib/resolveSeriesSlug'
import type { ExtraBreadcrumb } from '@shared/components/Layout'

interface Post {
  slug: string
  alternativeSlugs?: string[]
  title: string
  series?: string
  seriesSlug?: string
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
  const [postSeriesInfo, setPostSeriesInfo] = useState<{ name: string; slug: string } | null>(null)
  const [headerActions, setHeaderActions] = useState<React.ReactNode>(null)
  const isHome = location.pathname === localizePath('/', locale)
  const currentSeriesTitle =
    params.seriesSlug
      ? publicPostsData.find((post) => resolveSeriesSlug(post) === params.seriesSlug && post.series?.trim())?.series ?? null
      : null

  // Load post title + series if we're on a post page (resolve primary or alternative slug).
  // In dev, also resolve from private cache so draft post titles show in the breadcrumb.
  useEffect(() => {
    const applyPost = (post: Post | undefined) => {
      if (post) {
        setPostTitle(stripSeriesPrefixFromTitle(post.title, post.series))
        const sSlug = resolveSeriesSlug(post)
        setPostSeriesInfo(sSlug && post.series ? { name: post.series, slug: sSlug } : null)
      } else {
        setPostTitle(null)
        setPostSeriesInfo(null)
      }
    }

    if (params.slug) {
      const publicMap = buildSlugToPostMap(publicPostsData as Post[])
      const post = publicMap.get(params.slug)
      if (post) {
        applyPost(post)
      } else if (import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === 'true') {
        import('@cache/posts.private.json').then((mod: { default: Post[] }) => {
          const privateMap = buildSlugToPostMap(mod.default)
          applyPost(privateMap.get(params.slug!))
        }).catch(() => applyPost(undefined))
      } else {
        applyPost(undefined)
      }
    } else {
      applyPost(undefined)
    }
  }, [params.slug])

  // Custom breadcrumb label function for post titles
  const getBreadcrumbLabel = (pathname: string, params: Params): string | null => {
    if (params.slug && postTitle) {
      return postTitle
    }
    if (params.seriesSlug && currentSeriesTitle) {
      return currentSeriesTitle
    }
    return null
  }

  // Inject series crumb between "Posts" and the post title when the post belongs to a series.
  const extraBreadcrumbs: ExtraBreadcrumb[] = []
  if (postSeriesInfo) {
    extraBreadcrumbs.push({
      afterHref: localizePath('/posts', locale),
      label: postSeriesInfo.name,
      href: localizePath(`/posts/series/${postSeriesInfo.slug}`, locale),
    })
  }

  const routeNames: Record<string, string> = {
    'posts': t.navPosts,
    'series': t.postsSeriesHeading,
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
              hrefLang={localeToLanguageTag[altLocale]}
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
      <HeaderActionsProvider value={setHeaderActions}>
      <SharedLayout
        direction={direction}
        siteName="Mark Hendrickson"
        menuItems={menuItems}
        routeNames={routeNames}
        getBreadcrumbLabel={getBreadcrumbLabel}
        extraBreadcrumbs={extraBreadcrumbs.length > 0 ? extraBreadcrumbs : undefined}
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
        footer={<ProductsFooter locale={locale} pathname={location.pathname} />}
        defaultSidebarOpen={false}
        sidebarCollapsible="icon"
        collapsedHomeLabel="Mark Hendrickson"
        headerRight={headerActions}
      >
        {children}
      </SharedLayout>
      </HeaderActionsProvider>
    </>
  )
}

const productsFooterCopy = {
  en: {
    ariaLabel: 'Neotoma and Ateles',
    neotoma: {
      name: 'Neotoma',
      title: 'The system of record for AI agents.',
      description:
        'One record every agent defers to, whichever vendor built it. Know what was true, when, and on whose evidence.',
      action: 'Evaluate Neotoma',
    },
    ateles: {
      name: 'Ateles',
      title: 'The operating system for agentic organizations.',
      description:
        'Your agent organization, on any model, owned by you. Agents act within the authority you granted; the rest waits for you.',
      action: 'Read the design',
    },
  },
  es: {
    ariaLabel: 'Neotoma y Ateles',
    neotoma: {
      name: 'Neotoma',
      title: 'El sistema de registro para agentes de IA.',
      description:
        'Un único registro al que todo agente se somete, sea cual sea el proveedor que lo creó. Saber qué era verdad, cuándo y con qué pruebas.',
      action: 'Evalúa Neotoma',
    },
    ateles: {
      name: 'Ateles',
      title: 'El sistema operativo para organizaciones agénticas.',
      description:
        'Tu organización de agentes, sobre cualquier modelo y en tu propiedad. Los agentes actúan dentro de la autoridad que les diste; lo demás espera por ti.',
      action: 'Lee el diseño',
    },
  },
  ca: {
    ariaLabel: 'Neotoma i Ateles',
    neotoma: {
      name: 'Neotoma',
      title: "El sistema de registre per a agents d'IA.",
      description:
        'Un únic registre al qual tot agent se sotmet, sigui quin sigui el proveïdor que el va crear. Saber què era cert, quan i amb quines proves.',
      action: 'Avalua Neotoma',
    },
    ateles: {
      name: 'Ateles',
      title: 'El sistema operatiu per a organitzacions agèntiques.',
      description:
        "La teva organització d'agents, sobre qualsevol model i en propietat teva. Els agents actuen dins de l'autoritat que els vas donar; la resta espera per tu.",
      action: 'Llegeix el disseny',
    },
  },
} as const

/**
 * Neotoma.io Umami reads UTM params from the landing URL (first page view).
 * @see https://docs.umami.is/docs/utm
 */
const NEOTOMA_CTA_UTM: Record<string, string> = {
  utm_source: 'markmhendrickson.com',
  utm_medium: 'website_cta',
  utm_campaign: 'products_site_footer',
  utm_content: 'neotoma_system_of_record',
}

/** ateles.co is not live yet, so the Ateles link goes to the public repository. */
const ATELES_HREF = 'https://github.com/markmhendrickson/ateles'

function neotomaMarketingHref(locale: string): string {
  const path = locale === 'en' ? '/evaluate' : `/${locale}/evaluate`
  const url = new URL(path, 'https://neotoma.io')
  for (const [key, value] of Object.entries(NEOTOMA_CTA_UTM)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

interface ProductCardProps {
  name: string
  title: string
  description: string
  action: string
  href: string
  onClick: () => void
}

function ProductCard({ name, title, description, action, href, onClick }: ProductCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-zinc-800 p-6 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{name}</p>
      <p className="text-lg font-medium leading-snug text-white md:text-xl">{title}</p>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
      <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-medium text-zinc-50">
        {action}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  )
}

function ProductsFooter({ locale, pathname }: { locale: string; pathname: string }) {
  const isEvaluatePage = pathname.replace(/\/$/, '').endsWith('/evaluate')
  if (isEvaluatePage) return null

  const copy = productsFooterCopy[locale as keyof typeof productsFooterCopy] ?? productsFooterCopy.en
  const path = pathname.replace(/\/$/, '') || '/'

  return (
    <footer
      className="w-full shrink-0 border-t border-zinc-800 bg-zinc-950"
      style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
      aria-label={copy.ariaLabel}
    >
      <div className="mx-auto grid w-full max-w-[56rem] grid-cols-1 gap-4 px-6 py-12 md:grid-cols-2 md:py-16">
        <ProductCard
          {...copy.neotoma}
          href={neotomaMarketingHref(locale)}
          onClick={() =>
            trackUmamiEvent('neotoma_cta_click', { campaign: 'products_site_footer', locale, path })
          }
        />
        <ProductCard
          {...copy.ateles}
          href={ATELES_HREF}
          onClick={() =>
            trackUmamiEvent('ateles_cta_click', { campaign: 'products_site_footer', locale, path })
          }
        />
      </div>
    </footer>
  )
}
