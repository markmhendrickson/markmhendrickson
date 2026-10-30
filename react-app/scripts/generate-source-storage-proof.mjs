import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {JSDOM} from 'jsdom'
import {invoicePrint} from './overhead-marks.mjs'
import {validateAuthoredPaperSvg,PAPER_INSTANCE_ARCHIVE_OVERHEAD_SHA256} from './export-paper-artwork.mjs'
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../src/dev/overhead-record')
const d=new JSDOM(fs.readFileSync(path.join(dir,'invoice.svg'),'utf8'),{contentType:'image/svg+xml'}).window.document
const defs=d.querySelector('defs').innerHTML,archive=fs.readFileSync(path.join(dir,'materials/instance-archive-overhead-v1.webp'))
if(createHash('sha256').update(archive).digest('hex')!==PAPER_INSTANCE_ARCHIVE_OVERHEAD_SHA256)throw Error('Changed shared archive material')
const image=`<image id="proof-source-archive" width="1254" height="1254" href="data:image/webp;base64,${archive.toString('base64')}"/>`
const box=front=>`<svg x="230" y="25" width="440" height="493.6585" viewBox="230 170 820 920" overflow="hidden" data-paper-raster="instance-archive-overhead"><g ${front?'clip-path="url(#archive-front-native)"':''}><use href="#proof-source-archive"/></g></svg>`
const paper=(id,material,x,y,w,crop,print='')=>`<g data-retained-raw-source="${id}"><svg x="${x}" y="${y}" width="${w}" height="${w*crop[3]/crop[2]}" viewBox="${crop.join(' ')}" overflow="hidden" data-paper-raster="${material}"><use href="#proof-${material}"/></svg><g mask="url(#screenprint)">${print}</g></g>`
const svg=`<svg xmlns="http://www.w3.org/2000/svg" class="paper-scene" data-paper-scene="sourceMaterialProof" data-paper-treatment="hybrid-record-proof" data-paper-variant="overhead-sourceMaterialProof" viewBox="0 0 900 600" role="img" aria-labelledby="source-title"><title id="source-title">The same itemized invoice and intact email are stored behind the front lip of the shared archive box</title><defs>${defs}${image}<clipPath id="archive-front-native"><path d="M0 655H548Q552 715 620 715Q689 715 695 655H1254V1254H0Z"/></clipPath></defs><rect width="900" height="600" fill="#f2eee5"/><use href="#proof-ground" opacity=".17"/><g data-paper-composition="sourceMaterialProof" transform="translate(0 29.5)"><g data-source-archive="one">${box(false)}</g>${paper('invoice','document-packet',290,115,170,[239,121,833,1071],invoicePrint(290,115,170))}${paper('email','email-envelope',465,205,165,[36,295,1206,714])}<g data-archive-retaining-front="physical-lip">${box(true)}</g></g></svg>`
validateAuthoredPaperSvg(svg,'sourceMaterialProof');fs.writeFileSync(path.join(dir,'source-material.svg'),svg+'\n')
