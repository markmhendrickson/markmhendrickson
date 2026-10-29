import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyDocumentLanguage } from './apply-document-language.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const slug = 'your-agents-need-a-system-of-record'
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const matches = (posts) => posts.filter((post) => post.slug === slug)
const visible = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
const approvedExcerpt = 'When agents work across tools, they can act on different versions of the same fact. Neotoma gives the agents you connect a system of record where they can read the current values and inspect the observations and sources behind them.'

test('only the approved essay moves from unlisted review to the public caches', () => {
  const manifest = matches(json('src/content/posts/posts.json'))
  assert.equal(manifest.length, 1)
  assert.equal(manifest[0].published, true)
  assert.equal(manifest[0].unlisted, undefined)
  assert.equal(manifest[0].excerpt, approvedExcerpt)
  assert.match(manifest[0].publishedDate, /^\d{4}-\d{2}-\d{2}$/, 'publication candidate has a real launch date')
  assert(manifest[0].updatedDate >= manifest[0].publishedDate, 'last update cannot precede publication')
  assert.equal(matches(json('cache/unlisted-posts.json')).length, 0)
  assert.equal(matches(json('cache/posts.private.json')).length, 0)

  const body = read(`src/content/posts/${slug}.md`)
  const summary = read(`src/content/posts/${slug}.summary.md`).trim()
  for (const file of ['cache/posts.json', 'cache/posts.en.json', 'cache/api/posts.json', 'cache/api/posts.en.json', 'public/api/posts.json', 'public/api/posts.en.json']) {
    const payload = json(file)
    const posts = Array.isArray(payload) ? payload : payload.posts
    const [post] = matches(posts)
    assert.equal(matches(posts).length, 1, `${file}: exactly one public essay`)
    assert.equal(post.published, true)
    assert.equal(post.unlisted, undefined)
    assert.equal(post.body, body)
    assert.equal(post.excerpt, approvedExcerpt)
    assert.equal(post.summary, summary)
    assert.equal(post.heroImage, 'neotoma-paper/hero.svg')
    assert.equal(post.heroImageStyle, 'paper-scene')
    assert.equal(post.heroImageAlt, manifest[0].heroImageAlt)
    assert.equal(post.heroImageCaption, manifest[0].heroImageCaption)
    assert.equal(post.publishedDate, manifest[0].publishedDate, `${file}: launch date`)
    assert.equal(post.updatedDate, manifest[0].updatedDate, `${file}: last update`)
    assert(posts.every((candidate) => candidate.published !== false), `${file}: no draft entry`)
    if (post.publishedDate != null) assert.match(post.publishedDate, /^\d{4}-\d{2}-\d{2}$/)
  }
  assert(body.includes('utm_campaign=essay-system-of-record'))
  assert(!body.includes('utm_campaign=essay-2026-10-27'))
})

test('the listed server-rendered essay retains paper art and asides without review markers', () => {
  const html = read(`dist/posts/${slug}/index.html`)
  assert.match(html, /essay-paper-hero/)
  assert.equal((html.match(/data-paper-figure=/g) ?? []).length, 5)
  assert.equal((html.match(/<aside[^>]*essay-editorial-aside[^>]*>/g) ?? []).length, 2)
  assert(!html.includes('name="robots" content="noindex,nofollow"'))
  assert(!html.includes('data-testid="unlisted-preview-status"'))
})

test('public discovery includes the essay and excludes every unpublished draft', () => {
  const sitemap = read('dist/sitemap.xml')
  const feed = read('dist/rss.xml')
  const inventory = read('dist/llms-full.txt')
  const listing = read('dist/posts/index.html')
  const targetUrl = `https://markmhendrickson.com/posts/${slug}/`
  assert(sitemap.includes(`<loc>${targetUrl}</loc>`))
  assert(feed.includes(`<link>${targetUrl}</link>`))
  assert(inventory.includes(`- URL: ${targetUrl}`))
  assert(listing.includes(slug))

  const targetFeedItem = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)]
    .map(([item]) => item)
    .find((item) => item.includes(targetUrl))
  assert(targetFeedItem)
  const [target] = matches(json('src/content/posts/posts.json'))
  assert(targetFeedItem.includes(`<pubDate>${new Date(target.publishedDate).toUTCString()}</pubDate>`), 'feed uses manifest launch date')
  assert(sitemap.includes(`<loc>${targetUrl}</loc><lastmod>${target.updatedDate}</lastmod>`), 'sitemap uses current edit date')
  assert(inventory.includes(`- Published: ${target.publishedDate}`), 'LLM inventory uses manifest launch date')

  const drafts = json('cache/posts.private.json').filter((post) => post.published === false)
  assert(drafts.length > 0, 'draft exclusion instrument must have a positive case')
  for (const draft of drafts) {
    const draftUrl = `https://markmhendrickson.com/posts/${draft.slug}/`
    assert(!sitemap.includes(`<loc>${draftUrl}</loc>`), draft.slug)
    assert(!feed.includes(`<link>${draftUrl}</link>`), draft.slug)
    assert(!inventory.includes(`- URL: ${draftUrl}`), draft.slug)
    assert(!listing.includes(`"slug":"${draft.slug}"`), draft.slug)
  }
})

test('every localized essay renders its translated copy and paper scenes', () => {
  for (const locale of ['es', 'ca', 'zh', 'hi', 'ar', 'fr', 'pt', 'ru', 'bn', 'ur', 'id', 'de']) {
    const [post] = matches(json(`cache/posts.${locale}.json`))
    assert(post, `${locale}: target exists`)
    const manifest = matches(json('src/content/posts/posts.json'))[0]
    assert.equal(post.publishedDate, manifest.publishedDate, `${locale}: launch date`)
    assert.equal(post.updatedDate, manifest.updatedDate, `${locale}: last update`)
    assert.deepEqual(matches(json(`public/api/posts.${locale}.json`).posts), matches(json(`cache/api/posts.${locale}.json`).posts), `${locale}: public API parity`)
    assert.notEqual(post.body, read(`src/content/posts/${slug}.md`), `${locale}: translated body`)
    const override = json(`src/content/posts/translations.${locale}.json`)[slug]
    for (const field of ['heroImageLabel', 'heroImageCaption', 'heroImageAlt']) {
      assert.equal(post[field], override[field], `${locale}: localized ${field}`)
      assert.notEqual(post[field], json('src/content/posts/posts.json').find((candidate) => candidate.slug === slug)[field], `${locale}: not English ${field}`)
    }
    const html = read(`dist/${locale}/posts/${slug}/index.html`)
    assert(html.includes(`property="article:published_time" content="${manifest.publishedDate}"`), `${locale}: published metadata`)
    const visibleArticle = html.slice(html.indexOf('<article>'))
    const firstParagraph = post.body.split('\n').find((line) => line.trim() && !line.startsWith('#'))
    const headings = [...post.body.matchAll(/^## (.+)$/gm)].map((match) => match[1])
    const paperCaptions = [...post.body.matchAll(/^!\[([^\]]+)\]\([^\n]+ "paper\|([^|]+)\|([^"]+)"\)$/gm)]
    const asideLines = [...post.body.matchAll(/^> \*\*(.+)\*\*$/gm)].map((match) => match[1])
    assert(firstParagraph && headings.length >= 3 && paperCaptions.length === 5 && asideLines.length === 4, `${locale}: source instrument`)
    assert(visibleArticle.includes(visible(firstParagraph)), `${locale}: visible translated opening paragraph`)
    for (const heading of headings) assert(visibleArticle.includes(`>${visible(heading)}<`), `${locale}: visible translated heading ${heading}`)
    assert(visibleArticle.includes(`>${visible(post.heroImageAlt)}</title>`), `${locale}: localized hero accessible name`)
    for (const [, alt, label, caption] of paperCaptions) {
      assert(visibleArticle.includes(`>${visible(alt)}</title>`), `${locale}: localized figure accessible name ${label}`)
      assert(visibleArticle.includes(`<span class="essay-paper-label">${visible(label)}</span>`), `${locale}: visible figure label ${label}`)
      assert(visibleArticle.includes(`<span>${visible(caption)}</span>`), `${locale}: visible figure caption ${label}`)
    }
    for (let index = 0; index < asideLines.length; index += 2) {
      assert(visibleArticle.includes(`>${visible(asideLines[index])}</h3>`), `${locale}: visible aside label ${index / 2}`)
      assert(visibleArticle.includes(visible(asideLines[index + 1])), `${locale}: visible aside prose ${index / 2}`)
    }
    assert(html.includes(post.title), `${locale}: translated title`)
    assert(html.includes(post.excerpt), `${locale}: translated excerpt`)
    assert(html.includes(post.heroImageCaption), `${locale}: translated hero caption`)
    assert.equal((html.match(/data-paper-figure=/g) ?? []).length, 5, `${locale}: paper figures`)
    assert.equal((html.match(/<aside[^>]*essay-editorial-aside[^>]*>/g) ?? []).length, 2, `${locale}: asides`)
    assert(!html.includes('name="robots" content="noindex,nofollow"'), `${locale}: indexable`)
    assert(!html.includes('data-testid="unlisted-preview-status"'), `${locale}: no preview marker`)
  }
})

test('server-rendered documents declare the route language and direction', () => {
  for (const [locale, language, direction] of [
    ['en', 'en-US', 'ltr'],
    ['es', 'es-ES', 'ltr'],
    ['ar', 'ar', 'rtl'],
    ['zh', 'zh-CN', 'ltr'],
  ]) {
    const prefix = locale === 'en' ? '' : `${locale}/`
    const html = read(`dist/${prefix}posts/${slug}/index.html`)
    assert.match(html, new RegExp(`<html lang="${language}" dir="${direction}">`), locale)
  }
  assert.match(read('dist/404.html'), /<html lang="en-US" dir="ltr">/, 'unknown routes use the default document language')
})

test('localized heading links identify each distinct visible section', () => {
  const english = read(`dist/posts/${slug}/index.html`)
  const englishIds = [...english.slice(english.indexOf('<article>')).matchAll(/<h2 id="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(englishIds, [
    'recall-is-good-at-a-different-job', 'what-neotoma-does-today',
    'where-this-is-going', 'a-system-of-record-not-recall',
  ], 'existing English fragments remain stable')
  for (const locale of ['es', 'ca', 'zh', 'hi', 'ar', 'fr', 'pt', 'ru', 'bn', 'ur', 'id', 'de']) {
    const html = read(`dist/${locale}/posts/${slug}/index.html`)
    const article = html.slice(html.indexOf('<article>'))
    const headings = [...article.matchAll(/<h2 id="([^"]+)"[\s\S]*?<a href="#([^"]+)" class="post-heading-anchor/g)]
    assert.equal(headings.length, 4, `${locale}: four visible linked sections`)
    assert.equal(new Set(headings.map((match) => match[1])).size, 4, `${locale}: unique heading targets`)
    for (const [, id, encodedFragment] of headings) {
      assert.equal(decodeURIComponent(encodedFragment), id, `${locale}: encoded fragment resolves to its heading`)
    }
  }
})

test('unknown or hostile Helmet language attributes fall back to the configured language', () => {
  const attributes = { helmet: { htmlAttributes: { toString: () => 'lang="unknown" dir="rtl" onclick="alert(1)"' } } }
  const html = applyDocumentLanguage('<html lang="en" data-site="website">', attributes, new Set(['en-US', 'es-ES']), 'en-US')
  assert.equal(html, '<html data-site="website" lang="en-US" dir="ltr">')
  assert(!html.includes('onclick'))
})
