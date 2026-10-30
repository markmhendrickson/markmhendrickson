// Fixed authored responsive artboards; the existing renderer owns trust, raster and motion.
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {JSDOM} from 'jsdom'
import sharp from 'sharp'
import {dateMark,taskMark,clipboardClip} from './overhead-marks.mjs'
import {validateAuthoredPaperSvg} from './export-paper-artwork.mjs'
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(app,'src/dev/overhead-record')
const core=JSON.parse(fs.readFileSync(path.join(dir,'materials.json'))).assets,physical=JSON.parse(fs.readFileSync(path.join(dir,'physical-materials.json'))),archive=JSON.parse(fs.readFileSync(path.join(dir,'archive-material.json')))
const specs={'archive-tray':archive,'document-packet':core['document-packet'],'entity-dossier':core['entity-dossier'],'observation-slip':core['observation-slip'],'clipboard-clip':physical['clipboard-clip']}
const crops={'archive-tray':archive.crop,'document-packet':[239,121,833,1071],'entity-dossier':[199,102,892,1098],'observation-slip':[71,411,1149,577]}
const pixels={},definitions=[]
const prior=new JSDOM(fs.readFileSync(path.join(dir,'invoice.svg'),'utf8'),{contentType:'image/svg+xml'}).window.document
for(const id of ['proof-ground','screen-grain','screenprint'])definitions.push(prior.getElementById(id).outerHTML)
for(const[name,spec]of Object.entries(specs)){const bytes=fs.readFileSync(path.join(dir,'materials',spec.file));if(createHash('sha256').update(bytes).digest('hex')!==spec.sha256)throw Error('Archive material mismatch');definitions.push(`<image id="proof-${name}" width="1254" height="1254" href="data:image/webp;base64,${bytes.toString('base64')}"/>`);pixels[name]=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true})}
const navy='#223e50',sage='#59665c',rust='#ad5635'
const line=(x,y,w,t=3)=>`<path d="M${x} ${y}h${w}" fill="none" stroke="${navy}" stroke-width="${t}"/>`
const person=(x,y)=>`<g fill="none" stroke="${navy}" stroke-width="3"><circle cx="${x}" cy="${y}" r="9"/><path d="M${x-15} ${y+28}v-9q15-19 30 0v9z"/></g>`
const chat=(x,y)=>`<path d="M${x} ${y}h40v29h-24l-10 8v-8h-6zM${x+8} ${y+10}h24M${x+8} ${y+19}h16" fill="none" stroke="${navy}" stroke-width="3" stroke-linejoin="round"/>`
const agent=(x,y)=>`<g fill="none" stroke="${navy}" stroke-width="3"><path d="M${x} ${y+10}h42v29H${x}zM${x+21} ${y+10}V${y+2}M${x-5} ${y+17}v15M${x+47} ${y+17}v15"/><circle cx="${x+21}" cy="${y}" r="3" fill="#b9ced4"/><circle cx="${x+12}" cy="${y+23}" r="3" fill="${navy}"/><circle cx="${x+30}" cy="${y+23}" r="3" fill="${navy}"/><path d="M${x+12} ${y+33}h18"/></g>`
const profiles={
 desktop:{width:900,height:600,objects:{archive:['archive-tray',305,105,350],person:['entity-dossier',45,55,150],conversation:['observation-slip',40,280,180,'sage'],agent:['observation-slip',45,445,180,'blue'],task:['document-packet',735,55,120],'date-record':['observation-slip',725,405,145]},links:[['person','right',180,'archive','left',195],['conversation','right',326,'archive','left',305],['agent','right',490,'archive','left',415],['archive','right',195,'task','left',155],['archive','right',395,'date-record','left',440]]},
 mobile:{width:600,height:800,objects:{archive:['archive-tray',150,250,300],person:['entity-dossier',35,35,130],task:['document-packet',245,30,120],'date-record':['observation-slip',415,80,150],conversation:['observation-slip',55,655,190,'sage'],agent:['observation-slip',350,655,190,'blue']},links:[['person','bottom',115,'archive','top',200],['task','bottom',300,'archive','top',300],['date-record','bottom',475,'archive','top',400],['archive','bottom',230,'conversation','top',150],['archive','bottom',370,'agent','top',445]]}
}
const results=[]
for(const[layout,profile]of Object.entries(profiles)){
 const scene=layout==='desktop'?'archiveHeroDesktop':'archiveHeroMobile',defs=definitions.map(s=>s.includes('id="screenprint"')?s.replaceAll('height="600"',`height="${profile.height}"`):s),objects={},body=[],ink=[],connections=[],ports=[]
 const pose=id=>id==='archive'?'':`data-paper-object="" data-paper-motion-carrier="${id}" data-enter-x="${profile.objects[id][1]<profile.width/2?-16:16}" data-enter-y="8" data-enter-rotation="0" data-enter-delay="${Object.keys(profile.objects).indexOf(id)*70}" style="transform-box:view-box;transform-origin:0px 0px"`
 for(const[id,[material,x,y,width,color]]of Object.entries(profile.objects)){
  const crop=crops[material],height=width*crop[3]/crop[2];objects[id]={material,x,y,width,height,crop}
  body.push(`<g data-archive-${id==='archive'?'instance="one"':`satellite="${id}"`} data-scene-carrier="${id}" ${pose(id)}><svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${crop.join(' ')}" overflow="hidden" data-paper-raster="${material}" ${color?`filter="url(#archive-${color})"`:''}><use href="#proof-${material}"/></svg></g>`)
  let marks='',box=[x+15,y+(id==='agent'?16:20),width-30,height-(id==='agent'?31:35)]
  if(id==='archive'){const scale=width/crop[2],px=sourceX=>x+(sourceX-crop[0])*scale,py=sourceY=>y+(sourceY-crop[1])*scale;marks=line(px(280),py(1000),670*scale,10*scale)+line(px(280),py(1040),540*scale,5*scale);box=[px(245),py(980),755*scale,95*scale]}
  if(id==='person')marks=person(x+43,y+68)+line(x+68,y+66,width-90)+line(x+26,y+118,width-52,2)+line(x+26,y+135,width-66,2)
  if(id==='task')marks=`<g transform="translate(${x+25} ${y+42}) scale(.92)">${taskMark(0,0)}</g>`+line(x+25,y+112,width-52,2)
  if(id==='conversation')marks=chat(x+24,y+29)+line(x+81,y+43,width-105)+line(x+81,y+57,width-124,2)
  if(id==='agent')marks=agent(x+24,y+22)+line(x+89,y+45,width-114)+line(x+89,y+59,width-128,2)
  if(id==='date-record')marks=dateMark(x+22,y+24,'current')+line(x+66,y+37,width-89)+line(x+66,y+49,width-105,2)
  defs.push(`<clipPath id="face-${id}"><rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"/></clipPath>`)
  ink.push(`<g data-scene-ink="${id}" ${pose(id)}><g data-paper-print="${id}" data-print-box="${box.join(' ')}" clip-path="url(#face-${id})" mask="url(#screenprint)">${marks}</g>{{ports:${id}}}</g>`)
  if(id==='task')ink.push(`<g ${pose(id)}>${clipboardClip(x+width/2-22,y-1)}</g>`)
 }
 const edge=(id,side,coordinate)=>{const p=objects[id],scale=p.width/p.crop[2],{data,info}=pixels[p.material],span=[];if(['left','right'].includes(side)){const row=Math.round(p.crop[1]+(coordinate-p.y)/scale);for(let x=p.crop[0];x<p.crop[0]+p.crop[2];x++)if(data[(row*info.width+x)*4+3]>=200)span.push(x);if(!span.length)throw Error('Missing archive side');return{x:Number((p.x+((side==='left'?span[0]-.5:span.at(-1)+.5)-p.crop[0])*scale).toFixed(3)),y:coordinate,side,carrier:id}}const column=Math.round(p.crop[0]+(coordinate-p.x)/scale);for(let y=p.crop[1];y<p.crop[1]+p.crop[3];y++)if(data[(y*info.width+column)*4+3]>=200)span.push(y);if(!span.length)throw Error('Missing archive vertical edge');return{x:coordinate,y:Number((p.y+((side==='top'?span[0]-.5:span.at(-1)+.5)-p.crop[1])*scale).toFixed(3)),side,carrier:id}}
 for(const[from,fromSide,fromAt,to,toSide,toAt]of profile.links){const a=edge(from,fromSide,fromAt),b=edge(to,toSide,toAt),id=from+'-'+to;ports.push({...a,id:id+'-a'},{...b,id:id+'-b'});const vertical=['top','bottom'].includes(fromSide),gap=vertical?b.y-a.y:b.x-a.x;if(gap<24)throw Error(`Archive connector lacks gap ${layout}/${id}`);const bend=Math.min(50,gap*.4),d=vertical?`M${a.x} ${a.y}C${a.x} ${a.y+bend} ${b.x} ${b.y-bend} ${b.x} ${b.y}`:`M${a.x} ${a.y}C${a.x+bend} ${a.y} ${b.x-bend} ${b.y} ${b.x} ${b.y}`;connections.push(`<path data-paper-connection="" data-connection-kind="configured-instance" data-connection-from="${id}-a" data-connection-to="${id}-b" data-connection-delay="1300" pathLength="1" d="${d}" fill="none" stroke="${sage}" stroke-width="2.8" stroke-linecap="round"/>`)}
 const foreground=ink.map(s=>s.replace(/\{\{ports:([^}]+)\}\}/g,(_,id)=>ports.filter(p=>p.carrier===id).map(p=>`<circle data-paper-port="${p.id}" data-port-carrier="${id}" data-port-side="${p.side}" cx="${p.x}" cy="${p.y}" r="4.8" fill="${rust}"/>`).join(''))).join('')
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" class="paper-scene" data-paper-scene="${scene}" data-paper-treatment="hybrid-record-proof" data-paper-variant="overhead-${scene}" data-archive-layout="${layout}" viewBox="0 0 ${profile.width} ${profile.height}" role="img" aria-labelledby="archive-title"><title id="archive-title">An overhead archive of retained records connects with a person dossier, task clipboard, conversation, agent and date record</title><style>svg[data-archive-layout="${layout}"]{display:block;width:100%;height:auto;overflow:hidden;isolation:isolate}</style><defs>${defs.join('')}<filter id="archive-blue"><feColorMatrix type="matrix" values=".55 0 0 0 .12 0 .65 0 0 .15 0 0 .75 0 .18 0 0 0 1 0"/></filter><filter id="archive-sage"><feColorMatrix type="matrix" values=".60 0 0 0 .10 0 .65 0 0 .13 0 0 .50 0 .10 0 0 0 1 0"/></filter></defs><rect width="${profile.width}" height="${profile.height}" fill="#f2eee5"/><svg width="${profile.width}" height="${profile.height}" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice"><use href="#proof-ground" opacity=".17"/></svg><g data-archive-composition="${layout}" transform="translate(0 ${layout==='mobile'?16:0})">${body.join('')}<g data-paper-connections="">${connections.join('')}</g>${foreground}</g></svg>\n`
 validateAuthoredPaperSvg(svg,scene);fs.writeFileSync(path.join(dir,`archive-hero-${layout}.svg`),svg);results.push({layout,scene,width:profile.width,height:profile.height,objects,ports,links:profile.links})
}
fs.writeFileSync(path.join(dir,'archive-hero-geometry.json'),JSON.stringify(results,null,2)+'\n');console.log('Authored both responsive archive layouts')
