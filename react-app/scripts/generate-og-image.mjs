#!/usr/bin/env node
/**
 * Generate a 1200x630 og:image from profile.jpg with headline + CTA, under 600 KB (WhatsApp limit).
 * Output: public/images/og-default-1200x630.jpg
 * Run: node scripts/generate-og-image.mjs
 */
import sharp from 'sharp'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'public', 'profile.jpg')
const outDir = join(root, 'public', 'images')
const outPath = join(outDir, 'og-default-1200x630.jpg')

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const MAX_BYTES = 600 * 1024 // 600 KB

const HEADLINE = 'Mark Hendrickson'
const CTA = 'markmhendrickson.com'

if (!existsSync(inputPath)) {
  console.error('Input not found:', inputPath)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

/** SVG overlay: bottom band + headline + CTA for social preview. */
function svgOverlay() {
  const bandTop = 420
  return `
<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="40%" stop-color="rgba(0,0,0,0.5)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.85)"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${bandTop}" width="${OG_WIDTH}" height="${OG_HEIGHT - bandTop}" fill="url(#band)"/>
  <text x="${OG_WIDTH / 2}" y="520" text-anchor="middle" fill="white" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="56" font-weight="700">${escapeXml(HEADLINE)}</text>
  <text x="${OG_WIDTH / 2}" y="578" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="26" font-weight="500">${escapeXml(CTA)}</text>
</svg>
`.trim()
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function generate(quality) {
  const photo = await sharp(inputPath)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 90 })
    .toBuffer()

  const overlay = Buffer.from(svgOverlay())
  const buffer = await sharp(photo)
    .composite([{ input: overlay, top: 0, left: 0 }])
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
