import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = process.env.WEBSITE_TEST_DIST ?? path.join(app, 'dist')

test('the wide guest-floor pricing table carries each column label in prerendered cells', () => {
  const html = fs.readFileSync(path.join(dist, 'posts/barcelona-guest-floor/index.html'), 'utf8')
  const start = html.indexOf('table-scroll-outer table-stacked')
  assert(start >= 0, 'wide pricing table is marked for phone cards')
  const table = html.slice(start, html.indexOf('</table>', start) + '</table>'.length)
  const headings = [...table.matchAll(/<th[^>]*>([^<]+)<\/th>/g)].map((match) => match[1])
  const firstRow = /<tbody><tr>([\s\S]*?)<\/tr>/.exec(table)?.[1] ?? ''
  const cellLabels = [...firstRow.matchAll(/<td data-label="([^"]+)"/g)].map((match) => match[1])
  assert.equal(headings.length, 6, 'pricing table has six columns')
  assert.deepEqual(cellLabels, headings, 'the first price row remains understandable without its header row')
})

test('built phone styles stack labeled rows while post links use text underlines', () => {
  const cssFile = fs.readdirSync(path.join(dist, 'assets')).find((name) => name.endsWith('.css'))
  assert(cssFile, 'production stylesheet exists')
  const css = postcss.parse(fs.readFileSync(path.join(dist, 'assets', cssFile), 'utf8'))
  const phoneRules = []
  let postLinks
  css.walkRules((rule) => {
    if (rule.selector.startsWith('.post-prose a,.post-prose-summary a,')) postLinks = rule
    if (rule.parent.type === 'atrule' && rule.parent.params.includes('max-width: 639px')) phoneRules.push(rule)
  })
  const hasDeclaration = (rule, property, value) => rule.nodes.some((node) => node.prop === property && node.value === value)
  assert(phoneRules.some((rule) => rule.selector.includes('.table-stacked tbody') && rule.selector.includes('.table-stacked td') && hasDeclaration(rule, 'display', 'block')), 'wide rows stack on phones')
  assert(phoneRules.some((rule) => rule.selector.includes('td:not(:first-child):before') && hasDeclaration(rule, 'content', 'attr(data-label)')), 'each phone cell shows its header label')
  assert(postLinks && hasDeclaration(postLinks, 'text-decoration', 'underline'), 'post links use an actual underline')
  assert(!postLinks.nodes.some((node) => node.prop?.startsWith('border-bottom')), 'post links have no hooked bottom border')
})
