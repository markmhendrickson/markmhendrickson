#!/usr/bin/env node
/**
 * Create {slug}-hero-square.png from {slug}-hero.png using a square crop.
 * Hero images use lower-portion composition (elements in lower frame, negative space above).
 * Bottom anchoring keeps the main subject in frame and focuses on its key features (e.g. bot head).
 * Usage: node scripts/generate-hero-square-from-hero.mjs <slug>
 */
import sharp from 'sharp'
import { writeFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const postsImagesDir = join(root, 'public', 'images', 'posts')
const SIZE = 1200

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: node scripts/generate-hero-square-from-hero.mjs <slug>')
  process.exit(1)
}

const heroPath = join(postsImagesDir, `${slug}-hero.png`)
if (!existsSync(heroPath)) {
  console.error('No hero found:', heroPath)
  process.exit(1)
}

const outPath = join(postsImagesDir, `${slug}-hero-square.png`)
const buffer = await sharp(heroPath)
  .resize(SIZE, SIZE, {
    fit: 'cover',
    position: 'bottom'
  })
  .png()
  .toBuffer()

writeFileSync(outPath, buffer)
console.log('Wrote', outPath)
