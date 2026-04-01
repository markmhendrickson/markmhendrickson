#!/usr/bin/env node
/**
 * Hero for eleven-releases-in-five-weeks: 11 outlined "release" tiles on an ascending diagonal.
 * Style: solid black + white stroke only (matches other post heroes).
 */
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outPath = join(root, 'public', 'images', 'posts', 'eleven-releases-in-five-weeks-hero.png')

const W = 1376
const H = 768
const N = 11
const boxW = 62
const boxH = 76
const rx = 14
const stroke = 2.75
const stepX = 92
const stepY = 38
const marginBottom = 110

const spanX = (N - 1) * stepX + boxW
const x0 = (W - spanX) / 2
const y0 = H - marginBottom - boxH

const rects = []
for (let i = 0; i < N; i++) {
  const x = x0 + i * stepX
  const y = y0 - i * stepY
  rects.push({ x, y })
}

const cornerTicks = rects
  .map(({ x, y }) => {
    const ix = x + boxW * 0.62
    const iy = y + boxH * 0.22
    return `<path d="M ${ix} ${iy} L ${x + boxW - 10} ${iy} L ${x + boxW - 10} ${y + 14}" fill="none" stroke="#ffffff" stroke-width="${stroke * 0.85}" stroke-linecap="round" stroke-linejoin="round"/>`
  })
  .join('\n  ')

const boxes = rects
  .map(
    ({ x, y }) =>
      `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="${rx}" ry="${rx}" fill="none" stroke="#ffffff" stroke-width="${stroke}"/>`
  )
  .join('\n  ')

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#000000"/>
  ${boxes}
  ${cornerTicks}
</svg>`

const buf = await sharp(Buffer.from(svg)).png().toBuffer()
writeFileSync(outPath, buf)
console.log('Wrote', outPath, `(${N} tiles, ascending diagonal)`)
