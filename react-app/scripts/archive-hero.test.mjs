import assert from 'node:assert/strict'
import {test} from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import sharp from 'sharp'
import {JSDOM} from 'jsdom'
import postcss from 'postcss'
import {validateAuthoredPaperSvg,rasterPaperSvg} from './export-paper-artwork.mjs'
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=name=>fs.readFileSync(path.join(app,name),'utf8'),parse=s=>new JSDOM(s,{contentType:'image/svg+xml'}).window.document
const layouts={desktop:{scene:'archiveHeroDesktop',viewBox:'0 0 900 600',width:900,height:600},mobile:{scene:'archiveHeroMobile',viewBox:'0 0 600 800',width:600,height:800}}
const source=layout=>read(`src/dev/overhead-record/archive-hero-${layout}.svg`)
const hash=b=>createHash('sha256').update(b).digest('hex')
async function rgba(svg){return sharp(await rasterPaperSvg(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true})}
function objects(d){return new Map([...d.querySelectorAll('[data-scene-carrier]')].map(g=>{const svg=g.querySelector('svg');return[g.getAttribute('data-scene-carrier'),{g,svg,x:Number(svg.getAttribute('x')),y:Number(svg.getAttribute('y')),width:Number(svg.getAttribute('width')),crop:svg.getAttribute('viewBox').split(' ').map(Number)}]}))}
async function materialPixels(d,p){const id=p.svg.querySelector('use').getAttribute('href').slice(1),data=d.getElementById(id).getAttribute('href').split(',')[1];return sharp(Buffer.from(data,'base64')).ensureAlpha().raw().toBuffer({resolveWithObject:true})}
test('only the two fixed archive profiles admit the complete material/object set; old scenes retain their strict artboard',()=>{
 for(const[layout,spec]of Object.entries(layouts)){
  const svg=source(layout),d=parse(svg);assert.equal(validateAuthoredPaperSvg(svg,spec.scene),svg);assert.equal(d.documentElement.getAttribute('viewBox'),spec.viewBox)
  assert.deepEqual([...d.querySelectorAll('[data-archive-satellite]')].map(n=>n.getAttribute('data-archive-satellite')).sort(),['agent','conversation','date-record','person','task'])
  for(const mutation of[svg.replace(spec.viewBox,'0 0 1200 800'),svg.replace('data-archive-satellite="agent"','data-removed="agent"'),svg.replace('</svg>','<image href="https://example.com/paper.webp"/></svg>')])assert.throws(()=>validateAuthoredPaperSvg(mutation,spec.scene))
 }
 const old=read('src/dev/overhead-record/invoice.svg');assert.throws(()=>validateAuthoredPaperSvg(old.replace('0 0 900 600','0 0 600 800'),'invoiceOverheadProof'))
})
test('all archive endpoints sample opaque photographic borders and paths stay in negative space',async()=>{
 for(const[layout,spec]of Object.entries(layouts)){
  const d=parse(source(layout)),carriers=objects(d),defs=d.querySelector('defs').outerHTML,masks=new Map()
  for(const[id,p]of carriers)masks.set(id,(await rgba(`<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}">${defs}${p.g.outerHTML}</svg>`)).data)
  const opaque=(id,x,y)=>masks.get(id)[(Math.round(y)*spec.width+Math.round(x))*4+3]>=200
  for(const port of d.querySelectorAll('[data-paper-port]')){
   const p=carriers.get(port.getAttribute('data-port-carrier')),scale=p.width/p.crop[2],{data,info}=await materialPixels(d,p),side=port.getAttribute('data-port-side'),x=Number(port.getAttribute('cx')),y=Number(port.getAttribute('cy')),sx=p.crop[0]+(x-p.x)/scale,sy=p.crop[1]+(y-p.y)/scale,span=[]
   if(side==='left'||side==='right'){for(let px=p.crop[0];px<p.crop[0]+p.crop[2];px++)if(data[(Math.round(sy)*info.width+px)*4+3]>=200)span.push(px);assert(Math.abs(sx-(side==='left'?span[0]-.5:span.at(-1)+.5))*scale<.36)}
   else{for(let py=p.crop[1];py<p.crop[1]+p.crop[3];py++)if(data[(py*info.width+Math.round(sx))*4+3]>=200)span.push(py);assert(Math.abs(sy-(side==='top'?span[0]-.5:span.at(-1)+.5))*scale<.36)}
   assert.equal(port.getAttribute('fill'),'#ad5635')
  }
  for(const line of d.querySelectorAll('[data-paper-connection]')){
   const a=d.querySelector(`[data-paper-port="${line.getAttribute('data-connection-from')}"]`),b=d.querySelector(`[data-paper-port="${line.getAttribute('data-connection-to')}"]`),v=line.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);assert.deepEqual(v.slice(0,2),[Number(a.getAttribute('cx')),Number(a.getAttribute('cy'))]);assert.deepEqual(v.slice(-2),[Number(b.getAttribute('cx')),Number(b.getAttribute('cy'))]);assert.equal(line.getAttribute('stroke'),'#59665c')
   for(let i=8;i<=92;i+=2){const t=i/100,u=1-t,x=u**3*v[0]+3*u*u*t*v[2]+3*u*t*t*v[4]+t**3*v[6],y=u**3*v[1]+3*u*u*t*v[3]+3*u*t*t*v[5]+t**3*v[7];assert(![...carriers.keys()].some(id=>opaque(id,x,y)),`${layout}: connector crosses a paper object`)}
  }
 }
})
async function archiveInkErrors(svg){const d=parse(svg),p=objects(d).get('archive'),ink=d.querySelector('[data-paper-print="archive"]').cloneNode(true),box=[245,980,1000,1075];for(const e of[ink,...ink.querySelectorAll('*')])for(const a of['mask','clip-path'])e.removeAttribute(a);const width=Number(d.documentElement.getAttribute('viewBox').split(' ')[2]),height=Number(d.documentElement.getAttribute('viewBox').split(' ')[3]),{data,info}=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${ink.outerHTML}</svg>`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let count=0,bad=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>32){count++;const sx=p.crop[0]+(x-p.x)*p.crop[2]/p.width,sy=p.crop[1]+(y-p.y)*p.crop[2]/p.width;if(sx<box[0]||sx>box[2]||sy<box[1]||sy>box[3])bad++}assert(count>200,'actual rule ink is measured');return bad}
test('both archive rules stay on the same frontmost folder face at each scale; the old fixed offset fails',async()=>{
 for(const layout of Object.keys(layouts)){assert.equal(await archiveInkErrors(source(layout)),0,layout);const d=parse(source(layout));d.querySelector('[data-paper-print="archive"]').setAttribute('transform','translate(0 -22)');assert(await archiveInkErrors(d.documentElement.outerHTML)>0,'moving ink onto the rear folder fails the native-face guard')}
})
test('responsive publication retains graph bytes and exports complete self-contained layout/OG/square assets with current provenance',async()=>{
 const p=JSON.parse(read('public/images/posts/neotoma-paper/provenance.json')),archive=p.archiveHero;assert.equal(archive.sourceRepository,'https://github.com/markmhendrickson/markmhendrickson');assert.equal(p.sourceInputsByCommit[archive.sourceCommit].sourceRepository,archive.sourceRepository);assert.equal(archive.breakpoint,640);assert.deepEqual(archive.layouts,Object.fromEntries(Object.entries(layouts).map(([k,v])=>[k,v.viewBox])))
 for(const layout of Object.keys(layouts)){
  const name=`archive-hero-${layout}`,standalone=read(`public/images/posts/neotoma-paper/${name}.svg`),inline=read(`src/assets/neotoma-paper/published/${name}.svg`)
  assert.equal(standalone,source(layout));const restored=inline.replace(/href="\/images\/posts\/neotoma-paper\/materials\/([a-f0-9]{64})\.webp"/g,(_,digest)=>{const bytes=fs.readFileSync(path.join(app,`public/images/posts/neotoma-paper/materials/${digest}.webp`));assert.equal(hash(bytes),digest);return `href="data:image/webp;base64,${bytes.toString('base64')}"`});assert.equal(restored,standalone)
 }
 assert.equal(read('public/images/posts/neotoma-paper/hero.svg'),read('src/dev/overhead-record/connectedRecordsProof.svg'),'the detailed graph is unchanged, never replaced by archive pixels')
 for(const file of archive.outputs){const dir=file.endsWith('.jpg')?'public/images/og/':'public/images/posts/neotoma-paper/',bytes=fs.readFileSync(path.join(app,dir,file));assert.equal(hash(bytes),p.hashes[file]);assert.equal(p.outputSources[file].sourceCommit,archive.sourceCommit);assert.equal(p.outputSources[file].sourceRepository,archive.sourceRepository)}
 // Reproduce contain framing from the full desktop raster; a cover/crop cannot pass.
 const desktop=fs.readFileSync(path.join(app,'public/images/posts/neotoma-paper/archive-hero-desktop.png'))
 const square=await sharp(desktop).resize(1200,1200,{fit:'contain',background:'#f2eee5'}).png().toBuffer(),og=await sharp(desktop).resize(1200,630,{fit:'contain',background:'#f2eee5'}).jpeg({quality:92}).toBuffer()
 assert.equal(hash(square),p.hashes['archive-hero-square.png']);assert.equal(hash(og),p.hashes['your-agents-need-a-system-of-record-archive-1200x630.jpg'])
})
test('the new hero is responsive while the graph remains one body explainer in every locale and complete Markdown',async()=>{
 const {render}=await import(pathToFileURL(path.join(app,'dist/server/entry-server.js')).href)
 const locales=['en','es','ca','zh','hi','ar','fr','pt','ru','bn','ur','id','de'],slug='your-agents-need-a-system-of-record'
 for(const locale of locales){const prefix=locale==='en'?'':'/'+locale,d=new JSDOM(render(`${prefix}/posts/${slug}/`)).window.document;assert.equal(d.querySelectorAll('article [data-paper-responsive="archive-hero"]').length,1);assert.equal(d.querySelectorAll('article [data-paper-responsive-variant]').length,2);assert.equal(d.querySelectorAll('article [data-paper-scene="connectedRecordsProof"]').length,1);assert.equal(d.querySelectorAll('article [data-paper-figure]').length,6);const ids=[...d.querySelectorAll('article [id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);const md=read(`dist${prefix}/posts/${slug}.md`);assert(md.includes('/archive-hero-desktop.svg'));assert.equal(md.split('/images/posts/neotoma-paper/hero.svg').length-1,1);assert(!md.includes('data-paper-responsive'))}

})

test('the actual responsive CSS exposes exactly one SSR hero variant before hydration at narrow and wide widths',async()=>{
 const {render}=await import(pathToFileURL(path.join(app,'dist/server/entry-server.js')).href),html=render('/posts/your-agents-need-a-system-of-record/'),css=postcss.parse(read('src/index.css'))
 for(const width of[320,390,639,640,1280]){
  const d=new JSDOM(html).window.document,style=d.createElement('style'),rules=[]
  css.walkRules(rule=>{if(!rule.selector.includes('[data-paper-responsive-variant='))return;const media=rule.parent.type==='atrule'?rule.parent:null;if(media){const min=/min-width:\s*(\d+)px/.exec(media.params);assert(min,'responsive art uses an explicit fixed media profile');if(width<Number(min[1]))return}rules.push(rule.toString())});style.textContent=rules.join('\n');d.head.appendChild(style)
  const visible=[...d.querySelectorAll('article [data-paper-responsive-variant]')].filter(n=>d.defaultView.getComputedStyle(n).display!=='none');assert.equal(visible.length,1,`${width}: one announced/visible variant`);assert.equal(visible[0].getAttribute('data-paper-responsive-variant'),width<640?'mobile':'desktop')
  const hidden=d.querySelector(`article [data-paper-responsive-variant="${width<640?'desktop':'mobile'}"]`);hidden.style.display='block';assert.equal([...d.querySelectorAll('article [data-paper-responsive-variant]')].filter(n=>d.defaultView.getComputedStyle(n).display!=='none').length,2,'a leaked hidden twin is detected')
 }
})

test('actual opaque responsive compositions keep balanced margins on both artboards',async()=>{
 for(const[layout,spec]of Object.entries(layouts)){
  const d=parse(source(layout)),root=d.documentElement;for(const node of [...root.children])if(node.localName==='rect'||(node.localName==='svg'&&node.querySelector('use')?.getAttribute('href')==='#proof-ground'))node.remove()
  const {data,info}=await rgba(root.outerHTML);let l=info.width,r=-1,t=info.height,b=-1;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=200){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
  const margins=[l,info.width-r-1,t,info.height-b-1];assert(Math.min(...margins)>=20,`${layout}: all objects stay inset`);assert(Math.abs(margins[0]-margins[1])<=20&&Math.abs(margins[2]-margins[3])<=20,`${layout}: actual alpha bounds ${margins}`)
 }
})
