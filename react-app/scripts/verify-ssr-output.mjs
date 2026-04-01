#!/usr/bin/env node
/**
 * Verify that the build output is server-rendered: no SSR placeholder in prerendered HTML files.
 * Run after prerender in build:ci so we never deploy client-only by mistake.
 *
 * Checks a manifest of routes (static + first published post from cache) so regressions on
 * localized or secondary pages are caught, not only index/posts/honors spot paths.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist')
const cacheDir = path.resolve(__dirname, '..', 'cache')
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

const firstSlug = loadFirstPublishedSlug()

const keyFiles = [
  'index.html',
  '404.html',
  'posts/index.html',
  'timeline/index.html',
  'agent/index.html',
  'honors-thesis/chapter/introduction/index.html',
  'es/index.html',
  'es/posts/index.html',
]

if (firstSlug) {
  keyFiles.push(`posts/${firstSlug}/index.html`)
}

/** Minimum bytes: prerendered pages are far larger than the Vite shell (~2k). */
const minBytesFor = (rel) => {
  if (rel === 'index.html') return 8000
  if (rel.startsWith('posts/') && rel.endsWith('/index.html') && rel !== 'posts/index.html') return 8000
  return 5000
}

let failed = false
for (const rel of keyFiles) {
  const filePath = path.join(distDir, rel)
  if (!fs.existsSync(filePath)) {
    console.error(`verify-ssr: missing ${rel}`)
    failed = true
    continue
  }
  const html = fs.readFileSync(filePath, 'utf-8')
  if (html.includes(SSR_PLACEHOLDER)) {
    console.error(`verify-ssr: ${rel} still contains SSR placeholder (prerender did not run or failed)`)
    failed = true
  }
  const minBytes = minBytesFor(rel)
  if (html.length < minBytes) {
    console.error(
      `verify-ssr: ${rel} too small (${html.length} bytes), expected at least ${minBytes} bytes of prerendered content`,
    )
    failed = true
  }
}

if (failed) {
  process.exit(1)
}
console.log(
  `verify-ssr: OK — ${keyFiles.length} HTML outputs contain server-rendered content` +
    (firstSlug ? ` (spot post: posts/${firstSlug}/)` : ''),
)
