// Local authored SVG proof. Rendering and resource validation reuse the paper exporter.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { validateAuthoredPaperSvg, PAPER_TEXTURE_SHA256 } from './export-paper-artwork.mjs'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(app, 'src/dev/overhead-record')
const materials = JSON.parse(fs.readFileSync(path.join(dir, 'materials.json')))
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const texture = [...fs.readFileSync(path.join(app, 'src/assets/neotoma-paper/invoice-example.svg'), 'utf8').matchAll(/data:image\/webp;base64,([^"']+)/g)]
  .map((match) => Buffer.from(match[1], 'base64')).find((bytes) => digest(bytes) === PAPER_TEXTURE_SHA256)
if (!texture) throw new Error('Missing approved ground material')
const definitions = [`<image id="proof-ground" width="900" height="600" preserveAspectRatio="xMidYMid slice" href="data:image/webp;base64,${texture.toString('base64')}"/>`]
for (const [name, spec] of Object.entries(materials.assets)) {
  const bytes = fs.readFileSync(path.join(dir, 'materials', spec.file))
  if (digest(bytes) !== spec.sha256) throw new Error(`Changed proof material: ${name}`)
  definitions.push(`<image id="proof-${name}" width="1254" height="1254" href="data:image/webp;base64,${bytes.toString('base64')}"/>`)
}
const crops = {
  'document-packet': [239, 121, 833, 1071],
  'email-envelope': [36, 295, 1206, 714],
  'observation-slip': [71, 411, 1149, 577],
  'entity-dossier': [199, 102, 892, 1098],
}
function paper(name, x, y, width) {
  const crop = crops[name]
  return `<svg x="${x}" y="${y}" width="${width}" height="${width * crop[3] / crop[2]}" viewBox="${crop.join(' ')}" overflow="hidden" data-paper-raster="${name}"><use href="#proof-${name}"/></svg>`
}
const motion = (carrier, delay) => `data-paper-object="" data-paper-motion-carrier="${carrier}" data-enter-x="-24" data-enter-y="10" data-enter-rotation="0" data-enter-delay="${delay}" style="transform-box:view-box;transform-origin:0px 0px"`
const pin = (id, x, y) => `<circle data-paper-port="${id}" cx="${x}" cy="${y}" r="5.5" fill="#ad5635"/>`
const square = (x, y) => `<path d="M${x} ${y}h28v28h-28z" fill="none" stroke="#223e50" stroke-width="4"/>`
const triangle = (x, y) => `<path d="M${x} ${y + 28}l16-28 16 28z" fill="none" stroke="#223e50" stroke-width="4"/>`
const amount = (x, y) => `<circle cx="${x + 14}" cy="${y + 14}" r="12" fill="none" stroke="#223e50" stroke-width="4"/>`
const rule = (x, y, width = 94, thick = 7) => `<path d="M${x} ${y}h${width}" stroke="#223e50" stroke-width="${thick}"/>`
const connection = (from, to, d, delay) => `<path data-paper-connection="" data-connection-from="${from}" data-connection-to="${to}" data-connection-delay="${delay}" pathLength="1" d="${d}" fill="none" stroke="#223e50" stroke-width="3.8" stroke-linecap="round"/>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="paper-scene" data-paper-scene="invoiceOverheadProof" data-paper-treatment="hybrid-record-proof" data-paper-variant="overhead-invoice-proof" viewBox="0 0 900 600" role="img" aria-labelledby="proof-title">
<title id="proof-title">Intact original sources, two retained observations and per-field current values</title>
<style>svg[data-paper-variant="overhead-invoice-proof"]{display:block;width:100%;height:auto;overflow:hidden;isolation:isolate}svg[data-paper-variant="overhead-invoice-proof"] [data-paper-motion-carrier]{transform-box:view-box;transform-origin:0px 0px}</style>
<defs>${definitions.join('')}</defs>
<rect width="900" height="600" fill="#f2eee5"/><use href="#proof-ground" opacity="0.17"/>
<g data-paper-source="invoice">${paper('document-packet', 55, 70, 183)}</g>
<g data-paper-source="email">${paper('email-envelope', 55, 376, 205)}</g>
<g data-paper-observation="invoice-observation" ${motion('invoice-observation', 0)}>${paper('observation-slip', 330, 180, 220)}</g>
<g data-paper-observation="email-observation" ${motion('email-observation', 1100)}>${paper('observation-slip', 370, 270, 220)}</g>
<g data-paper-current-record="invoice">${paper('entity-dossier', 660, 172, 190)}</g>
<g data-paper-connections="">
${connection('invoice-source', 'invoice-observation-source', 'M222 195 C270 195 280 215 332 215', 900)}
${connection('email-source', 'email-observation-source', 'M250 431 C300 431 316 320 373 320', 1960)}
${connection('invoice-observation-amount', 'current-amount', 'M535 218 C590 218 605 270 670 270', 1560)}
${connection('email-observation-due', 'current-due', 'M575 320 C615 320 627 350 670 350', 2700)}
</g>
<g data-source-ink="invoice">${rule(82, 112, 107, 9)}${rule(82, 132, 72, 3)}${amount(80, 181)}${rule(121, 195, 66)}${square(80, 235)}${rule(121, 249, 66)}${pin('invoice-source', 222, 195)}</g>
<g data-source-ink="email">${pin('email-source', 250, 431)}</g>
<g data-observation-ink="invoice-observation" ${motion('invoice-observation', 0)}>
${amount(358, 204)}${rule(400, 218, 93)}${square(358, 244)}${rule(400, 258, 72, 4)}${pin('invoice-observation-source', 332, 215)}${pin('invoice-observation-amount', 535, 218)}</g>
<g data-observation-ink="email-observation" ${motion('email-observation', 1100)}>
${triangle(399, 306)}${rule(444, 320, 99)}${pin('email-observation-source', 373, 320)}${pin('email-observation-due', 575, 320)}</g>
<g data-current-ink="invoice">
<path d="M750 204l16 16-16 16-16-16z" fill="none" stroke="#223e50" stroke-width="4"/>
<g data-current-field="amount" data-observation="invoice-observation"><path d="M691 249h129v43H691z" fill="#98a48b" opacity="0.20"/>${amount(697, 256)}${rule(740, 270, 70)}${pin('current-amount', 670, 270)}</g>
<g data-current-field="due" data-observation="email-observation"><path d="M691 328h129v43H691z" fill="#a7bfcc" opacity="0.25"/>
<g data-paper-field-state="prior" opacity="0">${square(697, 336)}${rule(740, 350, 48)}</g>
<g data-paper-field-state="current" opacity="1">${triangle(697, 336)}${rule(740, 350, 70)}</g>${pin('current-due', 670, 350)}</g>
</g>
</svg>`
validateAuthoredPaperSvg(svg, 'invoiceOverheadProof')
fs.writeFileSync(path.join(dir, 'invoice.svg'), svg + '\n')
console.log(JSON.stringify({ svg: 'src/dev/overhead-record/invoice.svg', sha256: digest(svg + '\n'), bytes: Buffer.byteLength(svg + '\n'), crops, camera: 'locked overhead, no perspective or animated viewpoint', motion: 'fixed-orientation observation translation; due-field transition; static complete record' }))
