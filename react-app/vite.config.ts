import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cacheDir = path.resolve(__dirname, 'cache')
const postsContentDir = path.resolve(__dirname, 'src/content/posts')
const draftPostsContentDir = path.join(postsContentDir, 'drafts')

type CachedPostRecord = {
  published?: unknown
  slug?: unknown
  alternativeSlugs?: unknown
  body?: unknown
}

function readCachedPosts(locale?: string): CachedPostRecord[] {
  const fileName = locale ? `posts.${locale}.json` : 'posts.json'
  const filePath = path.join(cacheDir, fileName)
  if (!fs.existsSync(filePath)) return []
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown
    return Array.isArray(data) ? (data as CachedPostRecord[]) : []
  } catch {
    return []
  }
}

function resolveDefaultLocaleMarkdown(slug: string): string | null {
  for (const baseDir of [draftPostsContentDir, postsContentDir]) {
    const filePath = path.join(baseDir, `${slug}.md`)
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf-8')
  }
  for (const post of readCachedPosts()) {
    const variants = [post.slug, ...(Array.isArray(post.alternativeSlugs) ? post.alternativeSlugs : [])]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
    if (variants.includes(slug) && typeof post.body === 'string' && post.body.trim().length > 0) {
      return post.body
    }
  }
  return null
}

function resolveLocalizedMarkdown(locale: string | undefined, slug: string): string | null {
  if (!locale) return resolveDefaultLocaleMarkdown(slug)
  for (const post of readCachedPosts(locale)) {
    if (post.published === false) continue
    const variants = [post.slug, ...(Array.isArray(post.alternativeSlugs) ? post.alternativeSlugs : [])]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
    if (variants.includes(slug) && typeof post.body === 'string' && post.body.trim().length > 0) {
      return post.body
    }
  }
  return null
}

function buildPublishedMarkdownOutputs(): Array<{ outputPath: string; body: string }> {
  const outputs = new Map<string, string>()
  const cacheFiles = fs.existsSync(cacheDir)
    ? fs.readdirSync(cacheDir).filter((name) => /^posts(\.[a-z]{2})?\.json$/.test(name))
    : []

  for (const name of cacheFiles) {
    const localeMatch = /^posts(?:\.([a-z]{2}))?\.json$/.exec(name)
    const locale = localeMatch?.[1]
    const localePrefix = locale ? locale : ''
    for (const post of readCachedPosts(locale)) {
      if (post.published === false || typeof post.body !== 'string' || post.body.trim().length === 0) continue
      if (typeof post.slug !== 'string' || post.slug.length === 0) continue
      const body = !locale
        ? (resolveDefaultLocaleMarkdown(post.slug) ?? post.body)
        : post.body
      const variants = [post.slug, ...(Array.isArray(post.alternativeSlugs) ? post.alternativeSlugs : [])]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
      for (const variant of variants) {
        const routePath = path.join(localePrefix, 'posts', `${variant}.md`)
        outputs.set(routePath, body)
      }
    }
  }

  return [...outputs.entries()].map(([outputPath, body]) => ({ outputPath, body }))
}

/** Dev/build: serve post markdown at /posts/:slug.md and emit static .md files for published posts. */
function postMarkdownPlugin() {
  return {
    name: 'post-markdown',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' || !req.url) return next()
        const clean = req.url.split('?')[0] ?? ''
        const siblingMatch = clean.match(/^\/(?:([a-z]{2})\/)?posts\/([a-zA-Z0-9_-]+)\.md$/)
        const locale = siblingMatch?.[1]
        const slug = siblingMatch?.[2]
        if (!slug) return next()
        const body = resolveLocalizedMarkdown(locale, slug)
        if (body == null) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('Not found')
          return
        }
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
        res.end(body)
      })
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist')
      for (const { outputPath, body } of buildPublishedMarkdownOutputs()) {
        const filePath = path.join(outDir, outputPath)
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
        fs.writeFileSync(filePath, body, 'utf-8')
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
      postMarkdownPlugin(),
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
