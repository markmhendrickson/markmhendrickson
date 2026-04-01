import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cacheDir = path.resolve(__dirname, 'cache')
const postsContentDir = path.resolve(__dirname, 'src/content/posts')

/** Dev: serve post sources at GET /raw/post/:slug.md. Build: copy published post .md files into dist/raw/post/ for static hosts. */
function rawPostMarkdownPlugin() {
  function collectPublishedSlugs(): Set<string> {
    const slugs = new Set<string>()
    if (!fs.existsSync(cacheDir)) return slugs
    for (const name of fs.readdirSync(cacheDir)) {
      if (!/^posts(\.[a-z]{2})?\.json$/.test(name)) continue
      try {
        const data = JSON.parse(fs.readFileSync(path.join(cacheDir, name), 'utf-8')) as unknown
        if (!Array.isArray(data)) continue
        for (const p of data) {
          if (p == null || typeof p !== 'object') continue
          const rec = p as { published?: unknown; slug?: unknown }
          if (rec.published === false || !rec.slug) continue
          slugs.add(String(rec.slug))
        }
      } catch {
        /* skip malformed cache */
      }
    }
    return slugs
  }

  return {
    name: 'raw-post-markdown',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' || !req.url) return next()
        const clean = req.url.split('?')[0] ?? ''
        const m = clean.match(/^\/raw\/post\/([a-zA-Z0-9_-]+)\.md$/)
        if (!m) return next()
        const slug = m[1]
        const filePath = path.join(postsContentDir, `${slug}.md`)
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('Not found')
          return
        }
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
        fs.createReadStream(filePath).pipe(res)
      })
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist/raw/post')
      fs.mkdirSync(outDir, { recursive: true })
      for (const slug of collectPublishedSlugs()) {
        const src = path.join(postsContentDir, `${slug}.md`)
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(outDir, `${slug}.md`))
        }
      }
    },
  }
}

/** When cache/*.json changes (e.g. after generate_posts_cache.py), trigger full reload so dev shows new data. */
function cacheReloadPlugin() {
  return {
    name: 'cache-reload',
    configureServer(server) {
      server.watcher.add([path.join(cacheDir, '*.json'), path.join(cacheDir, 'api', '*.json')])
      server.watcher.on('change', (file) => {
        if (file.startsWith(cacheDir) && file.endsWith('.json')) {
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const umamiScriptUrl = process.env.VITE_UMAMI_SCRIPT_URL?.trim() || ''
  const umamiWebsiteId =
    mode === 'development'
      ? process.env.VITE_UMAMI_WEBSITE_ID_DEV?.trim() || ''
      : process.env.VITE_UMAMI_WEBSITE_ID_PROD?.trim() || ''

  return {
    plugins: [
      cacheReloadPlugin(),
      rawPostMarkdownPlugin(),
      react(),
      // Umami: inject only when VITE_UMAMI_SCRIPT_URL + mode-specific website ID are set (no hardcoded defaults)
      {
        name: 'inject-umami',
        transformIndexHtml(html) {
          if (!umamiScriptUrl || !umamiWebsiteId) return html
          const scriptSrc = umamiScriptUrl.replace(/"/g, '')
          const websiteId = umamiWebsiteId.replace(/"/g, '')
          const snippet = `
<!-- Umami (privacy-friendly analytics) -->
<script defer src="${scriptSrc}" data-website-id="${websiteId}" data-auto-track="false"><\/script>`
          return html.replace('</head>', `${snippet}\n  </head>`)
        },
      },
    ],
    base: '/',
    root: __dirname, // Explicitly set root to react-app directory
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@cache': path.resolve(__dirname, './cache'),
        '@shared': path.resolve(__dirname, '../shared/src'),
        // Resolve shared package deps from app node_modules (shared has no node_modules)
        'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
        '@radix-ui/react-slot': path.resolve(__dirname, 'node_modules/@radix-ui/react-slot'),
        'clsx': path.resolve(__dirname, 'node_modules/clsx'),
        'tailwind-merge': path.resolve(__dirname, 'node_modules/tailwind-merge'),
        'class-variance-authority': path.resolve(__dirname, 'node_modules/class-variance-authority'),
      },
      dedupe: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    },
    ssr: {
      // Externalize react/react-dom so prerender and Node use one instance (avoids "useContext" null).
      // react-helmet-async is CJS; bundle it so Node ESM loader doesn't fail on named import.
      noExternal: ['react-dom/server', 'react-router-dom', 'react-helmet-async'],
      target: 'node',
    },
    server: {
      proxy: {
        '/api/newsletter': {
          target: 'http://localhost:3456',
          changeOrigin: true,
        },
      },
      fs: {
        // Allow serving files from shared directory
        allow: ['..'],
      },
      watch: {
        // Ignore node_modules and dist to reduce file watcher CPU (Vite + Cursor both watch otherwise)
        ignored: ['**/node_modules/**', '**/dist/**'],
      },
    },
    optimizeDeps: {
      // Include shared components in dependency optimization
      include: [
        '@radix-ui/react-slot',
        'lucide-react',
        'clsx',
        'tailwind-merge',
      ],
    },
    build: {
      outDir: 'dist',
    },
    // For GitHub Pages - handle client-side routing
    preview: {
      port: 4173,
    },
  }
})
