import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

const [dist, locale, viewport] = process.argv.slice(2)
if (!dist || !locale || !['desktop', 'mobile'].includes(viewport)) {
  throw new Error('Usage: sidebar-controls.probe.mjs <dist> <locale> <desktop|mobile>')
}

const page = locale === 'en' ? 'index.html' : `${locale}/index.html`
const html = fs.readFileSync(path.join(dist, page), 'utf8')
const win = new JSDOM(html, {
  url: `https://markmhendrickson.com/${locale === 'en' ? '' : `${locale}/`}`,
  pretendToBeVisual: true,
  runScripts: 'outside-only',
}).window
Object.defineProperty(win, 'innerWidth', { value: viewport === 'mobile' ? 375 : 1280, configurable: true })
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
if (!scriptPath) throw new Error(`${page}: production client bundle not found`)
await import(pathToFileURL(path.join(dist, scriptPath)).href)

async function waitFor(label, predicate) {
  for (let attempt = 0; attempt < 150; attempt++) {
    const value = predicate()
    if (value) return value
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error(`${locale} ${viewport}: ${label} did not hydrate`)
}

function accessibleName(control) {
  return control?.getAttribute('aria-label') || control?.querySelector('.sr-only')?.textContent?.trim() || control?.textContent?.trim() || null
}

const result = {}
if (viewport === 'desktop') {
  const expand = await waitFor('hydrated collapsed expand button', () => win.document.querySelector('aside[data-state="collapsed"] > div:first-child button[aria-label]'))
  result.expand = accessibleName(expand)
  expand.click()
  const toggle = await waitFor('expanded sidebar toggle', () => win.document.querySelector('aside[data-state="expanded"] > div:first-child button'))
  result.toggle = accessibleName(toggle)
  result.toggleHidden = toggle.querySelector('.sr-only')?.textContent?.trim() || null
} else {
  const fab = await waitFor('mobile menu button', () => win.document.querySelector('.fixed.z-50 button'))
  result.open = accessibleName(fab)
  result.openHidden = fab.querySelector('.sr-only')?.textContent?.trim() || null
  fab.click()
  await waitFor('expanded mobile sidebar', () => win.document.querySelector('aside[data-state="expanded"]'))
  result.close = accessibleName(await waitFor('mobile dismissal', () => win.document.querySelector('div[role="button"][aria-label]')))
}

const menuButtons = await waitFor('language and theme controls', () => {
  const buttons = [...win.document.querySelectorAll('aside[data-state="expanded"] button[aria-expanded]')]
  return buttons.length >= 2 ? buttons : null
})
result.language = accessibleName(menuButtons.find((button) => button.querySelector('svg.lucide-languages')))
result.theme = accessibleName(menuButtons.find((button) => button.querySelector('svg.lucide-sun-moon')))
process.stdout.write(JSON.stringify(result))
win.close()
