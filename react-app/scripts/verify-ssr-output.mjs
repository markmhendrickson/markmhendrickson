#!/usr/bin/env node
/**
 * Verify that the build output is server-rendered: no SSR placeholder in prerendered HTML files.
 * Run after prerender in build:ci so we never deploy client-only by mistake.
 *
 * Checks a manifest of routes (static + first published post from cache) so regressions on
 * localized or secondary pages are caught, not only index/posts/honors spot paths.
 *
 * Also verifies every permalink returned by `server.js --list-post-routes` (same source as
 * prerender) so a new published post cannot ship without a matching prerendered HTML file.
 */
import { execFileSync } from 'child_process'
import fs, { mkdtempSync, rmSync } from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
const distDir = path.join(appRoot, 'dist')
const cacheDir = path.join(appRoot, 'cache')
const SSR_PLACEHOLDER = '<!--ssr-outlet-->'

function loadFirstPublishedSlug() {
  const postsPath = path.join(cacheDir, 'posts.json')
  if (!fs.existsSync(postsPath)) return null
  try {
    const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'))
    if (!Array.isArray(posts)) return null
    const pub = posts.find((p) => p && p.published !== false && p.slug)
    return pub?.slug ?? null
  } catch {
    return null
  }
}

/** First multi-part series slug (matches server.js resolveSeriesSlugFromPost). */
function loadFirstSeriesSlug() {
  const postsPath = path.join(cacheDir, 'posts.json')
  if (!fs.existsSync(postsPath)) return null
  try {
    const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'))
    if (!Array.isArray(posts)) return null
    for (const p of posts) {
      if (!p || p.published === false) continue
      if (!String(p.series || '').trim()) continue
      const explicit = String(p.seriesSlug || '').trim()
      if (explicit) return explicit
      const slug = String(p.slug || '').trim()
      const m = slug.match(/^(.*)-part-\d+$/i)
      if (m?.[1]) return m[1]
    }
    return null
  } catch {
    return null
  }
}

const firstSlug = loadFirstPublishedSlug()
const firstSeriesSlug = loadFirstSeriesSlug()

const keyFiles = [
  'index.html',
  '404.html',
  'posts/index.html',
  'posts/series/index.html',
  'timeline/index.html',
  'agent/index.html',
  'honors-thesis/chapter/introduction/index.html',
  'es/index.html',
  'es/posts/index.html',
]

if (firstSlug) {
  keyFiles.push(`posts/${firstSlug}/index.html`)
}
if (firstSeriesSlug) {
  keyFiles.push(`posts/series/${firstSeriesSlug}/index.html`)
}

/** Minimum bytes: prerendered pages are far larger than the Vite shell (~2k). */
const minBytesFor = (rel) => {
  if (rel === 'index.html') return 8000
  if (
    (rel.includes('/posts/') || rel.startsWith('posts/')) &&
    rel.endsWith('/index.html') &&
    !rel.endsWith('/posts/index.html') &&
    !rel.endsWith('/posts/series/index.html')
  ) {
    return 8000
  }
  return 5000
}

/** Prerender route path (e.g. /es/posts/foo) -> dist relative path */
function routeToDistRel(routePath) {
  const pathname = (routePath.split('?')[0] || '/').replace(/\/$/, '') || '/'
  if (pathname === '/') return 'index.html'
  const segs = pathname.split('/').filter(Boolean)
  return `${segs.join('/')}/index.html`
}

let postRoutes = []
const tmpDir = mkdtempSync(path.join(tmpdir(), 'verify-ssr-routes-'))
const routesFile = path.join(tmpDir, 'post-routes.json')
try {
  execFileSync(process.execPath, ['server.js', '--list-post-routes-out', routesFile], { cwd: appRoot })
  postRoutes = JSON.parse(fs.readFileSync(routesFile, 'utf-8'))
  if (!Array.isArray(postRoutes)) throw new Error('expected JSON array')
} catch (e) {
  console.error('verify-ssr: failed to list post routes from server.js:', e?.message || e)
  process.exit(1)
} finally {
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

const postHtmlRels = postRoutes.map((r) => routeToDistRel(r.startsWith('/') ? r : `/${r}`))

let failed = false

function verifyHtmlFile(rel, label = rel) {
  const filePath = path.join(distDir, rel)
  if (!fs.existsSync(filePath)) {
    console.error(`verify-ssr: missing ${label} -> ${rel}`)
    failed = true
    return
  }
  const html = fs.readFileSync(filePath, 'utf-8')
  if (html.includes(SSR_PLACEHOLDER)) {
    console.error(`verify-ssr: ${label} (${rel}) still contains SSR placeholder`)
    failed = true
  }
  const minBytes = minBytesFor(rel)
  if (html.length < minBytes) {
    console.error(
      `verify-ssr: ${label} (${rel}) too small (${html.length} bytes), expected at least ${minBytes}`,
    )
    failed = true
  }
}

for (const rel of keyFiles) {
  verifyHtmlFile(rel)
}

for (let i = 0; i < postHtmlRels.length; i++) {
  verifyHtmlFile(postHtmlRels[i], `post route ${postRoutes[i]}`)
}

if (failed) {
  process.exit(1)
}
console.log(
  `verify-ssr: OK — ${keyFiles.length} spot-check HTML files + ${postRoutes.length} post permalinks (all server-rendered)`,
)
