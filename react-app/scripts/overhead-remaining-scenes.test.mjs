import assert from 'node:assert/strict'
import {test,after}from'node:test'
import fs from'node:fs'
import sharp from'sharp'
import{JSDOM}from'jsdom'
import{createServer}from'vite'
import{createHash}from'node:crypto'
import{validateAuthoredPaperSvg,rasterPaperSvg,PAPER_REMAINING_PROOF_ASSETS}from'./export-paper-artwork.mjs'
const names=['connectedRecordsProof','syntheticSourcesProof','governedCollaborationProof','competingClaimsProof','explanationsImpactProof']
const sources=Object.fromEntries(names.map(n=>[n,fs.readFileSync(new URL(`../src/dev/overhead-record/${n}.svg`,import.meta.url),'utf8')]))
const parse=s=>new JSDOM(s,{contentType:'image/svg+xml'}).window.document
const pixels={}
for(const name of['document-packet','email-envelope','observation-slip','entity-dossier','governed-folio','claims-sleeve','explanation-dossier'])pixels[name]=await sharp(fs.readFileSync(new URL(`../src/dev/overhead-record/materials/${name}.webp`,import.meta.url))).ensureAlpha().raw().toBuffer({resolveWithObject:true})
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
const motion=await server.ssrLoadModule('/src/lib/paperVisualMotion.ts');after(()=>server.close())
const carrierMap=d=>Object.fromEntries([...d.querySelectorAll('[data-scene-carrier]')].map(g=>{const svg=g.querySelector('svg');return[g.getAttribute('data-scene-carrier'),{material:svg.getAttribute('data-paper-raster'),x:Number(svg.getAttribute('x')),y:Number(svg.getAttribute('y')),width:Number(svg.getAttribute('width')),crop:svg.getAttribute('viewBox').split(' ').map(Number)}]}))
function badPorts(s){const d=parse(s),carriers=carrierMap(d),bad=[];for(const pin of d.querySelectorAll('[data-paper-port]')){const p=carriers[pin.getAttribute('data-port-carrier')],scale=p.width/p.crop[2],sy=Math.round(p.crop[1]+(Number(pin.getAttribute('cy'))-p.y)/scale),sx=p.crop[0]+(Number(pin.getAttribute('cx'))-p.x)/scale,{data,info}=pixels[p.material],span=[];for(let x=p.crop[0];x<p.crop[0]+p.crop[2];x++)if(data[(sy*info.width+x)*4+3]>=200)span.push(x);const expected=pin.getAttribute('data-port-side')==='left'?span[0]-.5:span.at(-1)+.5;if(!span.length||Math.abs(sx-expected)*scale>.35)bad.push(pin.getAttribute('data-paper-port'))}return bad}
test('all five scenes bind exact approved resource profiles, wordless scene semantics and immutable accepted invoice',()=>{
 for(const[name,s]of Object.entries(sources)){assert.equal(validateAuthoredPaperSvg(s,name),s);assert.equal(parse(s).querySelectorAll('text,script,foreignObject').length,0)}
 const invoice=fs.readFileSync(new URL('../src/dev/overhead-record/invoice.svg',import.meta.url));assert.equal(createHash('sha256').update(invoice).digest('hex'),'62d013bbd3455edb50ce2ee20b655ab69601b72c9020939a608df986532ee703')
 const advanced=parse(sources.governedCollaborationProof).querySelector('image[id="proof-governed-folio"]').outerHTML
 assert.throws(()=>validateAuthoredPaperSvg(sources.syntheticSourcesProof.replace('</defs>',advanced+'</defs>'),'syntheticSourcesProof'),/Untrusted authored material/)
 assert.throws(()=>validateAuthoredPaperSvg(sources.governedCollaborationProof.replace('data-paper-variant="overhead-governedCollaborationProof"','data-paper-variant="arbitrary"'),'governedCollaborationProof'),/Unknown overhead/)
 for(const s of Object.values(sources))for(const attack of['<image href="https://example.com/paper.webp"/>','<script/>','<text>hidden labels</text>'])assert.throws(()=>validateAuthoredPaperSvg(s.replace('</svg>',attack+'</svg>'),parse(s).documentElement.getAttribute('data-paper-scene')))
 assert.equal(Object.keys(PAPER_REMAINING_PROOF_ASSETS).length,3)
})
test('photographic ports match their opaque silhouettes; original hero connectors remain in clear gaps',()=>{
 for(const[name,s]of Object.entries(sources)){if(name==='connectedRecordsProof')continue;assert.deepEqual(badPorts(s),[],name);for(const delta of[-3,3]){const d=parse(s),pin=d.querySelector('[data-paper-port]');pin.setAttribute('cx',Number(pin.getAttribute('cx'))+delta);assert(badPorts(d.documentElement.outerHTML).includes(pin.getAttribute('data-paper-port')))}}
 const hero=parse(sources.connectedRecordsProof),original=parse(fs.readFileSync(new URL('../src/assets/neotoma-paper/hero.svg',import.meta.url),'utf8'))
 assert.equal(hero.querySelectorAll('[data-paper-object]').length,5)
 assert.deepEqual([...hero.querySelectorAll('[data-paper-object]')].map(n=>n.querySelector('path')?.getAttribute('d')),[...original.querySelectorAll('[data-paper-object]')].map(n=>n.querySelector('path')?.getAttribute('d')))
 for(const line of hero.querySelectorAll('[data-paper-connection]')){const id=line.getAttribute('data-connection-from'),end=line.getAttribute('data-connection-to');const a=hero.querySelector(`[data-paper-port="${id}"]`),b=hero.querySelector(`[data-paper-port="${end}"]`);assert(a&&b);assert.equal(line.getAttribute('stroke'),'#59665c');assert.notEqual(line.getAttribute('stroke'),hero.querySelector('[data-paper-print="invoice"] [data-field-icon]').getAttribute('stroke'));assert.equal(line.getAttribute('d').startsWith(`M${a.getAttribute('cx')} ${a.getAttribute('cy')}`),true)}
})
test('hero port pairs sit at source and target borders, and no connector traverses a paper object',async()=>{
 const d=parse(sources.connectedRecordsProof),defs=d.querySelector('defs').outerHTML,masks=[]
 for(const object of d.querySelectorAll('[data-paper-object]')){
  const raw=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">${defs}${object.parentElement.outerHTML}</svg>`
  const {data}=await sharp(Buffer.from(raw)).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  masks.push(data)
 }
 const opaque=(x,y)=>masks.some(data=>data[(Math.round(y)*900+Math.round(x))*4+3]>200)
 const check=(doc)=>{for(const line of doc.querySelectorAll('[data-paper-connection]')){
  const a=doc.querySelector(`[data-paper-port="${line.getAttribute('data-connection-from')}"]`),b=doc.querySelector(`[data-paper-port="${line.getAttribute('data-connection-to')}"]`)
  const x1=Number(a.getAttribute('cx')),y1=Number(a.getAttribute('cy')),x2=Number(b.getAttribute('cx')),y2=Number(b.getAttribute('cy'))
  const path=line.getAttribute('d');assert.equal(path, x1===x2?`M${x1} ${y1}V${y2}`:`M${x1} ${y1}H${x2}`)
  const distance=Math.hypot(x2-x1,y2-y1),dx=(x2-x1)/distance,dy=(y2-y1)/distance
  assert(opaque(x1-2*dx,y1-2*dy),'source port lies on its object border')
  assert(!opaque(x1+3*dx,y1+3*dy),'source port opens to clear space')
  assert(!opaque(x2-3*dx,y2-3*dy),'target port is reached through clear space')
  assert(opaque(x2+2*dx,y2+2*dy),'target port lies on its object border')
  for(let t=6;t<distance-6;t+=2)assert(!opaque(x1+t*dx,y1+t*dy),'connector remains in negative space')
 }}
 check(d)
 const moved=parse(sources.connectedRecordsProof),line=moved.querySelector('[data-paper-connection]'),pin=moved.querySelector(`[data-paper-port="${line.getAttribute('data-connection-from')}"]`);pin.setAttribute('cx',Number(pin.getAttribute('cx'))+4);line.setAttribute('d',line.getAttribute('d').replace(/^M\d+ /,`M${pin.getAttribute('cx')} `));assert.throws(()=>check(moved),'moving both endpoint and path off the border fails')
})
// These measured source-native FACE windows are independent of generator print rectangles.
// They exclude folio gutters, sleeve pockets, folded corners, and the dossier window border.
const nativeFaces={'governed-folio':[[130,335,560,620],[710,335,1120,620]],'claims-sleeve':[[185,220,550,440],[710,220,1055,440],[245,785,1000,875]],'explanation-dossier':[[330,210,900,480],[355,650,875,1010]]}
async function inkErrors(s){const d=parse(s),carriers=carrierMap(d),errors=[];for(const g of d.querySelectorAll('[data-paper-print]')){const id=g.getAttribute('data-paper-print'),p=carriers[id],box=g.getAttribute('data-print-box').split(' ').map(Number),copy=g.cloneNode(true);for(const node of[copy,...copy.querySelectorAll('*')])for(const a of['clip-path','mask','style'])node.removeAttribute(a);const {data,info}=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">${copy.outerHTML}</svg>`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let y=0;y<600;y++)for(let x=0;x<900;x++){if(data[(y*info.width+x)*4+3]<=32)continue;const sx=p.crop[0]+(x-p.x)*p.crop[2]/p.width,sy=p.crop[1]+(y-p.y)*p.crop[2]/p.width;const outside=x<box[0]||x>box[0]+box[2]||y<box[1]||y>box[1]+box[3];const body=pixels[p.material];const opaque=body.data[(Math.round(sy)*body.info.width+Math.round(sx))*4+3]>=200;const faces=nativeFaces[p.material],faceSafe=!faces||faces.some(([l,t,r,b])=>sx>=l&&sx<=r&&sy>=t&&sy<=b);if(outside||!opaque||!faceSafe){errors.push({id,x,y,outside,opaque,faceSafe});y=600;break}}}return errors}
test('unmasked print stays on face-safe material windows; moved print fails',async()=>{
 for(const[name,s]of Object.entries(sources)){if(name==='connectedRecordsProof')continue;assert.deepEqual(await inkErrors(s),[],name)}
 const bleed=parse(sources.competingClaimsProof);bleed.querySelector('[data-paper-print]').setAttribute('transform','translate(0 50)');assert((await inkErrors(bleed.documentElement.outerHTML)).length>0)
})
test('retained evidence, shared instance, explicit decision, and bounded impact survive the complete static frame',()=>{
 const hero=parse(sources.connectedRecordsProof);assert.deepEqual([...hero.querySelectorAll('[data-entity-record]')].map(n=>n.getAttribute('data-entity-record')).sort(),['invoice','person','task']);assert.equal(hero.querySelectorAll('[data-connection-kind="entity-relation"]').length,2);assert.equal(hero.querySelectorAll('[data-connection-kind="evidence"]').length,1)
 const synthetic=parse(sources.syntheticSourcesProof);assert.equal(synthetic.querySelectorAll('[data-paper-source]').length,2);assert.equal(synthetic.querySelectorAll('[data-paper-observation]').length,2);assert.equal(synthetic.querySelectorAll('[data-current-field],[data-paper-current-record]').length,0)
 const folio=parse(sources.governedCollaborationProof);assert.equal(folio.querySelectorAll('[data-shared-reader]').length,2);assert.equal(folio.querySelectorAll('[data-shared-instance="one"]').length,1);assert.equal(folio.querySelectorAll('[data-record-page]').length,2)
 const claims=parse(sources.competingClaimsProof);assert.equal(claims.querySelectorAll('[data-retained-claim]').length,2);const old=claims.querySelector('[data-retained-claim="prior"] [data-field-icon="due"]'),later=claims.querySelector('[data-retained-claim="later"] [data-field-icon="due"]'),chosen=claims.querySelector('[data-selected-position] [data-field-icon="due"]');assert.equal(old.querySelector('path').getAttribute('d').replace(/\d+/g,'#'),later.querySelector('path').getAttribute('d').replace(/\d+/g,'#'));assert.notEqual(old.getAttribute('data-field-value'),later.getAttribute('data-field-value'));assert.equal(chosen.getAttribute('data-field-value'),later.getAttribute('data-field-value'))
 const impact=parse(sources.explanationsImpactProof);assert.equal(impact.querySelectorAll('[data-impact-record]').length,3);assert.equal(impact.querySelectorAll('[data-connection-kind="impact"]').length,2);assert(![...impact.querySelectorAll('[data-paper-port]')].some(p=>p.getAttribute('data-port-carrier')==='unaffected-record'));assert.deepEqual([...impact.querySelectorAll('[data-basis-part]')].map(n=>n.getAttribute('data-basis-part')).sort(),['authority','source'])
 for(const[name,remove]of[['syntheticSourcesProof','data-paper-observation="email-observation"'],['governedCollaborationProof','data-shared-instance="one"'],['competingClaimsProof','data-retained-claim="prior"'],['explanationsImpactProof','data-impact-record="unaffected"']])assert.throws(()=>validateAuthoredPaperSvg(sources[name].replace(remove,'data-broken="removed"'),name))
})
test('paper/ink move together, lines wait for settled carriers, decisions preserve both claims and typed relation/evidence widths',()=>{
 for(const[name,s]of Object.entries(sources)){
  const d=parse(s),calls=new Map();for(const node of d.querySelectorAll('*'))node.animate=(frames,options)=>{const a={frames,options};calls.set(node,a);return a};const result=motion.playPaperScene(d.documentElement);assert(result.length>0,name)
  const carriers=carrierMap(d)
  for(const[id,p]of Object.entries(carriers)){const groups=[...d.querySelectorAll(`[data-paper-motion-carrier="${id}"]`)];if(!groups.length)continue;assert.equal(groups.length,2);assert.deepEqual(calls.get(groups[0]),calls.get(groups[1]));assert(calls.get(groups[0]).frames.every(f=>f.transform.includes('rotate(0deg)')))}
  for(const line of d.querySelectorAll('[data-paper-connection]')){const endpoints=['data-connection-from','data-connection-to'].map(a=>d.querySelector(`[data-paper-port="${line.getAttribute(a)}"]`).getAttribute('data-port-carrier'));for(const id of endpoints){if(!id)continue;const paper=d.querySelector(`[data-scene-carrier="${id}"]`);if(paper?.hasAttribute('data-paper-object'))assert(Number(line.getAttribute('data-connection-delay'))>=Number(paper.getAttribute('data-enter-delay'))+820)}assert.equal(calls.get(line).frames.at(-1).strokeDasharray,'1');assert.equal(line.getAttribute('stroke-width'),line.getAttribute('data-connection-kind')==='entity-relation'?(name==='connectedRecordsProof'?'3.3':'4'):'2.8');for(const attr of['data-connection-from','data-connection-to']){const port=d.querySelector(`[data-paper-port="${line.getAttribute(attr)}"]`),animation=calls.get(port);assert(animation,'every connector port fades in');assert.equal(animation.frames[0].opacity,0);assert(Number(animation.options.delay)>=Number(line.getAttribute('data-connection-delay'))+650)}}
  for(const node of d.querySelectorAll('[data-retained-claim],[data-bounded-domain="untouched"],[data-impact-record="unaffected"]'))assert(!calls.has(node),'retained or out-of-scope records do not disappear/change')
 }
})
test('all five scene exports rasterize at full, card and small widths with a coherent opaque static frame',async()=>{
 for(const s of Object.values(sources)){const raster=await rasterPaperSvg(s);for(const width of[900,330,235]){const metadata=await sharp(raster).resize(width).png().toBuffer({resolveWithObject:true});assert.equal(metadata.info.width,width);assert(metadata.data.length>10000)}}
})
