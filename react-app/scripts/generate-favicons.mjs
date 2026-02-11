#!/usr/bin/env node
/**
 * Generate favicons from favicon.svg (black block with M).
 * Sizes: 16, 32, 48 (small), 96, 128, 180 (Apple touch), 192, 512 (PWA/large).
 * Output: public/favicon-{size}.png
 * Run: node scripts/generate-favicons.mjs
 */
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'public', 'favicon.svg')

const sizes = [16, 32, 48, 96, 128, 180, 192, 512]
for (const size of sizes) {
  const outPath = join(root, 'public', `favicon-${size}.png`)
  const buffer = await sharp(svgPath)
    .resize(size, size)
    .png()
    .toBuffer()
  writeFileSync(outPath, buffer)
  console.log(`Wrote ${outPath} (${size}x${size})`)
}
