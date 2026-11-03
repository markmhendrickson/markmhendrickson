import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { test } from 'node:test'
import { generateShortLinks, parseShortLinks, shortLinkHtml } from './generate-short-links.mjs'

const fixture = JSON.stringify({ origin: 'https://records.example', links: { 'shared-page': 'ent_0123456789abcdef01234567' } })
const destination = 'https://records.example/entities/ent_0123456789abcdef01234567/html'

function execute(html, suffix = '?t=synthetic-token', slash = '/') {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
  const message = { textContent: 'Opening shared page…' }
  let redirected
  vm.runInNewContext(script, {
    URL, document: { getElementById: () => message },
    window: { location: { href: `https://site.example/p/shared-page${slash}${suffix}`, replace: (url) => { redirected = url } } },
  })
  return { redirected, message: message.textContent, script }
}

test('generated deployed page forwards only t to the fixed destination with encoded token roundtrip', () => {
  const dist = mkdtempSync(path.join(os.tmpdir(), 'short-links-'))
  try {
    assert.equal(generateShortLinks({ raw: fixture, dist }), 1)
    const html = readFileSync(path.join(dist, 'p/shared-page/index.html'), 'utf8')
    for (const slash of ['', '/']) {
      const token = 'synthetic+/=&?#token'
      const result = execute(html, `?t=${encodeURIComponent(token)}`, slash)
      const target = new URL(result.redirected)
      assert.equal(`${target.origin}${target.pathname}`, destination)
      assert.equal(target.searchParams.get('access_token'), token)
      assert.deepEqual([...target.searchParams.keys()], ['access_token'])
    }
    assert.equal(existsSync(path.join(dist, 'p/unknown/index.html')), false)
    assert.equal(existsSync(path.join(dist, 'p/index.html')), false)
    assert.equal(html.includes('synthetic-token'), false)
    assert.match(html, /name="robots" content="noindex,nofollow,noarchive"/)
    assert.match(html, /name="referrer" content="no-referrer"/)
    assert.doesNotMatch(html, /(?:src|href)=|localStorage|sessionStorage|cookie|fetch\(/)
    const digest = createHash('sha256').update(execute(html).script).digest('base64')
    assert.ok(html.includes(`script-src 'sha256-${digest}'`))
    assert.equal(generateShortLinks({ raw: '', dist }), 0)
    assert.equal(existsSync(path.join(dist, 'p/shared-page/index.html')), false)
  } finally { rmSync(dist, { recursive: true, force: true }) }
})

test('missing, ambiguous, malformed and unexpected query values never redirect or reflect the token', () => {
  const html = shortLinkHtml(destination)
  for (const suffix of ['', '?t=', '?t=a&t=b', '?t=a&t=a', '?access_token=a', '?t=a&next=https://evil.example', '?t=a&extra=', '?t=%', '?t=%GG', '?t=%FF', '?t=%0A', '?t=%20', '?t=a#fragment', '?t=' + 'a'.repeat(4097)]) {
    const result = execute(html, suffix)
    assert.equal(result.redirected, undefined, suffix)
    assert.match(result.message, /complete link/)
    assert.equal(result.message.includes('evil.example'), false)
  }
})

test('private config is token-free, origin-constrained and safe for output paths', () => {
  assert.deepEqual(parseShortLinks(''), [])
  assert.deepEqual(parseShortLinks(fixture), [{ slug: 'shared-page', destination }])
  const invalid = [null, [], {}, { origin: 'http://records.example', links: {} },
    { origin: 'https://records.example/', links: {} }, { origin: 'https://records.example/path', links: {} },
    { origin: 'https://user:pass@records.example', links: {} }, { origin: 'https://records.example?t=secret', links: {} },
    { origin: 'https://records.example', links: { '../escape': 'ent_0123456789abcdef01234567' } },
    { origin: 'https://records.example', links: { safe: 'https://evil.example' } },
    { origin: 'https://records.example', links: { safe: 'ent_0123456789abcdef01234567?access_token=secret' } },
    { origin: 'https://records.example', links: [], access_token: 'secret' }]
  for (const config of invalid) assert.throws(() => parseShortLinks(JSON.stringify(config)))
  assert.throws(() => parseShortLinks('not json'))
})

test('full site build emits configured redirect pages without publishing a discovery registry', {
  skip: process.env.CHECK_SHORT_LINKS_BUILD !== '1',
}, () => {
  const dist = new URL('../dist/', import.meta.url)
  const links = parseShortLinks(process.env.NEOTOMA_SHORT_LINKS_JSON)
  assert.ok(links.length > 0, 'build verification requires synthetic configured links')
  for (const { slug, destination: expected } of links) {
    const html = readFileSync(new URL(`p/${slug}/index.html`, dist), 'utf8')
    const redirected = new URL(execute(html).redirected)
    assert.equal(`${redirected.origin}${redirected.pathname}`, expected)
    assert.equal(redirected.searchParams.get('access_token'), 'synthetic-token')
    for (const file of ['sitemap.xml', 'rss.xml', 'llms-full.txt', 'index.html']) {
      const content = readFileSync(new URL(file, dist), 'utf8')
      assert.equal(content.includes(`/p/${slug}`), false, file)
      assert.equal(content.includes(expected), false, file)
    }
  }
  assert.equal(existsSync(new URL('p/unknown/index.html', dist)), false)
  assert.ok(existsSync(new URL('404.html', dist)), 'unknown paths retain the built 404 page')
})
