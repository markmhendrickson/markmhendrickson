import assert from'node:assert/strict'
import{test}from'node:test'
import fs from'node:fs'
import os from'node:os'
import{createHash}from'node:crypto'
import path from'node:path'
import{execFileSync}from'node:child_process'
import{canonicalPostAliasPath}from'../src/lib/post-aliases.mjs'
import{createPostMarkdownRepository}from'./post-markdown.mjs'
const root=path.resolve(import.meta.dirname,'..'),old='one-place-where-a-fact-is-settled',slug='your-agents-need-a-system-of-record'
const locales=['en','es','ca','zh','hi','ar','fr','pt','ru','bn','ur','id','de']
const read=n=>fs.readFileSync(path.join(root,n),'utf8'),json=n=>JSON.parse(read(n))
test('canonical migration is durable source, preserves old alias and every locale identity and accepted editorial content',()=>{
 assert.equal(json('src/content/posts/canonical_slug_overrides.json')[old],slug)
 assert(json('src/content/posts/alternative_slugs.json')[slug].includes(old))
 for(const locale of locales){const post=json(`cache/posts.${locale}.json`).find(x=>x.slug===slug);assert(post,locale);assert.equal(post.canonicalSlug,slug);assert.equal(post.postId,slug);assert(post.alternativeSlugs.includes(old));if(locale!=='en')assert(json(`src/content/posts/translations.${locale}.json`)[slug],locale)}
 assert.equal(createHash('sha256').update(read(`src/content/posts/${slug}.md`)).digest('hex'),'f33eb411879b126f7a852f83856db3fc43ab5df0677549f16efa9b0cadd3e607','accepted prose and qualified current visual captions remain intact')
 assert.equal(createHash('sha256').update(read(`src/content/posts/${slug}.summary.md`)).digest('hex'),'c64ff58985846e0e3afdb5855604fe64735d29b49201846b74c29e8d585c0b7d','accepted editorial source bytes remain unchanged')
})
test('localized essay metadata is published from the new editorial translations',()=>{
 for(const locale of locales.filter(x=>x!=='en')){
  const source=json(`src/content/posts/translations.${locale}.json`)[slug]
  const post=json(`cache/posts.${locale}.json`).find(x=>x.slug===slug)
  const api=json(`public/api/posts.${locale}.json`).posts.find(x=>x.slug===slug)
  for(const field of ['title','excerpt','summary','body','heroImageAlt','heroImageCaption']){
   assert.equal(post[field],source[field],`${locale}: ${field} in post cache`)
   assert.equal(api[field],source[field],`${locale}: ${field} in public API`)
  }
  assert(source.title.length>10,`${locale}: translated title`)
  assert(source.excerpt.includes('Neotoma'),`${locale}: category introduction names the product`)
  assert.equal(source.summary.split('\n').filter(line=>line.startsWith('- ')).length,4,`${locale}: four prioritized takeaways`)
 }
})
test('advanced-gallery bridge and image descriptions belong to each locale source, not English-only JSX',()=>{
 const bridge='The shared instance is the foundation in use today. The next three visuals show that foundation and the direction from here.'
 const names=['vision-domain.svg','vision-positions.svg','vision-explanation.svg']
 const en=read(`src/content/posts/${slug}.md`)
 const enAlts=Object.fromEntries(names.map(name=>{
  const line=en.split('\n').find(line=>line.includes(`/images/posts/neotoma-paper/${name}`))
  assert(line,`English source has ${name}`)
  return[name,line.match(/^!\[([^\]]+)\]/)?.[1]]
 }))
 assert(en.includes(`${bridge}\n\n![${enAlts[names[0]]}]`),'English bridge precedes gallery in Markdown source')
 assert(!read('src/pages/Post.tsx').includes(bridge),'renderer does not inject English prose into every locale')
 for(const locale of locales.filter(x=>x!=='en')){
  const body=json(`src/content/posts/translations.${locale}.json`)[slug].body
  assert(!body.includes(bridge),`${locale}: localized bridge does not fall back to English`)
  const first=body.indexOf(`/images/posts/neotoma-paper/${names[0]}`)
  assert(first>0,`${locale}: gallery exists`)
  const preceding=body.slice(Math.max(0,first-700),first).split('\n\n').at(-2)
  assert(preceding && preceding.length>30 && !preceding.startsWith('!['),`${locale}: localized bridge precedes gallery`)
  for(const name of names){
   const line=body.split('\n').find(line=>line.includes(`/images/posts/neotoma-paper/${name}`))
   assert(line,`${locale}: ${name} exists`)
   const alt=line.match(/^!\[([^\]]+)\]/)?.[1]
   assert(alt && alt!==enAlts[name],`${locale}: ${name} has a localized accessible description`)
  }
 }
})
test('resolved aliases preserve query/hash and locale; canonical and Markdown URLs do not loop or change contract',()=>{
 const tail='?visual=overhead-proof&utm_source=review#a-system-of-record-not-recall'
 for(const prefix of['','/es','/de','/ar'])assert.equal(canonicalPostAliasPath(`${prefix}/posts/${old}/${tail}`,slug),`${prefix}/posts/${slug}${tail}`)
 assert.equal(canonicalPostAliasPath(`/posts/${slug}?x=1#h`,slug),null)
 assert.equal(canonicalPostAliasPath(`/posts/${old}.md?x=1#h`,slug),null)
 assert.equal(canonicalPostAliasPath(`/posts/${old}`,undefined),null)
 assert.equal(canonicalPostAliasPath(`/posts/${old}`,'../bad'),null)
 const repo=createPostMarkdownRepository(root)
 for(const locale of locales){const a=repo.resolve(old,locale),b=repo.resolve(slug,locale);assert.equal(a,b);assert(a.startsWith('# '));assert(a.includes('## '));assert(a.length>1000)}
 const outputs=repo.publishedOutputs();assert.equal(outputs.find(x=>x.outputPath===`posts/${old}.md`).body,outputs.find(x=>x.outputPath===`posts/${slug}.md`).body)
})
test('regenerating a historical Neotoma export retains the current slug/source/alias; disabling the binding fails causally',t=>{
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'essay-slug-export-'));t.after(()=>fs.rmSync(fixture,{recursive:true,force:true}));fs.mkdirSync(path.join(fixture,'scripts'),{recursive:true});fs.mkdirSync(path.join(fixture,'src/content/posts'),{recursive:true})
 for(const name of[`posts.json`,`canonical_slug_overrides.json`,`alternative_slugs.json`,`${slug}.md`,`${slug}.summary.md`])fs.copyFileSync(path.join(root,'src/content/posts',name),path.join(fixture,'src/content/posts',name))
 const script=read('scripts/generate_cache.py'),target=path.join(fixture,'scripts/generate_cache.py');fs.writeFileSync(target,script)
 const post=json('cache/posts.json').find(x=>x.slug===slug),raw={slug:old,published:true,title:post.title,excerpt:post.excerpt,published_date:post.publishedDate,updated_date:post.updatedDate,body:'Stale export body',hero_image:post.heroImage};const input=path.join(fixture,'export.json');fs.writeFileSync(input,JSON.stringify({posts:[raw],links:[],timeline:[]}))
 execFileSync('python3',[target,'--from-neotoma-json',input]);let result=JSON.parse(fs.readFileSync(path.join(fixture,'cache/posts.json'),'utf8')).find(x=>x.slug===slug);assert(result);assert(result.alternativeSlugs.includes(old));assert.equal(result.body,read(`src/content/posts/${slug}.md`));assert.equal(result.summary,read(`src/content/posts/${slug}.summary.md`).trim())
 fs.writeFileSync(target,script.replace('    posts = apply_canonical_slug_overrides(posts)\n',''));execFileSync('python3',[target,'--from-neotoma-json',input]);const broken=JSON.parse(fs.readFileSync(path.join(fixture,'cache/posts.json'),'utf8'));assert(!broken.some(x=>x.slug===slug),'old generator loses the canonical binding');assert(broken.some(x=>x.slug===old))
})
test('rendered canonical/alias routes, feeds, sitemap and full Markdown agree across locales',()=>{
 for(const locale of locales){const prefix=locale==='en'?'':`${locale}/`,canonical=`https://markmhendrickson.com/${prefix}posts/${slug}`,legacy=`https://markmhendrickson.com/${prefix}posts/${old}`
 for(const route of[slug,old]){const html=read(`dist/${prefix}posts/${route}/index.html`);assert(html.includes(`rel="canonical" href="${canonical}/"`));assert(html.includes(`property="og:url" content="${canonical}/"`));assert(!html.includes(`property="og:url" content="${legacy}"`))}
 assert.equal(read(`dist/${prefix}posts/${old}.md`),read(`dist/${prefix}posts/${slug}.md`))
 const feed=read(`dist/${prefix}rss.xml`);assert(feed.includes(`${canonical}/</link>`));assert(!feed.includes(`${legacy}/</link>`));const sitemap=read('dist/sitemap.xml');assert(sitemap.includes(`<loc>${canonical}/</loc>`));assert(!sitemap.includes(`<loc>${legacy}/</loc>`))
 }
 const redirects=read('dist/_redirects');assert(redirects.includes(`/posts/${old}  /posts/${slug}  301`));assert(redirects.includes(`/es/posts/${old}  /es/posts/${slug}  301`))
 assert(read('dist/sitemap.xml').includes('/posts/the-human-inversion-part-1/'),'unrelated alias discovery convention is unchanged')
 assert(read('dist/sitemap.xml').includes('/posts/the-oldest-argument-about-technology/'),'unrelated explicit canonical override does not change alias discovery')
})
