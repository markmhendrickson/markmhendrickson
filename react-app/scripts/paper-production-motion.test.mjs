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
