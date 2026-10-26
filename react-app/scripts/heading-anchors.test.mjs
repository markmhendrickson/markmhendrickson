import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const { slugifyHeading, createHeadingIdAllocator, headingIdFromHash } = await server.ssrLoadModule('/src/lib/headingAnchors.ts')
after(() => server.close())

test('default English headings retain their existing fragments', () => {
  assert.equal(slugifyHeading('Recall is good at a different job', true), 'recall-is-good-at-a-different-job')
  assert.equal(slugifyHeading('Café & records', true), 'caf-records')
})

test('Unicode headings and actual repeats receive distinct targets', () => {
  const headingId = createHeadingIdAllocator()
  assert.deepEqual([
    headingId('记录与来源'), headingId('记录与来源'), headingId('记录与来源-2'),
    headingId('ما يفعله Neotoma اليوم'), headingId('किसका रिकॉर्ड'),
  ], ['记录与来源', '记录与来源-2', '记录与来源-2-2', 'ما-يفعله-neotoma-اليوم', 'किसका-रिकॉर्ड'])
})

test('encoded route hashes find Unicode IDs and malformed hashes are safe', () => {
  for (const id of ['记录与来源', 'ما-يفعله-neotoma-اليوم', 'किसका-रिकॉर्ड', 'recall-is-good-at-a-different-job']) {
    assert.equal(headingIdFromHash(`#${encodeURIComponent(id)}`), id)
  }
  assert.equal(headingIdFromHash('#%E0%A4%A'), '%E0%A4%A')
})
