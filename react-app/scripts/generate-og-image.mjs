#!/usr/bin/env node
/**
 * Generate a 1200x630 og:image from profile.jpg, under 600 KB (WhatsApp limit).
 * Output: public/images/og-default-1200x630.jpg
 * Run: node scripts/generate-og-image.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
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

if (!existsSync(inputPath)) {
  console.error('Input not found:', inputPath)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

async function generate(quality) {
  const buffer = await sharp(inputPath)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'center' })
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
