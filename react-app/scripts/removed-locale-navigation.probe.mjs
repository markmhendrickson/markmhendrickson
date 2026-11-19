import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

const [dist] = process.argv.slice(2)
const html = fs.readFileSync(path.join(dist, 'posts/index.html'), 'utf8')
const dom = new JSDOM(html, {
  url: 'https://markmhendrickson.com/posts/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
})
const win = dom.window
const payload = win.document.getElementById('posts-ssr-data')
if (!payload) throw new Error('English posts SSR payload missing')
win.document.head.append(payload)
win.document.getElementById('root').replaceChildren()
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
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error(`Client redirect did not settle: ${win.location.href}`)
}
await waitFor(() => win.document.querySelector('aside[data-state="collapsed"]'))
win.history.pushState({}, '', '/ar/posts/some-slug/?q=one#section')
win.dispatchEvent(new win.PopStateEvent('popstate'))
await waitFor(() => win.location.pathname === '/posts/some-slug/')
if (win.location.search !== '?q=one' || win.location.hash !== '#section') {
  throw new Error(`Client redirect lost query or fragment: ${win.location.href}`)
}
process.stdout.write(win.location.pathname + win.location.search + win.location.hash)
