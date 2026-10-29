import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { JSDOM } from 'jsdom'
import sharp from 'sharp'
import { PAPER_PHOTO_ASSETS, validateAuthoredPaperSvg } from './export-paper-artwork.mjs'

const names = { visionDomain: 'vision-domain', visionPositions: 'vision-positions', visionExplanation: 'vision-explanation' }
const source = (name) => fs.readFileSync(new URL(`../src/assets/neotoma-paper/authored/${name}.svg`, import.meta.url), 'utf8')
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')

test('all three photographic scenes preserve the complete stationary photo and static essentials', () => {
  for (const [scene, name] of Object.entries(names)) {
    const svg = source(name)
    assert.equal(validateAuthoredPaperSvg(svg, scene), svg)
    const dom = new JSDOM(svg, { contentType: 'image/svg+xml' })
    const image = dom.window.document.querySelector('[data-paper-photograph]')
    const bytes = Buffer.from(image.getAttribute('href').split(',')[1], 'base64')
    const canonical = fs.readFileSync(new URL(`../src/assets/neotoma-paper/authored/photos/${PAPER_PHOTO_ASSETS[scene].file}`, import.meta.url))
    assert(bytes.equals(canonical), `${scene}: exact selected compressed photo`)
    assert.equal(hash(bytes), PAPER_PHOTO_ASSETS[scene].sha256)
    assert.equal(image.getAttribute('opacity'), '1')
    assert.equal(image.parentElement.localName, 'svg')
    assert.equal(image.getAttribute('preserveAspectRatio'), 'xMidYMid meet')
    assert.equal(dom.window.document.querySelectorAll('[data-paper-object]').length, 0, 'no invented movable photo fragments')
    for (const path of dom.window.document.querySelectorAll('[data-paper-highlight]')) assert.equal(path.getAttribute('opacity'), '0', 'only optional emphasis is absent without motion')
    dom.window.close()
  }
})

test('every photographic emphasis point is registered to actual physical ink at the native and card scales', async () => {
  for (const [scene, name] of Object.entries(names)) {
    const dom = new JSDOM(source(name), { contentType: 'image/svg+xml' })
    const { data, info } = await sharp(new URL(`../src/assets/neotoma-paper/authored/photos/${PAPER_PHOTO_ASSETS[scene].file}`, import.meta.url).pathname).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const roles = []
    for (const path of dom.window.document.querySelectorAll('[data-paper-highlight]')) {
      roles.push(path.getAttribute('data-highlight-role'))
      const values = path.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number)
      for (let n = 0; n < values.length; n += 2) {
        const x = Math.round(values[n] * info.width / 900), y = Math.round(values[n + 1] * info.height / 600)
        const i = (y * info.width + x) * info.channels
        const [r, g, b] = [...data.subarray(i, i + 3)]
        assert(r < 150 && g < 165 && b < 185 && b > r + 6 && g > r + 3, `${scene}: ink at ${x},${y}`)
        for (const width of [235, 330, 390, 900]) assert(Math.abs(values[n] * width / 900 - x * width / info.width) < 0.6, `${scene}: scaled registration`)
        if (scene === 'visionDomain') assert(x < 800, 'right record stays untouched')
        if (scene === 'visionExplanation') assert(!(x > 1100 && y > 700), 'unconnected third record stays untouched')
      }
    }
    if (scene === 'visionPositions') assert.deepEqual(roles, ['retained-left-claim', 'retained-right-claim', 'selected-square'])
    if (scene === 'visionExplanation') assert.deepEqual(roles, ['source-to-basis', 'envelope-to-basis', 'basis-to-current', 'current-value', 'first-affected-record', 'second-affected-record'])
    dom.window.close()
  }
})

test('photographic validation rejects the wrong selected scene or a moving/hidden photographic base', () => {
  const domain = source('vision-domain')
  assert.throws(() => validateAuthoredPaperSvg(domain.replace('data-paper-scene="visionDomain"', 'data-paper-scene="visionPositions"'), 'visionPositions'), /photographic scene binding/)
  assert.throws(() => validateAuthoredPaperSvg(domain.replace('data-paper-photograph=""', 'data-paper-photograph="" data-paper-object=""'), 'visionDomain'), /photographic scene binding/)
  assert.throws(() => validateAuthoredPaperSvg(domain.replace('meet" opacity="1"', 'meet" opacity="0"'), 'visionDomain'), /photographic scene binding/)
  assert.throws(() => validateAuthoredPaperSvg(domain.replace('data-highlight-duration="1800"', 'data-highlight-duration="Infinity"'), 'visionDomain'), /emphasis contract/)
})

test('public image provenance contains source hashes and prompts without private filesystem locators', () => {
  const origin = fs.readFileSync(new URL('../src/assets/neotoma-paper/authored/photos/origin.json', import.meta.url), 'utf8')
  const data = JSON.parse(origin)
  assert.equal(data.formatBuild.quality, 90)
  assert.equal(Object.keys(data.assets).length, 3)
  assert(!origin.includes('/Users/') && !origin.includes('generated_images/'))
  assert(data.prompts.governed_collaboration && data.prompts.competing_claims && data.prompts.explanations)
})
