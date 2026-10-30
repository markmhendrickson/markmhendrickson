import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import { validateAuthoredPaperSvg, rasterPaperSvg, PAPER_PROOF_ASSETS } from './export-paper-artwork.mjs'

const source = fs.readFileSync(new URL('../src/dev/overhead-record/invoice.svg', import.meta.url), 'utf8')
const dom = () => new JSDOM(source, { contentType: 'image/svg+xml' })
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
const motion = await server.ssrLoadModule('/src/lib/paperVisualMotion.ts')
after(() => server.close())

test('overhead proof keeps original sources, both observations and the complete mixed-source current record', () => {
  assert.equal(validateAuthoredPaperSvg(source, 'invoiceOverheadProof'), source)
  for (const [mutation, error] of [
    [source.replace('data-paper-observation="invoice-observation"', 'data-removed-observation="invoice-observation"'), /Incomplete retained record/],
    [source.replace('data-current-field="amount" data-observation="invoice-observation"', 'data-current-field="amount" data-observation="email-observation"'), /Wrong per-field/],
    [source.replace('data-paper-field-state="current" opacity="1"', 'data-paper-field-state="current" opacity="0"'), /Incomplete static/],
    [source.replace('data-enter-rotation="0"', 'data-enter-rotation="10"'), /Unknown overhead paper motion/],
  ]) assert.throws(() => validateAuthoredPaperSvg(mutation, 'invoiceOverheadProof'), error)
  const document = dom().window.document
  assert.equal(document.querySelectorAll('[data-paper-observation]').length, 2)
  assert.equal(document.querySelectorAll('[data-paper-source]').length, 2)
  assert.equal(document.querySelectorAll('[data-paper-current-record]').length, 1)
  assert.equal(document.querySelector('[data-paper-field-state="current"]').getAttribute('opacity'), '1')
  assert.equal(document.querySelector('[data-paper-field-state="prior"]').getAttribute('opacity'), '0')
  assert.equal(document.querySelectorAll('text,script,foreignObject').length, 0)
})

test('new material hashes are exact and cannot be smuggled into an ordinary production scene', async () => {
  const metadata = JSON.parse(fs.readFileSync(new URL('../src/dev/overhead-record/materials.json', import.meta.url)))
  for (const [name, expected] of Object.entries(PAPER_PROOF_ASSETS)) {
    const bytes = fs.readFileSync(new URL(`../src/dev/overhead-record/materials/${metadata.assets[name].file}`, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected)
    assert.equal(metadata.assets[name].sha256, expected)
    const info = await sharp(bytes).metadata()
    assert(info.hasAlpha)
    assert.equal(info.width, 1254)
  }
  const ordinary = fs.readFileSync(new URL('../src/assets/neotoma-paper/invoice-example.svg', import.meta.url), 'utf8')
  const cutout = source.match(/<image id="proof-document-packet"[^>]+\/>/)[0]
  assert.throws(() => validateAuthoredPaperSvg(ordinary.replace('</svg>', `${cutout}</svg>`), 'invoiceExample'), /Untrusted authored material/)
  for (const payload of ['<image href="https://example.com/paper.webp"/>', '<image href="data:image/webp;base64,bm90LXRoZS1tYXRlcmlhbA=="/>', '<text>Invoice</text>']) {
    assert.throws(() => validateAuthoredPaperSvg(source.replace('</svg>', `${payload}</svg>`), 'invoiceOverheadProof'))
  }
})

test('all four connections reach actual foreground ports after the corresponding observation settles', () => {
  const document = dom().window.document
  const ports = new Map([...document.querySelectorAll('[data-paper-port]')].map((node) => [node.getAttribute('data-paper-port'), [Number(node.getAttribute('cx')), Number(node.getAttribute('cy'))]]))
  const svg = document.documentElement
  const directChildren = [...(document.querySelector('[data-paper-composition]') || svg).children]
  const connectionLayer = document.querySelector('[data-paper-connections]')
  for (const field of ['[data-paper-observation]', '[data-paper-source]', '[data-paper-current-record]']) {
    for (const node of document.querySelectorAll(field)) assert(directChildren.indexOf(node) < directChildren.indexOf(connectionLayer), 'opaque carriers paint before exposed connectors')
  }
  for (const path of document.querySelectorAll('[data-paper-connection]')) {
    const values = path.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number)
    assert.deepEqual(values.slice(0, 2), ports.get(path.getAttribute('data-connection-from')))
    assert.deepEqual(values.slice(-2), ports.get(path.getAttribute('data-connection-to')))
    const latest = path.getAttribute('data-connection-from').startsWith('email') || path.getAttribute('data-connection-to').startsWith('email') ? 1920 : 820
    assert(Number(path.getAttribute('data-connection-delay')) >= latest, 'fixed paths stay hidden until their moving carrier has settled')
  }
  for (const carrier of ['invoice-observation', 'email-observation']) {
    const groups = [...document.querySelectorAll(`[data-paper-motion-carrier="${carrier}"]`)]
    assert.equal(groups.length, 2, 'body and foreground ink are distinct paint layers')
    for (const attribute of ['data-enter-x', 'data-enter-y', 'data-enter-rotation', 'data-enter-delay', 'style']) assert.equal(groups[0].getAttribute(attribute), groups[1].getAttribute(attribute), 'paired layers use the same local pose')
  }
  const firstPath = document.querySelector('[data-paper-connection]').getAttribute('d')
  const broken = source.replace(firstPath, firstPath.replace(/^M[\d.]+/, 'M210'))
  const brokenPath = new JSDOM(broken, { contentType: 'image/svg+xml' }).window.document.querySelector('[data-paper-connection]')
  assert.notDeepEqual(brokenPath.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).slice(0, 2).map(Number), ports.get('invoice-source'), 'causal geometry negative differs from the actual visible port')
})

test('finite semantic playback moves only the independent observations and changes only the due field', () => {
  const document = dom().window.document
  const calls = new Map()
  for (const node of document.querySelectorAll('*')) node.animate = (frames, options) => {
    const animation = { frames, options }
    calls.set(node, animation)
    return animation
  }
  const root = document.documentElement
  const animations = motion.playPaperScene(root)
  assert.equal(animations.length, 22)
  for (const node of document.querySelectorAll('[data-current-field="amount"]')) assert(!calls.has(node), 'selected amount is unchanged by read/update emphasis')
  assert.equal(document.querySelectorAll('[data-paper-envelope-state="open"]').length, 2)
  assert.equal(document.querySelector('[data-paper-envelope-state="closed"]').getAttribute('opacity'), '0')
  assert.equal(document.querySelector('[data-paper-letter]').getAttribute('data-due-date'), 'later')
  const letter = calls.get(document.querySelector('[data-paper-letter]'))
  assert.equal(letter.frames[0].opacity, 0)
  assert.equal(letter.frames.at(-1).opacity, 1)
  assert(letter.options.delay > 500, 'letter rises after envelope opens')
  for (const node of document.querySelectorAll('[data-paper-object]')) {
    const { frames } = calls.get(node)
    assert(frames.every((frame) => /rotate\(0deg\)/.test(frame.transform)), 'baked light cannot rotate with the sprite')
    assert.equal(frames[0].opacity, 0, 'the later observation is not already visible during its entry delay')
    assert.equal(frames.at(-1).opacity, 1, 'both observations remain after arrival')
    assert.equal(frames.at(-1).transform, 'translate(0px, 0px) rotate(0deg)')
  }
  const current = calls.get(document.querySelector('[data-paper-field-state="current"]'))
  const prior = calls.get(document.querySelector('[data-paper-field-state="prior"]'))
  assert.equal(current.frames[0].opacity, 0)
  assert.equal(current.frames.at(-1).opacity, 1)
  assert.equal(prior.frames[0].opacity, 1)
  assert.equal(prior.frames.at(-1).opacity, 0)
  assert(current.frames[1].offset * current.options.duration > 1920, 'email observation is retained before the due field changes')
  for (const path of document.querySelectorAll('[data-paper-connection]')) assert.equal(calls.get(path).frames[0].opacity, 0)
  assert(!calls.has(root), 'camera and whole artwork stay fixed')
})

test('derived static art retains texture and clearly exposed connectors at full and card widths', async () => {
  const raster = await rasterPaperSvg(source)
  for (const width of [900, 330, 235]) {
    const { data, info } = await sharp(raster).resize(width).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.equal(info.width, width)
    // Connector immediately beyond the invoice surface. The stroke must remain navy,
    // rather than disappear beneath the photographic paper carrier.
    const x = Math.round(236 * width / 900), y = Math.round(168 * width / 900)
    const neighborhood = []
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const i = ((y + dy) * width + x + dx) * info.channels
      neighborhood.push(data[i] < 170 && data[i + 2] > data[i] && data[i + 1] < 180)
    }
    assert(neighborhood.some(Boolean), `${width}px: exposed navy connection remains visibly darker and cooler than the paper after downsampling`)
    const without=dom().window.document;without.querySelector('[data-paper-connections]').remove()
    const absent=await sharp(await rasterPaperSvg(without.documentElement.outerHTML)).resize(width).removeAlpha().raw().toBuffer({resolveWithObject:true})
    const counter=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const i=((y+dy)*width+x+dx)*absent.info.channels;counter.push(absent.data[i]<170&&absent.data[i+2]>absent.data[i]&&absent.data[i+1]<180)}
    assert(!counter.some(Boolean),'removing the path fails the real-pixel visibility measurement')
  }
})
