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
const extraDefs={}
for(const [name,spec]of Object.entries(newMaterials)){const bytes=fs.readFileSync(path.join(dir,'materials',spec.file));if(createHash('sha256').update(bytes).digest('hex')!==spec.sha256)throw Error('Material hash changed');extraDefs[name]=`<image id="proof-${name}" width="1254" height="1254" href="data:image/webp;base64,${bytes.toString('base64')}"/>`}
const pixels={}
for(const name of Object.keys(crops))pixels[name]=await sharp(fs.readFileSync(path.join(dir,'materials',newMaterials[name]?.file||`${name}.webp`))).ensureAlpha().raw().toBuffer({resolveWithObject:true})
const n='#223e50',r='#ad5635',sage='#6c7865',connector='#59665c'
const rule=(x,y,w=70,thick=5)=>`<path d="M${x} ${y}h${w}" fill="none" stroke="${n}" stroke-width="${thick}"/>`
const bank=(x,y)=>`<g data-field-icon="amount" fill="none" stroke="${n}" stroke-width="2.6"><path d="M${x} ${y}h28v20h-28zM${x+4} ${y+4}h4M${x+20} ${y+16}h4"/><circle cx="${x+14}" cy="${y+10}" r="4"/></g>`
const calendar=(x,y,value='prior')=>`<g data-field-icon="due" data-field-value="${value}" stroke="${n}" stroke-width="2.6"><path d="M${x} ${y+4}h28v22h-28zM${x} ${y+11}h28M${x+7} ${y}v8M${x+21} ${y}v8" fill="none"/><path d="M${x+(value==='prior'?5:17)} ${y+16}h6v6h-6z" fill="${n}" stroke="none"/></g>`
const check=(x,y)=>`<path d="M${x} ${y+8}l7 7 15-19" fill="none" stroke="${n}" stroke-width="3.5"/>`
const key=(x,y)=>`<g fill="none" stroke="${n}" stroke-width="3"><circle cx="${x}" cy="${y}" r="7"/><path d="M${x+7} ${y}h25m-7 0v7m-8-7v5"/></g>`
const person=(x,y)=>`<g fill="none" stroke="${n}" stroke-width="3"><circle cx="${x}" cy="${y}" r="8"/><path d="M${x-14} ${y+27}v-8q14-18 28 0v8z"/></g>`
const agent=(x,y)=>`<g fill="none" stroke="${sage}" stroke-width="3"><rect x="${x}" y="${y}" width="36" height="26" rx="2"/><path d="M${x+7} ${y+8}l6 5-6 5m11 0h10"/></g>`
const chatCard=(x,y,variant)=>`<g data-chat-mark="${variant}" fill="none" stroke="${n}" stroke-width="2.8"><path d="M${x} ${y}h37v25h-25l-9 7v-7h-3z"/>${variant==='lines'?`<path d="M${x+7} ${y+8}h22M${x+7} ${y+15}h15"/>`:variant==='code'?`<path d="M${x+8} ${y+8}l7 5-7 5M${x+19} ${y+18}h10"/>`:`<path d="M${x+7} ${y+9}h24M${x+7} ${y+16}h8m5 0h11"/>`}</g>`
const envelope=(x,y)=>`<g fill="none" stroke="${sage}" stroke-width="3"><path d="M${x} ${y}h36v25h-36zM${x} ${y}l18 13 18-13"/></g>`
const claimCalendar=(x,y,side)=>`<g data-field-icon="due" data-field-value="${side}" fill="none" stroke="${n}" stroke-width="3.5"><path d="M${x} ${y+8}h82v73h-82zM${x} ${y+26}h82M${x+17} ${y}v16M${x+65} ${y}v16"/><path d="M${x+13} ${y+44}h22v22h-22zM${x+47} ${y+44}h22v22h-22z" stroke="${sage}" stroke-width="2.5"/><path d="M${x+(side==='prior'?14:48)} ${y+45}h20v20h-20z" fill="${r}" stroke="none"/></g>`
const checkInBox=(x,y)=>`<path d="M${x+3} ${y+9}l4 4 8-9" fill="none" stroke="${n}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`
const dueLetter=(x,y)=>`<g data-paper-letter="email" data-due-date="29" style="transform-box:view-box;transform-origin:0px 0px"><path d="M${x} ${y}h114v101h-114z" fill="#e9dfcc" stroke="#d2c4ad" stroke-width="1.8"/><g fill="none" stroke="${sage}" stroke-width="1.8" mask="url(#screenprint)"><path d="M${x+13} ${y+12}h83M${x+13} ${y+20}h58M${x+13} ${y+29}h39v45h-39zM${x+13} ${y+40}h39M${x+20} ${y+26}v7M${x+45} ${y+26}v7"/></g><g data-calendar-day="29" fill="none" stroke="${r}" stroke-width="2.4" mask="url(#screenprint)"><path d="M${x+20} ${y+51}q0-5 5-5t5 5q0 3-10 13h11M${x+38} ${y+59}q-5 1-5-6t6-7q5 0 5 7v7q0 8-11 7"/></g></g>`
const motion=(id,delay)=>`data-paper-object="" data-paper-motion-carrier="${id}" data-enter-x="-18" data-enter-y="10" data-enter-rotation="0" data-enter-delay="${delay}" style="transform-box:view-box;transform-origin:0px 0px"`
 function scene(name,title){
 const objects={},ports={},edges=[],boxes={},defs=[],body=[],ink=[]
 const add=(id,material,x,y,width,printBox,marks,attributes='',delay=null)=>{
  const crop=crops[material];objects[id]={material,x,y,width,crop,delay};boxes[id]=printBox
  const pose=delay===null?'':motion(id,delay)
  body.push(`<g data-scene-carrier="${id}" ${attributes} ${pose}><svg x="${x}" y="${y}" width="${width}" height="${width*crop[3]/crop[2]}" viewBox="${crop.join(' ')}" overflow="hidden" data-paper-raster="${material}"><use href="#proof-${material}"/></svg></g>`)
  defs.push(`<clipPath id="face-${id}"><rect x="${printBox[0]}" y="${printBox[1]}" width="${printBox[2]}" height="${printBox[3]}"/></clipPath>`)
  ink.push(`<g data-scene-ink="${id}" ${pose}><g data-paper-print="${id}" data-print-box="${printBox.join(' ')}" clip-path="url(#face-${id})" mask="url(#screenprint)">${marks}</g>{{ports:${id}}}</g>`)
 }
 const insert=(markup,definition='')=>{body.push(markup);if(definition)defs.push(definition)}
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
 const finish=()=>{
  const foreground=ink.map(s=>s.replace(/\{\{ports:([^}]+)\}\}/g,(_,id)=>Object.entries(ports).filter(([,p])=>p.carrier===id).map(([pid,p])=>`<circle data-paper-port="${pid}" data-port-carrier="${id}" data-port-side="${p.side}" cx="${p.x}" cy="${p.y}" r="4.8" fill="${r}"/>`).join(''))).join('')
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" class="paper-scene" data-paper-scene="${name}" data-paper-treatment="hybrid-record-proof" data-paper-variant="overhead-${name}" viewBox="0 0 900 600" role="img" aria-labelledby="scene-title"><title id="scene-title">${title}</title><style>svg[data-paper-variant="overhead-${name}"]{display:block;width:100%;height:auto;overflow:hidden;isolation:isolate}@media(prefers-reduced-motion:no-preference){svg[data-paper-variant="overhead-${name}"] [data-paper-port]{opacity:0}}</style><defs>${commonDefs}${[...new Set(Object.values(objects).map(p=>p.material))].map(m=>extraDefs[m]||'').join('')}${defs.join('')}</defs><rect width="900" height="600" fill="#f2eee5"/><use href="#proof-ground" opacity=".17"/>${body.join('')}<g data-paper-connections="">${edges.join('')}</g>${foreground}</svg>\n`
  validateAuthoredPaperSvg(svg,name);fs.writeFileSync(path.join(dir,`${name}.svg`),svg)
  return {name,sha256:createHash('sha256').update(svg).digest('hex'),objects,ports,printBoxes:boxes,title}
 }
 return {add,insert,link,finish}
}
const scenes=[]
{
 // Retain the five accepted physical forms and their composition: tabbed
 // folder, notched card, dog-eared note, wide record, and small slip. Their
 // original paper/fiber material is richer than the repeated dossier remake.
 const source=fs.readFileSync(path.join(app,'src/assets/neotoma-paper/hero.svg'),'utf8')
 const doc=new JSDOM(source,{contentType:'image/svg+xml'}).window.document,root=doc.documentElement
 root.setAttribute('data-paper-scene','connectedRecordsProof')
 root.setAttribute('data-paper-treatment','hybrid-record-proof')
 root.setAttribute('data-paper-variant','overhead-connectedRecordsProof')
 root.querySelector('style')?.insertAdjacentText('beforeend','@media(prefers-reduced-motion:no-preference){svg[data-paper-scene="connectedRecordsProof"] [data-paper-port]{opacity:0}}')
 root.querySelector('title').textContent='Distinct connected person, invoice and task records retain their own physical forms and evidence'
 for(const style of root.querySelectorAll('style'))style.textContent=style.textContent.replaceAll('svg[data-paper-scene="hero"]','svg[data-paper-scene="connectedRecordsProof"]')
 const paper=[...root.querySelectorAll('[data-paper-object]')]
 const roles=['person','invoice','task',null,null]
 paper.forEach((object,index)=>{
  object.setAttribute('data-enter-x',index%2?-14:14)
  object.setAttribute('data-enter-y',index%2?9:-8)
  object.setAttribute('data-enter-rotation','0')
  object.setAttribute('data-enter-delay',index*90)
  if(roles[index])object.setAttribute('data-entity-record',roles[index])
  if(index===3)object.setAttribute('data-retained-evidence','observation')
  if(index===4)object.setAttribute('data-source-evidence','source')
 })
 // The new role marks sit on the existing faces. The screenprint grain is the
 // same pinned material treatment used by the accepted invoice proof.
 const originalDefs=new JSDOM(approved,{contentType:'image/svg+xml'}).window.document
 for(const id of ['screen-grain','screenprint'])root.querySelector('defs').insertAdjacentHTML('beforeend',originalDefs.getElementById(id).outerHTML)
 // Preserve the approved print geometry, while giving its originally solid
 // navy blocks the same fine ink dropout as the newer proof scenes.
 for(const object of paper)for(const block of object.querySelectorAll('g[fill="#223e50"]'))block.setAttribute('mask','url(#screenprint)')
 // Rust circles are reserved for true inter-object connector ports in the
 // proof; the original task-note bullets remain but use sage ink.
 for(const mark of paper[2].querySelectorAll('circle[fill="#ae5632"]'))mark.setAttribute('fill',sage)
 // The original five paper objects already have distinct silhouettes and
 // native printed faces. Avoid a second, generic icon language on top of them.
 // The native rust bullets already identify the task. An additional mark
 // would compete with that print on the narrow note.
 for(const group of root.querySelectorAll('.paper-thread'))group.remove()
 const connections=[
  ['folder-card','entity-relation',372,157,472,157,900],
  ['card-task','entity-relation',633,157,714,157,990],
  ['card-record','evidence',552,261,552,333,1080],
 ]
 const back=doc.createElementNS('http://www.w3.org/2000/svg','g');back.setAttribute('data-paper-connections','')
 const front=doc.createElementNS('http://www.w3.org/2000/svg','g');front.setAttribute('data-paper-ports','')
 for(const [id,kind,x1,y1,x2,y2,delay]of connections){
  const bend=x1===x2?`M${x1} ${y1}V${y2}`:`M${x1} ${y1}H${x2}`
  back.insertAdjacentHTML('beforeend',`<path data-paper-connection="" data-connection-kind="${kind}" data-connection-from="${id}-a" data-connection-to="${id}-b" data-connection-delay="${delay}" d="${bend}" pathLength="1" fill="none" stroke="${connector}" stroke-width="${kind==='entity-relation'?3.3:2.8}" stroke-linecap="round"/>`)
  front.insertAdjacentHTML('beforeend',`<circle data-paper-port="${id}-a" cx="${x1}" cy="${y1}" r="4.5" fill="${r}"/><circle data-paper-port="${id}-b" cx="${x2}" cy="${y2}" r="4.5" fill="${r}"/>`)
 }
 root.insertBefore(back,paper[0].parentElement)
 root.appendChild(front)
 const svg=root.outerHTML+'\n';validateAuthoredPaperSvg(svg,'connectedRecordsProof')
 fs.writeFileSync(path.join(dir,'connectedRecordsProof.svg'),svg)
 scenes.push({name:'connectedRecordsProof',sha256:createHash('sha256').update(svg).digest('hex'),objects:{},ports:{},printBoxes:{},title:root.querySelector('title').textContent,source:'preserved-five-silhouette-hero'})
}
{
 const s=scene('syntheticSourcesProof','Original invoice and later email produce two retained observations before any current record is selected')
 s.add('invoice-source','document-packet',110,55,180,[133,82,130,173],rule(135,96,124,7)+bank(135,149)+rule(178,159,78)+calendar(135,204)+rule(178,217,55),'data-paper-source="invoice"')
 s.add('email-source','email-envelope-open',110,317,185,[136,349,120,55],'','data-paper-source="email" data-paper-envelope-state="open"')
 s.insert(dueLetter(137,306))
 s.insert('<g data-paper-envelope-front="email" data-paper-envelope-state="open" clip-path="url(#synthetic-envelope-front)"><svg x="110" y="317" width="185" height="144.094" viewBox="150 255 955 744" overflow="hidden"><use href="#proof-email-envelope-open"/></svg></g>','<clipPath id="synthetic-envelope-front"><rect x="110" y="377" width="185" height="90"/></clipPath>')
 s.add('email-closed','email-envelope',110,390,185,[135,424,130,38],'','data-paper-envelope-state="closed" opacity="0"')
 s.add('invoice-observation','observation-slip',515,105,245,[540,134,190,70],bank(542,138)+rule(585,148,135)+calendar(542,175)+rule(585,188,91),'data-paper-observation="invoice-observation"',0)
 s.add('email-observation','observation-slip',515,355,245,[540,393,190,35],calendar(542,396,'current')+rule(585,409,135),'data-paper-observation="email-observation"',1100)
 s.link('original-retained','invoice-source','right',159,'invoice-observation','left',148,'evidence',900)
 s.link('later-retained','email-source','right',415,'email-observation','left',409,'evidence',1960)
 scenes.push(s.finish())
}
{
 const s=scene('governedCollaborationProof','Three different connected tool slips reach one open shared Neotoma filing box')
 s.add('shared-archive','instance-archive-overhead',340,40,450,[440,220,205,180],'','data-shared-instance="one"')
 s.add('chat-reader','observation-slip',32,80,170,[51,100,138,56],`<path d="M54 101h134v52H54z" fill="#abc1cb" opacity=".38"/>${chatCard(64,111,'lines')}${rule(111,127,60)}`,'data-shared-reader="chat-blue"')
 s.add('terminal-reader','observation-slip',32,270,170,[51,290,138,56],`<path d="M54 291h134v52H54z" fill="#aab8a1" opacity=".40"/>${chatCard(64,301,'code')}${rule(111,317,60)}`,'data-shared-reader="chat-sage"')
 s.add('planner-reader','observation-slip',32,460,170,[51,480,138,56],`<path d="M54 481h134v52H54z" fill="#c8a68d" opacity=".35"/>${chatCard(64,491,'split')}${rule(111,507,60)}`,'data-shared-reader="chat-rust"')
 s.link('chat-shared','chat-reader','right',130,'shared-archive','left',220,'entity-relation',900)
 s.link('terminal-shared','terminal-reader','right',320,'shared-archive','left',320,'entity-relation',990)
 s.link('planner-shared','planner-reader','right',510,'shared-archive','left',440,'entity-relation',1080)
 scenes.push(s.finish())
}
{
 const s=scene('competingClaimsProof','Two incompatible retained claims remain visible beside an explicit selected position')
 s.add('claims-sleeve','claims-sleeve',190,40,500,[225,74,430,320],`<g data-retained-claim="prior">${claimCalendar(249,91,'prior')}${rule(356,144,43,3)}</g><g data-retained-claim="later">${claimCalendar(499,91,'current')}${rule(606,144,34,3)}<circle cx="616" cy="168" r="8" fill="${sage}"/></g><g data-selected-position="later"><g data-paper-field-state="prior" opacity="0"><path d="M282 354h22v22h-22z" fill="none" stroke="${sage}" stroke-width="3"/></g><g data-paper-field-state="current" opacity="1"><path d="M274 364l10 11 22-18" fill="none" stroke="${r}" stroke-width="5"/>${calendar(330,353,'current')}${rule(375,358,166)}<circle cx="562" cy="361" r="7" fill="${sage}"/></g></g>`,'data-claims-retained="both"')
 // The matching rust seal identifies which retained claim the decision adopts.
 s.add('decision-authority','observation-slip',730,420,120,[740,440,95,30],key(751,453)+`<circle cx="812" cy="454" r="5" fill="${sage}"/>`,'data-decision-authority="explicit"',1100)
 s.link('selection-authority','claims-sleeve','right',360,'decision-authority','left',453,'authority',1960)
 scenes.push(s.finish())
}
{
 const s=scene('explanationsImpactProof','The current field rests on its source and authority; the changed value reaches a schedule and task, while an unrelated record stays outside the path')
 s.add('explanation-dossier','explanation-dossier',70,65,360,[116,114,235,334],`<g data-explained-current-field="due">${calendar(143,145,'current')}${rule(189,158,129)}<path d="M318 153h12v12h-12z" fill="${sage}"/></g><g data-inspection-cue="magnifier" fill="none" stroke="${sage}" stroke-width="3"><circle cx="157" cy="159" r="20"/><path d="M172 174l18 18"/></g><g data-explanation-basis="retained-evidence-and-authority"><g data-basis-part="source">${envelope(150,315)}${rule(203,327,112)}</g><g data-basis-part="authority">${key(159,391)}${rule(207,390,106)}</g><path d="M318 383h12v12h-12z" fill="${sage}"/></g>`,'data-explanation-root="current"')
 s.add('affected-schedule','entity-dossier',630,48,160,[652,77,115,152],calendar(657,119,'current')+rule(703,132,59)+rule(657,185,102),'data-impact-record="affected-schedule"',0)
 s.add('affected-task','observation-slip',620,355,230,[645,380,170,62],`<path d="M649 390h18v18h-18z" fill="none" stroke="${n}" stroke-width="2.8"/>${checkInBox(649,390)}${rule(687,400,109)}<path d="M649 419h18v18h-18z" fill="none" stroke="${sage}" stroke-width="2.8"/>${rule(687,428,80)}`,'data-impact-record="affected-task"',900)
 s.add('unaffected-record','entity-dossier',468,453,100,[484,475,71,85],bank(489,502)+rule(489,545,54,3),'data-impact-record="unaffected"')
 s.link('impact-schedule','explanation-dossier','right',159,'affected-schedule','left',132,'impact',900)
 s.link('impact-task','explanation-dossier','right',390,'affected-task','left',400,'impact',1800)
 scenes.push(s.finish())
}
fs.writeFileSync(path.join(dir,'remaining-geometry.json'),JSON.stringify(scenes,null,2)+'\n')
console.log(JSON.stringify(scenes.map(({name,sha256})=>({name,sha256}))))
