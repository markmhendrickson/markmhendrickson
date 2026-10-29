import assert from 'node:assert/strict'
import {test} from 'node:test'
import fs from 'node:fs'
import sharp from 'sharp'
import {JSDOM} from 'jsdom'
const source=fs.readFileSync(new URL('../src/dev/overhead-record/invoice.svg',import.meta.url),'utf8')
const parse=s=>new JSDOM(s,{contentType:'image/svg+xml'}).window.document
// Deliberately independent of generator geometry.json and its helper/constants.
async function contourErrors(s){
 const d=parse(s),errors=[]
 for(const pin of d.querySelectorAll('[data-paper-port]')){
  const id=pin.getAttribute('data-paper-port')
  const selector=id.startsWith('invoice-observation')?'[data-paper-observation="invoice-observation"]':id.startsWith('email-observation')?'[data-paper-observation="email-observation"]':id.startsWith('current')?'[data-paper-current-record]':`[data-paper-source="${id.startsWith('invoice')?'invoice':'email'}"]`
  const carrier=d.querySelector(selector+' svg'),crop=carrier.getAttribute('viewBox').split(' ').map(Number)
  const scale=Number(carrier.getAttribute('width'))/crop[2],x=Number(pin.getAttribute('cx')),y=Number(pin.getAttribute('cy'))
  const material=carrier.getAttribute('data-paper-raster')
  const {data,info}=await sharp(fs.readFileSync(new URL(`../src/dev/overhead-record/materials/${material}.webp`,import.meta.url))).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  const sy=Math.round(crop[1]+(y-Number(carrier.getAttribute('y')))/scale)
  const sx=crop[0]+(x-Number(carrier.getAttribute('x')))/scale
  // Find connected opaque span at this height; 200 excludes translucent soft shadow.
  const span=[];for(let i=crop[0];i<crop[0]+crop[2];i++) if(data[(sy*info.width+i)*4+3]>=200)span.push(i)
  const border=Math.abs(sx-(span[0]-.5))<Math.abs(sx-(span.at(-1)+.5))?span[0]-.5:span.at(-1)+.5
  if(Math.abs(sx-border)*scale>.35)errors.push(id)
 }
 return errors
}
test('all endpoint centers meet the sampled opaque photographic border; old offsets and +/-3px fail',async()=>{
 assert.deepEqual(await contourErrors(source),[])
 const old=fs.readFileSync(new URL('./fixtures/overhead-ink-before.svg',import.meta.url),'utf8')
 assert((await contourErrors(old)).length>=5,'old vector-matched ports fail actual physical contour check')
 for(const delta of [-3,3]){
  const d=parse(source),pin=d.querySelector('[data-paper-port]');pin.setAttribute('cx',Number(pin.getAttribute('cx'))+delta)
  assert((await contourErrors(d.documentElement.outerHTML)).includes('invoice-source'))
 }
})
const safe={invoice:[76,93,133,178],'invoice-observation':[350,198,174,69],'email-observation':[390,321,174,32],current:[684,198,138,169]}
async function printErrors(s){
 const d=parse(s),errors=[]
 for(const [id,box]of Object.entries(safe)){
  const selector=id==='current'?'[data-current-ink]':id.includes('observation')?`[data-observation-ink="${id}"]`:`[data-source-ink="${id}"]`
  const ink=d.querySelector(selector).cloneNode(true)
  for(const node of ink.querySelectorAll('[data-paper-port]'))node.remove()
  // Measure all authored ink without the defensive clip or texture mask.
  for(const node of [ink,...ink.querySelectorAll('*')])for(const attr of ['clip-path','mask','style'])node.removeAttribute(attr)
  const {data,info}=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">${ink.outerHTML}</svg>`)).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>32&&(x<box[0]-1||x>box[0]+box[2]||y<box[1]-1||y>box[1]+box[3])){errors.push(id);y=info.height;break}
 }
 return errors
}
test('unclipped ink fits independently specified face-safe regions, including the old observation lower row',async()=>{
 assert.deepEqual(await printErrors(source),[])
 const old=fs.readFileSync(new URL('./fixtures/overhead-ink-before.svg',import.meta.url),'utf8')
 assert((await printErrors(old)).includes('invoice-observation'))
 const d=parse(source);d.querySelector('[data-paper-print="invoice-observation"]').setAttribute('transform','translate(0 20)')
 assert((await printErrors(d.documentElement.outerHTML)).includes('invoice-observation'))
})
test('calendar identifies due date consistently while selected cell represents value; banknote amount persists',()=>{
 const d=parse(source)
 assert.equal(d.querySelectorAll('[data-field-icon="due"]').length,5)
 assert.equal(d.querySelectorAll('[data-field-icon="amount"]').length,3)
 const prior=d.querySelector('[data-paper-field-state="prior"] [data-field-icon="due"]')
 const current=d.querySelector('[data-paper-field-state="current"] [data-field-icon="due"]')
 assert.equal(prior.querySelector('path').getAttribute('d'),current.querySelector('path').getAttribute('d'))
 assert.notEqual(prior.lastElementChild.getAttribute('d'),current.lastElementChild.getAttribute('d'))
 assert.equal(d.querySelector('[data-current-field="amount"] [data-field-icon]').getAttribute('data-field-icon'),'amount')
 assert.equal(d.querySelectorAll('[data-paper-print][clip-path][mask]').length,4)
 assert(d.querySelectorAll('#screen-grain circle').length>=5)
})
test('screen-print coverage varies within a stroke and remains attached to the carrier ink',async()=>{
 const d=parse(source),pattern=d.querySelector('#screen-grain').outerHTML,mask=d.querySelector('#screenprint').outerHTML
 const raster=async masked=>sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><defs>${pattern}${mask}</defs><path d="M2 10h36" stroke="#223e50" stroke-width="8" ${masked?'mask="url(#screenprint)"':''}/></svg>`)).ensureAlpha().raw().toBuffer({resolveWithObject:true})
 const coverage=async masked=>{const {data,info}=await raster(masked),a=[];for(let y=7;y<13;y++)for(let x=4;x<36;x++)a.push(data[(y*info.width+x)*4+3]);return new Set(a)}
 assert((await coverage(true)).size>5,'matte ink has partial coverage and small knockouts')
 assert.equal((await coverage(false)).size,1,'solid ink counterexample loses printed texture')
 for(const id of ['invoice-observation','email-observation'])assert(d.querySelector(`[data-observation-ink="${id}"] [data-paper-print][mask]`),'mask lives inside the carrier motion group')
})
