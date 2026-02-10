/**
 * Pre-render all routes to static HTML at build time.
 * Used for GitHub Pages (static hosting): no Node server runs, so we must
 * generate HTML for each route and write to dist/<path>/index.html.
 *
 * Run after: npm run build && npm run build:ssr
 * (so dist/ has client assets and dist/server/ has the SSR bundle.)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '..', 'dist')
const templatePath = path.join(distPath, 'index.html')
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

const STATIC_ROUTES = [
  '/',
  '/timeline',
  '/newsletter',
  '/newsletter/confirm',
  '/posts',
  '/links',
  '/songs',
]

function getPostSlugs() {
  const postsPath = path.resolve(__dirname, '..', 'src', 'content', 'posts', 'posts.json')
  if (!fs.existsSync(postsPath)) return []
  const raw = fs.readFileSync(postsPath, 'utf-8')
  const posts = JSON.parse(raw)
  const routes = []
  
  for (const p of (Array.isArray(posts) ? posts : [])) {
    if (p.published === false || !p.slug) continue
    
    // Add canonical slug
    routes.push(`/posts/${p.slug}`)
    
    // Add alternative slugs (for Twitter card previews and SEO)
    if (Array.isArray(p.alternativeSlugs)) {
      for (const altSlug of p.alternativeSlugs) {
        if (altSlug) routes.push(`/posts/${altSlug}`)
      }
    }
  }
  
  return routes
}

function urlToFilePath(url) {
  const pathname = url.split('?')[0] || '/'
  if (pathname === '/') return path.join(distPath, 'index.html')
  const segments = pathname.replace(/^\//, '').split('/').filter(Boolean)
  return path.join(distPath, ...segments, 'index.html')
}

async function main() {
  const template = fs.readFileSync(templatePath, 'utf-8')
  if (!template.includes(SSR_PLACEHOLDER)) {
    console.warn('prerender: template has no ssr-outlet placeholder')
    return
  }

  const serverPath = path.join(distPath, 'server', 'entry-server.js')
  if (!fs.existsSync(serverPath)) {
    throw new Error(
      'prerender: SSR bundle not found. Run "npm run build" then "npm run build:ssr" first.'
    )
  }

  const { render } = await import(pathToFileURL(serverPath).href)
  const postRoutes = getPostSlugs()
  const allRoutes = [...STATIC_ROUTES, ...postRoutes]

  for (const url of allRoutes) {
    try {
      const helmetContext = {}
      const appHtml = render(url, helmetContext)
      let html = template.replace(SSR_PLACEHOLDER, appHtml)
      if (template.includes(HELMET_PLACEHOLDER)) {
        html = html.replace(HELMET_PLACEHOLDER, helmetHeadString(helmetContext))
      }
      const outPath = urlToFilePath(url)
      fs.mkdirSync(path.dirname(outPath), { recursive: true })
      fs.writeFileSync(outPath, html, 'utf-8')
      console.log('prerender:', url, '->', outPath.replace(distPath, 'dist'))
    } catch (err) {
      console.error('prerender failed for', url, err)
      throw err
    }
  }

  // Pre-render NotFound for GitHub Pages 404 fallback (unknown paths)
  try {
    const notFoundHelmetContext = {}
    const notFoundHtml = render('/_no_match_', notFoundHelmetContext)
    let notFoundFull = template.replace(SSR_PLACEHOLDER, notFoundHtml)
    if (template.includes(HELMET_PLACEHOLDER)) {
      notFoundFull = notFoundFull.replace(HELMET_PLACEHOLDER, helmetHeadString(notFoundHelmetContext))
    }
    fs.writeFileSync(path.join(distPath, '404.html'), notFoundFull, 'utf-8')
    console.log('prerender: 404.html (NotFound)')
  } catch (err) {
    console.error('prerender 404 failed', err)
    throw err
  }

  // GitHub Pages redirect: /about -> / (no server-side redirects on static hosting)
  const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/">
  <link rel="canonical" href="/">
  <title>Redirecting...</title>
</head>
<body>
  <script>window.location.replace("/");</script>
  <p>Redirecting to <a href="/">home</a>...</p>
</body>
</html>`
  fs.mkdirSync(path.join(distPath, 'about'), { recursive: true })
  fs.writeFileSync(path.join(distPath, 'about', 'index.html'), redirectHtml, 'utf-8')
  console.log('prerender: about -> / (redirect)')

  console.log('prerender: done,', allRoutes.length, 'routes')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
