#!/usr/bin/env node
/**
 * Regenerate hero, hero-square, and hero-og from a source image with artwork
 * preserved and centered in each asset. Use when you want contain+center instead
 * of the default bottom-positioned layouts.
 *
 * Usage: node scripts/regenerate-hero-assets-centered.mjs <slug> [source_path]
 *   slug: post slug (e.g. claude-memory-and-the-truth-layer)
 *   source_path: optional path to source image; defaults to existing hero
 *
 * Produces:
 *   {slug}-hero.png (copy or resize to ~1200px long edge, preserve aspect)
 *   {slug}-hero-square.png (1200×1200, contain, center)
 *   {slug}-hero-og.png (1200×630, contain, center)
 *   og/{slug}-1200x630.jpg (via generate-post-og-image)
 */
import sharp from 'sharp'
import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const postsImagesDir = join(root, 'public', 'images', 'posts')
const ogDir = join(root, 'public', 'images', 'og')

const HERO_LONG_EDGE = 1200
const SQUARE_SIZE = 1200
const OG_WIDTH = 1200
const OG_HEIGHT = 630
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 }

const slug = process.argv[2]
const sourceArg = process.argv[3]

if (!slug) {
  console.error('Usage: node scripts/regenerate-hero-assets-centered.mjs <slug> [source_path]')
  process.exit(1)
}

let sourcePath = sourceArg
if (!sourcePath) {
  const heroPath = join(postsImagesDir, `${slug}-hero.png`)
  if (!existsSync(heroPath)) {
    console.error('No source path given and no existing hero at', heroPath)
    process.exit(1)
  }
  sourcePath = heroPath
}
if (!existsSync(sourcePath)) {
  console.error('Source not found:', sourcePath)
  process.exit(1)
}

async function run() {
  // Hero: landscape canvas (1200×675, 16:9) with artwork contained and centered
  const heroPath = join(postsImagesDir, `${slug}-hero.png`)
  const HERO_WIDTH = 1200
  const HERO_HEIGHT = 675
  const heroBuf = await sharp(sourcePath)
    .resize(HERO_WIDTH, HERO_HEIGHT, {
      fit: 'contain',
      position: 'center',
      background: BLACK
    })
    .png()
    .toBuffer()
  writeFileSync(heroPath, heroBuf)
  console.log('Wrote', heroPath)

  // Square: 1200×1200, contain, center
  const squarePath = join(postsImagesDir, `${slug}-hero-square.png`)
  const squareBuf = await sharp(heroPath)
    .resize(SQUARE_SIZE, SQUARE_SIZE, {
      fit: 'contain',
      position: 'center',
      background: BLACK
    })
    .png()
    .toBuffer()
  writeFileSync(squarePath, squareBuf)
  console.log('Wrote', squarePath)

  // Hero-og: 1200×630, contain, center
  const heroOgPath = join(postsImagesDir, `${slug}-hero-og.png`)
  const heroOgBuf = await sharp(heroPath)
    .resize(OG_WIDTH, OG_HEIGHT, {
      fit: 'contain',
      position: 'center',
      background: BLACK
    })
    .png()
    .toBuffer()
  writeFileSync(heroOgPath, heroOgBuf)
  console.log('Wrote', heroOgPath)

  // JPG for social sharing
  mkdirSync(ogDir, { recursive: true })
  const ogJpgPath = join(ogDir, `${slug}-1200x630.jpg`)
  const jpgBuf = await sharp(heroOgPath)
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer()
  writeFileSync(ogJpgPath, jpgBuf)
  console.log('Wrote', ogJpgPath, `(${(jpgBuf.length / 1024).toFixed(1)} KB)`)

  // If over 600KB, run generate-post-og-image to compress
  if (jpgBuf.length > 600 * 1024) {
    const result = spawnSync('node', [
      join(__dirname, 'generate-post-og-image.mjs'),
      slug
    ], { stdio: 'inherit' })
    if (result.status !== 0) process.exit(result.status)
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
