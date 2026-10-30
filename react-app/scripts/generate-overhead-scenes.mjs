import {amountMark,dateMark,taskMark,invoicePrint,clipboardClip,letterPaper,inspectionGlass,OPEN_ENVELOPE_CROP,envelopeFrontPath} from './overhead-marks.mjs'
// Author the remaining local proof scenes through the existing trusted SVG exporter.
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import sharp from 'sharp'
import {createHash} from 'node:crypto'
import {JSDOM} from 'jsdom'
import {validateAuthoredPaperSvg} from './export-paper-artwork.mjs'
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(app,'src/dev/overhead-record')
const approved=fs.readFileSync(path.join(dir,'invoice.svg'),'utf8')
const original=new JSDOM(approved,{contentType:'image/svg+xml'}).window.document
// The open envelope is scene-specific, rather than an invisible payload in
// every proof. Other original paper materials remain shared.
original.querySelector('#proof-email-envelope-open')?.remove()
const commonDefs=original.querySelector('defs').innerHTML
const crops={...JSON.parse(fs.readFileSync(path.join(dir,'geometry.json'))).crops,'governed-folio':[55,275,1142,718],'claims-sleeve':[108,148,1042,971],'explanation-dossier':[198,80,896,1107],'instance-archive-overhead':[230,170,820,920]}
const newMaterials=JSON.parse(fs.readFileSync(path.join(dir,'remaining-materials.json')))
newMaterials['email-envelope-open']=JSON.parse(fs.readFileSync(path.join(dir,'materials.json'))).assets['email-envelope-open']
const physicalMaterials=JSON.parse(fs.readFileSync(path.join(dir,'physical-materials.json')))
const extraDefs={}
for(const name of ['clipboard-clip','inspection-glass']){const spec=physicalMaterials[name],bytes=fs.readFileSync(path.join(dir,'materials',spec.file));if(createHash('sha256').update(bytes).digest('hex')!==spec.sha256)throw Error('Physical material hash changed');extraDefs[name]=`<image id="proof-${name}" width="1254" height="1254" href="data:image/webp;base64,${bytes.toString('base64')}"/>`}
for(const [name,spec]of Object.entries(newMaterials)){const bytes=fs.readFileSync(path.join(dir,'materials',spec.file));if(createHash('sha256').update(bytes).digest('hex')!==spec.sha256)throw Error('Material hash changed');extraDefs[name]=`<image id="proof-${name}" width="1254" height="1254" href="data:image/webp;base64,${bytes.toString('base64')}"/>`}
const pixels={}
for(const name of Object.keys(crops))pixels[name]=await sharp(fs.readFileSync(path.join(dir,'materials',newMaterials[name]?.file||JSON.parse(fs.readFileSync(path.join(dir,'materials.json'))).assets[name]?.file||`${name}.webp`))).ensureAlpha().raw().toBuffer({resolveWithObject:true})
const n='#223e50',r='#ad5635',sage='#6c7865',connector='#59665c'
const rule=(x,y,w=70,thick=5)=>`<path d="M${x} ${y}h${w}" fill="none" stroke="${n}" stroke-width="${thick}"/>`
const bank=amountMark
const calendar=dateMark
const check=(x,y)=>`<path d="M${x} ${y+8}l7 7 15-19" fill="none" stroke="${n}" stroke-width="3.5"/>`
const key=(x,y)=>`<g fill="none" stroke="${n}" stroke-width="3"><circle cx="${x}" cy="${y}" r="7"/><path d="M${x+7} ${y}h25m-7 0v7m-8-7v5"/></g>`
const person=(x,y)=>`<g fill="none" stroke="${n}" stroke-width="3"><circle cx="${x}" cy="${y}" r="8"/><path d="M${x-14} ${y+27}v-8q14-18 28 0v8z"/></g>`
const agent=(x,y)=>`<g fill="none" stroke="${sage}" stroke-width="3"><rect x="${x}" y="${y}" width="36" height="26" rx="2"/><path d="M${x+7} ${y+8}l6 5-6 5m11 0h10"/></g>`
const chatCard=(x,y,variant)=>`<g data-chat-mark="${variant}" fill="none" stroke="${n}" stroke-width="2.8"><path d="M${x} ${y}h37v25h-25l-9 7v-7h-3z"/>${variant==='lines'?`<path d="M${x+7} ${y+8}h22M${x+7} ${y+15}h15"/>`:variant==='code'?`<path d="M${x+8} ${y+8}l7 5-7 5M${x+19} ${y+18}h10"/>`:`<path d="M${x+7} ${y+9}h24M${x+7} ${y+16}h8m5 0h11"/>`}</g>`
const envelope=(x,y)=>`<g fill="none" stroke="${sage}" stroke-width="3"><path d="M${x} ${y}h36v25h-36zM${x} ${y}l18 13 18-13"/></g>`
const claimCalendar=(x,y,side)=>`<g data-field-icon="due" data-field-value="${side}" data-calendar-surface="cool-blue" fill="none" stroke="${n}" stroke-width="3.5"><path d="M${x} ${y+8}h82v73h-82z" fill="#c4d7df"/><path d="M${x} ${y+8}h82v18h-82z" fill="#89aaba" stroke="none"/><path d="M${x} ${y+26}h82M${x+17} ${y}v16M${x+65} ${y}v16"/><path d="M${x+13} ${y+44}h22v22h-22zM${x+47} ${y+44}h22v22h-22z" stroke="${sage}" stroke-width="2.5"/><circle cx="${x+(side==='prior'?24:58)}" cy="${y+55}" r="9" fill="${sage}" stroke="none"/></g>`
const checkInBox=(x,y)=>`<path d="M${x+3} ${y+9}l4 4 8-9" fill="none" stroke="${n}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`
const dueLetter=(x,y)=>`<g data-paper-letter="email" data-due-date="later" style="transform-box:view-box;transform-origin:0px 0px">${letterPaper(x,y,114)}<g mask="url(#screenprint)">${rule(x+13,y+12,83,2)}${rule(x+13,y+21,58,2)}<g transform="translate(${x+27} ${y+36}) scale(1.65)">${calendar(0,0,'current')}</g></g></g>`
const shiftFace=(dx,[x,y,width,height])=>[x+dx,y,width,height]
const shiftInk=(dx,marks)=>`<g transform="translate(${dx} 0)">${marks}</g>`
const motion=(id,delay)=>`data-paper-object="" data-paper-motion-carrier="${id}" data-enter-x="-18" data-enter-y="10" data-enter-rotation="0" data-enter-delay="${delay}" style="transform-box:view-box;transform-origin:0px 0px"`
 function scene(name,title){
 const objects={},ports={},edges=[],boxes={},defs=[],body=[],ink=[],overlays=[]
 const add=(id,material,x,y,width,printBox,marks,attributes='',delay=null)=>{
  const crop=crops[material];objects[id]={material,x,y,width,crop,delay};boxes[id]=printBox
  const pose=delay===null?'':motion(id,delay)
  body.push(`<g data-scene-carrier="${id}" ${attributes} ${pose}><svg x="${x}" y="${y}" width="${width}" height="${width*crop[3]/crop[2]}" viewBox="${crop.join(' ')}" overflow="hidden" data-paper-raster="${material}" ${attributes.includes('data-shared-reader')?`filter="url(#surface-${attributes.match(/chat-(blue|sage|rust)/)[1]})"`:''}><use href="#proof-${material}"/></svg></g>`)
  defs.push(`<clipPath id="face-${id}"><rect x="${printBox[0]}" y="${printBox[1]}" width="${printBox[2]}" height="${printBox[3]}"/></clipPath>`)
  ink.push(`<g data-scene-ink="${id}" ${pose}><g data-paper-print="${id}" data-print-box="${printBox.join(' ')}" clip-path="url(#face-${id})" mask="url(#screenprint)">${marks}</g>{{ports:${id}}}</g>`)
 }
 const insert=(markup,definition='')=>{(markup.includes('physical-magnifier')?overlays:body).push(markup);if(definition)defs.push(definition)}
 const edge=(id,side,y)=>{
  const p=objects[id],crop=p.crop,scale=p.width/crop[2],row=Math.round(crop[1]+(y-p.y)/scale),{data,info}=pixels[p.material],span=[]
  for(let x=crop[0];x<crop[0]+crop[2];x++)if(data[(row*info.width+x)*4+3]>=200)span.push(x)
  if(!span.length)throw Error(`No opaque contour ${name}/${id}/${y}`)
  return {x:Number((p.x+((side==='left'?span[0]-.5:span.at(-1)+.5)-crop[0])*scale).toFixed(3)),y,carrier:id,side}
 }
 const link=(id,from,fromSide,fromY,to,toSide,toY,kind='evidence',delay=900)=>{
  const a=edge(from,fromSide,fromY),b=edge(to,toSide,toY);ports[id+'-a']=a;ports[id+'-b']=b
  if(a.side!=='right'||b.side!=='left'||b.x-a.x<24)throw Error(`Connection crosses an object or lacks a clear gap: ${name}/${id}`)
  const dx=Number((Math.min(90,(b.x-a.x)*.38)).toFixed(3))
  edges.push(`<path data-paper-connection="" data-connection-kind="${kind}" data-connection-from="${id}-a" data-connection-to="${id}-b" data-connection-delay="${delay}" d="M${a.x} ${a.y} C${Number((a.x+dx).toFixed(3))} ${a.y} ${Number((b.x-dx).toFixed(3))} ${b.y} ${b.x} ${b.y}" pathLength="1" fill="none" stroke="${connector}" stroke-width="${kind==='entity-relation'?4:2.8}" stroke-linecap="round"/>`)
 }
 const verticalEdge=(id,side,x)=>{
  const p=objects[id],scale=p.width/p.crop[2],column=Math.round(p.crop[0]+(x-p.x)/scale),{data,info}=pixels[p.material],span=[]
  for(let y=p.crop[1];y<p.crop[1]+p.crop[3];y++)if(data[(y*info.width+column)*4+3]>=200)span.push(y)
  if(!span.length)throw Error(`No opaque vertical contour ${name}/${id}/${x}`)
  return {x,y:Number((p.y+((side==='top'?span[0]-.5:span.at(-1)+.5)-p.crop[1])*scale).toFixed(3)),carrier:id,side}
 }
 const linkVertical=(id,from,fromX,to,toX,kind='evidence',delay=900)=>{
  const a=verticalEdge(from,'bottom',fromX),b=verticalEdge(to,'top',toX);ports[id+'-a']=a;ports[id+'-b']=b
  if(b.y-a.y<24)throw Error(`Vertical connection crosses an object or lacks a clear gap: ${name}/${id}`)
  const dy=Number((Math.min(45,(b.y-a.y)*.4)).toFixed(3))
  edges.push(`<path data-paper-connection="" data-connection-kind="${kind}" data-connection-from="${id}-a" data-connection-to="${id}-b" data-connection-delay="${delay}" d="M${a.x} ${a.y} C${a.x} ${Number((a.y+dy).toFixed(3))} ${b.x} ${Number((b.y-dy).toFixed(3))} ${b.x} ${b.y}" pathLength="1" fill="none" stroke="${connector}" stroke-width="${kind==='entity-relation'?4:2.8}" stroke-linecap="round"/>`)
 }
 const finish=()=>{
  const compositionOffset=({syntheticSourcesProof:[20,11],competingClaimsProof:[0,27],explanationsImpactProof:[34.5,0]})[name]
  const compositionOpen=compositionOffset?`<g data-paper-composition="${name}" transform="translate(${compositionOffset.join(' ')})">`:''
  const compositionClose=compositionOffset?'</g>':''
  const foreground=ink.map(s=>s.replace(/\{\{ports:([^}]+)\}\}/g,(_,id)=>Object.entries(ports).filter(([,p])=>p.carrier===id).map(([pid,p])=>`<circle data-paper-port="${pid}" data-port-carrier="${id}" data-port-side="${p.side}" cx="${p.x}" cy="${p.y}" r="4.8" fill="${r}"/>`).join(''))).join('')
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" class="paper-scene" data-paper-scene="${name}" data-paper-treatment="hybrid-record-proof" data-paper-variant="overhead-${name}" viewBox="0 0 900 600" role="img" aria-labelledby="scene-title"><title id="scene-title">${title}</title><style>svg[data-paper-variant="overhead-${name}"]{display:block;width:100%;height:auto;overflow:hidden;isolation:isolate}</style><defs>${commonDefs}${[...new Set(Object.values(objects).map(p=>p.material))].map(m=>extraDefs[m]||'').join('')}${defs.join('')}<filter id="surface-blue"><feColorMatrix type="matrix" values=".55 0 0 0 .12 0 .65 0 0 .15 0 0 .75 0 .18 0 0 0 1 0"/></filter><filter id="surface-sage"><feColorMatrix type="matrix" values=".60 0 0 0 .10 0 .65 0 0 .13 0 0 .50 0 .10 0 0 0 1 0"/></filter><filter id="surface-rust"><feColorMatrix type="matrix" values=".72 0 0 0 .15 0 .42 0 0 .10 0 0 .30 0 .08 0 0 0 1 0"/></filter></defs><rect width="900" height="600" fill="#f2eee5"/><use href="#proof-ground" opacity=".17"/>${compositionOpen}${body.join('')}<g data-paper-connections="">${edges.join('')}</g>${foreground}${overlays.join('')}${compositionClose}</svg>\n`
  validateAuthoredPaperSvg(svg,name);fs.writeFileSync(path.join(dir,`${name}.svg`),svg)
  return {name,sha256:createHash('sha256').update(svg).digest('hex'),objects,ports,printBoxes:boxes,title,compositionOffset:compositionOffset||[0,0]}
 }
 return {add,insert,link,linkVertical,finish}
}
const scenes=[]
{
 // Keep the five-object graph's original large-left / center / upper-right /
 // wide-lower / small-lower-right composition and three relationships. Use
 // the same photographed cutouts as the later scenes so each object has an
 // immediate, distinct identity rather than a second illustrated vocabulary.
 const s=scene('connectedRecordsProof','An itemized invoice, person record and clipboard task connect with an email and its revised due-date note')
 s.add('invoice-record','document-packet',55,70,330,[88,107,256,298],invoicePrint(55,70,330),'data-entity-record="invoice"',0)
 s.add('person-record','entity-dossier',468,68,170,[493,105,126,147],person(514,141)+rule(545,140,63,4)+rule(498,191,107,3)+rule(498,215,83,3),'data-entity-record="person"',90)
 s.add('followup-task','document-packet',710,69,145,[740,84,98,142],rule(752,122,67,3)+`<path d="M752 143h16v16h-16zM752 177h16v16h-16z" fill="none" stroke="${n}" stroke-width="2.8"/>${checkInBox(752,143)}${rule(779,151,40,3)}${rule(779,185,40,3)}${rule(752,211,67,2)}`,'data-entity-record="task"',180)
 s.insert(`<g ${motion('followup-task',180)}>${clipboardClip(761,67)}</g>`,extraDefs['clipboard-clip'])
 s.add('email-record','email-envelope',400,365,290,[430,390,225,129],'','data-retained-evidence="email"',270)
 s.add('related-note','observation-slip',742,424,120,[753,436,90,40],calendar(758,440,'current')+rule(796,455,36,3),'data-source-evidence="related-record" data-date-update="later"',360)
 s.link('invoice-person','invoice-record','right',157,'person-record','left',157,'entity-relation',930)
 s.link('person-task','person-record','right',157,'followup-task','left',157,'entity-relation',1020)
 s.linkVertical('person-email','person-record',552,'email-record',552,'evidence',1130)
 s.link('email-date-update','email-record','right',455,'related-note','left',455,'evidence',1250)
 scenes.push(s.finish())
}
{
 const s=scene('syntheticSourcesProof','Original invoice and later email produce two retained observations before any current record is selected')
 s.add('invoice-source','document-packet',110,55,180,[129,76,140,180],invoicePrint(110,55,180),'data-paper-source="invoice"')
 s.add('email-source','email-envelope-open',110,347,185,[136,349,120,55],'','data-paper-source="email" data-paper-envelope-state="open"')
 s.insert(dueLetter(137,336))
 s.insert(`<g data-paper-envelope-front="email" data-paper-envelope-state="open" clip-path="url(#synthetic-envelope-front)"><svg x="110" y="347" width="185" height="${185*OPEN_ENVELOPE_CROP[3]/OPEN_ENVELOPE_CROP[2]}" viewBox="${OPEN_ENVELOPE_CROP.join(' ')}" overflow="hidden"><use href="#proof-email-envelope-open"/></svg></g>`,`<clipPath id="synthetic-envelope-front"><path d="${envelopeFrontPath(110,347,185)}"/></clipPath>`)
 s.add('email-closed','email-envelope',110,420,185,[135,424,130,38],'','data-paper-envelope-state="closed" opacity="0"')
 s.add('invoice-observation','observation-slip',515,105,245,[540,134,190,70],bank(542,138)+rule(585,148,135)+calendar(542,175)+rule(585,188,91),'data-paper-observation="invoice-observation"',0)
 s.add('email-observation','observation-slip',515,355,245,[540,393,190,35],calendar(542,396,'current')+rule(585,409,135),'data-paper-observation="email-observation"',1100)
 s.link('original-retained','invoice-source','right',159,'invoice-observation','left',148,'evidence',900)
 s.link('later-retained','email-source','right',445,'email-observation','left',409,'evidence',1960)
 scenes.push(s.finish())
}
{
 const s=scene('governedCollaborationProof','Three different connected tool slips reach one open shared Neotoma filing box')
 // Keep the physical gap/three readers intact while centering their outer edges.
 const dx=39
 s.add('shared-archive','instance-archive-overhead',340+dx,40,450,shiftFace(dx,[440,220,205,180]),'','data-shared-instance="one"')
 s.add('chat-reader','observation-slip',32+dx,80,170,shiftFace(dx,[51,100,138,56]),shiftInk(dx,`${chatCard(64,106,'lines')}${rule(111,122,60)}`),'data-shared-reader="chat-blue"')
 s.add('terminal-reader','observation-slip',32+dx,270,170,shiftFace(dx,[51,290,138,56]),shiftInk(dx,`${chatCard(64,296,'code')}${rule(111,312,60)}`),'data-shared-reader="chat-sage"')
 s.add('planner-reader','observation-slip',32+dx,460,170,shiftFace(dx,[51,480,138,56]),shiftInk(dx,`${chatCard(64,486,'split')}${rule(111,502,60)}`),'data-shared-reader="chat-rust"')
 s.link('chat-shared','chat-reader','right',130,'shared-archive','left',220,'entity-relation',900)
 s.link('terminal-shared','terminal-reader','right',320,'shared-archive','left',320,'entity-relation',990)
 s.link('planner-shared','planner-reader','right',510,'shared-archive','left',440,'entity-relation',1080)
 scenes.push(s.finish())
}
{
 const s=scene('competingClaimsProof','Two incompatible due-date claims remain visible while an explicit decision adopts the initial date')
 // The sleeve and decision slip shift as one composition; their connector still
 // derives both border coordinates from the alpha contours after the move.
 const dx=-70
 s.add('claims-sleeve','claims-sleeve',190+dx,40,500,shiftFace(dx,[225,74,430,320]),shiftInk(dx,`<g data-retained-claim="prior">${claimCalendar(249,91,'prior')}${rule(356,144,43,3)}</g><g data-retained-claim="later">${claimCalendar(499,91,'current')}${rule(606,144,34,3)}<circle cx="616" cy="168" r="8" fill="${sage}"/></g><g data-selected-position="initial"><g data-paper-field-state="prior" opacity="0"><path d="M282 354h22v22h-22z" fill="none" stroke="${sage}" stroke-width="3"/></g><g data-paper-field-state="current" opacity="1"><path d="M274 364l10 11 22-18" fill="none" stroke="${r}" stroke-width="5"/>${calendar(330,353,'prior')}${rule(375,358,166)}<circle cx="562" cy="361" r="7" fill="${sage}"/></g></g>`),'data-claims-retained="both"')
 // The matching rust seal identifies which retained claim the decision adopts.
 s.add('decision-authority','observation-slip',730+dx,420,120,shiftFace(dx,[740,440,95,30]),shiftInk(dx,key(751,453)+`<circle cx="812" cy="454" r="5" fill="${sage}"/>`),'data-decision-authority="explicit"',1100)
 s.link('selection-authority','claims-sleeve','right',360,'decision-authority','left',453,'authority',1960)
 scenes.push(s.finish())
}
{
 const s=scene('explanationsImpactProof','A separate physical magnifying glass inspects a current field and its source and authority inside one dossier')
 s.add('explanation-dossier','explanation-dossier',180,25,450,[237,86,294,418],`<g data-explained-current-field="due">${calendar(271,125,'current')}${rule(329,141,161)}<path d="M490 135h14v14h-14z" fill="${sage}"/></g><g data-explanation-basis="retained-evidence-and-authority"><g data-basis-part="source">${envelope(280,337)}${rule(346,352,139)}</g><g data-basis-part="authority">${key(291,433)}${rule(351,432,133)}</g></g>`,'data-explanation-root="current" data-explanation-scope="single-record-inspection"')
 s.insert(`<g data-explanation-trace="basis-to-value" fill="none" stroke="${sage}" stroke-width="2.5"><path d="M326 350C425 320 515 280 497 210M333 433C440 433 525 310 497 210M497 210V141"/><circle cx="497" cy="141" r="4" fill="${sage}"/></g><g data-inspection-object="physical-magnifier" ${motion('inspection-tool',0)}>${inspectionGlass()}</g>`,extraDefs['inspection-glass'])
 scenes.push(s.finish())
}
fs.writeFileSync(path.join(dir,'remaining-geometry.json'),JSON.stringify(scenes,null,2)+'\n')
console.log(JSON.stringify(scenes.map(({name,sha256})=>({name,sha256}))))
