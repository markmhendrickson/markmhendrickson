import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
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
