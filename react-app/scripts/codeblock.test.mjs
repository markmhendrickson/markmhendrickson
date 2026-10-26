import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = process.env.WEBSITE_TEST_DIST ?? path.join(app, 'dist')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const { MarkdownPre, normalizeCodeText, copyTextToClipboard } = await server.ssrLoadModule('/src/components/CodeBlock.tsx')
after(() => server.close())

test('a fenced snippet retains its code, language, and accessible copy action', () => {
  const source = 'echo "one"\n  echo two\n'
  const html = renderToStaticMarkup(React.createElement(MarkdownPre, {}, React.createElement('code', { className: 'language-bash' }, source)))
  assert(html.includes('>bash</span>'))
  assert(html.includes('echo &quot;one&quot;\n  echo two</code>'))
  assert(html.includes('aria-label="Copy code"'))
  assert.equal(normalizeCodeText(source), 'echo "one"\n  echo two')
})

test('clipboard helper sends exact supplied bytes to the supported browser API', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const written = []
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: async (value) => written.push(value) } } })
  try {
    assert.equal(await copyTextToClipboard('echo one\n  echo two'), true)
    assert.deepEqual(written, ['echo one\n  echo two'])
  } finally {
    if (previous) Object.defineProperty(globalThis, 'navigator', previous)
    else delete globalThis.navigator
  }
})

test('published fenced post renders every snippet with a copy action', () => {
  const html = fs.readFileSync(path.join(dist, 'posts/what-my-agentic-stack-actually-does/index.html'), 'utf8')
  const article = html.slice(html.indexOf('<article>'))
  assert.equal((article.match(/class="code-block not-prose/g) ?? []).length, 6)
  assert.equal((article.match(/aria-label="Copy" title="Copy"/g) ?? []).length, 6)
  assert(article.includes('store({'), 'code text remains visible')
})
