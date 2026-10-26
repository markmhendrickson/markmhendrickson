import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const dist = process.env.WEBSITE_TEST_DIST ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')

const { render } = await import(pathToFileURL(path.join(dist, 'server/entry-server.js')).href)

function visibleHtml(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
}

test('collapsed navigation has named, localized destinations in generated pages', () => {
  for (const [page, labels] of [
    ['index.html', [['Home', '/'], ['Posts', '/posts/']]],
    ['es/index.html', [['Inicio', '/es/'], ['Publicaciones', '/es/posts/']]],
  ]) {
    const html = fs.readFileSync(path.join(dist, page), 'utf8')
    const menuLinks = [...html.matchAll(/<a\b[^>]*class="[^"]*peer\/menu-button[^"]*"[^>]*>/g)].map((match) => match[0])
    assert(menuLinks.length >= 8, `${page}: rendered icon-rail links exist`)
    for (const [label, href] of labels) {
      assert(menuLinks.some((link) => link.includes(`aria-label="${label}"`) && link.includes(`href="${href}"`)), `${page}: ${label} names ${href}`)
    }
  }
})

test('the two product footer cards render as distinct public destinations', () => {
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
  assert(html.includes('The system of record for AI agents.'))
  assert(html.includes('The operating system for agentic organizations.'))
  assert(html.includes('utm_campaign=products_site_footer'))
  assert(html.includes('github.com/markmhendrickson/ateles'))
})

test('an editorial post promotes the opening hero once, expands takeover art, and calls out one bold message', () => {
  const body = [
    '![Opening image](/images/editorial-opening.png "hero")',
    '',
    'Opening paragraph remains in the article.',
    '',
    '![Full width image](/images/editorial-full.png "takeover")',
    '',
    '> **The key message stands alone.**',
  ].join('\n')
  const html = visibleHtml(render('/posts/editorial-fixture/', {}, {
    unlistedPost: { slug: 'editorial-fixture', title: 'Editorial fixture', published: true, body },
  }))

  assert(/<header class="post-takeover\b[^>]*>[\s\S]*?<img src="\/images\/editorial-opening\.png"/.test(html), 'opening image becomes the editorial hero')
  assert.equal((html.match(/<img src="\/images\/editorial-opening\.png"/g) ?? []).length, 1, 'opening image is not duplicated in the article')
  assert(html.includes('Opening paragraph remains in the article.'), 'opening prose remains in the article')
  assert(/class="post-takeover not-prose[^\"]*"[^>]*><img src="\/images\/editorial-full\.png"/.test(html), 'takeover image gets the full-bleed treatment')
  assert(/<aside class="post-message not-prose" role="note">[\s\S]*?<strong>The key message stands alone\.<\/strong>[\s\S]*?<\/aside>/.test(html), 'one bold blockquote becomes the key-message aside')
})

test('the localized raw Markdown header action is present for a public post and absent for its unlisted preview', () => {
  const publicHtml = visibleHtml(fs.readFileSync(path.join(dist, 'es/posts/the-human-inversion-the-attention-ceiling/index.html'), 'utf8'))
  const unlistedHtml = visibleHtml(render('/posts/unlisted-editorial-fixture/', {}, {
    unlistedPost: { slug: 'unlisted-editorial-fixture', title: 'Unlisted fixture', published: true, unlisted: true, body: 'Preview body.' },
  }))

  assert(/<a\b(?=[^>]*href="\/es\/posts\/the-human-inversion-the-attention-ceiling\.md")(?=[^>]*aria-label="Ver markdown")[^>]*>/.test(publicHtml), 'Spanish public post has a localized header action')
  assert(!/<a\b(?=[^>]*href="\/posts\/unlisted-editorial-fixture\.md")[^>]*>/.test(unlistedHtml), 'unlisted review omits the header action')
  assert(unlistedHtml.includes('data-testid="unlisted-preview-status"'), 'unlisted preview keeps its visible footer status')
  assert(unlistedHtml.includes('>Preview</span>'), 'the preview status is visible to readers')
  assert(unlistedHtml.includes('Preview body.'), 'unlisted article still renders')
})
