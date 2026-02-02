import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT || 5173
const SSR_PLACEHOLDER = '<!--ssr-outlet-->'

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

createServer().catch((e) => {
  console.error(e)
  process.exit(1)
})
