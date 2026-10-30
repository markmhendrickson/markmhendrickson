import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import { JSDOM } from 'jsdom'
import { build } from 'esbuild'

// Compile the actual module with production defines. A Vite dev SSR import
// would leave import.meta.env.DEV true and miss the publication regression.
const compiled = await build({
  entryPoints: [new URL('../src/lib/paperVisualMotion.ts', import.meta.url).pathname],
  bundle: true, platform: 'node', format: 'esm', write: false,
  define: { 'import.meta.env.DEV': 'false' },
})
const motion = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`)
const scenes = {
  'connected-records': 'connectedRecordsProof',
  'synthetic-sources': 'syntheticSourcesProof',
  'current-record': 'invoiceOverheadProof',
  'shared-instance': 'governedCollaborationProof',
  'competing-claims': 'competingClaimsProof',
  'explanations-impact': 'explanationsImpactProof',
}

test('production compilation animates the six trusted published scenes, including delayed endpoints', () => {
  for (const [file, scene] of Object.entries(scenes)) {
    const svg = fs.readFileSync(new URL(`../src/assets/neotoma-paper/published/${file}.svg`, import.meta.url), 'utf8')
    const document = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document
    const calls = new Map()
    for (const node of document.querySelectorAll('*')) node.animate = (frames, options) => {
      const result = { frames, options }
      calls.set(node, result)
      return result
    }
    const root = document.documentElement
    assert.equal(root.getAttribute('data-paper-scene'), scene)
    assert(motion.playPaperScene(root).length > 0, `${scene}: production playback is enabled`)
    const connections = [...root.querySelectorAll('[data-paper-connection]')]
    for (const line of connections) assert.equal(calls.get(line)?.frames.at(-1).strokeDashoffset, '0', `${scene}: line draws`)
    for (const port of root.querySelectorAll('[data-paper-port]')) {
      const animation = calls.get(port)
      assert(animation, `${scene}: endpoint appears after line`)
      assert(animation.options.delay >= 650)
      assert.equal(animation.frames[0].opacity, 0)
      assert.equal(animation.frames.at(-1).opacity, 1)
    }
    for (const letter of root.querySelectorAll('[data-paper-letter]')) {
      assert.equal(calls.get(letter)?.frames.at(-1).opacity, 1, `${scene}: dated letter rises`)
    }
  }
})

test('an unrecognized hybrid scene does not enter the privileged choreography', () => {
  const document = new JSDOM('<svg xmlns="http://www.w3.org/2000/svg" data-paper-scene="unreviewed" data-paper-treatment="hybrid-record-proof"><circle data-paper-port="x"/><path data-paper-connection=""/></svg>', { contentType: 'image/svg+xml' }).window.document
  const port = document.querySelector('[data-paper-port]')
  const line = document.querySelector('[data-paper-connection]')
  const calls = new Map()
  for (const node of [port, line]) node.animate = (frames, options) => { calls.set(node, { frames, options }); return { frames, options } }
  motion.playPaperScene(document.documentElement)
  assert(!calls.has(port), 'unknown scene cannot opt into staged endpoint choreography')
})

// Evaluate normal-motion CSS in the DOM as well as presentation opacity. This
// catches media rules that leave the authored fallback invisible without JS.
function fallbackDocument(svg) {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>${svg}</body></html>`)
  for (const style of dom.window.document.querySelectorAll('style')) {
    // These trusted scenes use only no-preference/reduce media queries. Select
    // the ordinary no-preference branch so its old opacity:0 regression is real.
    const sheet = dom.window.document.createElement('style')
    sheet.textContent = style.textContent.replace(/@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{([^{}]*\{[^{}]*\})\s*\}/g, '$1')
      .replace(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([^{}]*\{[^{}]*\})\s*\}/g, '')
    dom.window.document.head.appendChild(sheet)
  }
  return dom
}
function visibleOpacity(dom, node) {
  let value = 1
  for (let current = node; current?.nodeType === 1; current = current.parentElement) {
    const css = dom.window.getComputedStyle(current).opacity
    value *= Number(css || current.getAttribute('opacity') || 1)
  }
  return value
}
function assertFallbackVisible(dom, scene) {
  for (const node of dom.window.document.querySelectorAll('[data-paper-port],[data-paper-letter],[data-paper-envelope-state="open"],[data-inspection-object],[data-explanation-root]'))
    assert(visibleOpacity(dom, node) > .99, `${scene}: ${node.getAttribute('data-paper-port') || node.getAttribute('data-paper-letter') || 'open envelope'} stays visible`)
}
test('no-JS, missing motion APIs, reduced motion and observer disposal retain the complete authored frame', () => {
  for (const [file, scene] of Object.entries(scenes)) {
    const svg = fs.readFileSync(new URL(`../src/assets/neotoma-paper/published/${file}.svg`, import.meta.url), 'utf8')
    const staticDom = fallbackDocument(svg)
    assertFallbackVisible(staticDom, scene)
    for (const missing of ['animate','IntersectionObserver','matchMedia']) {
      const dom = fallbackDocument(svg), view = dom.window
      globalThis.window = view; globalThis.document = view.document; globalThis.Element = view.Element
      view.matchMedia = () => ({matches:false,addEventListener(){},removeEventListener(){}})
      view.IntersectionObserver = class { observe(){} disconnect(){} }
      view.Element.prototype.animate = () => { throw Error('fallback must not animate') }
      if (missing === 'animate') delete view.Element.prototype.animate
      else if (missing === 'IntersectionObserver') view.IntersectionObserver = undefined
      else view.matchMedia = undefined
      const stop = motion.observeViewportMotion([view.document.querySelector('svg')],motion.playPaperScene)
      assertFallbackVisible(dom, `${scene}/${missing}`);stop();assertFallbackVisible(dom,`${scene}/${missing}/cleanup`)
    }
    for (const reduced of [false,true]) {
      const dom=fallbackDocument(svg),view=dom.window
      globalThis.window=view;globalThis.document=view.document;globalThis.Element=view.Element
      view.matchMedia=()=>({matches:reduced,addEventListener(){},removeEventListener(){}})
      class Observer { observe(){} disconnect(){} }
      view.IntersectionObserver=Observer;globalThis.IntersectionObserver=Observer
      view.Element.prototype.animate=()=>{throw Error('not entered')}
      const stop=motion.observeViewportMotion([view.document.querySelector('svg')],motion.playPaperScene)
      if(reduced)assertFallbackVisible(dom,`${scene}/reduced`)
      stop();assertFallbackVisible(dom,`${scene}/disposed-before-entry`)
    }
  }
})
