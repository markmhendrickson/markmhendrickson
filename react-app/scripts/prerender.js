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

const STATIC_ROUTES = [
  '/',
  '/timeline',
  '/newsletter',
  '/newsletter/confirm',
  '/posts',
  '/social',
  '/songs',
]

function getPostSlugs() {
  const postsPath = path.resolve(__dirname, '..', 'src', 'content', 'posts', 'posts.json')
  if (!fs.existsSync(postsPath)) return []
  const raw = fs.readFileSync(postsPath, 'utf-8')
  const posts = JSON.parse(raw)
  return (Array.isArray(posts) ? posts : [])
    .filter((p) => p.published !== false && p.slug)
    .map((p) => `/posts/${p.slug}`)
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
      const appHtml = render(url)
      const html = template.replace(SSR_PLACEHOLDER, appHtml)
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
    const notFoundHtml = render('/_no_match_')
    const notFoundFull = template.replace(SSR_PLACEHOLDER, notFoundHtml)
    fs.writeFileSync(path.join(distPath, '404.html'), notFoundFull, 'utf-8')
    console.log('prerender: 404.html (NotFound)')
  } catch (err) {
    console.error('prerender 404 failed', err)
    throw err
  }

  console.log('prerender: done,', allRoutes.length, 'routes')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
