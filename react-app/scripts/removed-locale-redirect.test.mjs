import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { JSDOM } from 'jsdom'
import { redirectRemovedLocaleUrl } from '../src/i18n/removed-locale-redirect.mjs'
import { removedLocales as removed } from './build-locales.mjs'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(app, 'dist')

test('retired prefix mapping preserves English paths, queries, fragments and case', () => {
  for (const [input, expected] of [
    ['/ar', '/'], ['/ar/', '/'], ['/ar/posts/some-slug/', '/posts/some-slug/'],
    ['/ur/posts/essay?q=one#section', '/posts/essay?q=one#section'],
    ['/AR/posts/Foo?x=1#Top', '/posts/Foo?x=1#Top'],
    ['/es/posts/essay', null], ['/ca/posts/essay', null],
    ['/archive/', null], ['/ruby/', null], ['/urgent/', null], ['', null], ['/', null],
  ]) {
    assert.equal(redirectRemovedLocaleUrl(input, removed), expected, input)
  }
})

test('built 404 fallback redirects before React and is excluded from indexing', () => {
  const html = fs.readFileSync(path.join(dist, '404.html'), 'utf8')
  const doc = new JSDOM(html).window.document
  assert.equal(doc.querySelector('meta[name="robots"]')?.content, 'noindex')
  assert.equal(doc.querySelector('noscript a')?.getAttribute('href'), '/')
  const script = [...doc.querySelectorAll('script')].find((element) => element.textContent.includes('window.location.replace'))
  assert(script, 'fallback includes the early redirect script')
  assert(html.indexOf(script.outerHTML) < html.indexOf('<script type="module"'), 'redirect runs before React entry')
  for (const [input, expected] of [
    ['/ar', '/'], ['/ar/', '/'], ['/ar/posts/some-slug/?q=1#part', '/posts/some-slug/?q=1#part'],
    ['/UR/posts/essay', '/posts/essay'], ['/es/posts/essay', null], ['/archive/', null],
  ]) {
    let destination = null
    runInNewContext(script.textContent, {
      URL,
      window: { location: { href: `https://markmhendrickson.com${input}`, replace: (target) => { destination = target } } },
    })
    assert.equal(destination, expected, input)
  }
})

test('client navigation through a retired prefix reaches the English route', () => {
  const result = execFileSync(process.execPath, [path.join(app, 'scripts/removed-locale-navigation.probe.mjs'), dist], {
    cwd: app,
    encoding: 'utf8',
    timeout: 20000,
  })
  assert.equal(result, '/posts/some-slug/?q=one#section')
})
