import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import { embedTrustedPaperTexture, embedTrustedPaperAssets, settledPaperSource, dedupePaperCutouts, rasterPaperSvg, retainedPaperOutputs, paperDonorModules, ensureSvgNamespace, validateAuthoredPaperSvg, canonicalGithubRepository, PAPER_TEXTURE_SHA256, PAPER_ASSET_HASHES } from './export-paper-artwork.mjs'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import os from 'node:os'
import path from 'node:path'

test('authored provenance normalizes existing SSH and HTTPS repository remotes without accepting credentials or foreign hosts', () => {
  for (const remote of ['git@github.com:owner/project.git', 'https://github.com/owner/project.git']) assert.equal(canonicalGithubRepository(remote), 'https://github.com/owner/project')
  for (const remote of ['https://credential@github.com/owner/project.git', 'https://example.com/owner/project.git']) assert.throws(() => canonicalGithubRepository(remote), /Unknown authored source repository/)
})

test('selective export retains and verifies other scenes with their original source commits', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paper-retention-'))
  try {
    const publicDir = path.join(root, 'public')
    const inlineDir = path.join(root, 'inline')
    const ogDir = path.join(root, 'og')
    for (const dir of [publicDir, inlineDir, ogDir]) fs.mkdirSync(dir)
    const oldCommit = 'a'.repeat(40)
    const earlierCommit = 'b'.repeat(40)
    const files = { 'hero.svg': 'old hero', 'observation.svg': 'retained scene', 'observation.png': 'raster', 'tools.svg': 'older tool', 'hero-square.png': 'old square', 'paper.jpg': 'old OG' }
    const hashes = {}
    const outputSources = {}
    for (const [file, body] of Object.entries(files)) {
      const target = file.endsWith('.jpg') ? ogDir : publicDir
      fs.writeFileSync(path.join(target, file), body)
      if (file.endsWith('.svg')) fs.writeFileSync(path.join(inlineDir, file), body)
      hashes[file] = createHash('sha256').update(body).digest('hex')
      outputSources[file] = { sourceCommit: file === 'tools.svg' ? earlierCommit : oldCommit, scene: file.startsWith('observation') ? 'observation' : 'hero', sha256: hashes[file] }
    }
    const previous = { sourceCommit: oldCommit, hashes, outputSources }
    const retained = retainedPaperOutputs(previous, new Set(['hero', 'invoice-example']), publicDir, inlineDir, ogDir, 'paper.jpg')
    assert.deepEqual(Object.keys(retained).sort(), ['observation.png', 'observation.svg', 'tools.svg'])
    assert.equal(retained['tools.svg'].sourceCommit, earlierCommit)
    fs.writeFileSync(path.join(publicDir, 'observation.png'), 'corrupt')
    assert.throws(() => retainedPaperOutputs(previous, new Set(['hero', 'invoice-example']), publicDir, inlineDir, ogDir, 'paper.jpg'), /Unverified retained artwork: observation.png/)
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('reviewed wrapper loads its exact drawing and topic dependency and settles the drawing state', () => {
  const main = 'frontend/src/components/onepager/'
  const wrapper = 'import "./paper_scene.css";\nexport * from "./PaperSceneDrawing";\n'
  const read = (file) => {
    const contents = {
      [`${main}PaperScene.tsx`]: wrapper,
      [`${main}PaperSceneDrawing.tsx`]: 'const [cutoutReady, setCutoutReady] = useState(false);',
      [`${main}october_renders.ts`]: 'export const OCTOBER_RENDERS = {}',
      [`${main}paper_scene.css`]: '.paper-scene {}',
      'frontend/src/site/topic_drawings.ts': 'export const TOPIC_DRAWINGS = {}',
    }
    if (!(file in contents)) throw new Error(`Unexpected donor read: ${file}`)
    return Buffer.from(contents[file])
  }
  const modules = paperDonorModules(read)
  assert.deepEqual([...modules.keys()].sort(), [
    `${main}PaperScene.tsx`, `${main}PaperSceneDrawing.tsx`, `${main}october_renders.ts`, `${main}paper_scene.css`, 'frontend/src/site/topic_drawings.ts',
  ].sort())
  assert.equal(modules.get(`${main}PaperScene.tsx`).toString(), wrapper)
  assert(modules.get(`${main}PaperSceneDrawing.tsx`).toString().includes('useState(true)'))
  assert.throws(() => paperDonorModules((file) => Buffer.from(file.endsWith('PaperScene.tsx') ? 'export * from "./unreviewed";' : '')), /Unknown paper scene wrapper/)
})

test('authored SVG namespace is not added twice', () => {
  const namespaced = '<svg xmlns="http://www.w3.org/2000/svg"><defs/></svg>'
  assert.equal(ensureSvgNamespace(namespaced), namespaced)
  assert.equal(ensureSvgNamespace('<svg><defs/></svg>'), namespaced)
})

test('authored SVG exports keep the fixed scene, trusted material and inert wordless boundary', () => {
  const source = fs.readFileSync(new URL('../src/assets/neotoma-paper/authored/invoice-example.svg', import.meta.url), 'utf8')
  assert.equal(validateAuthoredPaperSvg(source, 'invoiceExample'), source)
  assert.throws(() => validateAuthoredPaperSvg(source, 'visionDomain'), /Unknown authored scene/)
  for (const injected of ['<script/>', '<text>Words inside art</text>', '<foreignObject/>', '<path onclick="bad()"/>', '<image href="https://example.com/untrusted.webp"/>', "<image href='https://example.com/untrusted.webp'/>"]) {
    assert.throws(() => validateAuthoredPaperSvg(source.replace('</svg>', `${injected}</svg>`), 'invoiceExample'), /Unexpected|Unresolved/)
  }
  assert.throws(() => validateAuthoredPaperSvg(source.replace('</svg>', '<path fill="url(https://example.com/paint)"/></svg>'), 'invoiceExample'), /Unresolved authored CSS/)
  assert.throws(() => validateAuthoredPaperSvg(source.replace('</svg>', '<path fill="url( https://example.com/paint )"/></svg>'), 'invoiceExample'), /Unresolved authored CSS/)
  assert.throws(() => validateAuthoredPaperSvg(source.replace('</svg>', '<image href="data:image/webp;base64,d3Jvbmc="/></svg>'), 'invoiceExample'), /Untrusted authored material/)
})

for (const [name, payload] of [
  ['spaced href assignment', '<image href = "https://example.com/external.webp"/>'],
  ['case-insensitive CSS URL function', '<path fill="URL(https://example.com/external)"/>'],
  ['namespace-prefixed active SVG element', '<s:script xmlns:s="http://www.w3.org/2000/svg">alert(1)</s:script>'],
]) {
  test(`authored XML boundary rejects ${name}`, () => {
    const source = fs.readFileSync(new URL('../src/assets/neotoma-paper/authored/invoice-example.svg', import.meta.url), 'utf8')
    assert.throws(() => validateAuthoredPaperSvg(source.replace('</svg>', `${payload}</svg>`), 'invoiceExample'))
  })
}

test('authored XML validation retains all canonical materials and rejects equivalent obfuscated resource or active forms', () => {
  for (const [name, scene] of Object.entries({ 'invoice-example': 'invoiceExample', 'vision-domain': 'visionDomain', 'vision-positions': 'visionPositions', 'vision-explanation': 'visionExplanation' })) {
    const source = fs.readFileSync(new URL(`../src/assets/neotoma-paper/authored/${name}.svg`, import.meta.url), 'utf8')
    assert.equal(validateAuthoredPaperSvg(source, scene), source)
  }
  const source = fs.readFileSync(new URL('../src/assets/neotoma-paper/authored/invoice-example.svg', import.meta.url), 'utf8')
  for (const payload of [
    '<image href = "h&#116;tps://example.com/external.webp"/>',
    '<path style="fill: u\\72l(https://example.com/external)"/>',
    '<path fill="u\\72l(https://example.com/external)"/>',
    '<path style="background-image: image-set(\'external.webp\')"/>',
    '<s:animate xmlns:s="http://www.w3.org/2000/svg"/>',
    '<path xmlns:e="urn:events" e:onload="bad()"/>',
    '<script xmlns="http://www.w3.org/1999/xhtml"/>',
  ]) assert.throws(() => validateAuthoredPaperSvg(source.replace('</svg>', `${payload}</svg>`), 'invoiceExample'), payload)
  assert.throws(() => validateAuthoredPaperSvg(`<?xml-stylesheet href="external.css"?>${source}`, 'invoiceExample'), /Unexpected authored XML declaration/)
  assert.throws(() => validateAuthoredPaperSvg(`<!DOCTYPE svg SYSTEM "external.dtd">${source}`, 'invoiceExample'), /Unexpected authored XML declaration/)
})

const hero = fs.readFileSync(new URL('../public/images/posts/neotoma-paper/hero.svg', import.meta.url), 'utf8')
const encoded = hero.match(/href="data:image\/webp;base64,([^"]+)"/)?.[1]
const bytes = encoded ? Buffer.from(encoded, 'base64') : null
const input = '<svg><image href="/brand/october/paper-fiber.webp"/></svg>'
const renderedNames = ['hero', 'observation', 'invoice-example', 'vision-domain', 'vision-positions', 'vision-explanation']
const names = [...renderedNames, 'tools'] // Unused tools artwork remains available, with its older provenance.
const allScenes = names.map((name) => fs.readFileSync(new URL(`../public/images/posts/neotoma-paper/${name}.svg`, import.meta.url), 'utf8')).join('')
test('hero follows the current published record-only composition', () => {
  assert.match(hero, /data-paper-scene="connectedRecordsProof"/)
  assert((hero.match(/data-paper-object=/g) ?? []).length >= 5)
  assert.equal((hero.match(/data-agent-client=/g) ?? []).length, 0)
  assert.equal((hero.match(/data-agent-access=/g) ?? []).length, 0)
  assert((hero.match(/data-paper-connection=/g) ?? []).length >= 2)
})
const materials = new Map()
const donorMaterialScenes = ['hero', 'observation', 'tools'].map((name) => fs.readFileSync(new URL(`../src/assets/neotoma-paper/${name}.svg`, import.meta.url), 'utf8')).join('')
for (const [, encoded] of (allScenes + donorMaterialScenes).matchAll(/href="data:image\/webp;base64,([^"]+)"/g)) {
  const material = Buffer.from(encoded, 'base64')
  const hash = createHash('sha256').update(material).digest('hex')
  const entry = Object.entries(PAPER_ASSET_HASHES).find(([, expected]) => expected === hash)
  if (entry) materials.set(entry[0], material)
}

test('committed material is the pinned texture and export embeds its exact bytes', () => {
  assert(bytes, 'Committed hero must carry its own material texture')
  assert.equal(createHash('sha256').update(bytes).digest('hex'), PAPER_TEXTURE_SHA256)
  const result = embedTrustedPaperTexture(input, bytes)
  assert(result.includes(`href="data:image/webp;base64,${bytes.toString('base64')}"`))
  assert(!result.includes('href="/brand/'))
})

test('missing or changed texture cannot yield a successful export', () => {
  assert.throws(() => embedTrustedPaperTexture(input), /Missing trusted paper texture/)
  assert.throws(() => embedTrustedPaperTexture(input, Buffer.from('wrong material')), /hash mismatch/)
})

test('unexpected image and CSS dependencies fail closed instead of fetching', () => {
  assert(bytes)
  assert.throws(() => embedTrustedPaperTexture(input.replace('</svg>', '<image href="https://example.com/paper.webp"/></svg>'), bytes), /Unresolved external SVG dependency/)
  assert.throws(() => embedTrustedPaperTexture(input.replace('</svg>', '<style>.x{fill:url(https://example.com/a)}</style></svg>'), bytes), /Unresolved external CSS dependency/)
  assert.throws(() => embedTrustedPaperTexture('<svg/>', bytes), /Missing authored paper texture/)
})

test('raster fallbacks preserve actual texture pixels rather than silently dropping WebP', async () => {
  const raster = await rasterPaperSvg(hero)
  assert(raster.toString().includes('data:image/png;base64,'))
  const textured = await sharp(raster).resize(1200, 800).raw().toBuffer()
  const plain = await sharp(Buffer.from(hero.replace(/<image\b[^>]*\/>/g, ''))).resize(1200, 800).raw().toBuffer()
  const changed = textured.reduce((count, channel, i) => count + (channel !== plain[i] ? 1 : 0), 0)
  assert(changed > 1000, `Texture must affect rendered pixels, changed only ${changed} channels`)
})

test('all four pinned materials are embedded and unknown or missing cutouts fail closed', () => {
  assert.equal(materials.size, 4)
  const source = input.replace('</svg>', '<image href="/brand/october/hybrid/envelope-blue.webp"/></svg>')
  assert(!embedTrustedPaperAssets(source, materials).includes('href="/brand/'))
  const missing = new Map(materials)
  missing.delete('/brand/october/hybrid/envelope-blue.webp')
  assert.throws(() => embedTrustedPaperAssets(source, missing), /Missing or changed trusted paper asset/)
  assert.throws(() => embedTrustedPaperAssets(source.replace('</svg>', '<image href="/untrusted.webp"/></svg>'), materials), /Unresolved external SVG dependency/)
})

test('static successful-load state remains deterministic and published artwork has no active image handlers', () => {
  const binding = 'const [cutoutReady, setCutoutReady] = useState(false);'
  assert.equal(settledPaperSource(binding), binding.replace('false', 'true'))
  const settled = binding.replace('false', 'true')
  assert.equal(settledPaperSource(settled), settled)
  assert.throws(() => settledPaperSource('different load binding'), /Unknown settled paper load-state/)
  assert.throws(() => settledPaperSource(`${settled}\n${binding}`), /Unknown settled paper load-state/)
  assert.throws(() => settledPaperSource(binding.replace('false', 'unknown')), /Unknown settled paper load-state/)
  assert((allScenes.match(/href="data:image\/webp;base64,/g) ?? []).length > 0)
  assert(!allScenes.includes('onload='))
})

test('published scenes have current hashes, matching standalone sources and content-addressed inline materials', () => {
  const provenance = JSON.parse(fs.readFileSync(new URL('../public/images/posts/neotoma-paper/provenance.json', import.meta.url)))
  const current = {
    hero: ['connected-records', 'connectedRecordsProof'], observation: ['synthetic-sources', 'syntheticSourcesProof'],
    'invoice-example': ['current-record', 'invoiceOverheadProof'], 'vision-domain': ['shared-instance', 'governedCollaborationProof'],
    'vision-positions': ['competing-claims', 'competingClaimsProof'], 'vision-explanation': ['explanations-impact', 'explanationsImpactProof'],
  }
  assert.deepEqual(provenance.scenes, Object.fromEntries(Object.entries(current).map(([name, [, scene]]) => [name, scene])))
  assert.deepEqual(provenance.refreshedScenes, Object.keys(current))
  assert.equal(provenance.publicationSourceCommit, '774fc34b934a325c1fda05211f025263072aa9e2')
  const materialHashes = new Set()
  for (const [name, [inlineName, scene]] of Object.entries(current)) {
    const standalone = fs.readFileSync(new URL(`../public/images/posts/neotoma-paper/${name}.svg`, import.meta.url))
    const inline = fs.readFileSync(new URL(`../src/assets/neotoma-paper/published/${inlineName}.svg`, import.meta.url), 'utf8')
    assert(standalone.toString().includes(`data-paper-scene="${scene}"`))
    assert(!inline.includes('data:image/webp;base64,'), `${name}: inline artwork has no embedded repeated WebP`)
    for (const [, hash] of inline.matchAll(/href="\/images\/posts\/neotoma-paper\/materials\/([a-f0-9]{64})\.webp"/g)) {
      materialHashes.add(hash)
      const material = fs.readFileSync(new URL(`../public/images/posts/neotoma-paper/materials/${hash}.webp`, import.meta.url))
      assert.equal(createHash('sha256').update(material).digest('hex'), hash)
    }
    assert(inline.includes('/images/posts/neotoma-paper/materials/'), `${name}: same-origin material references`)
    const restored = inline.replace(/href="\/images\/posts\/neotoma-paper\/materials\/([a-f0-9]{64})\.webp"/g, (_, hash) => {
      const material = fs.readFileSync(new URL(`../public/images/posts/neotoma-paper/materials/${hash}.webp`, import.meta.url))
      return `href="data:image/webp;base64,${material.toString('base64')}"`
    })
    assert.equal(restored, standalone.toString(), `${name}: externalized material reproduces reviewed standalone art byte for byte`)
    for (const ext of ['svg', 'png']) {
      const file = `${name}.${ext}`
      const output = fs.readFileSync(new URL(`../public/images/posts/neotoma-paper/${file}`, import.meta.url))
      const hash = createHash('sha256').update(output).digest('hex')
      assert.equal(provenance.hashes[file], hash)
      assert.equal(provenance.outputSources[file].sha256, hash)
      assert.equal(provenance.outputSources[file].sourceSha256, createHash('sha256').update(standalone).digest('hex'))
      assert.equal(provenance.outputSources[file].sourceCommit, provenance.publicationSourceCommit)
    }
  }
  assert.equal(materialHashes.size, 9)
  for (const file of ['hero-square.png', 'your-agents-need-a-system-of-record-paper-1200x630.jpg']) {
    const root = file.endsWith('.jpg') ? '../public/images/og/' : '../public/images/posts/neotoma-paper/'
    const hash = createHash('sha256').update(fs.readFileSync(new URL(root + file, import.meta.url))).digest('hex')
    assert.equal(provenance.outputSources[file].sha256, hash)
  }
  assert.equal(provenance.retainedOutputs['tools.svg'].renderedInArticle, false)
  assert.equal(provenance.authoredSourceCommit, '36686acfdf48887292f6613cf88eb5f84fbac090')
})

test('raster adapter decodes every trusted material including the envelope before Sharp', async () => {
  const observation = fs.readFileSync(new URL('../public/images/posts/neotoma-paper/observation.svg', import.meta.url), 'utf8')
  const raster = (await rasterPaperSvg(observation)).toString()
  assert(!raster.includes('data:image/webp'))
  assert((raster.match(/data:image\/png;base64,/g) ?? []).length >= 3)
})

test('cutout deduplication preserves pixels for stretch, slice, clipping, opacity and blend', async () => {
  const material = materials.get('/brand/october/hybrid/paper-ivory.webp')
  assert(material)
  const uri = `data:image/webp;base64,${material.toString('base64')}`
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><defs><clipPath id="crop"><rect x="240" y="20" width="140" height="220"/></clipPath></defs><rect width="600" height="300" fill="#e9dfcd"/><image href="${uri}" width="180" height="260" preserveAspectRatio="none"></image><image href="${uri}" x="210" y="10" width="200" height="270" preserveAspectRatio="xMidYMid slice" clip-path="url(#crop)" opacity=".72" style="mix-blend-mode:multiply"></image><image href="${uri}" x="430" y="50" width="140" height="190" preserveAspectRatio="none"></image></svg>`
  const optimized = await dedupePaperCutouts(source, materials)
  assert(optimized.length < source.length / 2)
  assert.equal((optimized.match(/data:image\/webp/g) ?? []).length, 1)
  const before = await sharp(await rasterPaperSvg(source)).raw().toBuffer()
  const after = await sharp(await rasterPaperSvg(optimized)).raw().toBuffer()
  assert(before.equals(after), 'Symbol reuse must not change rendered material pixels')
})
