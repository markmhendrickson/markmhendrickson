import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { buildLocales, removedLocales as removed } from './build-locales.mjs'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(app, 'dist')

test('build publishes only selected locale routes, discovery links, feeds and assets', () => {
  const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')
  const pages = ['index.html', 'posts/index.html', ...buildLocales.filter((locale) => locale !== 'en').flatMap((locale) => [`${locale}/index.html`, `${locale}/posts/index.html`])]
  const documents = pages.map((page) => new JSDOM(fs.readFileSync(path.join(dist, page), 'utf8')).window.document)
  const expectedTags = new Set(['en-US', 'es-ES', 'ca-ES', 'en', 'es', 'ca'])
  for (const locale of removed) {
    assert(!fs.existsSync(path.join(dist, locale)), `${locale}: no page, feed or Markdown directory`)
    assert(!fs.existsSync(path.join(dist, 'api', `posts.${locale}.json`)), `${locale}: no public post cache`)
    assert(!fs.existsSync(path.join(dist, 'api', `agent.${locale}.json`)), `${locale}: no public agent cache`)
    assert(!sitemap.includes(`https://markmhendrickson.com/${locale}/`), `${locale}: no sitemap route`)
    for (const file of ['robots.txt', 'llms.txt', 'llms-full.txt', 'rss.xml']) {
      const content = fs.readFileSync(path.join(dist, file), 'utf8')
      assert(!content.includes(`https://markmhendrickson.com/${locale}/`), `${locale}: no ${file} route`)
    }
  }
  for (const doc of documents) {
    const tags = new Set([...doc.querySelectorAll('link[hreflang]')].map((link) => link.getAttribute('hreflang')))
    assert([...tags].every((tag) => expectedTags.has(tag) || tag === 'x-default'), 'alternates use only active locales')
    assert([...doc.querySelectorAll('meta[property="og:locale:alternate"]')].every((meta) => ['en_US', 'es_ES', 'ca_ES'].includes(meta.content)), 'Open Graph alternates use only active locales')
    assert([...doc.querySelectorAll('a[href]')].every((link) => !removed.some((locale) => link.getAttribute('href').startsWith(`/${locale}/`))), 'language navigation excludes retired locales')
  }
  assert(sitemap.includes('https://markmhendrickson.com/es/'))
  assert(sitemap.includes('https://markmhendrickson.com/ca/'))
  assert(fs.existsSync(path.join(dist, 'es', 'rss.xml')))
  assert(fs.existsSync(path.join(dist, 'ca', 'rss.xml')))
  const root = documents[0]
  assert(root.querySelector('link[hreflang="es-ES"]'))
  assert(root.querySelector('link[hreflang="ca-ES"]'))
  for (const doc of [documents[2], documents[4]]) {
    assert(doc.querySelector('link[hreflang="es-ES"]'), 'localized home links to Spanish')
    assert(doc.querySelector('link[hreflang="ca-ES"]'), 'localized home links to Catalan')
  }
})

test('client and SSR bundles exclude retired locale metadata and translated post caches', () => {
  const js = [
    ...fs.readdirSync(path.join(dist, 'assets')).filter((name) => name.endsWith('.js'))
      .map((name) => fs.readFileSync(path.join(dist, 'assets', name), 'utf8')),
    fs.readFileSync(path.join(dist, 'server/entry-server.js'), 'utf8'),
  ].join('\n')
  for (const retiredText of ['Русский', 'Deutsch', 'ar_AR', 'zh-CN']) {
    assert(!js.includes(retiredText), `retired locale UI metadata excluded: ${retiredText}`)
  }
  for (const locale of removed) {
    const sample = JSON.parse(fs.readFileSync(path.join(app, 'cache', `posts.${locale}.json`), 'utf8'))
      .find((post) => typeof post.body === 'string' && post.body.length > 200)
    const phrase = sample?.body.slice(0, 120)
    if (phrase) assert(!js.includes(phrase), `${locale}: localized post body excluded from JS`)
  }
})
