#!/usr/bin/env node
/**
 * Generate favicons by downscaling mh-logo.png (high-res) to 16, 32, 48 with lanczos3.
 * Output: public/favicon-16.png, public/favicon-32.png, public/favicon-48.png
 * Run: node scripts/generate-favicons.mjs
 */
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const logoPath = join(root, 'public', 'mh-logo.png')

const pipeline = sharp(logoPath)

for (const size of [16, 32, 48]) {
  const outPath = join(root, 'public', `favicon-${size}.png`)
  const buffer = await pipeline
    .clone()
    .resize(size, size)
    .linear(1.35, 0) // boost near-whites to pure white (fix gray from anti-aliasing)
    .png()
    .toBuffer()
  writeFileSync(outPath, buffer)
  console.log(`Wrote ${outPath} (${size}x${size})`)
}
