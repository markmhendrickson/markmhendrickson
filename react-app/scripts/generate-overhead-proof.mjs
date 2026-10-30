import {amountMark,dateMark,taskMark,invoicePrint,clipboardClip,letterPaper,OPEN_ENVELOPE_CROP,envelopeFrontPath} from './overhead-marks.mjs'
// Local authored SVG proof. Rendering and resource validation reuse the paper exporter.
import fs from 'node:fs'
import sharp from 'sharp'
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
const pixels = {}
for (const [name, spec] of Object.entries(materials.assets)) {
  const bytes = fs.readFileSync(path.join(dir, 'materials', spec.file))
  if (digest(bytes) !== spec.sha256) throw new Error(`Changed proof material: ${name}`)
  pixels[name] = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  definitions.push(`<image id="proof-${name}" width="1254" height="1254" href="data:image/webp;base64,${bytes.toString('base64')}"/>`)
}
const crops = {
  'document-packet': [239, 121, 833, 1071],
  'email-envelope': [36, 295, 1206, 714],
  'email-envelope-open': OPEN_ENVELOPE_CROP,
  'observation-slip': [71, 411, 1149, 577],
  'letter-paper': [192,76,880,1108],
  'entity-dossier': [199, 102, 892, 1098],
}
function paper(name, x, y, width) {
  const crop = crops[name]
  return `<svg x="${x}" y="${y}" width="${width}" height="${width * crop[3] / crop[2]}" viewBox="${crop.join(' ')}" overflow="hidden" data-paper-raster="${name}"><use href="#proof-${name}"/></svg>`
}
const motion = (carrier, delay) => `data-paper-object="" data-paper-motion-carrier="${carrier}" data-enter-x="-24" data-enter-y="10" data-enter-rotation="0" data-enter-delay="${delay}" style="transform-box:view-box;transform-origin:0px 0px"`
const placements = {
  invoice: { material: 'document-packet', x:55, y:70, width:183 },
  email: { material: 'email-envelope-open', x:55, y:368, width:205 },
  'invoice-observation': { material:'observation-slip', x:330, y:145, width:220 },
  'email-observation': { material:'observation-slip', x:330, y:340, width:220 },
  current: { material:'entity-dossier', x:660, y:172, width:190 },
}
// Alpha 200 selects opaque paper, excluding the feathered contact shadow.
function edge(carrier, side, y) {
  const p = placements[carrier], crop = crops[p.material], scale = p.width/crop[2]
  const row = Math.round(crop[1]+(y-p.y)/scale), {data,info}=pixels[p.material]
  const body=[]
  for(let x=crop[0];x<crop[0]+crop[2];x++) if(data[(row*info.width+x)*4+3]>=200) body.push(x)
  if(!body.length) throw new Error(`Missing paper contour: ${carrier}`)
  const sourceEdge=side==='left'?body[0]-.5:body.at(-1)+.5
  return { x:Number((p.x+(sourceEdge-crop[0])*scale).toFixed(3)), y, carrier, side, sourceRow:row, sourceEdge }
}
const ports = {
  'invoice-source':edge('invoice','right',185),
  'invoice-observation-source':edge('invoice-observation','left',177),
  'invoice-observation-amount':edge('invoice-observation','right',177),
  'email-source':edge('email','right',479),
  'email-observation-source':edge('email-observation','left',393),
  'email-observation-due':edge('email-observation','right',393),
  'current-amount':edge('current','left',270),
  'current-due':edge('current','left',344),
}
const printBoxes={invoice:[76,93,133,178],'invoice-observation':[350,163,174,69],'email-observation':[350,377,174,32],current:[684,198,138,169]}
for(const [id,box] of Object.entries(printBoxes)) definitions.push(`<clipPath id="print-${id}"><rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"/></clipPath>`)
definitions.push(`<pattern id="screen-grain" width="17" height="13" patternUnits="userSpaceOnUse"><rect width="17" height="13" fill="white"/><g fill="black"><circle cx="2.1" cy="3.5" r=".8" opacity=".65"/><circle cx="7.7" cy="1.9" r=".6" opacity=".9"/><circle cx="13.6" cy="5.2" r=".85" opacity=".55"/><circle cx="5.1" cy="10.6" r=".7" opacity=".8"/><circle cx="11.2" cy="10.4" r=".6" opacity=".7"/><path d="M1 8h1.2v.5H1zM9 6h.6v1.1H9z" opacity=".6"/></g></pattern><mask id="screenprint" maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="600" style="mask-type:luminance"><rect width="900" height="600" fill="url(#screen-grain)"/></mask>`)
definitions.push(`<clipPath id="email-open-front"><path d="${envelopeFrontPath(55,368,205)}"/></clipPath>`)
const print = (id,ink) => `<g data-paper-print="${id}" data-print-box="${printBoxes[id].join(' ')}" clip-path="url(#print-${id})" mask="url(#screenprint)">${ink}</g>`
const pin = (id) => {const p=ports[id];return `<circle data-paper-port="${id}" data-port-carrier="${p.carrier}" data-port-side="${p.side}" cx="${p.x}" cy="${p.y}" r="5.5" fill="#ad5635"/>`}
const amount=amountMark
const calendar=dateMark
const rule=(x,y,width=94,thick=5.5)=>`<path d="M${x} ${y}h${width}" stroke="#223e50" stroke-width="${thick}"/>`
const letter = `<g data-paper-letter="email" data-due-date="later" style="transform-box:view-box;transform-origin:0px 0px">${letterPaper(79,355,131)}<g mask="url(#screenprint)">${rule(95,368,98,2)}${rule(95,377,70,2)}<g transform="translate(107 393) scale(1.8)">${calendar(0,0,'current')}</g></g></g>`
const connection=(from,to,delay)=>{const a=ports[from],b=ports[to],dx=Number(((b.x-a.x)*.48).toFixed(3));return `<path data-paper-connection="" data-connection-from="${from}" data-connection-to="${to}" data-connection-delay="${delay}" pathLength="1" d="M${a.x} ${a.y} C${Number((a.x+dx).toFixed(3))} ${a.y} ${Number((b.x-dx).toFixed(3))} ${b.y} ${b.x} ${b.y}" fill="none" stroke="#223e50" stroke-width="3.8" stroke-linecap="round"/>`}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="paper-scene" data-paper-scene="invoiceOverheadProof" data-paper-treatment="hybrid-record-proof" data-paper-variant="overhead-invoice-proof" viewBox="0 0 900 600" role="img" aria-labelledby="proof-title">
<title id="proof-title">Intact original sources, two retained observations and per-field current values</title>
<style>svg[data-paper-variant="overhead-invoice-proof"]{display:block;width:100%;height:auto;overflow:hidden;isolation:isolate}svg[data-paper-variant="overhead-invoice-proof"] [data-paper-motion-carrier]{transform-box:view-box;transform-origin:0px 0px}</style>
<defs>${definitions.join('')}</defs>
<rect width="900" height="600" fill="#f2eee5"/><use href="#proof-ground" opacity="0.17"/><g data-paper-composition="invoiceOverheadProof" transform="translate(0 -17)">
<g data-paper-source="invoice">${paper('document-packet', 55, 70, 183)}</g>
<g data-paper-source="email" data-paper-envelope-state="open">${paper('email-envelope-open', 55, 368, 205)}</g>
${letter}
<g data-paper-envelope-front="email" data-paper-envelope-state="open" clip-path="url(#email-open-front)">${paper('email-envelope-open', 55, 368, 205)}</g>
<g data-paper-envelope-state="closed" opacity="0">${paper('email-envelope', 55, 446, 205)}</g>
<g data-paper-observation="invoice-observation" ${motion('invoice-observation', 0)}>${paper('observation-slip', 330, 145, 220)}</g>
<g data-paper-observation="email-observation" ${motion('email-observation', 1100)}>${paper('observation-slip', 330, 340, 220)}</g>
<g data-paper-current-record="invoice">${paper('entity-dossier', 660, 172, 190)}</g>
<g data-paper-connections="">
${connection('invoice-source','invoice-observation-source',900)}
${connection('email-source','email-observation-source',1960)}
${connection('invoice-observation-amount','current-amount',1560)}
${connection('email-observation-due','current-due',2700)}
</g>
<g data-source-ink="invoice">${print('invoice',invoicePrint(55,70,183))}${pin('invoice-source')}</g>
<g data-source-ink="email">${pin('email-source')}</g>
<g data-observation-ink="invoice-observation" ${motion('invoice-observation',0)}>${print('invoice-observation',amount(352,167)+rule(395,177,126)+calendar(352,204)+rule(395,217,88,3.8))}${pin('invoice-observation-source')}${pin('invoice-observation-amount')}</g>
<g data-observation-ink="email-observation" ${motion('email-observation',1100)}>${print('email-observation',calendar(352,380,'current')+rule(395,393,126))}${pin('email-observation-source')}${pin('email-observation-due')}</g>
<g data-current-ink="invoice">${print('current',`
<g data-current-field="amount" data-observation="invoice-observation">${amount(692,260)}${rule(735,270,79)}</g>
<g data-current-field="due" data-observation="email-observation"><g data-paper-field-state="prior" opacity="0">${calendar(692,331)}${rule(735,344,55)}</g><g data-paper-field-state="current" opacity="1">${calendar(692,331,'current')}${rule(735,344,79)}</g></g>`)}${pin('current-amount')}${pin('current-due')}</g>
</g></svg>`
validateAuthoredPaperSvg(svg, 'invoiceOverheadProof')
fs.writeFileSync(path.join(dir, 'geometry.json'), JSON.stringify({placements,crops,ports,printBoxes,bodyAlphaThreshold:200,borderConvention:'opaque-pixel outer boundary, excluding contact shadow',iconSemantics:{amount:'banknote',due:'calendar; selected cell changes value, never field type'}},null,2)+'\n')
fs.writeFileSync(path.join(dir, 'invoice.svg'), svg + '\n')
console.log(JSON.stringify({ svg: 'src/dev/overhead-record/invoice.svg', sha256: digest(svg + '\n'), bytes: Buffer.byteLength(svg + '\n'), crops, camera: 'locked overhead, no perspective or animated viewpoint', motion: 'fixed-orientation observation translation; due-field transition; static complete record' }))
