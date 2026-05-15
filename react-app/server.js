import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT || 5173
const SSR_PLACEHOLDER = '<!--ssr-outlet-->'
const HELMET_PLACEHOLDER = '<!--helmet-outlet-->'

function helmetHeadString(helmetContext) {
  const helmet = helmetContext?.helmet
  if (!helmet) return ''
  const parts = [
    helmet.title?.toString?.(),
    helmet.priority?.toString?.(),
    helmet.meta?.toString?.(),
    helmet.link?.toString?.(),
    helmet.script?.toString?.(),
  ].filter(Boolean)
  return parts.join('')
}

const SITE_BASE = 'https://markmhendrickson.com'

/** GitHub Pages serves `dist/path/index.html` at `/path/`; bare `/path` 301s. Sitemap/RSS use trailing-slash URLs for HTML routes; file URLs (e.g. *.xml, *.txt) stay extension-only. */
function sitemapCanonicalLoc(pathname) {
  const p = pathname === '' || pathname === '/' ? '/' : pathname.startsWith('/') ? pathname : `/${pathname}`
  if (/\/[^/]+\.[a-z0-9]+$/i.test(p)) {
    return `${SITE_BASE}${p}`
  }
  if (p === '/') return `${SITE_BASE}/`
  return `${SITE_BASE}${p.replace(/\/$/, '')}/`
}
const AVAILABLE_LOCALES = ['en', 'es', 'ca', 'zh', 'hi', 'ar', 'fr', 'pt', 'ru', 'bn', 'ur', 'id', 'de']
const AVAILABLE_LOCALE_SET = new Set(AVAILABLE_LOCALES)

function parseConfiguredLocales(raw) {
  if (!raw || !String(raw).trim()) return [...AVAILABLE_LOCALES]
  const parsed = String(raw)
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((locale) => AVAILABLE_LOCALE_SET.has(locale))
  return parsed.length ? [...new Set(parsed)] : [...AVAILABLE_LOCALES]
}

const SUPPORTED_LOCALES = parseConfiguredLocales(
  process.env.WEBSITE_LOCALES || process.env.VITE_WEBSITE_LOCALES
)

function resolveDefaultLocale(locales) {
  const configured = (process.env.WEBSITE_DEFAULT_LOCALE || process.env.VITE_WEBSITE_DEFAULT_LOCALE || '')
    .trim()
    .toLowerCase()
  if (configured && locales.includes(configured)) return configured
  if (locales.includes('en')) return 'en'
  return locales[0] || 'en'
}

const DEFAULT_LOCALE = resolveDefaultLocale(SUPPORTED_LOCALES)
const PREFIXED_LOCALES = SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE)
const CORE_STATIC_ROUTE_SUFFIXES = [
  '/',
  '/timeline',
  '/newsletter',
  '/newsletter/confirm',
  '/posts',
  '/posts/series',
  '/links',
  '/songs',
  '/meet',
  '/agent',
  '/consulting',
  '/investing',
  '/neotoma',
  '/wisdom',
  '/honors-thesis',
  '/about',
  '/schedule',
]

function loadHonorsThesisRouteSuffixes() {
  const p = path.resolve(__dirname, 'cache', 'honors-thesis-paths.json')
  if (!fs.existsSync(p)) {
    console.warn(
      'honors-thesis-paths.json missing; run npx tsx scripts/gen-honors-thesis-paths.ts (included in prebuild)',
    )
    return []
  }
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string' && x.startsWith('/')) : []
  } catch (e) {
    console.warn('honors-thesis-paths.json invalid:', e?.message || e)
    return []
  }
}

const STATIC_ROUTE_SUFFIXES = [...CORE_STATIC_ROUTE_SUFFIXES, ...loadHonorsThesisRouteSuffixes()]
const LEGACY_STATIC_ROUTES = STATIC_ROUTE_SUFFIXES
/** Root-level paths that must not be redirected to /posts/:slug */
const RESERVED_ROOT_PATHS = new Set([
  'posts',
  'timeline',
  'newsletter',
  'links',
  'meet',
  'schedule',
  'songs',
  'agent',
  'consulting',
  'investing',
  'neotoma',
  'wisdom',
  'honors-thesis',
  'raw',
  'about',
])
const LOCALIZED_STATIC_ROUTES = PREFIXED_LOCALES.flatMap((locale) =>
  STATIC_ROUTE_SUFFIXES.map((suffix) => (suffix === '/' ? `/${locale}` : `/${locale}${suffix}`))
)
const STATIC_ROUTES = [...new Set([...LEGACY_STATIC_ROUTES, ...LOCALIZED_STATIC_ROUTES])]

const localeToLanguageTag = {
  en: 'en-US',
  es: 'es-ES',
  ca: 'ca-ES',
  zh: 'zh-CN',
  hi: 'hi-IN',
  ar: 'ar',
  fr: 'fr-FR',
  pt: 'pt-PT',
  ru: 'ru-RU',
  bn: 'bn-BD',
  ur: 'ur-PK',
  id: 'id-ID',
  de: 'de-DE',
}

function isSupportedLocale(locale) {
  return SUPPORTED_LOCALES.includes(locale)
}

function getPosts(locale = DEFAULT_LOCALE) {
  const localePath = path.resolve(__dirname, 'cache', `posts.${locale}.json`)
  const fallbackPath = path.resolve(__dirname, 'cache', 'posts.json')
  const postsPath = fs.existsSync(localePath) ? localePath : fallbackPath
  if (!fs.existsSync(postsPath)) return []
  const raw = fs.readFileSync(postsPath, 'utf-8')
  const posts = JSON.parse(raw)
  return Array.isArray(posts) ? posts : []
}

function buildSlugToCanonical(posts) {
  const map = new Map()
  for (const p of posts) {
    if (p.slug) map.set(p.slug, p.slug)
    for (const alt of p.alternativeSlugs ?? []) {
      if (alt) map.set(alt, p.slug)
    }
  }
  return map
}

/** Mirrors `resolveSeriesSlug` in src/lib/resolveSeriesSlug.ts */
function resolveSeriesSlugFromPost(p) {
  const explicit = String(p.seriesSlug || '').trim()
  if (explicit) return explicit
  const slug = String(p.slug || '').trim()
  if (!slug) return null
  const m = slug.match(/^(.*)-part-\d+$/i)
  return m ? m[1] : null
}

/** Localized `/posts/series/:seriesSlug` for every published multi-part series (for prerender + verify-ssr). */
function getSeriesDetailRoutes() {
  const routes = new Set()
  for (const locale of SUPPORTED_LOCALES) {
    const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
    for (const p of getPosts(locale)) {
      if (p.published === false) continue
      if (!String(p.series || '').trim()) continue
      const s = resolveSeriesSlugFromPost(p)
      if (s) routes.add(`${localePrefix}/posts/series/${s}`)
    }
  }
  return [...routes]
}

function getSeriesSitemapEntries() {
  const byPath = new Map()
  for (const locale of SUPPORTED_LOCALES) {
    const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
    for (const p of getPosts(locale)) {
      if (p.published === false) continue
      if (!String(p.series || '').trim()) continue
      const s = resolveSeriesSlugFromPost(p)
      if (!s) continue
      const pathName = `${localePrefix}/posts/series/${s}`
      const lastmod = p.updatedDate || p.publishedDate || null
      const prev = byPath.get(pathName)
      if (!prev || (lastmod && (!prev.lastmod || String(lastmod) > String(prev.lastmod)))) {
        byPath.set(pathName, { pathName, lastmod })
      }
    }
  }
  return [...byPath.values()]
}

/** All post URLs to prerender: canonical slug plus every alternativeSlug so crawlers (X, etc.) get correct meta for any shared URL. */
function getPostSlugs() {
  const routes = new Set()
  for (const locale of SUPPORTED_LOCALES) {
    const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
    for (const p of getPosts(locale)) {
      if (p.published === false || !p.slug) continue
      routes.add(`${localePrefix}/posts/${p.slug}`)
      for (const alt of p.alternativeSlugs ?? []) {
        if (alt) routes.add(`${localePrefix}/posts/${alt}`)
      }
    }
  }
  return [...routes]
}

function getPostEntries() {
  const seen = new Set()
  const entries = []
  for (const locale of SUPPORTED_LOCALES) {
    const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
    for (const p of getPosts(locale)) {
      if (p.published === false || !p.slug) continue
      const lastmod = p.updatedDate || p.publishedDate || null
      const variants = [p.slug, ...(p.alternativeSlugs ?? [])]
      for (const variant of variants) {
        if (!variant) continue
        const pathName = `${localePrefix}/posts/${variant}`
        if (seen.has(pathName)) continue
        seen.add(pathName)
        entries.push({ pathName, lastmod })
      }
    }
  }
  return entries
}

function buildSitemapXml(staticRoutes, postEntries) {
  const urlEntries = [
    ...staticRoutes.map((route) => ({ loc: sitemapCanonicalLoc(route) })),
    ...postEntries.map((entry) => ({
      loc: sitemapCanonicalLoc(entry.pathName),
      lastmod: entry.lastmod || undefined,
    })),
  ]
  const urls = urlEntries
    .map(({ loc, lastmod }) => {
      if (lastmod) {
        return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`
      }
      return `  <url><loc>${loc}</loc></url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

function escapeXml(str) {
  if (str == null || typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822Date(isoDate) {
  if (!isoDate) return ''
  try {
    return new Date(isoDate).toUTCString()
  } catch {
    return ''
  }
}

const RSS_FEED_TITLE = 'Mark Hendrickson'
const RSS_FEED_DESCRIPTION =
  'Essays on user-owned agent memory, personal infrastructure, and building systems that restore sovereignty in an age of AI, crypto, and complexity.'

function buildRssXml(posts, locale = 'en') {
  const published = posts
    .filter((p) => p.published !== false && p.slug)
    .sort((a, b) => {
      const da = a.publishedDate || a.updatedDate || ''
      const db = b.publishedDate || b.updatedDate || ''
      return db.localeCompare(da)
    })
  const latestDate = published[0]
    ? toRfc822Date(published[0].updatedDate || published[0].publishedDate)
    : toRfc822Date(new Date().toISOString())
  const items = published
    .map((p) => {
      const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
      const link = `${SITE_BASE}${localePrefix}/posts/${p.slug}/`
      const title = escapeXml(p.title || '')
      const description = escapeXml(p.excerpt || '')
      const pubDate = toRfc822Date(p.publishedDate || p.updatedDate)
      return `  <item>
    <title>${title}</title>
    <link>${escapeXml(link)}</link>
    <description>${description}</description>
    <pubDate>${pubDate}</pubDate>
    <guid isPermaLink="true">${escapeXml(link)}</guid>
  </item>`
    })
    .join('\n')
  const localeBasePath = locale === DEFAULT_LOCALE ? '/' : `/${locale}/`
  const rssPath = locale === DEFAULT_LOCALE ? '/rss.xml' : `/${locale}/rss.xml`
  const languageTag = localeToLanguageTag[locale] || 'en-US'
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(RSS_FEED_TITLE)}</title>
    <link>${SITE_BASE}${localeBasePath}</link>
    <description>${escapeXml(RSS_FEED_DESCRIPTION)}</description>
    <language>${languageTag}</language>
    <lastBuildDate>${latestDate}</lastBuildDate>
    <atom:link href="${SITE_BASE}${rssPath}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`
}

function buildLlmsFullTxt(posts, timelineData) {
  const published = posts
    .filter((p) => p.published !== false && p.slug && !p.excludeFromListing)
    .sort((a, b) => {
      const da = a.publishedDate || a.updatedDate || ''
      const db = b.publishedDate || b.updatedDate || ''
      return db.localeCompare(da)
    })

  const lines = []
  lines.push('# Mark Hendrickson — Full content inventory')
  lines.push('')
  lines.push('> Extended version of llms.txt with complete post inventory, timeline, and page content.')
  lines.push('> See also: https://markmhendrickson.com/llms.txt')
  lines.push('')

  lines.push('## Posts')
  lines.push('')
  for (const p of published) {
    const url = `${SITE_BASE}/posts/${p.slug}/`
    const rawUrl = `${SITE_BASE}/posts/${p.slug}.md`
    lines.push(`### ${p.title || p.slug}`)
    lines.push('')
    lines.push(`- URL: ${url}`)
    lines.push(`- Raw markdown: ${rawUrl}`)
    if (p.publishedDate) lines.push(`- Published: ${p.publishedDate}`)
    if (p.updatedDate) lines.push(`- Updated: ${p.updatedDate}`)
    if (p.category) lines.push(`- Category: ${p.category}`)
    if (p.tags && p.tags.length) lines.push(`- Tags: ${p.tags.join(', ')}`)
    if (p.readTime) lines.push(`- Read time: ${p.readTime} min`)
    if (p.excerpt) lines.push(`- Excerpt: ${p.excerpt}`)
    lines.push('')
  }

  if (timelineData && Array.isArray(timelineData) && timelineData.length > 0) {
    lines.push('## Career timeline')
    lines.push('')
    for (const entry of timelineData) {
      lines.push(`### ${entry.role} — ${entry.company}`)
      lines.push('')
      lines.push(`- Period: ${entry.date}`)
      if (entry.description && entry.description.length > 0) {
        for (const desc of entry.description) {
          lines.push(`- ${desc}`)
        }
      }
      lines.push('')
    }
  }

  lines.push('## JSON API endpoints')
  lines.push('')
  lines.push(`- Posts: ${SITE_BASE}/api/posts.json`)
  lines.push(`- Timeline: ${SITE_BASE}/api/timeline.json`)
  lines.push(`- Links: ${SITE_BASE}/api/links.json`)
  lines.push(`- Pages: ${SITE_BASE}/api/pages.json`)
  lines.push(`- Agent: ${SITE_BASE}/api/agent.json`)
  lines.push(`- Meet: ${SITE_BASE}/api/meet.json`)
  lines.push(`- Consulting: ${SITE_BASE}/api/consulting.json`)
  lines.push(`- Investing: ${SITE_BASE}/api/investing.json`)
  lines.push('')
  lines.push('## MCP server')
  lines.push('')
  lines.push('Repository: https://github.com/markmhendrickson/mcp-server-markmhendrickson')
  lines.push('Agent page: https://markmhendrickson.com/agent')
  lines.push('')

  return lines.join('\n')
}

function readTimelineData() {
  const filePath = path.resolve(__dirname, 'src', 'data', 'timeline.json')
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function readPostBody(slug) {
  const mdPath = path.resolve(__dirname, 'src', 'content', 'posts', `${slug}.md`)
  if (fs.existsSync(mdPath)) return fs.readFileSync(mdPath, 'utf-8')
  // Fallback when markdown was not committed but cache already has body (e.g. export-only workflow).
  for (const p of getPosts(DEFAULT_LOCALE)) {
    if (p.slug === slug && typeof p.body === 'string' && p.body.trim().length > 0) return p.body
  }
  return null
}

function resolveSlugToCanonical(slug, locale = DEFAULT_LOCALE) {
  const posts = getPosts(locale)
  const slugToCanonical = buildSlugToCanonical(posts)
  return slugToCanonical.get(slug) ?? slug
}

/** All slugs that should redirect from root to /posts/:slug (legacy HN-style URLs). */
function getLegacyRootSlugRedirects() {
  const posts = getPosts(DEFAULT_LOCALE)
  const slugToCanonical = buildSlugToCanonical(posts)
  return slugToCanonical
}

function readAgentContent(locale) {
  const base = path.resolve(__dirname, 'cache', 'api')
  const localePath = locale === DEFAULT_LOCALE ? path.join(base, 'agent.json') : path.join(base, `agent.${locale}.json`)
  const fallbackPath = path.join(base, 'agent.json')
  const filePath = fs.existsSync(localePath) ? localePath : fallbackPath
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function readSongsContent() {
  const filePath = path.resolve(__dirname, 'public', 'data', 'songs.json')
  if (!fs.existsSync(filePath)) return null
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

/** Same data prerender injects into entry-server (posts body, agent JSON, songs list). */
function buildSsrRenderOptions(url) {
  const pathname = (url.split('?')[0] || '/').replace(/\/$/, '') || '/'
  const segments = pathname.split('/').filter(Boolean)
  const routeLocale = isSupportedLocale(segments[0]) ? segments[0] : DEFAULT_LOCALE
  const offset = isSupportedLocale(segments[0]) ? 1 : 0
  const isPostRoute = segments[offset] === 'posts'
  const slug = isPostRoute ? segments[offset + 1] : null
  const canonicalSlug = slug ? resolveSlugToCanonical(slug, routeLocale) : null
  const postBody = canonicalSlug ? readPostBody(canonicalSlug) : null
  const isAgentRoute = segments[offset] === 'agent'
  const isSongsRoute = segments[offset] === 'songs'
  const agentContent = isAgentRoute ? readAgentContent(routeLocale) : null
  const songs = isSongsRoute ? readSongsContent() : null
  const options = {}
  if (postBody != null) options.postBody = postBody
  if (agentContent != null) options.agentContent = agentContent
  if (songs != null) options.songs = songs
  return Object.keys(options).length ? options : undefined
}

async function runPrerender() {
  const distPath = path.resolve(__dirname, 'dist')
  const templatePath = path.join(distPath, 'index.html')
  const template = fs.readFileSync(templatePath, 'utf-8')
  if (!template.includes(SSR_PLACEHOLDER)) {
    console.warn('prerender: template has no ssr-outlet placeholder')
    return
  }
  const serverPath = path.join(distPath, 'server', 'entry-server.js')
  if (!fs.existsSync(serverPath)) {
    throw new Error('prerender: SSR bundle not found. Run "npm run build" then "npm run build:ssr" first.')
  }
  const { render } = await import(pathToFileURL(serverPath).href)
  const postRoutes = getPostSlugs()
  const seriesDetailRoutes = getSeriesDetailRoutes()
  const allRoutes = [...new Set([...STATIC_ROUTES, ...seriesDetailRoutes, ...postRoutes])]

  for (const url of allRoutes) {
    const pathname = url.split('?')[0] || '/'
    const helmetContext = {}
    const options = buildSsrRenderOptions(url)
    const appHtml = render(url, helmetContext, options)
    let html = template.replace(SSR_PLACEHOLDER, appHtml)
    if (template.includes(HELMET_PLACEHOLDER)) {
      html = html.replace(HELMET_PLACEHOLDER, helmetHeadString(helmetContext))
    }
    const outPath =
      pathname === '/'
        ? path.join(distPath, 'index.html')
        : path.join(distPath, ...pathname.replace(/^\//, '').split('/').filter(Boolean), 'index.html')
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, html, 'utf-8')
    console.log('prerender:', url, '->', outPath.replace(distPath, 'dist'))
  }
  const notFoundHelmetContext = {}
  const notFoundHtml = render('/_no_match_', notFoundHelmetContext)
  let notFoundFull = template.replace(SSR_PLACEHOLDER, notFoundHtml)
  if (template.includes(HELMET_PLACEHOLDER)) {
    notFoundFull = notFoundFull.replace(HELMET_PLACEHOLDER, helmetHeadString(notFoundHelmetContext))
  }
  fs.writeFileSync(path.join(distPath, '404.html'), notFoundFull, 'utf-8')
  console.log('prerender: 404.html')
  const sitemapRoutes = [...new Set([...LEGACY_STATIC_ROUTES, ...LOCALIZED_STATIC_ROUTES, '/llms.txt', '/llms-full.txt'])]
  const sitemapXml = buildSitemapXml(sitemapRoutes, [...getPostEntries(), ...getSeriesSitemapEntries()])
  fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemapXml, 'utf-8')
  console.log('prerender: sitemap.xml')
  const rssXml = buildRssXml(getPosts(DEFAULT_LOCALE), DEFAULT_LOCALE)
  fs.writeFileSync(path.join(distPath, 'rss.xml'), rssXml, 'utf-8')
  console.log('prerender: rss.xml')
  for (const locale of PREFIXED_LOCALES) {
    const localizedRssXml = buildRssXml(getPosts(locale), locale)
    fs.mkdirSync(path.join(distPath, locale), { recursive: true })
    fs.writeFileSync(path.join(distPath, locale, 'rss.xml'), localizedRssXml, 'utf-8')
    console.log(`prerender: ${locale}/rss.xml`)
  }
  const llmsFullPosts = getPosts(DEFAULT_LOCALE)
  const timelineData = readTimelineData()
  const llmsFullTxt = buildLlmsFullTxt(llmsFullPosts, timelineData)
  fs.writeFileSync(path.join(distPath, 'llms-full.txt'), llmsFullTxt, 'utf-8')
  console.log('prerender: llms-full.txt')
  // Netlify _redirects: root-level /slug -> /posts/canonical for every post (HN and legacy URLs)
  const legacySlugs = getLegacyRootSlugRedirects()
  const redirectLines = []
  for (const [variant, canonical] of legacySlugs) {
    if (RESERVED_ROOT_PATHS.has(variant)) continue
    redirectLines.push(`/${variant}  /posts/${canonical}  301`)
  }
  if (redirectLines.length) {
    fs.writeFileSync(path.join(distPath, '_redirects'), redirectLines.join('\n'), 'utf-8')
    console.log('prerender: _redirects (' + redirectLines.length + ' legacy post redirects)')
  }
  console.log('prerender: done,', allRoutes.length, 'routes')
}

async function createServer() {
  const app = express()

  // Serve /api/* from cache (generated by generate_website_cache.py)
  const cacheApiPath = path.resolve(__dirname, 'cache', 'api')
  if (fs.existsSync(cacheApiPath)) {
    app.use('/api', express.static(cacheApiPath))
  }

  // Redirects for HN and legacy URL patterns (legacy root-level posts, trailing slash)
  app.use((req, res, next) => {
    const pathname = (req.path || '/').replace(/\/$/, '') || '/'
    const segments = pathname.split('/').filter(Boolean)
    const legacySlugs = getLegacyRootSlugRedirects()

    // Root-level single segment: legacy /slug -> /posts/canonical (skip reserved paths)
    if (segments.length === 1 && !RESERVED_ROOT_PATHS.has(segments[0])) {
      const canonical = legacySlugs.get(segments[0])
      if (canonical) {
        return res.redirect(301, `/posts/${canonical}${req.url.slice(req.path.length) || ''}`)
      }
    }

    // /posts/slug/ -> /posts/slug (canonical no trailing slash)
    if (segments.length === 2 && segments[0] === 'posts' && req.path.endsWith('/') && req.path !== '/posts/') {
      return res.redirect(301, `/posts/${segments[1]}${req.url.slice(req.path.length) || ''}`)
    }

    next()
  })

  if (isProd) {
    // Production: serve static assets from dist, run SSR from built server bundle
    const distPath = path.resolve(__dirname, 'dist')
    app.use(express.static(distPath, { index: false }))

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl
      try {
        const templatePath = path.join(distPath, 'index.html')
        let template = fs.readFileSync(templatePath, 'utf-8')
        const serverPath = path.join(distPath, 'server', 'entry-server.js')
        const { render } = await import(pathToFileURL(serverPath).href)
        const helmetContext = {}
        const options = buildSsrRenderOptions(url)
        const appHtml = render(url, helmetContext, options)
        let html = template.replace(SSR_PLACEHOLDER, appHtml)
        if (template.includes(HELMET_PLACEHOLDER)) {
          html = html.replace(HELMET_PLACEHOLDER, helmetHeadString(helmetContext))
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
      } catch (e) {
        next(e)
      }
    })
  } else {
    // Development: Vite dev server with SSR (middleware mode)
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    })
    app.use(vite.middlewares)

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        const { render } = await vite.ssrLoadModule('/src/entry-server.tsx')
        const helmetContext = {}
        const options = buildSsrRenderOptions(url)
        const appHtml = render(url, helmetContext, options)
        let html = template.replace(SSR_PLACEHOLDER, appHtml)
        if (template.includes(HELMET_PLACEHOLDER)) {
          html = html.replace(HELMET_PLACEHOLDER, helmetHeadString(helmetContext))
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
      } catch (e) {
        vite.ssrFixStacktrace(e)
        next(e)
      }
    })
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
  })
}

// Write route list to a file (stdout capture via child_process truncates around 8K in some Node versions).
const listPostRoutesOutIdx = process.argv.indexOf('--list-post-routes-out')
if (listPostRoutesOutIdx >= 0) {
  const outFile = process.argv[listPostRoutesOutIdx + 1]
  if (!outFile) {
    console.error('usage: node server.js --list-post-routes-out <path.json>')
    process.exit(1)
  }
  fs.writeFileSync(outFile, JSON.stringify([...getSeriesDetailRoutes(), ...getPostSlugs()]), 'utf-8')
  process.exit(0)
}

if (process.argv.includes('--prerender')) {
  runPrerender().catch((e) => {
    console.error(e)
    process.exit(1)
  })
} else {
  createServer().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
