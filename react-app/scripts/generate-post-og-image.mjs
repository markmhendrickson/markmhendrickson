#!/usr/bin/env node
/**
 * Generate a 1200x630 og:image from a post's hero image (black background, hero fitted), under 600 KB.
 * Usage: node scripts/generate-post-og-image.mjs <slug>
 * Example: node scripts/generate-post-og-image.mjs agentic-search-and-the-truth-layer
 * Output: public/images/og/<slug>-1200x630.jpg
 */
import sharp from 'sharp'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const postsImagesDir = join(root, 'public', 'images', 'posts')
const ogDir = join(root, 'public', 'images', 'og')

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const MAX_BYTES = 600 * 1024 // 600 KB

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: node scripts/generate-post-og-image.mjs <slug>')
  process.exit(1)
}

const heroExtensions = ['.png', '.jpg', '.jpeg', '.webp']
let heroPath = null
for (const ext of heroExtensions) {
  const p = join(postsImagesDir, `${slug}-hero${ext}`)
  if (existsSync(p)) {
    heroPath = p
    break
  }
}
if (!heroPath) {
  console.error('No hero image found for slug:', slug, '(looked for', `${slug}-hero{.png,.jpg,.jpeg,.webp}`, 'in', postsImagesDir + ')')
  process.exit(1)
}

mkdirSync(ogDir, { recursive: true })
const outPath = join(ogDir, `${slug}-1200x630.jpg`)

async function generate(quality) {
  const hero = await sharp(heroPath)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .toBuffer()

  const buffer = await sharp(hero)
    .jpeg({ quality, mozjpeg: true })
    .toBuffer()
  return buffer
}

let lo = 50
let hi = 90
let best = null

while (lo <= hi) {
  const q = Math.floor((lo + hi) / 2)
  const buf = await generate(q)
  if (buf.length <= MAX_BYTES) {
    best = buf
    lo = q + 1
  } else {
    hi = q - 1
  }
}

if (!best) {
  const buf = await generate(70)
  best = buf
  console.warn('Could not get under 600 KB; output may exceed WhatsApp limit.')
}

writeFileSync(outPath, best)
console.log('Wrote', outPath, `(${(best.length / 1024).toFixed(1)} KB)`)
