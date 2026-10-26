import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import React, { act } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { StaticRouter } from 'react-router-dom/server.js'
import { JSDOM } from 'jsdom'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({ root: process.env.WEBSITE_TEST_APP ?? app, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
const { loadPostsData, buildSeriesIndexBundles, buildSearchFeed } = await server.ssrLoadModule('/src/lib/postsFeed.ts')
after(() => server.close())

const posts = loadPostsData(false, 'en')
const bundles = buildSeriesIndexBundles(posts, false)
const identity = (item) => item.kind === 'series' ? item.bundle.slug : item.post.slug

test('a series-wide query returns its series without flooding results with sibling parts', () => {
  assert(bundles.some((bundle) => bundle.slug === 'the-human-inversion'), 'published series instrument exists')
  const results = buildSearchFeed(posts, bundles, 'Human Inversion', 'en')
  assert.equal(results[0]?.kind, 'series')
  assert.equal(identity(results[0]), 'the-human-inversion')
  assert(!results.some((item) => item.kind === 'post' && item.post.slug.startsWith('the-human-inversion-')))
  assert.equal(new Set(results.map((item) => `${item.kind}:${identity(item)}`)).size, results.length)
})

test('a distinct part can still outrank its parent series', () => {
  const results = buildSearchFeed(posts, bundles, 'reconciler rubric', 'en')
  assert.equal(results[0]?.kind, 'post')
  assert.equal(identity(results[0]), 'the-human-inversion-the-reconciler-and-the-rubric')
  assert(results.some((item) => item.kind === 'series' && identity(item) === 'the-human-inversion'))
})

test('ordinary post search stays available when no series matches', () => {
  const results = buildSearchFeed(posts, bundles, 'neotoma', 'en')
  assert(results.length > 0)
  assert.equal(results[0].kind, 'post')
  assert(results.every((item) => item.kind === 'post'))
})

test('draft route honors a matching query and shows a no-match state for another', async () => {
  await server.close()
  const fixturePosts = [
    { slug: 'fixture-quartz-lantern', title: 'Quartz lantern note', excerpt: 'A unique fixture.', body: 'Quartz lantern.', published: false, updatedDate: '2026-10-02' },
    { slug: 'fixture-copper-garden', title: 'Copper garden note', excerpt: 'Another fixture.', body: 'Copper garden.', published: false, updatedDate: '2026-10-01' },
  ]
  const fixtureServer = await createServer({
    root: app,
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    plugins: [{
      name: 'draft-route-test-cache',
      enforce: 'pre',
      resolveId(id) {
        if (id === '@cache/posts.private.json' || id.endsWith('/cache/posts.private.json')) return '\0draft-route-test-cache'
        if (id === 'react-helmet-async') return '\0draft-route-test-helmet'
      },
      load(id) {
        if (id === '\0draft-route-test-cache') return `export default ${JSON.stringify(fixturePosts)}`
        if (id === '\0draft-route-test-helmet') return 'export const Helmet = () => null'
      },
    }],
  })
  try {
    const { default: Posts } = await fixtureServer.ssrLoadModule('/src/pages/Posts.tsx')
    const { LocaleProvider } = await fixtureServer.ssrLoadModule('/src/i18n/LocaleContext.tsx')
    const { PostsListSSRProvider } = await fixtureServer.ssrLoadModule('/src/contexts/PostsListSSRContext.tsx')
    for (const [query, expected, absent] of [
      ['quartz', 'Quartz lantern note', 'Copper garden note'],
      ['no-such-draft', 'No posts match', 'Quartz lantern note'],
    ]) {
      const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: `https://example.test/posts/draft?q=${query}` })
      const previous = Object.fromEntries(['window', 'document', 'navigator', 'HTMLElement', 'IS_REACT_ACT_ENVIRONMENT'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
      for (const key of ['window', 'document', 'navigator', 'HTMLElement']) {
        Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? dom.window : dom.window[key] })
      }
      globalThis.IS_REACT_ACT_ENVIRONMENT = true
      dom.window.scrollTo = () => {}
      dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
      const root = createRoot(dom.window.document.getElementById('root'))
      try {
        await act(async () => {
          root.render(React.createElement(MemoryRouter, { initialEntries: [`/posts/draft?q=${query}`] },
            React.createElement(PostsListSSRProvider, { posts: null, sourcePath: '/posts/draft' },
              React.createElement(LocaleProvider, { locale: 'en' },
                React.createElement(Posts, { draft: true })))))
          await Promise.resolve()
        })
        const text = dom.window.document.getElementById('root').textContent
        assert(text.includes(expected), `${query}: expected route result is visible`)
        assert(!text.includes(absent), `${query}: unrelated draft is absent`)
      } finally {
        await act(async () => root.unmount())
        dom.window.close()
        for (const [key, descriptor] of Object.entries(previous)) {
          if (descriptor) Object.defineProperty(globalThis, key, descriptor)
          else delete globalThis[key]
        }
      }
    }
  } finally {
    await fixtureServer.close()
  }
})

test('SSR listing stays selective while hydrated and direct searches find a published excluded post', async () => {
  const fixture = {
    slug: 'fixture-orbit-orange', title: 'Orbit orange public note',
    excerpt: 'A unique orbit-orange fixture.', tags: ['orbit-orange'],
    published: true, excludeFromListing: true, publishedDate: '2026-10-01',
  }
  const publicLists = Object.fromEntries(['default', 'en', 'es'].map((locale) => {
    const filename = locale === 'default' ? 'posts.json' : `posts.${locale}.json`
    const records = JSON.parse(fs.readFileSync(path.join(app, 'cache', filename), 'utf8'))
    return [locale, [...records, { ...fixture, title: locale === 'es' ? 'Nota pública órbita naranja' : fixture.title }]]
  }))
  const fixtureServer = await createServer({
    root: app, server: { middlewareMode: true, hmr: false }, appType: 'custom',
    plugins: [{
      name: 'published-excluded-search-fixture', enforce: 'pre',
      resolveId(id) {
        const match = id.match(/(?:^|\/)cache\/posts(?:\.(en|es))?\.json$/)
        if (match) return `\0published-search-${match[1] ?? 'default'}`
      },
      load(id) {
        if (!id.startsWith('\0published-search-')) return
        return `export default ${JSON.stringify(publicLists[id.slice('\0published-search-'.length)])}`
      },
    }],
  })
  let root
  let dom
  let previous
  try {
    const { render } = await fixtureServer.ssrLoadModule('/src/entry-server.tsx')
    const serverHtml = render('/posts')
    const match = /<script type="application\/json" id="posts-ssr-data">([\s\S]*?)<\/script>/.exec(serverHtml)
    assert(match, 'normal /posts SSR supplies a listing payload')
    const ssrPosts = JSON.parse(match[1])
    assert(!ssrPosts.some((post) => post.slug === fixture.slug), 'published excluded post is absent from the SSR listing')
    assert(!serverHtml.includes(fixture.title), 'unfiltered server HTML does not list the fixture')

    const { default: Posts } = await fixtureServer.ssrLoadModule('/src/pages/Posts.tsx')
    const { LocaleProvider } = await fixtureServer.ssrLoadModule('/src/i18n/LocaleContext.tsx')
    const { PostsListSSRProvider } = await fixtureServer.ssrLoadModule('/src/contexts/PostsListSSRContext.tsx')
    const { HelmetProvider } = await fixtureServer.ssrLoadModule('react-helmet-async')
    let navigate
    function NavigationHandle() {
      navigate = useNavigate()
      return null
    }
    function IndexPage() {
      const locale = useLocation().pathname.startsWith('/es/') ? 'es' : 'en'
      return React.createElement(PostsListSSRProvider, { posts: ssrPosts, sourcePath: '/posts' },
        React.createElement(LocaleProvider, { locale },
          React.createElement(HelmetProvider, { context: {} }, React.createElement(Posts))))
    }
    const appFor = (initialPath, serverSide = false) => React.createElement(
      serverSide ? StaticRouter : MemoryRouter,
      serverSide ? { location: initialPath } : { initialEntries: [initialPath] },
      React.createElement(NavigationHandle), React.createElement(IndexPage),
    )
    const hydratedMarkup = renderToString(appFor('/posts', true))
    dom = new JSDOM(`<!doctype html><html><body><div id="root">${hydratedMarkup}</div></body></html>`, { url: 'https://example.test/posts' })
    previous = Object.fromEntries(['window', 'document', 'navigator', 'HTMLElement', 'IS_REACT_ACT_ENVIRONMENT'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
    for (const key of ['window', 'document', 'navigator', 'HTMLElement']) {
      Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? dom.window : dom.window[key] })
    }
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    dom.window.scrollTo = () => {}
    dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
    await act(async () => { root = hydrateRoot(dom.window.document.getElementById('root'), appFor('/posts')); await Promise.resolve() })
    const resultLink = (locale) => dom.window.document.querySelector(`h2 a[href="${locale === 'es' ? '/es' : ''}/posts/${fixture.slug}/"]`)
    assert.equal(resultLink('en'), null, 'hydrated unfiltered index still omits the excluded post')

    await act(async () => { navigate('/posts?q=orbit-orange'); await Promise.resolve() })
    assert.equal(resultLink('en')?.textContent, fixture.title, 'normal hydrated search discovers the published excluded post')
    await act(async () => { navigate('/es/posts?q=orbit-orange'); await Promise.resolve() })
    assert.equal(resultLink('es')?.textContent, 'Nota pública órbita naranja', 'locale navigation uses the translated public search pool')
    await act(async () => { navigate('/es/posts'); await Promise.resolve() })
    assert.equal(resultLink('es'), null, 'the localized unfiltered index stays selective')

    const directHtml = render('/posts?q=orbit-orange')
    const directDocument = new JSDOM(directHtml).window.document
    assert.equal(directDocument.querySelector(`h2 a[href="/posts/${fixture.slug}/"]`)?.textContent, fixture.title, 'direct query SSR also discovers the published excluded post')
  } finally {
    if (root) await act(async () => root.unmount())
    dom?.window.close()
    if (previous) for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
    await fixtureServer.close()
  }
})
