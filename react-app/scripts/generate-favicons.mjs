#!/usr/bin/env node
/**
 * Generate favicons from favicon.svg (black block with M) to 16, 32, 48 PNG.
 * Output: public/favicon-16.png, public/favicon-32.png, public/favicon-48.png
 * Run: node scripts/generate-favicons.mjs
 */
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'public', 'favicon.svg')

for (const size of [16, 32, 48]) {
  const outPath = join(root, 'public', `favicon-${size}.png`)
  const buffer = await sharp(svgPath)
    .resize(size, size)
    .png()
    .toBuffer()
  writeFileSync(outPath, buffer)
  console.log(`Wrote ${outPath} (${size}x${size})`)
}
