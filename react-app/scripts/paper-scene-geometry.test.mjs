import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import { JSDOM } from 'jsdom'
import sharp from 'sharp'
import { rasterPaperSvg } from './export-paper-artwork.mjs'

const source = fs.readFileSync(new URL('../src/assets/neotoma-paper/authored/invoice-example.svg', import.meta.url), 'utf8')
const doc = new JSDOM(source, { contentType: 'image/svg+xml' }).window.document

function transform(point, value = '') {
  let [x, y] = point
  const operations = [...value.matchAll(/(translate|rotate|scale|matrix)\(([^)]*)\)/g)]
  for (const [, kind, args] of operations.reverse()) {
    const v = args.trim().split(/[\s,]+/).map(Number)
    if (kind === 'translate') { x += v[0]; y += v[1] || 0 }
    if (kind === 'scale') { x *= v[0]; y *= v[1] ?? v[0] }
    if (kind === 'matrix') [x, y] = [v[0] * x + v[2] * y + v[4], v[1] * x + v[3] * y + v[5]]
    if (kind === 'rotate') {
      const angle = v[0] * Math.PI / 180, cx = v[1] || 0, cy = v[2] || 0
      const dx = x - cx, dy = y - cy
      x = cx + dx * Math.cos(angle) - dy * Math.sin(angle)
      y = cy + dx * Math.sin(angle) + dy * Math.cos(angle)
    }
  }
  return [x, y]
}

function scenePoint(element, point, frame = null) {
  let result = point
  for (let node = element; node && node.tagName !== 'svg'; node = node.parentElement) {
    if (frame && node.hasAttribute('data-paper-object')) result = transform(result, frame)
    result = transform(result, node.getAttribute('transform') || '')
  }
  return result
}

test('coordinate instrument composes translated, rotated and scaled SVG geometry', () => {
  const result = transform([2, 3], 'translate(10 20) rotate(90)')
  assert(Math.abs(result[0] - 7) < 1e-8)
  assert(Math.abs(result[1] - 22) < 1e-8)
  assert.deepEqual(transform([2, 3], 'matrix(2 0 0 3 10 20)'), [14, 29])
})

test('every invoice curve ends at its visible marker centers under responsive scaling', () => {
  const curves = [...doc.querySelectorAll('[data-paper-connection]')]
  assert.equal(curves.length, 3)
  for (const curve of curves) {
    const values = curve.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number)
    for (const [attribute, endpoint] of [['data-paper-from', values.slice(0, 2)], ['data-paper-to', values.slice(-2)]]) {
      const port = doc.querySelector(`[data-paper-port="${curve.getAttribute(attribute)}"]`)
      assert(port, attribute)
      const center = scenePoint(port, [Number(port.getAttribute('cx')), Number(port.getAttribute('cy'))])
      for (const width of [320, 390, 900, 1200]) {
        const scale = width / 900
        assert(Math.hypot((center[0] - endpoint[0]) * scale, (center[1] - endpoint[1]) * scale) < 0.01, `${attribute} at ${width}px`)
      }
    }
  }
})

test('foreground pins follow their carrier at intermediate translated and rotated arrival poses', () => {
  for (const front of doc.querySelectorAll('[data-paper-port-carrier]')) {
    const name = front.getAttribute('data-paper-port-carrier')
    const carrier = [...doc.querySelectorAll(`[data-paper-carrier="${name}"]`)].find((node) => !node.hasAttribute('data-paper-port-carrier'))
    assert(carrier)
    for (const attribute of ['data-enter-x', 'data-enter-y', 'data-enter-rotation', 'data-enter-delay', 'style']) assert.equal(front.getAttribute(attribute), carrier.getAttribute(attribute))
    assert.equal(front.style.transformOrigin, '0px 0px', 'a shared explicit origin avoids different fill-box centers')
    for (const port of front.querySelectorAll('[data-paper-port]')) {
      const point = [Number(port.getAttribute('cx')), Number(port.getAttribute('cy'))]
      for (const progress of [0, 0.25, 0.6, 1]) {
        const rest = 1 - progress
        const frame = `translate(${Number(front.getAttribute('data-enter-x')) * rest} ${Number(front.getAttribute('data-enter-y')) * rest}) rotate(${Number(front.getAttribute('data-enter-rotation')) * rest})`
        const visible = scenePoint(port, point, frame)
        const attached = scenePoint(carrier, transform(point, frame))
        assert(Math.hypot(visible[0] - attached[0], visible[1] - attached[1]) < 0.01)
      }
    }
  }
})

test('connector pixels stay visible between paper surface and foreground pin rather than disappearing behind the carrier', async () => {
  const layer = doc.querySelector('[data-paper-link-layer]')
  assert(layer)
  const redDoc = new JSDOM(source, { contentType: 'image/svg+xml' }).window.document
  const redLayer = redDoc.querySelector('[data-paper-link-layer]')
  const firstCarrier = redDoc.querySelector('[data-paper-carrier]').parentElement
  redDoc.documentElement.insertBefore(redLayer, firstCarrier)
  const red = redDoc.documentElement.outerHTML
  const raster = async (svg) => sharp(await rasterPaperSvg(svg)).resize(900, 600).removeAlpha().raw().toBuffer()
  const [before, after] = await Promise.all([raster(red), raster(source)])
  for (const [x, y] of [[351, 209], [342, 449]]) {
    const at = (y * 900 + x) * 3
    const previous = [...before.subarray(at, at + 3)], current = [...after.subarray(at, at + 3)]
    assert(previous[0] > 100, `negative control reproduces occlusion at ${x},${y}`)
    assert(current[0] < 80 && current[1] < 110 && current[2] < 140, `navy connector remains exposed at ${x},${y}: ${current}`)
  }
})
