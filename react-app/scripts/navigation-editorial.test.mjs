import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = process.env.WEBSITE_TEST_DIST ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')

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
