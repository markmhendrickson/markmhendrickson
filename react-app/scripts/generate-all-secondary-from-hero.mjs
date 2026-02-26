#!/usr/bin/env node
/**
 * Regenerate all secondary images (hero-square and OG) from hero images.
 * Finds every {slug}-hero.png (or .jpg) in public/images/posts, then for each slug:
 * - Creates {slug}-hero-square.png (from hero, contain fit in square)
 * - Creates og/{slug}-1200x630.jpg (from hero or hero-og)
 * Usage: node scripts/generate-all-secondary-from-hero.mjs
 */
import { readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const postsImagesDir = join(root, 'public', 'images', 'posts')

const heroExtensions = ['.png', '.jpg', '.jpeg']
const slugs = new Set()
for (const name of readdirSync(postsImagesDir, { withFileTypes: true })) {
  if (!name.isFile()) continue
  for (const ext of heroExtensions) {
    const suffix = `-hero${ext}`
    if (name.name.endsWith(suffix) && !name.name.includes('-hero-og') && !name.name.includes('-hero-square')) {
      slugs.add(name.name.slice(0, -suffix.length))
      break
    }
  }
}

const slugList = [...slugs].sort()
if (slugList.length === 0) {
  console.log('No hero images found in', postsImagesDir)
  process.exit(0)
}

console.log('Regenerating secondary images for', slugList.length, 'posts:', slugList.join(', '))

// Hero-square only supports .png hero
const squareScript = join(root, 'scripts', 'generate-hero-square-from-hero.mjs')
const ogScript = join(root, 'scripts', 'generate-post-og-image.mjs')

for (const slug of slugList) {
  const heroPng = join(postsImagesDir, `${slug}-hero.png`)
  if (existsSync(heroPng)) {
    const r = spawnSync(process.execPath, [squareScript, slug], { cwd: root, stdio: 'inherit' })
    if (r.status !== 0) console.error('Square failed for', slug)
  }
  const r2 = spawnSync(process.execPath, [ogScript, slug], { cwd: root, stdio: 'inherit' })
  if (r2.status !== 0) console.error('OG failed for', slug)
}

console.log('Done.')
