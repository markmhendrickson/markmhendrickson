import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT || 5173
const SSR_PLACEHOLDER = '<!--ssr-outlet-->'

const STATIC_ROUTES = ['/', '/timeline', '/newsletter', '/newsletter/confirm', '/posts', '/social', '/songs']

function getPostSlugs() {
  const postsPath = path.resolve(__dirname, 'src', 'content', 'posts', 'posts.json')
  if (!fs.existsSync(postsPath)) return []
  const raw = fs.readFileSync(postsPath, 'utf-8')
  const posts = JSON.parse(raw)
  return (Array.isArray(posts) ? posts : [])
    .filter((p) => p.published !== false && p.slug)
    .map((p) => `/posts/${p.slug}`)
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
    const appHtml = render(url)
    const html = template.replace(SSR_PLACEHOLDER, appHtml)
    const pathname = url.split('?')[0] || '/'
    const outPath =
      pathname === '/'
        ? path.join(distPath, 'index.html')
        : path.join(distPath, ...pathname.replace(/^\//, '').split('/').filter(Boolean), 'index.html')
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, html, 'utf-8')
    console.log('prerender:', url, '->', outPath.replace(distPath, 'dist'))
  }
  const notFoundHtml = render('/_no_match_')
  fs.writeFileSync(path.join(distPath, '404.html'), template.replace(SSR_PLACEHOLDER, notFoundHtml), 'utf-8')
  console.log('prerender: 404.html')
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
        const appHtml = render(url)
        const html = template.replace(SSR_PLACEHOLDER, appHtml)
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
        const appHtml = render(url)
        const html = template.replace(SSR_PLACEHOLDER, appHtml)
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
