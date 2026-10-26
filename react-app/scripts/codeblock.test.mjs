import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import React, { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { createServer } from 'vite'
import { JSDOM } from 'jsdom'
import { StaticRouter } from 'react-router-dom/server.js'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = process.env.WEBSITE_TEST_DIST ?? path.join(app, 'dist')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const { CodeBlock, MarkdownPre, normalizeCodeText, copyTextToClipboard } = await server.ssrLoadModule('/src/components/CodeBlock.tsx')
after(() => server.close())

async function withBrowserDom(run) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://example.test/' })
  const previous = Object.fromEntries(['window', 'document', 'navigator', 'HTMLElement', 'IS_REACT_ACT_ENVIRONMENT'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const key of ['window', 'document', 'navigator', 'HTMLElement']) {
    Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? dom.window : dom.window[key] })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(dom.window.document.getElementById('root'))
  try {
    return await run(dom.window, root)
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
}

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

test('copy control sends the displayed normalized snippet and announces localized success', async () => {
  await withBrowserDom(async (win, root) => {
    const written = []
    win.navigator.clipboard = { writeText: async (value) => written.push(value) }
    await act(async () => root.render(React.createElement(CodeBlock, { code: 'echo one\n  echo two\n\n', copyLabel: 'Copiar', copiedLabel: 'Copiado', failureLabel: 'No se pudo copiar.' })))
    const button = win.document.querySelector('button[aria-label="Copiar"]')
    assert(button, 'localized copy action is present')
    assert.equal(win.document.querySelector('pre code').textContent, 'echo one\n  echo two')
    await act(async () => { button.click(); await Promise.resolve() })
    assert.deepEqual(written, ['echo one\n  echo two'])
    assert.equal(button.getAttribute('aria-label'), 'Copiado')
    assert.equal(win.document.querySelector('[role="status"]').textContent, 'Copiado')
  })
})

test('rejected clipboard and throwing fallback leave focus intact and announce retryable failure', async () => {
  await withBrowserDom(async (win, root) => {
    win.navigator.clipboard = { writeText: async () => { throw new Error('denied') } }
    win.document.execCommand = () => { throw new Error('unavailable') }
    await act(async () => root.render(React.createElement(CodeBlock, { code: 'echo failure', copyLabel: 'Copiar', copiedLabel: 'Copiado', failureLabel: 'No se pudo copiar. Inténtalo de nuevo.' })))
    const button = win.document.querySelector('button[aria-label="Copiar"]')
    button.focus()
    await act(async () => { button.click(); await Promise.resolve() })
    assert.equal(win.document.querySelectorAll('textarea').length, 0, 'temporary fallback input is removed')
    assert.equal(win.document.activeElement, button, 'keyboard focus returns to the copy action')
    assert.equal(button.getAttribute('aria-label'), 'Copiar', 'copy remains retryable')
    const status = win.document.querySelector('[role="status"]')
    assert.equal(status.textContent, 'No se pudo copiar. Inténtalo de nuevo.')
    assert(!status.classList.contains('sr-only'), 'failure is visible as well as announced')
  })
})

test('a denied copy visibly explains failure while keeping the action available', async () => {
  await withBrowserDom(async (win, root) => {
    win.navigator.clipboard = { writeText: async () => { throw new Error('denied') } }
    win.document.execCommand = () => false
    await act(async () => root.render(React.createElement(CodeBlock, { code: 'echo retry', copyLabel: 'Copiar', copiedLabel: 'Copiado', failureLabel: 'No se pudo copiar. Inténtalo de nuevo.' })))
    const button = win.document.querySelector('button[aria-label="Copiar"]')
    await act(async () => { button.click(); await Promise.resolve() })
    assert.equal(button.getAttribute('aria-label'), 'Copiar')
    const status = win.document.querySelector('[role="status"]')
    assert.equal(status.textContent, 'No se pudo copiar. Inténtalo de nuevo.')
    assert(!status.classList.contains('sr-only'))
  })
})

test('overlapping clicks serialize clipboard writes and a failed attempt does not block the next', async () => {
  await withBrowserDom(async (win, root) => {
    const requests = []
    const copied = []
    win.navigator.clipboard = { writeText: (value) => new Promise((resolve, reject) => requests.push({ value, resolve, reject })) }
    win.document.execCommand = () => false
    await act(async () => root.render(React.createElement(CodeBlock, {
      code: 'echo ordered', copyLabel: 'Copiar', copiedLabel: 'Copiado',
      failureLabel: 'No se pudo copiar.', onCopy: () => copied.push('copied'),
    })))
    const button = win.document.querySelector('button[aria-label="Copiar"]')
    await act(async () => { button.click(); button.click(); await Promise.resolve() })
    assert.equal(requests.length, 1, 'a second click cannot start an unordered clipboard write')
    assert.equal(requests[0].value, 'echo ordered')

    await act(async () => { requests[0].reject(new Error('denied')); await Promise.resolve() })
    assert.equal(requests.length, 2, 'the queued attempt starts after the first has failed')
    assert.equal(requests[1].value, 'echo ordered')
    await act(async () => { requests[1].resolve(); await Promise.resolve() })
    assert.equal(button.getAttribute('aria-label'), 'Copiado', 'the final completed action determines the status')
    assert.equal(win.document.querySelector('[role="status"]').textContent, 'Copiado')
    assert.deepEqual(copied, ['copied'], 'only the successful write invokes the callback')

    await act(async () => { button.click(); button.click(); await Promise.resolve() })
    assert.equal(requests.length, 3, 'the next pair also starts one write at a time')
    await act(async () => { requests[2].resolve(); await Promise.resolve() })
    assert.equal(requests.length, 4, 'the last requested write starts after the prior success')
    await act(async () => { requests[3].reject(new Error('denied')); await Promise.resolve() })
    assert.equal(button.getAttribute('aria-label'), 'Copiar', 'a later failure remains retryable')
    assert.equal(win.document.querySelector('[role="status"]').textContent, 'No se pudo copiar.')
    assert.deepEqual(copied, ['copied', 'copied'])
  })
})

test('published fenced post renders every snippet with a copy action', () => {
  const html = fs.readFileSync(path.join(dist, 'posts/what-my-agentic-stack-actually-does/index.html'), 'utf8')
  const article = html.slice(html.indexOf('<article>'))
  assert.equal((article.match(/class="code-block not-prose/g) ?? []).length, 6)
  assert.equal((article.match(/aria-label="Copy" title="Copy"/g) ?? []).length, 6)
  assert(article.includes('store({'), 'code text remains visible')
})

test('post code controls have localized action names in every supported locale', async () => {
  const { render } = await import(pathToFileURL(path.join(dist, 'server/entry-server.js')).href)
  const labels = {
    en: 'Copy', es: 'Copiar', ca: 'Copia', zh: '复制', hi: 'कॉपी करें', ar: 'نسخ', fr: 'Copier',
    pt: 'Copiar', ru: 'Копировать', bn: 'কপি করুন', ur: 'کاپی کریں', id: 'Salin', de: 'Kopieren',
  }
  for (const [locale, label] of Object.entries(labels)) {
    const prefix = locale === 'en' ? '' : `${locale}/`
    const html = render(`/${prefix}posts/code-label-fixture/`, {}, {
      unlistedPost: {
        slug: 'code-label-fixture',
        title: 'Code label fixture',
        published: true,
        body: '```bash\necho exact-copy\n```',
      },
    })
    const document = new JSDOM(html).window.document
    const buttons = [...document.querySelectorAll('article .code-block button')]
    assert.equal(buttons.length, 1, `${locale}: route renders the code fixture with a copy action`)
    assert.equal(buttons[0].getAttribute('aria-label'), label, `${locale}: localized copy name`)
  }
})

test('body, summary, postscript, thesis, and Wisdom expose the same exact-copy control', async () => {
  const { render } = await import(pathToFileURL(path.join(dist, 'server/entry-server.js')).href)
  const body = '```bash\necho body\n```\n\n## Postscript\n\n```bash\necho postscript\n```'
  const summary = '```bash\necho summary\n```'
  const postHtml = render('/es/posts/code-fixture/', {}, {
    unlistedPost: { slug: 'code-fixture', title: 'Code fixture', published: true, body, summary },
  })
  const { LocaleProvider } = await server.ssrLoadModule('/src/i18n/LocaleContext.tsx')
  const { HonorsThesisMarkdown } = await server.ssrLoadModule('/src/pages/HonorsThesis.tsx')
  const { WisdomEmptyState } = await server.ssrLoadModule('/src/pages/Wisdom.tsx')
  const route = (element) => renderToStaticMarkup(
    React.createElement(StaticRouter, { location: '/es/' }, React.createElement(LocaleProvider, { locale: 'es' }, element)),
  )
  const thesisHtml = route(React.createElement(HonorsThesisMarkdown, {
    markdown: '```bash\necho thesis\n```',
    footnoteOptions: { footnoteLabel: 'Notes', footnoteBackLabel: 'Back' },
  }))
  const wisdomHtml = route(React.createElement(WisdomEmptyState))
  const snippets = [
    ...new JSDOM(postHtml).window.document.querySelectorAll('.code-block'),
    ...new JSDOM(thesisHtml).window.document.querySelectorAll('.code-block'),
    ...new JSDOM(wisdomHtml).window.document.querySelectorAll('.code-block'),
  ]
  assert.deepEqual(snippets.map((block) => block.querySelector('code').textContent), [
    'echo summary', 'echo body', 'echo postscript', 'echo thesis', 'python execution/scripts/generate_pithbot.py',
  ])
  assert(snippets.every((block) => block.querySelector('button')?.getAttribute('aria-label') === 'Copiar'), 'all five entry points use the localized copy name')

  for (const block of snippets) {
    const code = block.querySelector('code').textContent
    await withBrowserDom(async (win, root) => {
      const written = []
      win.navigator.clipboard = { writeText: async (value) => written.push(value) }
      await act(async () => root.render(React.createElement(CodeBlock, { code, copyLabel: 'Copiar', copiedLabel: 'Copiado' })))
      const button = win.document.querySelector('button[aria-label="Copiar"]')
      await act(async () => { button.click(); await Promise.resolve() })
      assert.deepEqual(written, [code], 'clicked control writes the displayed snippet')
      assert.equal(button.getAttribute('aria-label'), 'Copiado', 'success state is announced')
    })
  }
})
