import assert from 'node:assert/strict'
import {test} from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import {JSDOM} from 'jsdom'
import {createPostMarkdownRepository} from './post-markdown.mjs'
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=process.env.WEBSITE_TEST_DIST??path.join(app,'dist')
const {render}=await import(pathToFileURL(path.join(dist,'server/entry-server.js')).href)
const essay='your-agents-need-a-system-of-record',locales=['en','es','ca','zh','hi','ar','fr','pt','ru','bn','ur','id','de']
function assertStrip(html,locale){
 const d=new JSDOM(html).window.document,strip=d.querySelectorAll('article .essay-product-strip');assert.equal(strip.length,1,`${locale}: once in article`)
 const link=strip[0].querySelector('a');assert.equal(link.getAttribute('href'),`https://neotoma.io/${locale==='es'?'es':'en'}/`);assert(link.textContent.trim().length>0)
 assert.equal(strip[0].querySelector('[role="img"]').getAttribute('aria-label'),'Neotoma')
 assert.deepEqual([...strip[0].querySelectorAll('img')].map(n=>n.getAttribute('src')),['/brand/neotoma/n2-nav-light.svg','/brand/neotoma/n2-nav-dark.svg'])
 assert(strip[0].compareDocumentPosition(d.querySelector('article h1'))&4,'product reference precedes title')
 assert(strip[0].closest('header'),'product strip stays in article header')
 assert.equal(d.querySelectorAll('main > header .essay-product-strip').length,0,'no duplicate sticky-header brand')
 return link.textContent.trim()
}
test('essay product strip appears above title once across every locale and editorial query',()=>{
 const labels=[];for(const locale of locales)for(const query of ['', '?design=editorial']){const route=`${locale==='en'?'':'/'+locale}/posts/${essay}/${query}`;labels.push(assertStrip(render(route),locale))}
 assert(labels.includes('Visit Neotoma'));assert(labels.includes('Visitar Neotoma'));assert.equal(new Set(labels).size,12,'all locales have an authored label; es/pt naturally share wording')
 const editorial=render(`/posts/${essay}/`,{}, {postBody:'![Opening art](/images/posts/neotoma-paper/hero.png "hero")\n\nEssay body.'})
 assertStrip(editorial,'en');assert(new JSDOM(editorial).window.document.querySelector('article > header.post-takeover'),'hero editorial header also retains strip')
})
test('unrelated posts, homepage, draft preview and Markdown do not acquire product promotion',()=>{
 for(const route of ['/','/posts/three-types-of-design/','/es/posts/three-types-of-design/','/posts/missing-post/'])assert(!render(route).includes('essay-product-strip'),route)
 assert(!render('/posts/draft-strip-fixture/',{}, {unlistedPost:{slug:'draft-strip-fixture',title:'Preview',published:true,body:'Preview body'}}).includes('essay-product-strip'))
 const repo=createPostMarkdownRepository(app);for(const locale of locales){const markdown=repo.resolve(essay,locale);assert(markdown);assert(!markdown.includes('essay-product-strip'));assert(!markdown.includes('/brand/neotoma/'));assert(!markdown.includes('Visit Neotoma'))}
})
test('both accepted solid N2 logo files match their provenance exactly',()=>{
 const provenance=JSON.parse(fs.readFileSync(path.join(app,'public/brand/neotoma/PROVENANCE.json')))
 assert(provenance.identity.includes('Retained sheets'));assert.equal(provenance.source_commit,'2aed03818f5742e34d4bbc24d7a09662db76dd20')
 for(const[name,spec]of Object.entries(provenance.files)){const bytes=fs.readFileSync(path.join(app,'public/brand/neotoma',name));assert.equal(createHash('sha256').update(bytes).digest('hex'),spec.sha256);assert(!bytes.toString().includes('<text'),'accepted outlined lockup without font/network dependency')}
})
