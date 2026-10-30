import assert from 'node:assert/strict'
import {test} from 'node:test'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import sharp from 'sharp'
import {JSDOM} from 'jsdom'
import {rasterPaperSvg,validateAuthoredPaperSvg} from './export-paper-artwork.mjs'
const dir=new URL('../src/dev/overhead-record/',import.meta.url)
const read=name=>fs.readFileSync(new URL(name,dir),'utf8')
const parse=s=>new JSDOM(s,{contentType:'image/svg+xml'}).window.document
const names=['connectedRecordsProof','syntheticSourcesProof','invoice','governedCollaborationProof','competingClaimsProof','explanationsImpactProof','source-material']
const docs=Object.fromEntries(names.map(name=>[name,parse(read(name+'.svg'))]))
const pixels=async svg=>sharp(await rasterPaperSvg(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true})
test('new physical accessories bind exact alpha-bearing photographic materials',async()=>{
 const metadata=JSON.parse(read('physical-materials.json'))
 for(const spec of Object.values(metadata)){
  const bytes=fs.readFileSync(new URL('materials/'+spec.file,dir))
  assert.equal(createHash('sha256').update(bytes).digest('hex'),spec.sha256)
  const {data}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  let clear=0,opaque=0;for(let i=3;i<data.length;i+=4){if(data[i]===0)clear++;if(data[i]>=200)opaque++}
  assert(clear>10000&&opaque>10000,'real cutout has both transparent negative space and opaque material')
 }
 for(const[name,selector,material]of [['connectedRecordsProof','[data-task-clipboard]','clipboard-clip'],['explanationsImpactProof','[data-inspection-object]','inspection-glass']]){
  const accessory=docs[name].querySelector(selector);assert(accessory.querySelector(`[data-paper-raster="${material}"] use`));assert.equal(accessory.querySelectorAll('path,circle,rect').length,0,'no flat vector stand-in')
  const mutation=parse(read(name+'.svg'));mutation.querySelector(selector+' use').setAttribute('href','https://example.com/asset.webp');assert.throws(()=>validateAuthoredPaperSvg(mutation.documentElement.outerHTML,name))
 }
 const glass=docs.explanationsImpactProof.querySelector('[data-inspection-object] svg')
 const lens=await pixels(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">${docs.explanationsImpactProof.querySelector('defs').outerHTML}${glass.outerHTML}</svg>`)
 assert(lens.data[(140*900+440)*4+3]<100,'physical lens remains see-through over the selected field')
})
test('every calendar is filled cool blue with first/second position unchanged and no red internal dot',()=>{
 let count=0
 for(const d of Object.values(docs))for(const calendar of d.querySelectorAll('[data-field-icon="due"]')){
  count++;assert.equal(calendar.getAttribute('data-calendar-surface'),'cool-blue');assert.equal(calendar.querySelector('path').getAttribute('fill'),'#c4d7df')
  const dot=calendar.querySelector('circle');assert(dot);assert.notEqual(dot.getAttribute('fill'),'#ad5635')
 }
 assert(count>=15)
 const a=docs.invoice.querySelector('[data-paper-field-state="prior"] [data-field-icon="due"]'),b=docs.invoice.querySelector('[data-paper-field-state="current"] [data-field-icon="due"]')
 assert(Number(a.querySelector('circle').getAttribute('cx'))<Number(b.querySelector('circle').getAttribute('cx')))
 const old=parse(read('invoice.svg').replaceAll('data-calendar-surface="cool-blue"',''))
 assert([...old.querySelectorAll('[data-field-icon="due"]')].some(c=>c.getAttribute('data-calendar-surface')!=='cool-blue'),'unfilled historical vocabulary fails the contract')
 assert.equal(docs.invoice.querySelectorAll('[data-current-field] > path[fill]').length,0,'no colored field band remains on current record')
})
async function letterOcclusion(d){
 const letter=d.querySelector('[data-paper-letter]'),calendar=letter.querySelector('[data-field-icon="due"]').parentElement,front=d.querySelector('[data-paper-envelope-front]')
 const defs=d.querySelector('defs').outerHTML
 const raster=async node=>pixels(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">${defs}${node.outerHTML}</svg>`)
 const [ink,pocket,paper]=await Promise.all([raster(calendar),raster(front),raster(letter.querySelector('svg'))])
 let overlap=0,bleed=0,printed=0
 for(let i=3;i<ink.data.length;i+=4)if(ink.data[i]>=180){printed++;if(pocket.data[i]>=180)overlap++;if(paper.data[i]<180)bleed++}
 assert(printed>300,'calendar was actually measured');return{overlap,bleed}
}
test('both dated letters have photographic paper and completely exposed calendar ink above pocket',async()=>{
 for(const name of ['syntheticSourcesProof','invoice']){
  const d=docs[name];assert(d.querySelector('[data-paper-letter] [data-paper-raster="letter-paper"]'))
  assert.deepEqual(await letterOcclusion(d),{overlap:0,bleed:0},name)
  const bad=parse(read(name+'.svg'));bad.querySelector('[data-paper-envelope-front]').setAttribute('transform','translate(0 -70)');assert((await letterOcclusion(bad)).overlap>0,'front-fold regression occludes the date and fails')
 }
})
async function bodyRatio(file,bodyTop=0){
 const {data,info}=await sharp(fs.readFileSync(new URL('materials/'+file,dir))).ensureAlpha().raw().toBuffer({resolveWithObject:true})
 let l=1254,r=-1,t=1254,b=-1;for(let y=bodyTop;y<1254;y++)for(let x=0;x<1254;x++)if(data[(y*info.width+x)*4+3]>=200){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
 return(r-l+1)/(b-t+1)
}
test('open envelope retains hero body proportions while upper flap extends separately',async()=>{
 const metadata=JSON.parse(read('physical-materials.json')),hero=await bodyRatio('email-envelope.webp'),open=await bodyRatio(metadata['email-envelope-open'].file,540)
 assert(Math.abs(hero-open)<.12,`same body: hero${hero} open${open}`)
 const old=await bodyRatio('email-envelope-open-v2.webp',540);assert(Math.abs(hero-old)>.2,'old wide shallow pocket fails same-envelope geometry')
})
