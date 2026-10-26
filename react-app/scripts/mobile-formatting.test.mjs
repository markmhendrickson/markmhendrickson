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

test('built prose scopes underline ordinary links and keep actions and heading anchors plain', () => {
  const html = fs.readFileSync(path.join(dist, 'posts/barcelona-guest-floor/index.html'), 'utf8')
  const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag)
  assert(anchors.some((tag) => tag.includes('href="mailto:') && tag.includes('no-underline')), 'email action retains its plain-link class')
  assert(anchors.some((tag) => tag.includes('post-heading-anchor') && tag.includes('no-underline')), 'section anchors retain their plain-link class')
  const postscriptHtml = fs.readFileSync(path.join(dist, 'posts/agent-memory-breaks-before-retrieval/index.html'), 'utf8')
  const postscript = postscriptHtml.slice(postscriptHtml.indexOf('class="postscript-prose'), postscriptHtml.indexOf('</section>', postscriptHtml.indexOf('class="postscript-prose')))
  const postscriptAnchors = [...postscript.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag)
  assert(postscriptAnchors.some((tag) => tag.includes('post-heading-anchor') && tag.includes('no-underline')), 'the published postscript has a plain heading anchor')
  assert(postscriptAnchors.some((tag) => !tag.includes('no-underline')), 'the published postscript has an ordinary link')

  const cssFile = fs.readdirSync(path.join(dist, 'assets')).find((name) => name.endsWith('.css'))
  assert(cssFile, 'production stylesheet exists')
  const css = postcss.parse(fs.readFileSync(path.join(dist, 'assets', cssFile), 'utf8'))
  const scopes = ['.post-prose', '.post-prose-summary', '.postscript-prose']
  const ordinaryUnderline = new Set()
  const plainLinkOverride = new Set()
  css.walkRules((rule) => {
    const declaration = rule.nodes.find((node) => node.prop === 'text-decoration')?.value
    for (const scope of scopes) {
      if (rule.selector.split(',').includes(`${scope} a`) && declaration === 'underline') ordinaryUnderline.add(scope)
      // The extra class makes this selector outrank the ordinary prose-link rule.
      if (rule.selector.split(',').includes(`${scope} a.no-underline`) && declaration === 'none') plainLinkOverride.add(scope)
    }
  })
  assert.deepEqual([...ordinaryUnderline], scopes, 'ordinary links in all prose scopes retain their underline')
  assert.deepEqual([...plainLinkOverride], scopes, 'plain actions and anchors override the underline in every prose scope')
})
