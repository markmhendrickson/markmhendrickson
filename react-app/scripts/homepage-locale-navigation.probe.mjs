import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

const [dist, locale] = process.argv.slice(2)
if (!dist || !locale) throw new Error('Usage: homepage-locale-navigation.probe.mjs <dist> <locale>')

const html = fs.readFileSync(path.join(dist, 'posts/index.html'), 'utf8')
const dom = new JSDOM(html, {
  url: 'https://markmhendrickson.com/posts/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
})
const win = dom.window
// Keep the prerendered /posts payload while starting a clean client root.
// JSDOM rewrites some of the site's prerendered markup and cannot hydrate it faithfully.
const payload = win.document.getElementById('posts-ssr-data')
if (!payload) throw new Error('English /posts SSR payload missing')
win.document.head.append(payload)
win.document.getElementById('root').replaceChildren()
Object.defineProperty(win, 'innerWidth', { value: 1280, configurable: true })
win.scrollTo = () => {}
win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'MutationObserver']) {
  globalThis[key] = key === 'window' ? win : win[key]
}
globalThis.self = win
globalThis.getComputedStyle = win.getComputedStyle.bind(win)
globalThis.requestAnimationFrame = win.requestAnimationFrame.bind(win)
globalThis.cancelAnimationFrame = win.cancelAnimationFrame.bind(win)

const scriptPath = /<script[^>]*type="module"[^>]*src="([^"]+)"/.exec(html)?.[1]
if (!scriptPath) throw new Error('production client bundle not found')
await import(pathToFileURL(path.join(dist, scriptPath)).href)

const waitFor = async (predicate) => {
  for (let attempt = 0; attempt < 150; attempt++) {
    const value = predicate()
    if (value) return value
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error(`${locale}: client navigation did not settle`)
}

await waitFor(() => win.document.querySelector('aside[data-state="collapsed"]'))
const localeHref = `/${locale}/`
win.history.pushState({}, '', localeHref)
win.dispatchEvent(new win.PopStateEvent('popstate'))
await waitFor(() => win.location.pathname === localeHref && win.document.querySelector('#home-latest-posts'))

const feedItems = (root) => [...root.querySelectorAll('article h3 a, article h2 a')]
  .slice(0, 12)
  .map((link) => ({ href: link.getAttribute('href'), title: link.textContent.trim() }))
const homeItems = feedItems(win.document.querySelector('section[aria-labelledby="home-latest-posts"]'))
const expectedDoc = new JSDOM(fs.readFileSync(path.join(dist, locale, 'posts/index.html'), 'utf8')).window.document
const expectedItems = feedItems(expectedDoc)
const postsHref = `/${locale}/posts/`
win.history.pushState({}, '', postsHref)
win.dispatchEvent(new win.PopStateEvent('popstate'))
const postsItems = await waitFor(() => {
  if (win.location.pathname !== postsHref) return null
  const items = feedItems(win.document)
  return items.length === 12 && items[0]?.href?.startsWith(postsHref) ? items : null
})
process.stdout.write(JSON.stringify({ homeItems, postsItems, expectedItems }))
