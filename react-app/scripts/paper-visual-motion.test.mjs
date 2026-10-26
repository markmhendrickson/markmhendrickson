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
  class Element {
    constructor(dataset = {}) { this.dataset = dataset; this.calls = []; this.attributes = new Map() }
    setAttribute(name, value) { this.attributes.set(name, value) }
    getAttribute(name) { return this.attributes.get(name) ?? null }
    animate(frames, options) {
      const animation = { frames, options, cancelled: 0, playState: 'running', finished: new Promise(() => {}), cancel() { this.cancelled++; this.playState = 'idle' } }
      this.calls.push(animation)
      return animation
    }
  }
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = []; this.disconnected = false; observers.push(this) }
    observe(target) { this.targets.push(target) }
    disconnect() { this.disconnected = true }
    enter(target, isIntersecting = true, intersectionRatio = isIntersecting ? 1 : 0) { this.callback([{ target, isIntersecting, intersectionRatio }]) }
  }
  globalThis.Element = Element
  globalThis.IntersectionObserver = Observer
  globalThis.window = { matchMedia: () => reduced, IntersectionObserver: Observer }
  globalThis.document = { hidden: false, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) }
  return { Element, observers, reduced, preferences, listeners }
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
  assert.equal((html.match(/<svg\b/g) ?? []).length, 7)
  assert((html.match(/data-paper-object=/g) ?? []).length > 20)
  for (const scene of ['visionDomain', 'visionPositions', 'visionExplanation']) assert(html.includes(`data-paper-scene="${scene}"`))
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

test('one article observer shares the two-scene budget across hero and all six interior figures', () => {
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
  observer.enter(scenes[0], false)
  observer.enter(scenes[6], false); observer.enter(scenes[6])
  assert.equal(objects[6].calls.length, 1)
  document.hidden = true; env.listeners.get('visibilitychange')()
  document.hidden = false; env.listeners.get('visibilitychange')()
  assert.deepEqual(objects.map((object) => object.calls.length), [1, 1, 0, 0, 0, 0, 1])
  stop()
  assert(observer.disconnected)
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
