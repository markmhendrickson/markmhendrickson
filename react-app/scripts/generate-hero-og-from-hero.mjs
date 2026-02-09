#!/usr/bin/env node
/**
 * Create {slug}-hero-og.png from {slug}-hero.png by resizing to 1200x630 with cover fit.
 * So the OG source matches the main hero and fills the landscape frame.
 * Usage: node scripts/generate-hero-og-from-hero.mjs <slug>
 */
import sharp from 'sharp'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const postsImagesDir = join(root, 'public', 'images', 'posts')
const OG_WIDTH = 1200
const OG_HEIGHT = 630

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: node scripts/generate-hero-og-from-hero.mjs <slug>')
  process.exit(1)
}

const heroPath = join(postsImagesDir, `${slug}-hero.png`)
if (!existsSync(heroPath)) {
  console.error('No hero found:', heroPath)
  process.exit(1)
}

const outPath = join(postsImagesDir, `${slug}-hero-og.png`)
const buffer = await sharp(heroPath)
  .resize(OG_WIDTH, OG_HEIGHT, {
    fit: 'cover',
    position: 'bottom',
    background: { r: 0, g: 0, b: 0, alpha: 1 }
  })
  .png()
  .toBuffer()

writeFileSync(outPath, buffer)
console.log('Wrote', outPath)
