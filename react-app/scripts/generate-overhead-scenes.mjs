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
const commonDefs=original.querySelector('defs').innerHTML
const crops={...JSON.parse(fs.readFileSync(path.join(dir,'geometry.json'))).crops,'governed-folio':[55,275,1142,718],'claims-sleeve':[108,148,1042,971],'explanation-dossier':[198,80,896,1107]}
const newMaterials=JSON.parse(fs.readFileSync(path.join(dir,'remaining-materials.json')))
const extraDefs={}
for(const [name,spec]of Object.entries(newMaterials)){const bytes=fs.readFileSync(path.join(dir,'materials',spec.file));if(createHash('sha256').update(bytes).digest('hex')!==spec.sha256)throw Error('Material hash changed');extraDefs[name]=`<image id="proof-${name}" width="1254" height="1254" href="data:image/webp;base64,${bytes.toString('base64')}"/>`}
const pixels={}
for(const name of Object.keys(crops))pixels[name]=await sharp(fs.readFileSync(path.join(dir,'materials',`${name}.webp`))).ensureAlpha().raw().toBuffer({resolveWithObject:true})
const n='#223e50',r='#ad5635'
const rule=(x,y,w=70,thick=5)=>`<path d="M${x} ${y}h${w}" fill="none" stroke="${n}" stroke-width="${thick}"/>`
const bank=(x,y)=>`<g data-field-icon="amount" fill="none" stroke="${n}" stroke-width="2.6"><path d="M${x} ${y}h28v20h-28zM${x+4} ${y+4}h4M${x+20} ${y+16}h4"/><circle cx="${x+14}" cy="${y+10}" r="4"/></g>`
const calendar=(x,y,value='prior')=>`<g data-field-icon="due" data-field-value="${value}" stroke="${n}" stroke-width="2.6"><path d="M${x} ${y+4}h28v22h-28zM${x} ${y+11}h28M${x+7} ${y}v8M${x+21} ${y}v8" fill="none"/><path d="M${x+(value==='prior'?5:17)} ${y+16}h6v6h-6z" fill="${n}" stroke="none"/></g>`
const diamond=(x,y)=>`<path data-record-identity="" d="M${x} ${y-12}l12 12-12 12-12-12z" fill="none" stroke="${n}" stroke-width="3"/>`
const check=(x,y)=>`<path d="M${x} ${y+8}l7 7 15-19" fill="none" stroke="${n}" stroke-width="3.5"/>`
const key=(x,y)=>`<g fill="none" stroke="${n}" stroke-width="3"><circle cx="${x}" cy="${y}" r="7"/><path d="M${x+7} ${y}h25m-7 0v7m-8-7v5"/></g>`
const person=(x,y)=>`<g fill="none" stroke="${n}" stroke-width="3"><circle cx="${x}" cy="${y}" r="8"/><path d="M${x-14} ${y+27}v-8q14-18 28 0v8z"/></g>`
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
 const edge=(id,side,y)=>{
  const p=objects[id],crop=p.crop,scale=p.width/crop[2],row=Math.round(crop[1]+(y-p.y)/scale),{data,info}=pixels[p.material],span=[]
  for(let x=crop[0];x<crop[0]+crop[2];x++)if(data[(row*info.width+x)*4+3]>=200)span.push(x)
  if(!span.length)throw Error(`No opaque contour ${name}/${id}/${y}`)
  return {x:Number((p.x+((side==='left'?span[0]-.5:span.at(-1)+.5)-crop[0])*scale).toFixed(3)),y,carrier:id,side}
 }
 const link=(id,from,fromSide,fromY,to,toSide,toY,kind='evidence',delay=900)=>{
  const a=edge(from,fromSide,fromY),b=edge(to,toSide,toY);ports[id+'-a']=a;ports[id+'-b']=b
  const dx=Number(((b.x-a.x)*.5).toFixed(3))
  edges.push(`<path data-paper-connection="" data-connection-kind="${kind}" data-connection-from="${id}-a" data-connection-to="${id}-b" data-connection-delay="${delay}" d="M${a.x} ${a.y} C${Number((a.x+dx).toFixed(3))} ${a.y} ${Number((b.x-dx).toFixed(3))} ${b.y} ${b.x} ${b.y}" pathLength="1" fill="none" stroke="${n}" stroke-width="${kind==='entity-relation'?4:2.8}" ${kind==='entity-relation'?'':'stroke-dasharray=".025 .025"'} stroke-linecap="round"/>`)
 }
 const finish=()=>{
  const foreground=ink.map(s=>s.replace(/\{\{ports:([^}]+)\}\}/g,(_,id)=>Object.entries(ports).filter(([,p])=>p.carrier===id).map(([pid,p])=>`<circle data-paper-port="${pid}" data-port-carrier="${id}" data-port-side="${p.side}" cx="${p.x}" cy="${p.y}" r="4.8" fill="${r}"/>`).join(''))).join('')
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" class="paper-scene" data-paper-scene="${name}" data-paper-treatment="hybrid-record-proof" data-paper-variant="overhead-${name}" viewBox="0 0 900 600" role="img" aria-labelledby="scene-title"><title id="scene-title">${title}</title><style>svg[data-paper-variant="overhead-${name}"]{display:block;width:100%;height:auto;overflow:hidden;isolation:isolate}</style><defs>${commonDefs}${[...new Set(Object.values(objects).map(p=>p.material))].map(m=>extraDefs[m]||'').join('')}${defs.join('')}</defs><rect width="900" height="600" fill="#f2eee5"/><use href="#proof-ground" opacity=".17"/>${body.join('')}<g data-paper-connections="">${edges.join('')}</g>${foreground}</svg>\n`
  validateAuthoredPaperSvg(svg,name);fs.writeFileSync(path.join(dir,`${name}.svg`),svg)
  return {name,sha256:createHash('sha256').update(svg).digest('hex'),objects,ports,printBoxes:boxes,title}
 }
 return {add,link,finish}
}
const scenes=[]
{
 const s=scene('connectedRecordsProof','Connected entity records retain distinct field evidence trails')
 s.add('person-record','entity-dossier',90,180,155,[112,205,110,140],diamond(166,227)+person(166,264)+rule(120,322,88),'data-entity-record="person"')
 s.add('invoice-record','entity-dossier',385,75,175,[408,108,125,155],diamond(471,122)+bank(411,164)+rule(454,174,70)+calendar(411,216,'current')+rule(454,229,70),'data-entity-record="invoice"')
 s.add('project-record','entity-dossier',675,235,150,[698,262,105,132],diamond(749,279)+`<path d="M710 309h14v14h-14zM710 338h14v14h-14z" fill="none" stroke="${n}" stroke-width="2.5"/>`+check(712,310)+rule(734,316,49,3)+rule(734,345,49,3)+rule(706,375,90),'data-entity-record="task"')
 s.add('source-evidence','document-packet',80,30,70,[89,43,46,57],rule(91,49,40,4)+rule(91,65,29,2)+rule(91,80,36,2),'data-source-evidence="original"')
 s.add('retained-evidence','observation-slip',390,410,175,[410,439,132,38],calendar(412,442,'current')+rule(454,455,80),'data-retained-evidence="observation"',0)
 s.link('person-invoice','person-record','right',247,'invoice-record','left',193,'entity-relation',0)
 s.link('invoice-project','invoice-record','right',193,'project-record','left',311,'entity-relation',0)
 s.link('source-person','source-evidence','right',80,'person-record','left',322,'evidence',0)
 s.link('evidence-invoice','retained-evidence','right',455,'invoice-record','right',229,'evidence',900)
 scenes.push(s.finish())
}
{
 const s=scene('syntheticSourcesProof','Original invoice and later email produce two retained observations before any current record is selected')
 s.add('invoice-source','document-packet',110,55,180,[133,82,130,173],rule(135,96,124,7)+bank(135,149)+rule(178,159,78)+calendar(135,204)+rule(178,217,55),'data-paper-source="invoice"')
 s.add('email-source','email-envelope',110,390,185,[135,424,130,38],'','data-paper-source="email"')
 s.add('invoice-observation','observation-slip',515,105,245,[540,134,190,67],bank(542,138)+rule(585,148,135)+calendar(542,175)+rule(585,188,91),'data-paper-observation="invoice-observation"',0)
 s.add('email-observation','observation-slip',515,355,245,[540,393,190,35],calendar(542,396,'current')+rule(585,409,135),'data-paper-observation="email-observation"',1100)
 s.link('original-retained','invoice-source','right',159,'invoice-observation','left',148,'evidence',900)
 s.link('later-retained','email-source','right',442,'email-observation','left',409,'evidence',1960)
 scenes.push(s.finish())
}
{
 const s=scene('governedCollaborationProof','An authorized correction changes only the left domain while the right domain remains intact')
 s.add('domain-folio','governed-folio',190,150,520,[223,176,454,126],`<g data-bounded-domain="authorized"><path d="M229 181h180v100H229z" fill="#98a48b" opacity=".22"/>${person(254,201)}${key(299,211)}<g data-paper-field-state="prior" opacity="0">${calendar(250,247)}${rule(294,260,62)}</g><g data-paper-field-state="current" opacity="1">${calendar(250,247,'current')}${rule(294,260,91)}${check(374,254)}</g></g><g data-bounded-domain="untouched">${bank(495,201)}${rule(539,211,105)}${calendar(495,247)}${rule(539,260,66)}</g>`,'data-governed-domains="two"')
 s.add('authorized-actor','observation-slip',60,25,210,[81,53,160,48],person(96,60)+key(148,76)+`<path d="M190 59h30v25h-30zM198 68l5 4-5 4m10 0h7" fill="none" stroke="${n}" stroke-width="2.5"/>`,'data-correction-authority="scoped"')
 s.add('correction-observation','observation-slip',80,455,200,[101,486,151,34],calendar(103,489,'current')+rule(147,502,100),'data-authorized-correction="left-only"',1100)
 s.link('authority-to-left','authorized-actor','right',76,'domain-folio','left',227,'authority',0)
 s.link('correction-to-left','correction-observation','right',502,'domain-folio','left',275,'evidence',1960)
 scenes.push(s.finish())
}
{
 const s=scene('competingClaimsProof','Two incompatible retained claims remain visible beside an explicit selected position')
 s.add('claims-sleeve','claims-sleeve',190,40,500,[225,74,430,320],`<g data-retained-claim="prior">${calendar(247,100)}${rule(292,113,94)}${bank(247,164)}${rule(292,174,100)}</g><g data-retained-claim="later">${calendar(495,100,'current')}${rule(540,113,94)}${bank(495,164)}${rule(540,174,100)}</g><g data-selected-position="later"><g data-paper-field-state="prior" opacity="0"><path d="M278 356h22v22h-22z" fill="none" stroke="${n}" stroke-width="3"/></g><g data-paper-field-state="current" opacity="1">${check(278,356)}${calendar(326,347,'current')}${rule(371,360,176)}</g></g>`,'data-claims-retained="both"')
 // A separate authority seal records selection; neither physical claim is removed.
 s.add('decision-authority','observation-slip',700,420,150,[718,444,110,34],key(729,457)+check(790,450),'data-decision-authority="explicit"',1100)
 s.link('selection-authority','decision-authority','left',457,'claims-sleeve','right',360,'authority',1960)
 scenes.push(s.finish())
}
{
 const s=scene('explanationsImpactProof','A current field reveals retained evidence and authority, with two connected dependents and one unaffected record')
 s.add('explanation-dossier','explanation-dossier',70,70,360,[116,118,235,328],`<g data-explained-current-field="due">${calendar(140,148,'current')}${rule(186,161,125)}${key(245,207)}</g><g data-explanation-basis="retained-evidence-and-authority">${calendar(144,317)}${rule(189,330,99)}${calendar(144,366,'current')}${rule(189,379,130)}${person(154,405)}${key(217,423)}</g>`,'data-explanation-root="current"')
 s.add('affected-schedule','entity-dossier',625,45,160,[647,76,115,152],diamond(704,93)+calendar(652,132,'current')+rule(696,145,62)+rule(652,191,106),'data-impact-record="affected-schedule"',0)
 s.add('affected-payment','entity-dossier',625,300,160,[647,331,115,152],diamond(704,348)+bank(652,390)+rule(696,400,62)+rule(652,446,106),'data-impact-record="affected-payment"',900)
 s.add('unaffected-record','entity-dossier',450,440,105,[466,459,73,92],diamond(502,476)+bank(470,500)+rule(470,538,62),'data-impact-record="unaffected"')
 s.link('impact-schedule','explanation-dossier','right',161,'affected-schedule','left',145,'impact',900)
 s.link('impact-payment','explanation-dossier','right',207,'affected-payment','left',400,'impact',1800)
 scenes.push(s.finish())
}
fs.writeFileSync(path.join(dir,'remaining-geometry.json'),JSON.stringify(scenes,null,2)+'\n')
console.log(JSON.stringify(scenes.map(({name,sha256})=>({name,sha256}))))
