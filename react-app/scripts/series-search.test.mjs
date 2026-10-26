import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({ root: process.env.WEBSITE_TEST_APP ?? app, server: { middlewareMode: true }, appType: 'custom' })
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
