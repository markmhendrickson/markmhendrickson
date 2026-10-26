import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
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

/** Absolute path of the dev-only cache that holds draft (unpublished) posts. */
const privateCachePath = path.join(cacheDir, 'posts.private.json')

/** Absolute path of the cache that holds unlisted (review-only) posts. Deliberately NOT named `posts.*.json`,
 * so no public-list glob or `posts(.xx).json` scan can ever pick it up. */
const unlistedCachePath = path.join(cacheDir, 'unlisted-posts.json')

/** Slugs (canonical and alternative) of unlisted posts. Their text is meant to be in the bundle (lazy chunk). */
function readUnlistedSlugs(): Set<string> {
  const slugs = new Set<string>()
  if (!fs.existsSync(unlistedCachePath)) return slugs
  try {
    const data = JSON.parse(fs.readFileSync(unlistedCachePath, 'utf-8')) as unknown
    for (const post of Array.isArray(data) ? (data as CachedPostRecord[]) : []) {
      for (const value of [post.slug, ...(Array.isArray(post.alternativeSlugs) ? post.alternativeSlugs : [])]) {
        if (typeof value === 'string' && value.length > 0) slugs.add(value)
      }
    }
  } catch {
    /* unreadable file: treat as no unlisted posts */
  }
  return slugs
}

/** Slugs (canonical and alternative) of every published post across the public caches. */
function readPublishedSlugs(): Set<string> {
  const slugs = new Set<string>()
  const names = fs.existsSync(cacheDir)
    ? fs.readdirSync(cacheDir).filter((name) => /^posts(\.[a-z]{2})?\.json$/.test(name))
    : []
  for (const name of names) {
    const locale = /^posts\.([a-z]{2})\.json$/.exec(name)?.[1]
    for (const post of readCachedPosts(locale) as Array<CachedPostRecord & { canonicalSlug?: unknown }>) {
      if (post.published === false) continue
      for (const value of [
        post.slug,
        post.canonicalSlug,
        ...(Array.isArray(post.alternativeSlugs) ? post.alternativeSlugs : []),
      ]) {
        if (typeof value === 'string' && value.length > 0) slugs.add(value)
      }
    }
  }
  return slugs
}

/** Distinctive plain-text fragments of each unpublished post, used to verify the bundle is clean. */
function collectDraftMarkers(): string[] {
  if (!fs.existsSync(privateCachePath)) return []
  const unlistedSlugs = readUnlistedSlugs()
  let privatePosts: CachedPostRecord[] = []
  try {
    const data = JSON.parse(fs.readFileSync(privateCachePath, 'utf-8')) as unknown
    if (Array.isArray(data)) privatePosts = data as CachedPostRecord[]
  } catch {
    return []
  }
  let publicText = ''
  for (const name of fs.readdirSync(cacheDir).filter((n) => /^posts(\.[a-z]{2})?\.json$/.test(n))) {
    publicText += fs.readFileSync(path.join(cacheDir, name), 'utf-8')
  }
  const markers: string[] = []
  for (const post of privatePosts) {
    if (post.published !== false || typeof post.body !== 'string') continue
    // An unlisted post that also exists as a draft record is meant to be in the bundle.
    if (typeof post.slug === 'string' && unlistedSlugs.has(post.slug)) continue
    // Plain sentences only: no quotes, backslashes or markdown, so no escaping differences in the bundle.
    const candidates = post.body
      .split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 30 && sentence.length <= 80 && /^[A-Za-z0-9 ,.;:!?()-]+$/.test(sentence))
      .filter((sentence) => !publicText.includes(sentence))
    if (candidates.length > 0) markers.push(candidates[0], candidates[Math.floor(candidates.length / 2)])
  }
  return [...new Set(markers)]
}

/** Slugs of unpublished posts that are not also a substring of a published slug (so a hit is a real leak). */
function collectDraftOnlySlugs(publishedSlugs: Set<string>): string[] {
  if (!fs.existsSync(privateCachePath)) return []
  try {
    const data = JSON.parse(fs.readFileSync(privateCachePath, 'utf-8')) as unknown
    if (!Array.isArray(data)) return []
    const published = [...publishedSlugs]
    const unlistedSlugs = readUnlistedSlugs()
    return (data as CachedPostRecord[])
      .filter((post) => post.published === false && typeof post.slug === 'string' && post.slug.length > 0)
      .map((post) => post.slug as string)
      .filter((slug) => !publishedSlugs.has(slug) && !unlistedSlugs.has(slug) && !published.some((other) => other.includes(slug)))
  } catch {
    return []
  }
}

/**
 * Production builds must not contain draft content. Drafts live in `cache/posts.private.json`
 * and in per-slug markdown under `src/content/posts/`; several modules import them statically or via
 * dynamic-import globs, which would otherwise ship every draft to anyone who downloads the bundle.
 *
 * In `vite build` (unless `VITE_SHOW_DRAFTS=true`, the explicit opt-in to ship drafts) this plugin:
 * - resolves the private cache to an empty list, and
 * - resolves post markdown whose slug is not published to an empty string (published slugs unchanged),
 *   which includes unlisted posts: their body is served from `cache/unlisted-posts.json` (a lazy chunk fetched
 *   only by the post page on a public-list miss), so neither their text nor their slug is in the main chunk,
 * - then fails the build if any recognizable draft text is still present in an emitted chunk.
 * Dev (`vite` serve) is untouched, so drafts stay viewable by URL and listed at /posts/draft/.
 */
function stripDraftsFromBuildPlugin() {
  const publishedSlugs = readPublishedSlugs()
  const postsDir = postsContentDir + path.sep
  const isPublishedMarkdown = (filePath: string): boolean => {
    if (filePath.startsWith(draftPostsContentDir + path.sep)) return false
    const name = path.basename(filePath, '.md')
    // `{slug}.md` or a sibling such as `{slug}.summary.md` / `{slug}.postscript.md`.
    return publishedSlugs.has(name) || publishedSlugs.has(name.replace(/\.[a-z]+$/i, ''))
  }
  return {
    name: 'strip-drafts-from-build',
    apply: 'build' as const,
    enforce: 'pre' as const,
    load(id: string) {
      const filePath = path.resolve(id.split('?')[0] ?? '')
      if (filePath === privateCachePath) return '[]'
      if (filePath.startsWith(postsDir) && filePath.endsWith('.md') && !isPublishedMarkdown(filePath)) {
        return 'export default ""'
      }
      return null
    },
    generateBundle(_options: unknown, bundle: Record<string, { type: string; code?: string }>) {
      // The dynamic-import globs behind `import(`@/content/posts/${slug}.md?raw`)` list every markdown
      // file by name in the main chunk, which would reveal the slugs of unpublished posts even though
      // their bodies are stubbed. Drop those map entries and the now-empty stub chunks. (Runs before
      // Vite swaps the `__VITE_PRELOAD__` placeholder, and the SSR build has no preload wrapper, hence
      // the optional parts of the pattern.)
      const mapEntry =
        /"\.\.\/content\/posts\/([^"]+)\.md":\s*\(\)\s*=>\s*(?:[\w$]+\(\s*\(\)\s*=>\s*)?import\("\.\/([^"]+)"\)(?:\s*,\s*(?:\[[^\]]*\]|__VITE_PRELOAD__)\s*\))?\s*,?/g
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== 'chunk' || typeof output.code !== 'string') continue
        output.code = output.code.replace(mapEntry, (entry, name: string, stubFile: string) => {
          if (isPublishedMarkdown(path.resolve(postsContentDir, `${name}.md`))) return entry
          delete bundle[path.posix.join(path.posix.dirname(fileName), stubFile)]
          return ''
        })
      }

      // Fail the build if recognizable draft text or a draft-only slug is still in any chunk.
      const needles = [...collectDraftMarkers(), ...collectDraftOnlySlugs(publishedSlugs)]
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== 'chunk' || typeof output.code !== 'string') continue
        const leaked = needles.find((needle) => output.code!.includes(needle))
        if (leaked) {
          this.error(`Draft post content leaked into production bundle ${fileName}: "${leaked}"`)
        }
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const umamiScriptUrl = process.env.VITE_UMAMI_SCRIPT_URL?.trim() || ''
  const umamiWebsiteId =
    mode === 'development'
      ? process.env.VITE_UMAMI_WEBSITE_ID_DEV?.trim() || ''
      : process.env.VITE_UMAMI_WEBSITE_ID_PROD?.trim() || ''

  // VITE_SHOW_DRAFTS=true is the explicit opt-in to ship drafts; otherwise builds contain none.
  const showDrafts =
    (process.env.VITE_SHOW_DRAFTS ?? loadEnv(mode, __dirname, 'VITE_').VITE_SHOW_DRAFTS) === 'true'

  return {
    plugins: [
      ...(command === 'build' && !showDrafts ? [stripDraftsFromBuildPlugin()] : []),
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
        '@radix-ui/react-tooltip': path.resolve(__dirname, 'node_modules/@radix-ui/react-tooltip'),
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
        '@radix-ui/react-tooltip',
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
