import React, { useEffect, useState } from 'react'
import { useLocation, useParams, type Params } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Layout as SharedLayout } from '@shared/components/Layout'
import { Home, FileText, Share2, Clock, Bot, Briefcase, TrendingUp, CalendarPlus } from 'lucide-react'
import { ArrowRight, FileCheck2, Network, type LucideIcon } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { localeToOgLocale, localeToLanguageName, localeToLanguageTag, supportedLocales } from '@/i18n/config'
import { localizePath, saveLocale, stripLocaleFromPath } from '@/i18n/routing'
import { getLocalizedPublicPosts } from '@/lib/postsLocaleData'
import { findUnlistedPost } from '@/lib/unlistedPosts'
import { trackUmamiEvent } from '@/lib/analytics'
import { HeaderActionsProvider } from '@/lib/headerActions'
import { usePostSSR } from '@/contexts/PostSSRContext'
import { MarkdownLinkAction } from '@/components/MarkdownLinkAction'
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
  const ssrPost = usePostSSR()
  const publicPostsData = getLocalizedPublicPosts(locale) as Post[]
  const [postTitle, setPostTitle] = useState<string | null>(null)
  const [postSeriesInfo, setPostSeriesInfo] = useState<{ name: string; slug: string } | null>(null)
  // Keep the public post action in the initial HTML. Post registers the same action
  // after hydration and owns updates during client-side navigation.
  const [headerActions, setHeaderActions] = useState<React.ReactNode>(() =>
    ssrPost?.slug && !ssrPost.unlisted ? (
      <MarkdownLinkAction href={localizePath(`/posts/${ssrPost.slug}.md`, locale)} label={t.pageRawMarkdown} />
    ) : null,
  )
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
          const privatePost = privateMap.get(params.slug!)
          if (privatePost) return applyPost(privatePost)
          return findUnlistedPost(params.slug).then((unlisted) => applyPost(unlisted as unknown as Post | undefined))
        }).catch(() => applyPost(undefined))
      } else {
        // Unlisted review page (not in any list): title only, from the lazily loaded unlisted cache.
        findUnlistedPost(params.slug)
          .then((unlisted) => applyPost(unlisted as unknown as Post | undefined))
          .catch(() => applyPost(undefined))
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

  const defaultTitle = 'Mark Hendrickson — Building the system of record for AI agents'
  const defaultDescription = t.defaultHomeDescription
  const defaultUrl = `https://markmhendrickson.com${localizePath('/', locale)}`
  const defaultImage = 'https://markmhendrickson.com/images/og-default-1200x630.jpg'
  const ogImageWidth = 1200
  const ogImageHeight = 630

  return (
    <>
      <Helmet>
        <html lang={languageTag} dir={direction} />
      </Helmet>
      {!hasPageHelmet && (
        <Helmet>
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
                  'systems of record for AI agents',
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
        sidebarExpandLabel={t.sidebarExpandLabel}
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
        'One place where a fact is settled. Agents read what was stored, from which source, and what is current now.',
      action: 'Evaluate Neotoma',
    },
    ateles: {
      name: 'Ateles',
      title: 'Building the operating system for agentic organizations.',
      description:
        'An open-source project in development for organizing agents, tasks, and plans across supported tools.',
      action: 'Read the design',
    },
  },
  es: {
    ariaLabel: 'Neotoma y Ateles',
    neotoma: {
      name: 'Neotoma',
      title: 'El sistema de registro para agentes de IA.',
      description:
        'Un único lugar donde se establece un hecho. Los agentes leen lo que se guardó, de qué fuente y qué es vigente ahora.',
      action: 'Evalúa Neotoma',
    },
    ateles: {
      name: 'Ateles',
      title: 'Construyendo el sistema operativo para organizaciones de agentes.',
      description:
        'Un proyecto de código abierto en desarrollo para organizar agentes, tareas y planes con las herramientas compatibles.',
      action: 'Lee el diseño',
    },
  },
  ca: {
    ariaLabel: 'Neotoma i Ateles',
    neotoma: {
      name: 'Neotoma',
      title: "El sistema de registre per a agents d'IA.",
      description:
        "Un únic lloc on s'estableix un fet. Els agents llegeixen el que es va desar, de quina font i què és vigent ara.",
      action: 'Avalua Neotoma',
    },
    ateles: {
      name: 'Ateles',
      title: "Construint el sistema operatiu per a organitzacions d'agents.",
      description:
        'Un projecte de codi obert en desenvolupament per organitzar agents, tasques i plans amb les eines compatibles.',
      action: 'Llegeix el disseny',
    },
  },
  zh: {
    ariaLabel: 'Neotoma 和 Ateles',
    neotoma: { name: 'Neotoma', title: '面向 AI 智能体的记录系统。', description: '一份供智能体共同参照的记录，不受其供应商限制。查看记录的内容、时间和依据。', action: '了解 Neotoma' },
    ateles: { name: 'Ateles', title: '正在构建面向智能体组织的操作系统。', description: '一个开发中的开源项目，用于通过受支持的工具组织智能体、任务和计划。', action: '阅读设计' },
  },
  hi: {
    ariaLabel: 'Neotoma और Ateles',
    neotoma: { name: 'Neotoma', title: 'AI एजेंटों के लिए साझा रिकॉर्ड प्रणाली।', description: 'एक रिकॉर्ड जिसे अलग-अलग प्रदाताओं के एजेंट संदर्भ मान सकें। देखें क्या दर्ज हुआ, कब हुआ और किस साक्ष्य के आधार पर।', action: 'Neotoma देखें' },
    ateles: { name: 'Ateles', title: 'एजेंट संगठनों के लिए ऑपरेटिंग सिस्टम का निर्माण जारी है।', description: 'समर्थित टूल के साथ एजेंटों, कार्यों और योजनाओं को व्यवस्थित करने के लिए विकासाधीन ओपन-सोर्स परियोजना।', action: 'डिज़ाइन पढ़ें' },
  },
  ar: {
    ariaLabel: 'Neotoma وAteles',
    neotoma: { name: 'Neotoma', title: 'نظام السجل المرجعي لوكلاء الذكاء الاصطناعي.', description: 'سجل مشترك يرجع إليه الوكلاء بغض النظر عن مزوّدهم. اطّلع على ما سُجّل، ومتى، وعلى أي دليل استند.', action: 'تعرّف على Neotoma' },
    ateles: { name: 'Ateles', title: 'نبني نظام تشغيل للمؤسسات التي تعمل بالوكلاء.', description: 'مشروع مفتوح المصدر قيد التطوير لتنظيم الوكلاء والمهام والخطط عبر الأدوات المدعومة.', action: 'اقرأ التصميم' },
  },
  fr: {
    ariaLabel: 'Neotoma et Ateles',
    neotoma: { name: 'Neotoma', title: "Le système de référence pour les agents d’IA.", description: 'Un registre commun auquel les agents peuvent se référer, quel que soit leur fournisseur. Retrouvez les données enregistrées, leur date et leurs preuves.', action: 'Découvrir Neotoma' },
    ateles: { name: 'Ateles', title: "Un système d’exploitation pour les organisations d’agents, en construction.", description: 'Un projet open source en cours de développement pour organiser agents, tâches et plans avec les outils pris en charge.', action: 'Lire la conception' },
  },
  pt: {
    ariaLabel: 'Neotoma e Ateles',
    neotoma: { name: 'Neotoma', title: 'O sistema de registro para agentes de IA.', description: 'Um registro comum que agentes de diferentes fornecedores podem consultar. Veja o que foi registrado, quando e com base em quais evidências.', action: 'Conheça Neotoma' },
    ateles: { name: 'Ateles', title: 'Construindo o sistema operacional para organizações de agentes.', description: 'Um projeto de código aberto em desenvolvimento para organizar agentes, tarefas e planos com as ferramentas compatíveis.', action: 'Leia o projeto' },
  },
  ru: {
    ariaLabel: 'Neotoma и Ateles',
    neotoma: { name: 'Neotoma', title: 'Единая система записей для ИИ-агентов.', description: 'Общая запись, к которой могут обращаться агенты разных поставщиков. Видно, что и когда было записано и на каких данных основано.', action: 'Узнать о Neotoma' },
    ateles: { name: 'Ateles', title: 'Создаём операционную систему для организаций с агентами.', description: 'Открытый проект в разработке для организации агентов, задач и планов с помощью поддерживаемых инструментов.', action: 'Читать концепцию' },
  },
  bn: {
    ariaLabel: 'Neotoma ও Ateles',
    neotoma: { name: 'Neotoma', title: 'এআই এজেন্টদের জন্য অভিন্ন রেকর্ড ব্যবস্থা।', description: 'ভিন্ন সরবরাহকারীর এজেন্টরা একই রেকর্ড ব্যবহার করতে পারে। কী, কখন এবং কোন প্রমাণের ভিত্তিতে সংরক্ষিত হয়েছে তা দেখুন।', action: 'Neotoma সম্পর্কে জানুন' },
    ateles: { name: 'Ateles', title: 'এজেন্টভিত্তিক সংগঠনের অপারেটিং সিস্টেম তৈরি হচ্ছে।', description: 'সমর্থিত টুল দিয়ে এজেন্ট, কাজ ও পরিকল্পনা সংগঠিত করার জন্য উন্নয়নাধীন ওপেন-সোর্স প্রকল্প।', action: 'নকশা পড়ুন' },
  },
  ur: {
    ariaLabel: 'Neotoma اور Ateles',
    neotoma: { name: 'Neotoma', title: 'اے آئی ایجنٹس کے لیے مشترکہ ریکارڈ نظام۔', description: 'ایک ریکارڈ جسے مختلف فراہم کنندگان کے ایجنٹس دیکھ سکتے ہیں۔ جانیں کیا اور کب درج ہوا اور اس کی بنیاد کیا تھی۔', action: 'Neotoma جانیں' },
    ateles: { name: 'Ateles', title: 'ایجنٹ تنظیموں کے لیے آپریٹنگ سسٹم زیرِ تعمیر ہے۔', description: 'معاونت یافتہ ٹولز کے ساتھ ایجنٹس، کاموں اور منصوبوں کو منظم کرنے کے لیے زیرِ ترقی اوپن سورس منصوبہ۔', action: 'ڈیزائن پڑھیں' },
  },
  id: {
    ariaLabel: 'Neotoma dan Ateles',
    neotoma: { name: 'Neotoma', title: 'Sistem catatan acuan bagi agen AI.', description: 'Satu catatan bersama yang dapat dirujuk agen dari berbagai penyedia. Lihat apa yang dicatat, kapan, dan berdasarkan bukti apa.', action: 'Jelajahi Neotoma' },
    ateles: { name: 'Ateles', title: 'Membangun sistem operasi bagi organisasi agen.', description: 'Proyek sumber terbuka yang sedang dikembangkan untuk menata agen, tugas, dan rencana melalui alat yang didukung.', action: 'Baca rancangannya' },
  },
  de: {
    ariaLabel: 'Neotoma und Ateles',
    neotoma: { name: 'Neotoma', title: 'Das maßgebliche Datensystem für KI-Agenten.', description: 'Ein gemeinsamer Datenbestand für Agenten verschiedener Anbieter. Er zeigt, was wann erfasst wurde und auf welchen Belegen es beruht.', action: 'Neotoma ansehen' },
    ateles: { name: 'Ateles', title: 'Ein Betriebssystem für agentengestützte Organisationen im Aufbau.', description: 'Ein quelloffenes Projekt in Entwicklung, das Agenten, Aufgaben und Pläne mit unterstützten Tools organisiert.', action: 'Konzept lesen' },
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

function ProductCard({ name, title, description, action, href, onClick, icon: Icon }: ProductCardProps & { icon: LucideIcon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-zinc-800 p-6 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
    >
      <div className="flex items-center gap-2.5 text-zinc-500">
        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-[11px] font-semibold uppercase tracking-widest">{name}</p>
      </div>
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
          icon={FileCheck2}
          href={neotomaMarketingHref(locale)}
          onClick={() =>
            trackUmamiEvent('neotoma_cta_click', { campaign: 'products_site_footer', locale, path })
          }
        />
        <ProductCard
          {...copy.ateles}
          icon={Network}
          href={ATELES_HREF}
          onClick={() =>
            trackUmamiEvent('ateles_cta_click', { campaign: 'products_site_footer', locale, path })
          }
        />
      </div>
    </footer>
  )
}
