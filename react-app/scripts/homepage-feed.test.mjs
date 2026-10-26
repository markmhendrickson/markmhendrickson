import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server.js'
import { createServer } from 'vite'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = process.env.WEBSITE_TEST_DIST ?? path.join(app, 'dist')
const read = (file) => fs.readFileSync(path.join(dist, file), 'utf8')

test('homepage displays the same first feed page as the posts index', () => {
  for (const locale of ['', 'es/', 'ca/', 'zh/', 'hi/', 'ar/', 'fr/', 'pt/', 'ru/', 'bn/', 'ur/', 'id/', 'de/']) {
    const home = read(`${locale}index.html`)
    const posts = read(`${locale}posts/index.html`)
    const start = home.indexOf('<section aria-labelledby="home-latest-posts"')
    assert(start >= 0, `${locale || 'en'}: latest section exists`)
    const section = home.slice(start, home.indexOf('</section>', start))
    const itemLinks = (html) => [...html.matchAll(/<article\b[\s\S]*?<h[23][^>]*><a[^>]*href="([^"]+)"/g)].map((match) => match[1])
    const homeLinks = itemLinks(section)
    const postsLinks = itemLinks(posts)
    assert.equal(homeLinks.length, 12, `${locale || 'en'}: one complete feed page`)
    assert.deepEqual(homeLinks, postsLinks.slice(0, 12), `${locale || 'en'}: home and index use the same feed order`)
    assert.equal(new Set(homeLinks).size, homeLinks.length, `${locale || 'en'}: no duplicate feed items`)
  }
})

test('homepage keeps the reviewed public positioning and excludes draft links', () => {
  const home = read('index.html')
  assert(home.includes('The idea is a record, not recall.'))
  assert(home.includes('an open-source project in development'))
  assert(home.includes('href="https://github.com/markmhendrickson/ateles"'))
  const drafts = JSON.parse(fs.readFileSync(path.join(app, 'cache/posts.private.json'), 'utf8')).filter((post) => post.published === false)
  assert(drafts.length > 0, 'draft exclusion has a positive source case')
  for (const draft of drafts) assert(!home.includes(`href="/posts/${draft.slug}/"`), draft.slug)
})

test('all locale homepages name the feed and its page-two continuation in the selected language', () => {
  const labels = {
    en: ['Latest posts', 'More posts', 'an open-source project in development'],
    es: ['Últimas publicaciones', 'Más publicaciones', 'un proyecto de código abierto en desarrollo'],
    ca: ['Últimes publicacions', 'Més publicacions', 'un projecte de codi obert en desenvolupament'],
    zh: ['最新文章', '更多文章', '开发中的开源项目'],
    hi: ['नवीनतम लेख', 'और लेख', 'विकासाधीन ओपन-सोर्स परियोजना'],
    ar: ['أحدث المقالات', 'المزيد من المقالات', 'مشروع مفتوح المصدر قيد التطوير'],
    fr: ['Articles récents', 'Plus d’articles', 'un projet open source en cours de développement'],
    pt: ['Publicações recentes', 'Mais publicações', 'um projeto de código aberto em desenvolvimento'],
    ru: ['Новые статьи', 'Ещё статьи', 'открытого проекта в разработке'],
    bn: ['সাম্প্রতিক লেখা', 'আরও লেখা', 'উন্নয়নাধীন ওপেন-সোর্স প্রকল্প'],
    ur: ['تازہ مضامین', 'مزید مضامین', 'زیرِ ترقی اوپن سورس منصوبہ'],
    id: ['Tulisan terbaru', 'Tulisan lainnya', 'proyek sumber terbuka yang sedang dikembangkan'],
    de: ['Neueste Beiträge', 'Weitere Beiträge', 'ein quelloffenes Projekt in Entwicklung'],
  }
  for (const [locale, [heading, more, qualifier]] of Object.entries(labels)) {
    const prefix = locale === 'en' ? '' : `${locale}/`
    const home = read(`${prefix}index.html`)
    assert(home.includes(`>${heading}</h2>`), `${locale}: latest feed heading`)
    assert(home.includes(`href="/${prefix}posts/?page=2">${more}`), `${locale}: continuation names page two`)
    assert(home.includes(qualifier), `${locale}: Ateles development status`)
    if (locale !== 'en') assert(!home.includes('That experience informs'), `${locale}: no English home narrative fallback`)
    if (['ar', 'ur'].includes(locale)) assert(home.includes('dir="rtl"'), `${locale}: page direction is RTL`)
  }
})

test('latest-feed component explains an empty feed and names a one-page index accurately', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { HomeLatestPosts } = await server.ssrLoadModule('/src/pages/Home.tsx')
    const { LocaleProvider } = await server.ssrLoadModule('/src/i18n/LocaleContext.tsx')
    const fixture = (locale, items, totalPages) => renderToStaticMarkup(
      React.createElement(StaticRouter, { location: locale === 'en' ? '/' : `/${locale}/` },
        React.createElement(LocaleProvider, { locale }, React.createElement(HomeLatestPosts, { items, totalPages }))),
    )
    const empty = fixture('ar', [], 0)
    assert(empty.includes('لا توجد مشاركات حتى الآن.'), 'Arabic empty feed has an explicit state')
    assert(!empty.includes('href="/ar/posts/'), 'empty feed has no misleading continuation')
    const oneItem = [{ kind: 'post', post: { slug: 'fixture', title: 'Fixture', excerpt: 'Fixture excerpt.', published: true, publishedDate: '2026-10-01' }, sortKey: 0 }]
    const singleton = fixture('en', oneItem, 1)
    assert(singleton.includes('href="/posts/"'), 'single-page continuation reaches the posts index')
    assert(singleton.includes('View all posts'), 'single-page link names the full index')
    assert(!singleton.includes('More posts'), 'single-page link does not promise page two')
  } finally {
    await server.close()
  }
})

test('client navigation from English posts loads the destination locale feed', () => {
  const probe = path.join(app, 'scripts/homepage-locale-navigation.probe.mjs')
  for (const locale of ['es', 'zh']) {
    const output = execFileSync(process.execPath, [probe, dist, locale], { encoding: 'utf8', timeout: 15000 })
    const { homeItems, postsItems, expectedItems } = JSON.parse(output)
    assert.equal(homeItems.length, 12, `${locale}: homepage has a complete first page`)
    assert.deepEqual(homeItems, expectedItems, `${locale}: hydrated homepage matches localized posts page`)
    assert.deepEqual(postsItems, expectedItems, `${locale}: client-navigated posts page matches localized cache`)
    const english = read('posts/index.html')
    assert(!english.includes(`>${homeItems[0].title}</a>`), `${locale}: the localized lead title differs from English`)
  }
})
