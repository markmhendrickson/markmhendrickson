import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const motion = await server.ssrLoadModule('/src/lib/paperVisualMotion.ts')
const { PaperArtwork, hasPaperArtwork } = await server.ssrLoadModule('/src/components/PaperArtwork.tsx')
after(() => server.close())

function environment() {
  const listeners = new Map()
  const preferences = new Map()
  const reduced = { matches: false, addEventListener: (name, fn) => preferences.set(name, fn), removeEventListener: (name) => preferences.delete(name) }
  const observers = []
  const mutations = []
  class Element {
    constructor(dataset = {}) { this.dataset = dataset; this.calls = []; this.attributes = new Map(); this.style = {}; this.isConnected = true }
    setAttribute(name, value) { this.attributes.set(name, value) }
    getAttribute(name) { return this.attributes.get(name) ?? null }
    animate(frames, options) {
      let finish
      const finished = new Promise((resolve) => { finish = resolve })
      const animation = { frames, options, cancelled: 0, playState: 'running', finished, finish() { this.playState = 'finished'; finish() }, cancel() { this.cancelled++; this.playState = 'idle' } }
      this.calls.push(animation)
      return animation
    }
  }
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = []; this.disconnected = false; observers.push(this) }
    observe(target) { this.targets.push(target) }
    unobserve(target) { this.targets = this.targets.filter((item) => item !== target) }
    disconnect() { this.disconnected = true }
    enter(target, isIntersecting = true, intersectionRatio = isIntersecting ? 1 : 0) { this.callback([{ target, isIntersecting, intersectionRatio }]) }
  }
  class Mutation {
    constructor(callback) { this.callback = callback; mutations.push(this) }
    observe(root, options) { this.root = root; this.options = options }
    disconnect() { this.disconnected = true }
    change() { this.callback([]) }
  }
  globalThis.Element = Element
  globalThis.IntersectionObserver = Observer
  globalThis.window = { matchMedia: () => reduced, IntersectionObserver: Observer, MutationObserver: Mutation }
  globalThis.document = { hidden: false, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) }
  return { Element, observers, mutations, reduced, preferences, listeners }
}

test('paper arrivals animate real objects from outside the frame, settle, then draw connections', () => {
  const env = environment()
  const objects = [new env.Element({ enterX: '-1050', enterY: '35', enterRotation: '-5', enterDelay: '0' }), new env.Element({ enterX: '1050', enterY: '-25', enterRotation: '5', enterDelay: '200' })]
  const connections = [new env.Element(), new env.Element()]
  const root = { querySelectorAll: (selector) => selector.includes('object') ? objects : connections }
  const animations = motion.playPaperScene(root)
  assert.equal(animations.length, 4)
  const first = objects[0].calls[0]
  assert.equal(first.frames.length, 33)
  assert.equal(motion.springFrames(-1050, 35, -5), first.frames)
  assert.match(first.frames[0].transform, /translate\(-1050px, 35px\) rotate\(-5deg\)/)
  assert.equal(first.frames.at(-1).transform, 'translate(0px, 0px) rotate(0deg)')
  assert(first.frames.every((frame) => !('opacity' in frame)))
  assert.equal(first.options.duration, 820)
  assert.equal(connections[0].calls[0].options.delay, 1060)
  assert.equal(connections[1].calls[0].options.delay, 1130)
  assert.equal(connections[0].calls[0].frames.at(-1).strokeDashoffset, '0')
})

test('photographic scenes keep the baked image still while finite highlights trace evidence and return to static', () => {
  const env = environment()
  const image = new env.Element()
  const trace = new env.Element({ highlightDelay: '120', highlightDuration: '1700', paperHighlight: 'trace' })
  const focus = new env.Element({ highlightDelay: '1100', highlightDuration: '1000', paperHighlight: 'focus' })
  const root = new env.Element()
  root.setAttribute('data-paper-treatment', 'photographic-paper')
  root.querySelectorAll = (selector) => selector === '[data-paper-highlight]' ? [trace, focus] : ['image', '[data-paper-photograph]'].includes(selector) ? [image] : []
  assert.deepEqual(root.querySelectorAll('image'), [image], 'instrument exposes the real photographic base to a mistaken image query')
  const animations = motion.playPaperScene(root)
  assert.equal(animations.length, 2)
  assert.equal(image.calls.length, 0, 'no pan, float or fragment motion on the photograph')
  assert.equal(root.calls.length, 0, 'the entire scene is not panned or floated either')
  assert.equal(trace.calls[0].options.delay, 120)
  assert.equal(trace.calls[0].options.duration, 1700)
  assert.equal(focus.calls[0].options.delay, 1100)
  for (const { frames } of animations) {
    assert.equal(frames[0].opacity, 0)
    assert.equal(frames.at(-1).opacity, 0, 'clean complete static photograph after emphasis')
    assert(frames.some((frame) => frame.opacity > 0.5), 'the effect is visibly meaningful between static endpoints')
    assert(frames.every((frame) => !('transform' in frame)), 'no invented independent photo-object motion')
  }
  assert.equal(trace.calls[0].frames[0].strokeDashoffset, '1')
  assert(trace.calls[0].frames.some((frame) => frame.strokeDashoffset === '0'))
})

test('observer replays only on real re-entry and cancels on exit, hidden, preference change and unmount', () => {
  const env = environment()
  const root = new env.Element()
  const stop = motion.observeViewportMotion([root], (target) => [target.animate([], {})])
  const observer = env.observers[0]
  observer.enter(root); observer.enter(root)
  assert.equal(root.calls.length, 1)
  assert.equal(root.getAttribute('data-motion-entry-count'), '1')
  assert.equal(root.getAttribute('data-motion-animation-count'), '1')
  observer.enter(root, false)
  assert.equal(root.calls[0].cancelled, 1)
  observer.enter(root)
  assert.equal(root.calls.length, 2)
  document.hidden = true; env.listeners.get('visibilitychange')()
  assert.equal(root.calls[1].cancelled, 1)
  document.hidden = false; env.listeners.get('visibilitychange')()
  assert.equal(root.calls.length, 2)
  assert.equal(root.getAttribute('data-motion-entry-count'), '2')
  observer.enter(root, false); observer.enter(root)
  assert.equal(root.calls.length, 3)
  env.reduced.matches = true; env.preferences.get('change')()
  assert.equal(root.calls[2].cancelled, 1)
  observer.enter(root, false); observer.enter(root)
  assert.equal(root.calls.length, 3)
  stop()
  assert(observer.disconnected)
  assert.equal(env.listeners.size, 0)
  assert.equal(env.preferences.size, 0)
})

test('an unseen hybrid scene keeps ports and the dated letter staged through its first offscreen observer event', async () => {
  const env = environment()
  const scene = new env.Element(), port = new env.Element()
  const open = new env.Element({ paperEnvelopeState: 'open' })
  const closed = new env.Element({ paperEnvelopeState: 'closed' })
  const letter = new env.Element()
  scene.setAttribute('data-paper-treatment', 'hybrid-record-proof')
  scene.setAttribute('data-paper-scene', 'invoiceOverheadProof')
  scene.querySelectorAll = (selector) => selector === '[data-paper-port]' ? [port] : selector === '[data-paper-envelope-state]' ? [open, closed] : selector === '[data-paper-letter]' ? [letter] : []
  const stop = motion.observeViewportMotion([scene], (target) => [target.animate([], {})])
  assert.equal(port.style.opacity, '0', 'ports are staged before the observer begins')
  assert.equal(open.style.opacity, '0')
  assert.equal(closed.style.opacity, '1')
  assert.equal(letter.style.opacity, '0')
  env.observers[0].enter(scene, false)
  assert.equal(port.style.opacity, '0', 'an offscreen callback never settles an unplayed scene')
  assert.equal(open.style.opacity, '0', 'open cutout cannot flash before the first scroll entry')
  assert.equal(letter.style.opacity, '0', 'dated letter cannot flash before opening')
  env.observers[0].enter(scene)
  assert.equal(port.style.opacity, '0', 'ports remain hidden while their line is drawing')
  assert.equal(letter.style.opacity, '0')
  scene.calls[0].finish()
  await new Promise(setImmediate)
  assert.equal(port.style.opacity, '1', 'completed scene returns to its readable static state')
  assert.equal(open.style.opacity, '1')
  assert.equal(closed.style.opacity, '0')
  assert.equal(letter.style.opacity, '1')
  stop()
})

test('meaningful visibility starts at 35 percent and ratio dips do not create another entry', () => {
  const env = environment()
  const root = new env.Element()
  const stop = motion.observeViewportMotion([root], (target) => [target.animate([], {})])
  const observer = env.observers[0]
  assert.deepEqual(observer.options.threshold, [0, 0.35])
  observer.enter(root, true, 0.12)
  observer.enter(root, true, 0.34)
  assert.equal(root.calls.length, 0)
  observer.enter(root, true, 0.35)
  assert.equal(root.calls.length, 1)
  observer.enter(root, true, 0.2)
  observer.enter(root, true, 0.36)
  assert.equal(root.calls.length, 1)
  observer.enter(root, false)
  assert.equal(root.calls[0].cancelled, 1)
  observer.enter(root, true, 0.35)
  assert.equal(root.calls.length, 2)
  stop()
})

test('reduced motion and unavailable browser APIs leave the authored state untouched', () => {
  const env = environment(); env.reduced.matches = true
  const root = new env.Element()
  const stop = motion.observeViewportMotion([root], (target) => [target.animate([], {})])
  env.observers[0].enter(root)
  assert.equal(root.calls.length, 0)
  stop()
  window.IntersectionObserver = undefined
  motion.observeViewportMotion([root], () => { throw new Error('unsupported fallback must not animate') })()
})

test('server-rendered artwork is complete without JS and all inline references remain unique', () => {
  const filenames = ['hero', 'observation', 'invoice-example', 'tools', 'vision-domain', 'vision-positions', 'vision-explanation']
  const html = renderToStaticMarkup(React.createElement('main', {}, filenames.map((name) => React.createElement(PaperArtwork, { key: name, src: `/images/posts/neotoma-paper/${name}.svg`, alt: name }))))
  assert((html.match(/<svg\b/g) ?? []).length >= 7, 'all seven top-level scenes render without JavaScript')
  assert((html.match(/data-paper-object=/g) ?? []).length > 20)
  for (const scene of ['connectedRecordsProof', 'syntheticSourcesProof', 'invoiceOverheadProof', 'governedCollaborationProof', 'competingClaimsProof', 'explanationsImpactProof']) assert(html.includes(`data-paper-scene="${scene}"`))
  assert(!html.includes('feTurbulence'))
  assert(!html.includes('feDropShadow'))
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(ids).size, ids.length)
  for (const [, reference] of html.matchAll(/url\(#([^)]*)\)/g)) assert(ids.includes(reference), reference)
  for (const [, reference] of html.matchAll(/\bhref="#([^"]+)"/g)) assert(ids.includes(reference), reference)
  assert(!html.includes('<script'))
  assert(!html.includes('visibility:hidden'))
})

test('every trusted paper scene uses its supplied accessible name', () => {
  for (const name of ['hero', 'observation', 'invoice-example', 'tools', 'vision-domain', 'vision-positions', 'vision-explanation']) {
    const alt = `Localized ${name} <& 'quoted' scene`
    const html = renderToStaticMarkup(React.createElement(PaperArtwork, { src: `/images/posts/neotoma-paper/${name}.svg`, alt }))
    const [, labelId] = html.match(/<svg\b[^>]*aria-labelledby="([^"]+)"/) ?? []
    const [, titleId, title] = html.match(/<title id="([^"]+)">([^<]+)<\/title>/) ?? []
    assert(labelId && titleId, `${name}: labeled title exists`)
    assert.equal(labelId, titleId, `${name}: SVG names its title`)
    assert.equal(title, 'Localized ' + name + ' &lt;&amp; &#x27;quoted&#x27; scene', `${name}: supplied alt is escaped`)
    assert(!html.includes('<script'), `${name}: no injected markup`)
  }
})

test('one article observer shares two slots and drains still-visible scenes in entry order', async () => {
  const env = environment()
  const objects = Array.from({ length: 7 }, () => new env.Element({ enterX: '1050', enterY: '0', enterRotation: '5', enterDelay: '0' }))
  const scenes = objects.map((object) => {
    const scene = new env.Element()
    scene.querySelectorAll = (selector) => selector.includes('object') ? [object] : []
    return scene
  })
  const article = { querySelectorAll: () => scenes }
  const stop = motion.observePaperArticle(article)
  assert.equal(env.observers.length, 1)
  const observer = env.observers[0]
  assert.equal(observer.targets.length, 7)
  scenes.forEach((scene) => observer.enter(scene))
  assert.deepEqual(objects.map((object) => object.calls.length), [1, 1, 0, 0, 0, 0, 0])
  objects[0].calls[0].finish()
  await new Promise(setImmediate)
  assert.deepEqual(objects.map((object) => object.calls.length), [1, 1, 1, 0, 0, 0, 0], 'completion enrolls third visible scene without exit/re-entry')
  observer.enter(scenes[1], false)
  assert.deepEqual(objects.map((object) => object.calls.length), [1, 1, 1, 1, 0, 0, 0], 'exit releases a slot to the next queued scene')
  document.hidden = true; env.listeners.get('visibilitychange')()
  document.hidden = false; env.listeners.get('visibilitychange')()
  assert.deepEqual(objects.map((object) => object.calls.length), [1, 1, 1, 1, 0, 0, 0], 'tab resume does not play old queued entries')
  observer.enter(scenes[6], false); observer.enter(scenes[6])
  assert.equal(objects[6].calls.length, 1, 'a real new entry can play after resume')
  stop()
  assert(observer.disconnected)
})

test('queued scenes that leave or become suppressed never replay when a slot frees', async () => {
  for (const suppress of ['exit', 'reduced', 'hidden']) {
    const env = environment()
    const scenes = Array.from({ length: 3 }, () => new env.Element())
    const stop = motion.observeViewportMotion(scenes, (target) => [target.animate([], {})])
    const observer = env.observers[0]
    scenes.forEach((scene) => observer.enter(scene))
    if (suppress === 'exit') observer.enter(scenes[2], false)
    if (suppress === 'reduced') { env.reduced.matches = true; env.preferences.get('change')(); env.reduced.matches = false; env.preferences.get('change')() }
    if (suppress === 'hidden') { document.hidden = true; env.listeners.get('visibilitychange')(); document.hidden = false; env.listeners.get('visibilitychange')() }
    scenes[0].calls[0].finish()
    await new Promise(setImmediate)
    assert.equal(scenes[2].calls.length, 0, suppress)
    stop()
  }
})

test('article registration observes replacement SVG nodes after an ordinary subtree remount', () => {
  const env = environment()
  const oldObject = new env.Element({ enterX: '20', enterY: '0', enterRotation: '0' })
  const newObject = new env.Element({ enterX: '20', enterY: '0', enterRotation: '0' })
  const oldScene = new env.Element(), newScene = new env.Element()
  oldScene.querySelectorAll = (selector) => selector.includes('object') ? [oldObject] : []
  newScene.querySelectorAll = (selector) => selector.includes('object') ? [newObject] : []
  let children = [oldScene]
  const stop = motion.observePaperArticle({ querySelectorAll: () => children })
  const observer = env.observers[0]
  observer.enter(oldScene)
  oldScene.isConnected = false
  children = [newScene]
  assert.equal(env.mutations.length, 1, 'article child changes are observed')
  env.mutations[0].change()
  assert.deepEqual(observer.targets, [newScene], 'removed node unobserved and replacement enrolled')
  assert.equal(oldObject.calls[0].cancelled, 1)
  observer.enter(newScene)
  assert.equal(newScene.getAttribute('data-motion-entry-count'), '1')
  assert.equal(newObject.calls.length, 1)
  stop()
  assert(env.mutations[0].disconnected)
})

test('an already visible logical scene does not replay merely because Post replaces its DOM', () => {
  const env = environment()
  const object = () => new env.Element({ enterX: '20', enterY: '0', enterRotation: '0' })
  const oldObject = object(), newObject = object()
  const oldScene = new env.Element(), newScene = new env.Element()
  for (const scene of [oldScene, newScene]) scene.setAttribute('data-paper-scene', 'visionPositions')
  oldScene.querySelectorAll = (selector) => selector.includes('object') ? [oldObject] : []
  newScene.querySelectorAll = (selector) => selector.includes('object') ? [newObject] : []
  let children = [oldScene]
  const stop = motion.observePaperArticle({ querySelectorAll: () => children })
  const observer = env.observers[0]
  observer.enter(oldScene)
  oldScene.isConnected = false
  children = [newScene]
  env.mutations[0].change()
  observer.enter(newScene)
  assert.equal(newObject.calls.length, 0, 'ordinary rerender preserves settled visible pose')
  assert.equal(newScene.getAttribute('data-motion-entry-count'), '1')
  observer.enter(newScene, false); observer.enter(newScene)
  assert.equal(newObject.calls.length, 1, 'real viewport re-entry plays the replacement')
  assert.equal(newScene.getAttribute('data-motion-entry-count'), '2')
  stop()
})

test('arbitrary markdown URLs never enter the inline HTML trust boundary', () => {
  for (const src of ['https://example.com/hero.svg', '/images/posts/neotoma-paper/../../untrusted.svg', '/images/posts/neotoma-paper/hero.svg?untrusted']) {
    assert.equal(hasPaperArtwork(src), false)
    const html = renderToStaticMarkup(React.createElement(PaperArtwork, { src, alt: '<script>untrusted</script>' }))
    assert(html.startsWith('<img '))
    assert(!html.includes('<svg'))
    assert(!html.includes('<script>'))
  }
})
