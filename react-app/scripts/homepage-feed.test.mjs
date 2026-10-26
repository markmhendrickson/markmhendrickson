import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = process.env.WEBSITE_TEST_DIST ?? path.join(app, 'dist')
const read = (file) => fs.readFileSync(path.join(dist, file), 'utf8')

test('homepage displays the same first feed page as the posts index', () => {
  for (const locale of ['', 'es/', 'ca/']) {
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
  assert(home.includes('href="https://github.com/markmhendrickson/ateles"'))
  const drafts = JSON.parse(fs.readFileSync(path.join(app, 'cache/posts.private.json'), 'utf8')).filter((post) => post.published === false)
  assert(drafts.length > 0, 'draft exclusion has a positive source case')
  for (const draft of drafts) assert(!home.includes(`href="/posts/${draft.slug}/"`), draft.slug)
})
