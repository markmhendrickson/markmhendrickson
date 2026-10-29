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
for(const name of['document-packet','email-envelope','email-envelope-open','observation-slip','entity-dossier','governed-folio','claims-sleeve','explanation-dossier','instance-archive-overhead'])pixels[name]=await sharp(fs.readFileSync(new URL(`../src/dev/overhead-record/materials/${name==='email-envelope-open'?'email-envelope-open-v2':name==='instance-archive-overhead'?'instance-archive-overhead-v1':name}.webp`,import.meta.url))).ensureAlpha().raw().toBuffer({resolveWithObject:true})
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
const motion=await server.ssrLoadModule('/src/lib/paperVisualMotion.ts');after(()=>server.close())
const carrierMap=d=>Object.fromEntries([...d.querySelectorAll('[data-scene-carrier]')].map(g=>{const svg=g.querySelector('svg');return[g.getAttribute('data-scene-carrier'),{material:svg.getAttribute('data-paper-raster'),x:Number(svg.getAttribute('x')),y:Number(svg.getAttribute('y')),width:Number(svg.getAttribute('width')),crop:svg.getAttribute('viewBox').split(' ').map(Number)}]}))
const compositionMargins=d=>{const objects=Object.values(carrierMap(d));return{left:Math.min(...objects.map(p=>p.x)),right:900-Math.max(...objects.map(p=>p.x+p.width))}}
function badPorts(s){const d=parse(s),carriers=carrierMap(d),bad=[];for(const pin of d.querySelectorAll('[data-paper-port]')){const p=carriers[pin.getAttribute('data-port-carrier')],scale=p.width/p.crop[2],sy=Math.round(p.crop[1]+(Number(pin.getAttribute('cy'))-p.y)/scale),sx=Math.round(p.crop[0]+(Number(pin.getAttribute('cx'))-p.x)/scale),{data,info}=pixels[p.material],span=[],side=pin.getAttribute('data-port-side');if(side==='left'||side==='right'){for(let x=p.crop[0];x<p.crop[0]+p.crop[2];x++)if(data[(sy*info.width+x)*4+3]>=200)span.push(x);const expected=side==='left'?span[0]-.5:span.at(-1)+.5;if(!span.length||Math.abs((p.crop[0]+(Number(pin.getAttribute('cx'))-p.x)/scale)-expected)*scale>.35)bad.push(pin.getAttribute('data-paper-port'))}else{for(let y=p.crop[1];y<p.crop[1]+p.crop[3];y++)if(data[(y*info.width+sx)*4+3]>=200)span.push(y);const expected=side==='top'?span[0]-.5:span.at(-1)+.5;if(!span.length||Math.abs((p.crop[1]+(Number(pin.getAttribute('cy'))-p.y)/scale)-expected)*scale>.35)bad.push(pin.getAttribute('data-paper-port'))}}return bad}
test('all five scenes bind exact approved resource profiles and wordless scene semantics',()=>{
 for(const[name,s]of Object.entries(sources)){assert.equal(validateAuthoredPaperSvg(s,name),s);assert.equal(parse(s).querySelectorAll('text,script,foreignObject').length,0)}
 const invoice=fs.readFileSync(new URL('../src/dev/overhead-record/invoice.svg',import.meta.url));assert.equal(createHash('sha256').update(invoice).digest('hex'),'3526812220577c3246c42da27ddd6f0965586adff58940c62e064ed3ae170f45')
 const advanced=parse(sources.governedCollaborationProof).querySelector('image[id="proof-instance-archive-overhead"]').outerHTML
 assert.throws(()=>validateAuthoredPaperSvg(sources.syntheticSourcesProof.replace('</defs>',advanced+'</defs>'),'syntheticSourcesProof'),/Untrusted authored material/)
 assert.throws(()=>validateAuthoredPaperSvg(sources.governedCollaborationProof.replace('data-paper-variant="overhead-governedCollaborationProof"','data-paper-variant="arbitrary"'),'governedCollaborationProof'),/Unknown overhead/)
 for(const s of Object.values(sources))for(const attack of['<image href="https://example.com/paper.webp"/>','<script/>','<text>hidden labels</text>'])assert.throws(()=>validateAuthoredPaperSvg(s.replace('</svg>',attack+'</svg>'),parse(s).documentElement.getAttribute('data-paper-scene')))
 assert.equal(Object.keys(PAPER_REMAINING_PROOF_ASSETS).length,3)
})
test('five distinct physical records preserve the original graph layout and source identities',()=>{
 const hero=parse(sources.connectedRecordsProof),carriers=carrierMap(hero)
 assert.equal(Object.keys(carriers).length,5)
 assert.deepEqual(Object.values(carriers).map(p=>p.material),['document-packet','entity-dossier','explanation-dossier','email-envelope','observation-slip'])
 assert.deepEqual([...hero.querySelectorAll('[data-entity-record]')].map(n=>n.getAttribute('data-entity-record')).sort(),['invoice','person','task'])
 assert.equal(hero.querySelectorAll('[data-retained-evidence="email"]').length,1)
 assert.equal(hero.querySelectorAll('[data-source-evidence="related-record"]').length,1)
 assert(carriers['invoice-record'].x<carriers['person-record'].x&&carriers['person-record'].x<carriers['followup-task'].x)
 assert(carriers['email-record'].y>carriers['person-record'].y&&carriers['related-note'].y>carriers['person-record'].y)
 const links=[...hero.querySelectorAll('[data-paper-connection]')].map(n=>[n.getAttribute('data-connection-from'),n.getAttribute('data-connection-to')])
 assert.deepEqual(links,[['invoice-person-a','invoice-person-b'],['person-task-a','person-task-b'],['person-email-a','person-email-b']])
 assert.equal(hero.querySelectorAll('[data-paper-port]').length,6)
})
test('gallery compositions have balanced outer margins at desktop and card scale',()=>{
 for(const name of ['governedCollaborationProof','competingClaimsProof']){
  const margins=compositionMargins(parse(sources[name]))
  assert(margins.left>=50&&margins.right>=50,`${name}: keeps a visible gutter`)
  assert(Math.abs(margins.left-margins.right)<=20,`${name}: balanced outer gutters`)
  // A source-coordinate regression must fail before rendering, at every size.
  const shifted=parse(sources[name]);shifted.querySelector('[data-scene-carrier] svg').setAttribute('x',0)
  const bad=compositionMargins(shifted);assert(Math.abs(bad.left-bad.right)>20)
 }
})
test('photographic ports match their opaque silhouettes; shifted endpoints fail',()=>{
 for(const[name,s]of Object.entries(sources)){assert.deepEqual(badPorts(s),[],name);for(const delta of[-3,3]){const d=parse(s),pin=d.querySelector('[data-paper-port]');pin.setAttribute('cx',Number(pin.getAttribute('cx'))+delta);assert(badPorts(d.documentElement.outerHTML).includes(pin.getAttribute('data-paper-port')))}}
})
test('hero connectors stay in negative space with ports on the paper edges',async()=>{
 const d=parse(sources.connectedRecordsProof),decoded=(await rasterPaperSvg(sources.connectedRecordsProof)).toString(),defs=parse(decoded).querySelector('defs').outerHTML,masks={}
 for(const object of d.querySelectorAll('[data-scene-carrier]')){
  const raw=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">${defs}${object.outerHTML}</svg>`
  masks[object.getAttribute('data-scene-carrier')]=(await sharp(Buffer.from(raw)).ensureAlpha().raw().toBuffer({resolveWithObject:true})).data
 }
 const opaque=(id,x,y)=>masks[id][(Math.round(y)*900+Math.round(x))*4+3]>200
 for(const line of d.querySelectorAll('[data-paper-connection]')){
  const a=d.querySelector(`[data-paper-port="${line.getAttribute('data-connection-from')}"]`),b=d.querySelector(`[data-paper-port="${line.getAttribute('data-connection-to')}"]`)
  const x1=Number(a.getAttribute('cx')),y1=Number(a.getAttribute('cy')),x2=Number(b.getAttribute('cx')),y2=Number(b.getAttribute('cy'))
  const from=a.getAttribute('data-port-carrier'),to=b.getAttribute('data-port-carrier'),direction=a.getAttribute('data-port-side')==='bottom'?[0,1]:[1,0]
  assert(opaque(from,x1-2*direction[0],y1-2*direction[1]),'source lies at its own paper edge')
  assert(!opaque(from,x1+3*direction[0],y1+3*direction[1]),'source faces clear space')
  assert(!opaque(to,x2-3*direction[0],y2-3*direction[1]),'target approached through clear space')
  assert(opaque(to,x2+2*direction[0],y2+2*direction[1]),'target lies at its own paper edge')
  const values=[...line.getAttribute('d').matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>Number(m[0]));assert.equal(values.length,8)
  assert.equal(values[0],x1);assert.equal(values[1],y1);assert.equal(values[6],x2);assert.equal(values[7],y2)
  for(let i=8;i<=92;i+=2){const t=i/100,u=1-t,x=u*u*u*values[0]+3*u*u*t*values[2]+3*u*t*t*values[4]+t*t*t*values[6],y=u*u*u*values[1]+3*u*u*t*values[3]+3*u*t*t*values[5]+t*t*t*values[7];assert(!Object.keys(masks).some(id=>opaque(id,x,y)),`connector ${line.getAttribute('data-connection-from')} crosses paper at ${i}%`)}
 }
 const shifted=parse(sources.connectedRecordsProof),pin=shifted.querySelector('[data-paper-port]');pin.setAttribute('cx',Number(pin.getAttribute('cx'))+4);assert(badPorts(shifted.documentElement.outerHTML).includes(pin.getAttribute('data-paper-port')))
})
// These measured source-native FACE windows are independent of generator print rectangles.
// They exclude folio gutters, sleeve pockets, folded corners, and the dossier window border.
const nativeFaces={'governed-folio':[[130,335,560,620],[710,335,1120,620]],'claims-sleeve':[[185,220,550,440],[710,220,1055,440],[245,785,1000,875]],'explanation-dossier':[[330,210,900,480],[355,650,875,1010]]}
async function inkErrors(s){const d=parse(s),carriers=carrierMap(d),errors=[];for(const g of d.querySelectorAll('[data-paper-print]')){const id=g.getAttribute('data-paper-print'),p=carriers[id],box=g.getAttribute('data-print-box').split(' ').map(Number),copy=g.cloneNode(true);for(const node of[copy,...copy.querySelectorAll('*')])for(const a of['clip-path','mask','style'])node.removeAttribute(a);const {data,info}=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">${copy.outerHTML}</svg>`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let y=0;y<600;y++)for(let x=0;x<900;x++){if(data[(y*info.width+x)*4+3]<=32)continue;const sx=p.crop[0]+(x-p.x)*p.crop[2]/p.width,sy=p.crop[1]+(y-p.y)*p.crop[2]/p.width;const outside=x<box[0]||x>box[0]+box[2]||y<box[1]||y>box[1]+box[3];const body=pixels[p.material];const opaque=body.data[(Math.round(sy)*body.info.width+Math.round(sx))*4+3]>=200;const faces=nativeFaces[p.material],faceSafe=!faces||faces.some(([l,t,r,b])=>sx>=l&&sx<=r&&sy>=t&&sy<=b);if(outside||!opaque||!faceSafe){errors.push({id,x,y,outside,opaque,faceSafe});y=600;break}}}return errors}
test('unmasked print stays on face-safe material windows; moved print fails',async()=>{
 for(const[name,s]of Object.entries(sources)){assert.deepEqual(await inkErrors(s),[],name)}
 const bleed=parse(sources.competingClaimsProof);bleed.querySelector('[data-paper-print]').setAttribute('transform','translate(0 50)');assert((await inkErrors(bleed.documentElement.outerHTML)).length>0)
})
test('retained evidence, shared instance, explicit decision, and bounded impact survive the complete static frame',()=>{
 const hero=parse(sources.connectedRecordsProof);assert.deepEqual([...hero.querySelectorAll('[data-entity-record]')].map(n=>n.getAttribute('data-entity-record')).sort(),['invoice','person','task']);assert.equal(hero.querySelectorAll('[data-connection-kind="entity-relation"]').length,2);assert.equal(hero.querySelectorAll('[data-connection-kind="evidence"]').length,1)
 const synthetic=parse(sources.syntheticSourcesProof);assert.equal(synthetic.querySelectorAll('[data-paper-source]').length,2);assert.equal(synthetic.querySelectorAll('[data-paper-observation]').length,2);assert.equal(synthetic.querySelectorAll('[data-current-field],[data-paper-current-record]').length,0)
 const folio=parse(sources.governedCollaborationProof);assert.equal(folio.querySelectorAll('[data-shared-reader]').length,3);assert.equal(folio.querySelectorAll('[data-shared-instance="one"]').length,1);assert.equal(folio.querySelectorAll('[data-paper-raster="instance-archive-overhead"]').length,1)
 const claims=parse(sources.competingClaimsProof);assert.equal(claims.querySelectorAll('[data-retained-claim]').length,2);const old=claims.querySelector('[data-retained-claim="prior"] [data-field-icon="due"]'),later=claims.querySelector('[data-retained-claim="later"] [data-field-icon="due"]'),chosen=claims.querySelector('[data-selected-position] [data-field-icon="due"]');assert.equal(old.querySelector('path').getAttribute('d').replace(/\d+/g,'#'),later.querySelector('path').getAttribute('d').replace(/\d+/g,'#'));assert.notEqual(old.getAttribute('data-field-value'),later.getAttribute('data-field-value'));assert.equal(chosen.getAttribute('data-field-value'),later.getAttribute('data-field-value'))
 const impact=parse(sources.explanationsImpactProof);assert.equal(impact.querySelectorAll('[data-impact-record]').length,3);assert.equal(impact.querySelectorAll('[data-connection-kind="impact"]').length,2);assert(![...impact.querySelectorAll('[data-paper-port]')].some(p=>p.getAttribute('data-port-carrier')==='unaffected-record'));assert.deepEqual([...impact.querySelectorAll('[data-basis-part]')].map(n=>n.getAttribute('data-basis-part')).sort(),['authority','source'])
 for(const[name,remove]of[['syntheticSourcesProof','data-paper-observation="email-observation"'],['governedCollaborationProof','data-shared-instance="one"'],['competingClaimsProof','data-retained-claim="prior"'],['explanationsImpactProof','data-impact-record="unaffected"']])assert.throws(()=>validateAuthoredPaperSvg(sources[name].replace(remove,'data-broken="removed"'),name))
})
test('paper/ink move together, lines wait for settled carriers, decisions preserve both claims and typed relation/evidence widths',()=>{
 for(const[name,s]of Object.entries(sources)){
  const d=parse(s),calls=new Map();for(const node of d.querySelectorAll('*'))node.animate=(frames,options)=>{const a={frames,options};calls.set(node,a);return a};const result=motion.playPaperScene(d.documentElement);assert(result.length>0,name)
  const carriers=carrierMap(d)
  for(const[id,p]of Object.entries(carriers)){const groups=[...d.querySelectorAll(`[data-paper-motion-carrier="${id}"]`)];if(!groups.length)continue;assert.equal(groups.length,2);assert.deepEqual(calls.get(groups[0]),calls.get(groups[1]));assert(calls.get(groups[0]).frames.every(f=>f.transform.includes('rotate(0deg)')))}
  for(const line of d.querySelectorAll('[data-paper-connection]')){const endpoints=['data-connection-from','data-connection-to'].map(a=>d.querySelector(`[data-paper-port="${line.getAttribute(a)}"]`).getAttribute('data-port-carrier'));for(const id of endpoints){if(!id)continue;const paper=d.querySelector(`[data-scene-carrier="${id}"]`);if(paper?.hasAttribute('data-paper-object'))assert(Number(line.getAttribute('data-connection-delay'))>=Number(paper.getAttribute('data-enter-delay'))+820)}assert.equal(calls.get(line).frames.at(-1).strokeDasharray,'1');assert.equal(line.getAttribute('stroke-width'),line.getAttribute('data-connection-kind')==='entity-relation'?'4':'2.8');for(const attr of['data-connection-from','data-connection-to']){const port=d.querySelector(`[data-paper-port="${line.getAttribute(attr)}"]`),animation=calls.get(port);assert(animation,'every connector port fades in');assert.equal(animation.frames[0].opacity,0);assert(Number(animation.options.delay)>=Number(line.getAttribute('data-connection-delay'))+650)}}
  for(const node of d.querySelectorAll('[data-retained-claim],[data-bounded-domain="untouched"],[data-impact-record="unaffected"]'))assert(!calls.has(node),'retained or out-of-scope records do not disappear/change')
 }
})
test('all five scene exports rasterize at full, card and small widths with a coherent opaque static frame',async()=>{
 for(const s of Object.values(sources)){const raster=await rasterPaperSvg(s);for(const width of[900,330,235]){const metadata=await sharp(raster).resize(width).png().toBuffer({resolveWithObject:true});assert.equal(metadata.info.width,width);assert(metadata.data.length>10000)}}
})
