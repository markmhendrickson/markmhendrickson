import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

const [dist, locale] = process.argv.slice(2)
if (!dist || !locale) throw new Error('Usage: desktop-sidebar-name.probe.mjs <dist> <locale>')

const page = locale === 'en' ? 'index.html' : `${locale}/index.html`
const html = fs.readFileSync(path.join(dist, page), 'utf8')
const dom = new JSDOM(html, {
  url: `https://markmhendrickson.com/${locale === 'en' ? '' : `${locale}/`}`,
  pretendToBeVisual: true,
  runScripts: 'outside-only',
})
const win = dom.window
Object.defineProperty(win, 'innerWidth', { value: 1280, configurable: true })
win.scrollTo = () => {}
win.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
})
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'MutationObserver']) {
  globalThis[key] = key === 'window' ? win : win[key]
}
globalThis.self = win
globalThis.getComputedStyle = win.getComputedStyle.bind(win)
globalThis.requestAnimationFrame = win.requestAnimationFrame.bind(win)
globalThis.cancelAnimationFrame = win.cancelAnimationFrame.bind(win)

const scriptPath = /<script[^>]*type="module"[^>]*src="([^"]+)"/.exec(html)?.[1]
if (!scriptPath) throw new Error(`${page}: production client bundle not found`)
await import(pathToFileURL(path.join(dist, scriptPath)).href)

let control
for (let attempt = 0; attempt < 100; attempt++) {
  control = win.document.querySelector('aside[data-state="collapsed"] > div:first-child button[aria-label]')
  if (control) break
  await new Promise((resolve) => setTimeout(resolve, 20))
}
if (!control) throw new Error(`${page}: collapsed desktop expand control did not hydrate`)
process.stdout.write(JSON.stringify({ label: control.getAttribute('aria-label') }))
win.close()
