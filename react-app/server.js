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
const STATIC_ROUTES = ['/', '/timeline', '/newsletter', '/newsletter/confirm', '/posts', '/social', '/songs']

function getPosts() {
  const postsPath = path.resolve(__dirname, 'src', 'content', 'posts', 'posts.json')
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

/** All post URLs to prerender: canonical slug plus every alternativeSlug so crawlers (X, etc.) get correct meta for any shared URL. */
function getPostSlugs() {
  const posts = getPosts()
  const routes = new Set()
  for (const p of posts) {
    if (p.published === false || !p.slug) continue
    routes.add(`/posts/${p.slug}`)
    for (const alt of p.alternativeSlugs ?? []) {
      if (alt) routes.add(`/posts/${alt}`)
    }
  }
  return [...routes]
}

function getPostEntries() {
  const postsPath = path.resolve(__dirname, 'src', 'content', 'posts', 'posts.json')
  if (!fs.existsSync(postsPath)) return []
  const raw = fs.readFileSync(postsPath, 'utf-8')
  const parsed = JSON.parse(raw)
  const posts = Array.isArray(parsed) ? parsed : []
  const seen = new Set()
  return posts
    .filter((p) => p.published !== false && p.slug)
    .map((p) => {
      const pathName = `/posts/${p.slug}`
      const lastmod = p.updatedDate || p.publishedDate || null
      return { pathName, lastmod }
    })
    .filter((entry) => {
      if (seen.has(entry.pathName)) return false
      seen.add(entry.pathName)
      return true
    })
}

function buildSitemapXml(staticRoutes, postEntries) {
  const urlEntries = [
    ...staticRoutes.map((route) => ({ loc: `${SITE_BASE}${route}` })),
    ...postEntries.map((entry) => ({
      loc: `${SITE_BASE}${entry.pathName}`,
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

function readPostBody(slug) {
  const mdPath = path.resolve(__dirname, 'src', 'content', 'posts', `${slug}.md`)
  if (!fs.existsSync(mdPath)) return null
  return fs.readFileSync(mdPath, 'utf-8')
}

function resolveSlugToCanonical(slug) {
  const posts = getPosts()
  const slugToCanonical = buildSlugToCanonical(posts)
  return slugToCanonical.get(slug) ?? slug
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
  const allRoutes = [...STATIC_ROUTES, ...postRoutes]
  for (const url of allRoutes) {
    const helmetContext = {}
    const pathname = url.split('?')[0] || '/'
    const postMatch = pathname.match(/^\/posts\/([^/]+)$/)
    const canonicalSlug = postMatch ? resolveSlugToCanonical(postMatch[1]) : null
    const postBody = canonicalSlug ? readPostBody(canonicalSlug) : null
    const appHtml = render(url, helmetContext, postBody != null ? { postBody } : undefined)
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
  const sitemapXml = buildSitemapXml(STATIC_ROUTES, getPostEntries())
  fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemapXml, 'utf-8')
  console.log('prerender: sitemap.xml')
  console.log('prerender: done,', allRoutes.length, 'routes')
}

async function createServer() {
  const app = express()

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
        const appHtml = render(url, helmetContext)
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
        const appHtml = render(url, helmetContext)
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
