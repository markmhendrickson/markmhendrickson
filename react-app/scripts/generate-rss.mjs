#!/usr/bin/env node
/**
 * Generates public/rss.xml from src/content/posts/posts.json.
 * Run from react-app directory (or repo root with correct paths).
 * Output: public/rss.xml (Vite copies to dist on build).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const reactAppRoot = path.resolve(__dirname, '..')
const postsPath = path.join(reactAppRoot, 'src', 'content', 'posts', 'posts.json')
const outPath = path.join(reactAppRoot, 'public', 'rss.xml')

const SITE_BASE = 'https://markmhendrickson.com'
const FEED_TITLE = 'Mark Hendrickson'
const FEED_DESCRIPTION = 'Essays on user-owned agent memory, personal infrastructure, and building systems that restore sovereignty in an age of AI, crypto, and complexity.'

function escapeXml(str) {
  if (str == null || typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822Date(isoDate) {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    return d.toUTCString()
  } catch {
    return ''
  }
}

function buildRssXml(posts) {
  const published = posts
    .filter((p) => p.published !== false && p.slug)
    .sort((a, b) => {
      const da = a.publishedDate || a.updatedDate || ''
      const db = b.publishedDate || b.updatedDate || ''
      return db.localeCompare(da)
    })

  const latestDate = published[0]
    ? toRfc822Date(published[0].updatedDate || published[0].publishedDate)
    : toRfc822Date(new Date().toISOString())

  const items = published
    .map((p) => {
      const link = `${SITE_BASE}/posts/${p.slug}`
      const title = escapeXml(p.title || '')
      const description = escapeXml(p.excerpt || '')
      const pubDate = toRfc822Date(p.publishedDate || p.updatedDate)
      const guid = link
      return `  <item>
    <title>${title}</title>
    <link>${escapeXml(link)}</link>
    <description>${description}</description>
    <pubDate>${pubDate}</pubDate>
    <guid isPermaLink="true">${escapeXml(guid)}</guid>
  </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_BASE}/</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${latestDate}</lastBuildDate>
    <atom:link href="${SITE_BASE}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`
}

function main() {
  if (!fs.existsSync(postsPath)) {
    console.warn('generate-rss: posts.json not found at', postsPath)
    process.exit(0)
  }
  const raw = fs.readFileSync(postsPath, 'utf-8')
  const posts = JSON.parse(raw)
  const list = Array.isArray(posts) ? posts : []
  const xml = buildRssXml(list)
  const publicDir = path.dirname(outPath)
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  fs.writeFileSync(outPath, xml, 'utf-8')
  console.log('generate-rss: wrote', outPath)
}

main()
