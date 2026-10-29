import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import postcss from 'postcss'
import sharp from 'sharp'
import { JSDOM } from 'jsdom'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const PAPER_TEXTURE_SHA256 = '9e9dfed440f8ff1800180963edc0dfab6c8333607dc000e079018d9f0c6cf1b8'
const texturePath = 'frontend/public/brand/october/paper-fiber.webp'
export const PAPER_ASSET_HASHES = {
  '/brand/october/paper-fiber.webp': PAPER_TEXTURE_SHA256,
  '/brand/october/hybrid/paper-ivory.webp': 'd171c7337f5cdaa68978e54ec4b9b0302cd776ba51a054e91f27ba4c9e59ac7f',
  '/brand/october/hybrid/folder-sage.webp': '280af24f30bdd170f64fdf579b5a69717226d59d3338f2d1a6c1bb2ea7d77ebe',
  '/brand/october/hybrid/envelope-blue.webp': '23d773b7e7bfdb79abd06a5b0b1f308c93de1675a0fee0e14def6ecf829941d6',
}
export const PAPER_PHOTO_ASSETS = {
  visionDomain: { file: 'governed-collaboration.webp', sha256: '268c61dc2465b1c25cddff288ec9e55de3b0bcbcb62076203839215399f8495a' },
  visionPositions: { file: 'competing-claims-and-decisions.webp', sha256: '3bdd47b254b163d73b958f7caf6987dd4d69d2f96a5a99a6288a6cad9ad29f07' },
  visionExplanation: { file: 'explanations-and-impact.webp', sha256: '8083e4bab93c0dcdf79e601a9dd16746e87fdbf6bee6c996c3e7b51795122f40' },
}
export const PAPER_PROOF_ASSETS = {
  'document-packet': '59e2ce139e5606fbc64ecb27abf5b41ac615e8cf86866af21e08158f47fc4773',
  'email-envelope': '83ef47976c1a1f661a02e90139c294240f532d84a2ba33c5a67e4c2418aacaa6',
  'observation-slip': 'b13701ca89a9a7b39c542ad55d3a53057944e3df31574019558e8389281c8a05',
  'entity-dossier': 'd1133eb4e26412fd0be76929ad257756f370e8f2e8760dd599e47bd41b4b9ece',
}
export const PAPER_REMAINING_PROOF_ASSETS = {
 governedCollaborationProof:'debf8235bd7c8090c9275d33031cf8b6127758da39fcaeca9ec17f07201dc6bf',
 competingClaimsProof:'a854ad7b4eebdca431e6cd829c4ccc8239ec8654bedcca54297e82396d834868',
 explanationsImpactProof:'b4c4f8f9611406000b26de70e44cd28caa667412cf82dde5713dc48be3fa1c11',
}
const trustedRasterHashes = () => [...Object.values(PAPER_ASSET_HASHES), ...Object.values(PAPER_PHOTO_ASSETS).map((asset) => asset.sha256)]
const paperDir = 'frontend/src/components/onepager/'
const reviewedWrapper = 'import "./paper_scene.css";\nexport * from "./PaperSceneDrawing";'
const PAPER_SCENES = { hero: 'hero', observation: 'observation', 'invoice-example': 'invoiceExample', 'vision-domain': 'visionDomain', 'vision-positions': 'visionPositions', 'vision-explanation': 'visionExplanation', 'overhead-proof': 'invoiceOverheadProof', 'connected-proof':'connectedRecordsProof', 'synthetic-proof':'syntheticSourcesProof', 'governed-proof':'governedCollaborationProof','claims-proof':'competingClaimsProof','impact-proof':'explanationsImpactProof' }
const AUTHORED_PAPER_SCENES = ['invoice-example', 'vision-domain', 'vision-positions', 'vision-explanation']
const OG_NAME = 'one-place-where-a-fact-is-settled-paper-1200x630.jpg'
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

/** Check every output that a selective export promises to leave byte-exact. */
export function retainedPaperOutputs(previous, selected, publicDir, inlineDir, ogDir, ogName = OG_NAME) {
  const retained = {}
  for (const [file, expected] of Object.entries(previous.hashes)) {
    const scene = file === ogName || file === 'hero-square.png' ? 'hero' : file.replace(/\.(svg|png)$/, '')
    if (selected.has(scene)) continue
    const source = previous.outputSources?.[file]
    const sourceCommit = source?.sourceCommit ?? previous.sourceCommit
    const filePath = path.join(file === ogName ? ogDir : publicDir, file)
    if (!/^[a-f0-9]{40}$/.test(sourceCommit) || sha256(fs.readFileSync(filePath)) !== expected || (source?.sha256 && source.sha256 !== expected)) throw new Error(`Unverified retained artwork: ${file}`)
    if (file.endsWith('.svg') && sha256(fs.readFileSync(path.join(inlineDir, file))) !== expected) throw new Error(`Retained inline artwork differs: ${file}`)
    retained[file] = { ...source, sourceCommit, scene: source?.scene ?? PAPER_SCENES[scene] ?? 'localService', sha256: expected }
  }
  return retained
}

/** Only the pinned local paper texture may become a self-contained image dependency. */
export function embedTrustedPaperTexture(svg, bytes, cutouts = new Set()) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) throw new Error('Missing trusted paper texture')
  if (sha256(bytes) !== PAPER_TEXTURE_SHA256) throw new Error('Paper texture hash mismatch')
  if (!svg.includes('href="/brand/october/paper-fiber.webp"')) throw new Error('Missing authored paper texture reference')
  const embedded = svg.replaceAll('href="/brand/october/paper-fiber.webp"', `href="data:image/webp;base64,${bytes.toString('base64')}"`)
  for (const [, href] of embedded.matchAll(/\b(?:xlink:)?href=["']([^"']+)["']/g)) {
    if (!href.startsWith('#') && href !== `data:image/webp;base64,${bytes.toString('base64')}` && !cutouts.has(href)) throw new Error('Unresolved external SVG dependency')
  }
  for (const [, ref] of embedded.matchAll(/url\(([^)]+)\)/g)) {
    if (!ref.startsWith('#')) throw new Error('Unresolved external CSS dependency')
  }
  if (/@import\b|<script\b|<text\b/i.test(embedded)) throw new Error('Unexpected executable or visible text in paper artwork')
  return embedded
}

export function settledPaperSource(source) {
  const bindings = [...source.matchAll(/const \[cutoutReady, setCutoutReady\] = useState\((false|true)\);/g)]
  if (bindings.length !== 1) throw new Error('Unknown settled paper load-state binding')
  return source.replace(bindings[0][0], 'const [cutoutReady, setCutoutReady] = useState(true);')
}

/** The accepted donor has one of two pinned source layouts, never an arbitrary import graph. */
export function paperDonorModules(read) {
  const main = read(`${paperDir}PaperScene.tsx`)
  const wrapper = main.toString().trim() === reviewedWrapper
  if (!wrapper && main.toString().includes('export * from ')) throw new Error('Unknown paper scene wrapper')
  const files = new Map([
    [`${paperDir}PaperScene.tsx`, wrapper ? main : Buffer.from(settledPaperSource(main.toString()))],
    [`${paperDir}october_renders.ts`, read(`${paperDir}october_renders.ts`)],
    [`${paperDir}paper_scene.css`, read(`${paperDir}paper_scene.css`)],
  ])
  if (wrapper) {
    files.set(`${paperDir}PaperSceneDrawing.tsx`, Buffer.from(settledPaperSource(read(`${paperDir}PaperSceneDrawing.tsx`).toString())))
    files.set('frontend/src/site/topic_drawings.ts', read('frontend/src/site/topic_drawings.ts'))
  }
  return files
}

export function ensureSvgNamespace(svg) {
  if (!/<svg\b/.test(svg)) throw new Error('Missing authored SVG root')
  return /<svg\b[^>]*\bxmlns=/.test(svg) ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
}

export function embedTrustedPaperAssets(svg, assets) {
  const cutouts = new Set()
  for (const [href, expected] of Object.entries(PAPER_ASSET_HASHES)) {
    const bytes = assets.get(href)
    if (!Buffer.isBuffer(bytes) || sha256(bytes) !== expected) throw new Error(`Missing or changed trusted paper asset: ${href}`)
    if (href === '/brand/october/paper-fiber.webp') continue
    const uri = `data:image/webp;base64,${bytes.toString('base64')}`
    cutouts.add(uri)
    svg = svg.replaceAll(`href="${href}"`, `href="${uri}"`)
  }
  return embedTrustedPaperTexture(svg, assets.get('/brand/october/paper-fiber.webp'), cutouts)
}

/** Store each cutout payload once; symbols preserve each original image's fit mode. */
export async function dedupePaperCutouts(svg, assets) {
  const cutouts = new Map()
  for (const [href, bytes] of assets) {
    if (!href.includes('/hybrid/')) continue
    const { width, height } = await sharp(bytes).metadata()
    cutouts.set(`data:image/webp;base64,${bytes.toString('base64')}`, { width, height, name: path.basename(href, '.webp') })
  }
  const definitions = new Map()
  svg = svg.replace(/<image\b([^>]*?)><\/image>/g, (image, attrs) => {
    const uri = attrs.match(/\bhref="([^"]+)"/)?.[1]
    const cutout = cutouts.get(uri)
    if (!cutout) return image
    const fit = attrs.match(/\bpreserveAspectRatio="([^"]+)"/)?.[1]
    if (fit !== 'none' && fit !== 'xMidYMid slice') throw new Error('Unknown paper cutout fit mode')
    const imageId = `material-${cutout.name}-image`
    const symbolId = `material-${cutout.name}-${fit === 'none' ? 'stretch' : 'slice'}`
    definitions.set(imageId, `<image id="${imageId}" href="${uri}" width="${cutout.width}" height="${cutout.height}"/>`)
    definitions.set(symbolId, `<symbol id="${symbolId}" viewBox="0 0 ${cutout.width} ${cutout.height}" preserveAspectRatio="${fit}"><use href="#${imageId}"/></symbol>`)
    const remaining = attrs.replace(/\s+href="[^"]+"/, '').replace(/\s+preserveAspectRatio="[^"]+"/, '')
    return `<use href="#${symbolId}"${remaining}/>`
  })
  if (!svg.includes('</defs>')) throw new Error('Missing paper material definitions')
  return svg.replace('</defs>', `${[...definitions.values()].join('')}</defs>`)
}

function scopedStyles(css, scene) {
  const scope = `svg[data-paper-scene="${scene}"]`
  const parsed = postcss.parse(css)
  parsed.walkRules((rule) => {
    rule.selectors = rule.selectors.map((selector) => selector.startsWith('.paper-scene')
      ? selector.replace('.paper-scene', scope)
      : `${scope} ${selector}`)
  })
  return parsed.toString()
}

// librsvg may silently skip embedded WebP. Decode the same trusted pixels to PNG
// for rasterization, while browser SVGs retain the exact source WebP bytes.
export async function rasterPaperSvg(svg) {
  const uris = new Set([...svg.matchAll(/data:image\/webp;base64,([^"']+)/g)].map((match) => match[0]))
  if (uris.size === 0) throw new Error('Missing embedded paper texture for rasterization')
  for (const uri of uris) {
    const bytes = Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64')
    if (![...trustedRasterHashes(), ...Object.values(PAPER_PROOF_ASSETS), ...Object.values(PAPER_REMAINING_PROOF_ASSETS)].includes(sha256(bytes))) throw new Error('Paper asset hash mismatch')
    const png = await sharp(bytes).png().toBuffer()
    svg = svg.replaceAll(uri, `data:image/png;base64,${png.toString('base64')}`)
  }
  return Buffer.from(svg)
}

/** Native SVGs use the same fixed trust boundary and raster adapter as donor exports. */
export function validateAuthoredPaperSvg(svg, scene) {
  if (/<!DOCTYPE\b|<\?(?!xml\s)/i.test(svg)) throw new Error('Unexpected authored XML declaration')
  // XML parsing resolves namespace prefixes, entity escapes, quote styles and
  // assignment whitespace. Scripts/resources stay disabled in this existing DOM tool.
  const parsed = new JSDOM(svg, { contentType: 'image/svg+xml' })
  try {
    const root = parsed.window.document.documentElement
    const namespace = 'http://www.w3.org/2000/svg'
    if (root.namespaceURI !== namespace || root.localName !== 'svg' || !Object.values(PAPER_SCENES).includes(scene) || root.getAttribute('data-paper-scene') !== scene || root.getAttribute('viewBox') !== '0 0 900 600') throw new Error('Unknown authored scene contract')
    const elements = [root, ...root.querySelectorAll('*')]
    const ids = new Set(elements.map((element) => element.getAttribute('id')).filter(Boolean))
    const materials = new Set()
    const overheadProof = root.getAttribute('data-paper-treatment') === 'hybrid-record-proof'
    const allowedMaterials = overheadProof ? scene==='connectedRecordsProof'
      ? [PAPER_TEXTURE_SHA256,PAPER_ASSET_HASHES['/brand/october/hybrid/paper-ivory.webp']]
      : [PAPER_TEXTURE_SHA256, ...Object.values(PAPER_PROOF_ASSETS), ...(PAPER_REMAINING_PROOF_ASSETS[scene]?[PAPER_REMAINING_PROOF_ASSETS[scene]]:[])] : trustedRasterHashes()
    const localCssUrls = (value) => {
      if (/\\/.test(value)) throw new Error('Unexpected escaped authored CSS syntax')
      for (const [, raw] of value.matchAll(/url\s*\(([^)]+)\)/gi)) {
        const ref = raw.trim().replace(/^(['"])(.*)\1$/, '$2')
        if (!ref.startsWith('#') || !ids.has(ref.slice(1))) throw new Error('Unresolved authored CSS dependency')
      }
    }
    const inertCss = (value) => {
      if (/\\/.test(value)) throw new Error('Unexpected escaped authored CSS syntax')
      const css = postcss.parse(value)
      css.walkAtRules((rule) => { if (rule.name.toLowerCase() !== 'media') throw new Error('Unexpected authored CSS rule') })
      css.walkDecls((decl) => {
        localCssUrls(decl.value)
        for (const [, name] of decl.value.matchAll(/([\w-]+)\s*\(/g)) {
          if (!['url', 'rgb', 'rgba', 'hsl', 'hsla', 'var', 'calc', 'min', 'max', 'clamp'].includes(name.toLowerCase())) throw new Error('Unexpected authored CSS function')
        }
      })
    }
    for (const element of elements) {
      const name = element.localName.toLowerCase()
      if (element.namespaceURI !== namespace || ['script', 'foreignobject', 'text', 'set', 'discard', 'handler'].includes(name) || name.startsWith('animate')) throw new Error('Unexpected active or visible text content in authored artwork')
      if (name === 'style') inertCss(element.textContent || '')
      for (const attribute of element.attributes) {
        const attributeName = attribute.localName.toLowerCase()
        if (attributeName.startsWith('on')) throw new Error('Unexpected active authored SVG attribute')
        if (attributeName === 'style') inertCss(attribute.value)
        localCssUrls(attribute.value)
        if (attributeName !== 'href') continue
        const href = attribute.value
        if (href.startsWith('#') && ids.has(href.slice(1))) continue
        if (!href.startsWith('data:image/webp;base64,')) throw new Error('Unresolved authored SVG dependency')
        const hash = sha256(Buffer.from(href.slice(href.indexOf(',') + 1), 'base64'))
        if (!allowedMaterials.includes(hash)) throw new Error('Untrusted authored material')
        materials.add(hash)
      }
    }
    if (overheadProof) {
      if (!['invoiceOverheadProof','connectedRecordsProof','syntheticSourcesProof',...Object.keys(PAPER_REMAINING_PROOF_ASSETS)].includes(scene) || root.getAttribute('data-paper-variant') !== (scene === 'invoiceOverheadProof'?'overhead-invoice-proof':`overhead-${scene}`) || materials.size !== allowedMaterials.length || allowedMaterials.some((hash) => !materials.has(hash))) throw new Error('Unknown overhead proof binding')
      if (scene === 'invoiceOverheadProof') {
        const originals = [...root.querySelectorAll('[data-paper-source]')].map((node) => node.getAttribute('data-paper-source')).sort()
        const observations = [...root.querySelectorAll('[data-paper-observation]')].map((node) => node.getAttribute('data-paper-observation')).sort()
        if (originals.join(',') !== 'email,invoice' || observations.join(',') !== 'email-observation,invoice-observation' || root.querySelectorAll('[data-paper-current-record]').length !== 1) throw new Error('Incomplete retained record proof')
        if (root.querySelector('[data-current-field="amount"]')?.getAttribute('data-observation') !== 'invoice-observation' || root.querySelector('[data-current-field="due"]')?.getAttribute('data-observation') !== 'email-observation') throw new Error('Wrong per-field observation')
        const before = root.querySelector('[data-paper-field-state="prior"]')
        const current = root.querySelector('[data-paper-field-state="current"]')
        if (!before || before.getAttribute('opacity') !== '0' || !current || current.getAttribute('opacity') !== '1') throw new Error('Incomplete static current field')
      } else if (scene === 'syntheticSourcesProof') {
        if(root.querySelectorAll('[data-paper-source]').length!==2 || root.querySelectorAll('[data-paper-observation]').length!==2 || root.querySelector('[data-paper-current-record]')) throw new Error('Incomplete unmerged source proof')
      } else if(scene === 'connectedRecordsProof' && (root.querySelectorAll('[data-entity-record]').length!==3 || root.querySelectorAll('[data-connection-kind="entity-relation"]').length!==2 || !root.querySelector('[data-retained-evidence]'))) throw new Error('Incomplete connected entity proof')
      if(scene==='governedCollaborationProof' && (root.querySelectorAll('[data-shared-reader]').length!==2 || !root.querySelector('[data-shared-instance="one"]'))) throw new Error('Incomplete shared instance proof')
      if(scene==='competingClaimsProof' && (root.querySelectorAll('[data-retained-claim]').length!==2 || !root.querySelector('[data-selected-position="later"]') || !root.querySelector('[data-decision-authority]'))) throw new Error('Incomplete retained claims proof')
      if(scene==='explanationsImpactProof' && (root.querySelectorAll('[data-impact-record]').length!==3 || root.querySelectorAll('[data-connection-kind="impact"]').length!==2 || !root.querySelector('[data-explanation-basis]'))) throw new Error('Incomplete bounded impact proof')
      for (const state of root.querySelectorAll('[data-paper-field-state]')) {
        if (!['prior','current'].includes(state.getAttribute('data-paper-field-state')) || state.getAttribute('opacity') !== (state.getAttribute('data-paper-field-state')==='current'?'1':'0')) throw new Error('Incomplete static current field')
      }
      for (const object of root.querySelectorAll('[data-paper-object]')) {
        const delay = Number(object.getAttribute('data-enter-delay'))
        if (Number(object.getAttribute('data-enter-rotation')) !== 0 || !Number.isFinite(delay) || delay < 0 || delay > 1800) throw new Error('Unknown overhead paper motion')
      }
    } else if (root.getAttribute('data-paper-treatment') === 'photographic-paper') {
      const photo = PAPER_PHOTO_ASSETS[scene]
      const image = root.querySelector('[data-paper-photograph]')
      if (!photo || !materials.has(photo.sha256) || materials.size !== 1 || !image || image.parentElement !== root || image.getAttribute('width') !== '900' || image.getAttribute('height') !== '600' || image.getAttribute('preserveAspectRatio') !== 'xMidYMid meet' || image.getAttribute('opacity') !== '1' || image.hasAttribute('style') || image.hasAttribute('transform') || root.querySelector('[data-paper-object]')) throw new Error('Unknown photographic scene binding')
      const highlights = [...root.querySelectorAll('[data-paper-highlight]')]
      if (highlights.length === 0) throw new Error('Missing photographic ink emphasis')
      for (const highlight of highlights) {
        const duration = Number(highlight.getAttribute('data-highlight-duration'))
        const delay = Number(highlight.getAttribute('data-highlight-delay'))
        if (highlight.localName !== 'path' || !['trace', 'focus'].includes(highlight.getAttribute('data-paper-highlight')) || highlight.getAttribute('pathLength') !== '1' || highlight.getAttribute('opacity') !== '0' || highlight.getAttribute('fill') !== 'none' || highlight.hasAttribute('transform') || !Number.isFinite(duration) || duration < 200 || duration > 5000 || !Number.isFinite(delay) || delay < 0 || delay > 5000) throw new Error('Unknown photographic emphasis contract')
      }
    } else if (!materials.has(PAPER_TEXTURE_SHA256)) throw new Error('Missing authored paper texture')
    return svg
  } finally { parsed.window.close() }
}

/** Copy the selected authored source, then derive all public rasters from those exact bytes. */
export function canonicalGithubRepository(remote) {
  const repository = remote.trim().replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '')
  if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Unknown authored source repository')
  return repository
}

export async function exportAuthoredPaperArtwork(commit) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Authored export requires an exact source commit')
  const read = (file) => execFileSync('git', ['-C', appRoot, 'show', `${commit}:${file}`], { maxBuffer: 16 * 1024 * 1024 })
  execFileSync('git', ['-C', appRoot, 'cat-file', '-e', `${commit}^{commit}`])
  const repository = canonicalGithubRepository(execFileSync('git', ['-C', appRoot, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }))
  const publicDir = path.join(appRoot, 'public/images/posts/neotoma-paper')
  const inlineDir = path.join(appRoot, 'src/assets/neotoma-paper')
  const provenancePath = path.join(publicDir, 'provenance.json')
  const previous = JSON.parse(fs.readFileSync(provenancePath, 'utf8'))
  const retained = retainedPaperOutputs(previous, new Set(AUTHORED_PAPER_SCENES), publicDir, inlineDir, path.join(appRoot, 'public/images/og'))
  const exporterPath = 'react-app/scripts/export-paper-artwork.mjs'
  const sourceHashes = { [exporterPath]: sha256(read(exporterPath)) }
  for (const { file, sha256: expected } of Object.values(PAPER_PHOTO_ASSETS)) {
    const filePath = `react-app/src/assets/neotoma-paper/authored/photos/${file}`
    const bytes = read(filePath)
    if (sha256(bytes) !== expected) throw new Error('Changed canonical photograph')
    sourceHashes[filePath] = expected
  }
  const photoOriginPath = 'react-app/src/assets/neotoma-paper/authored/photos/origin.json'
  sourceHashes[photoOriginPath] = sha256(read(photoOriginPath))
  const outputSources = { ...retained }
  const hashes = Object.fromEntries(Object.entries(retained).map(([file, entry]) => [file, entry.sha256]))
  const outputs = new Map()
  for (const name of AUTHORED_PAPER_SCENES) {
    const sourcePath = `react-app/src/assets/neotoma-paper/authored/${name}.svg`
    const source = read(sourcePath)
    const svg = validateAuthoredPaperSvg(source.toString(), PAPER_SCENES[name])
    if (svg !== source.toString()) throw new Error('Authored source must declare its own SVG namespace')
    sourceHashes[sourcePath] = sha256(source)
    const png = await sharp(await rasterPaperSvg(svg)).resize(1200, 800).png().toBuffer()
    for (const [extension, bytes] of [['svg', source], ['png', png]]) {
      const file = `${name}.${extension}`
      outputs.set(file, bytes)
      hashes[file] = sha256(bytes)
      outputSources[file] = { sourceRepository: repository, sourceCommit: commit, sourceKind: 'authored-svg', sourcePath, sourceSha256: sha256(source), scene: PAPER_SCENES[name], sha256: hashes[file] }
    }
  }
  for (const [file, bytes] of outputs) {
    fs.writeFileSync(path.join(publicDir, file), bytes)
    if (file.endsWith('.svg')) fs.writeFileSync(path.join(inlineDir, file), bytes)
  }
  fs.writeFileSync(provenancePath, JSON.stringify({
    ...previous,
    refreshedScenes: AUTHORED_PAPER_SCENES,
    retainedOutputs: retained,
    authoredSourceRepository: repository,
    authoredSourceCommit: commit,
    authoredSourceFiles: Object.keys(sourceHashes),
    authoredSourceHashes: sourceHashes,
    sourceInputsByCommit: { ...previous.sourceInputsByCommit, [commit]: { sourceRepository: repository, sourceFiles: Object.keys(sourceHashes), sourceHashes } },
    outputSources, hashes,
    method: 'Retained donor scenes keep their original per-output provenance. Invoice and advanced scenes use committed, wordless native SVG source under the same trusted inline/public asset contract; SVG bytes copy exactly and PNGs derive from those bytes through the existing verified material raster adapter. No new renderer or external fetch.',
  }, null, 2) + '\n')
  console.log(`Exported ${AUTHORED_PAPER_SCENES.length} authored scenes from ${commit}; retained ${Object.keys(retained).length} outputs`)
}

/** Read every donor input from Git objects, never a sibling's in-progress working files. */
export async function exportPaperArtwork(sourceRoot, commit, requestedScenes = Object.keys(PAPER_SCENES)) {
  if (!sourceRoot || !commit) throw new Error('Usage: node scripts/export-paper-artwork.mjs <source-checkout> <commit>')
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Donor requires an exact commit hash')
  if (!Array.isArray(requestedScenes) || requestedScenes.length === 0 || new Set(requestedScenes).size !== requestedScenes.length || requestedScenes.some((scene) => !PAPER_SCENES[scene])) throw new Error('Unknown or duplicate paper scene selection')
  if (requestedScenes.some((scene) => fs.existsSync(path.join(appRoot, 'src/assets/neotoma-paper/authored', `${scene}.svg`)))) throw new Error('Authored scenes must use --authored; donor export cannot overwrite approved native artwork')
  const selected = Object.fromEntries(requestedScenes.map((scene) => [scene, PAPER_SCENES[scene]]))
  execFileSync('git', ['-C', sourceRoot, 'cat-file', '-e', `${commit}^{commit}`])
  const read = (file) => execFileSync('git', ['-C', sourceRoot, 'show', `${commit}:${file}`], { maxBuffer: 16 * 1024 * 1024 })
  const texture = read(texturePath)
  if (sha256(texture) !== PAPER_TEXTURE_SHA256) throw new Error('Paper texture hash mismatch')
  const donorProvenance = JSON.parse(read('frontend/public/brand/october/PROVENANCE.json').toString()).files['paper-fiber.webp']
  const hybridProvenance = JSON.parse(read('frontend/public/brand/october/hybrid/PROVENANCE.json').toString())
  const assets = new Map(Object.keys(PAPER_ASSET_HASHES).map((href) => [href, read(`frontend/public${href}`)]))
  const assetPathSource = read('frontend/src/site/spa_path.ts')
  if (!assetPathSource.toString().includes('if (typeof window === "undefined") return "";')) throw new Error('Unknown SSR static asset base-path contract')
  const temp = fs.mkdtempSync(path.join(appRoot, '.paper-export-'))
  const require = createRequire(import.meta.url)
  try {
    const publicDir = path.join(appRoot, 'public/images/posts/neotoma-paper')
    const inlineDir = path.join(appRoot, 'src/assets/neotoma-paper')
    const ogDir = path.join(appRoot, 'public/images/og')
    const previous = JSON.parse(fs.readFileSync(path.join(publicDir, 'provenance.json'), 'utf8'))
    const retainedOutputs = retainedPaperOutputs(previous, new Set(requestedScenes), publicDir, inlineDir, ogDir)
    const source = path.join(temp, 'source')
    const sourceHashes = {}
    for (const [name, bytes] of paperDonorModules(read)) {
      const destination = path.join(source, name)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.writeFileSync(destination, bytes)
      sourceHashes[name] = sha256(read(name))
    }
    sourceHashes[texturePath] = sha256(texture)
    sourceHashes['frontend/src/site/spa_path.ts'] = sha256(assetPathSource)
    for (const [href, bytes] of assets) sourceHashes[`frontend/public${href}`] = sha256(bytes)
    const compiled = path.join(temp, 'scenes.cjs')
    await build({
      stdin: { contents: `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {PaperScene} from ${JSON.stringify(path.join(source, paperDir, 'PaperScene.tsx'))}; export const render = scene => renderToStaticMarkup(React.createElement(PaperScene,{scene}));`, resolveDir: appRoot, loader: 'tsx' },
      alias: { react: path.join(appRoot, 'node_modules/react'), 'react-dom': path.join(appRoot, 'node_modules/react-dom') },
      bundle: true, platform: 'node', format: 'cjs', outfile: compiled, loader: { '.css': 'empty' }, nodePaths: [path.join(appRoot, 'node_modules')],
      plugins: [{ name: 'pinned-static-asset-ssr', setup(builder) {
        builder.onResolve({ filter: /^@\/site\/spa_path$/ }, () => ({ path: 'asset-path', namespace: 'paper-ssr' }))
        builder.onLoad({ filter: /.*/, namespace: 'paper-ssr' }, () => ({ contents: 'export const staticAssetPath = path => path;', loader: 'js' }))
      } }],
    })
    const { render } = require(compiled)
    const css = fs.readFileSync(path.join(source, paperDir, 'paper_scene.css'), 'utf8')
    const colors = { 'paper-navy': '#223e50', 'paper-cream': '#eee6d6', 'paper-sage': '#98a48b', 'paper-blue': '#a7bfcc', 'paper-rust': '#ae5632' }
    const outputs = new Map()
    const renderFidelity = Object.fromEntries(Object.entries(previous.renderFidelity ?? {}).filter(([scene]) => !Object.values(selected).includes(scene)))
    for (const [file, scene] of Object.entries(selected)) {
      let svg = ensureSvgNamespace(render(scene)).replace(/(<svg[^>]*>)/, `$1<style>${scopedStyles(css, scene)}</style>`)
      svg = svg.replace(/var\(--([\w-]+)\)/g, (_, name) => { if (!colors[name]) throw new Error(`Unknown palette ${name}`); return colors[name] })
      const original = embedTrustedPaperAssets(svg, assets)
      svg = await dedupePaperCutouts(original, assets)
      const beforePixels = await sharp(await rasterPaperSvg(original)).resize(1200, 800).raw().toBuffer()
      const afterPixels = await sharp(await rasterPaperSvg(svg)).resize(1200, 800).raw().toBuffer()
      let changedChannels = 0, maxDelta = 0
      for (let i = 0; i < beforePixels.length; i++) {
        const delta = Math.abs(beforePixels[i] - afterPixels[i])
        if (delta) changedChannels++
        maxDelta = Math.max(maxDelta, delta)
      }
      renderFidelity[scene] = { changedChannels, maxDelta, channels: beforePixels.length }
      // Nested symbol transforms can round a few 8-bit samples by one level.
      if (maxDelta > 1 || changedChannels > 16) throw new Error(`Paper material deduplication changed pixels: ${scene}`)
      outputs.set(`${file}.svg`, Buffer.from(svg + '\n'))
      outputs.set(`${file}.png`, await sharp(await rasterPaperSvg(svg)).resize(1200, 800).png().toBuffer())
    }
    let matte = previous.derivedRasterMatte?.color
    let og
    if (selected.hero) {
      const rasterHero = await rasterPaperSvg(outputs.get('hero.svg').toString())
      matte = outputs.get('hero.svg').toString().match(/<radialGradient\b[^>]*id="[^"]+-ground"[^>]*>[\s\S]*?<stop offset="1" stop-color="(#[a-f0-9]{6})"/i)?.[1]
      if (!matte) throw new Error('Unknown authored paper ground for raster framing')
      outputs.set('hero-square.png', await sharp(rasterHero).resize(800, 800, { fit: 'contain', background: matte }).png().toBuffer())
      og = await sharp(rasterHero).resize(1200, 630, { fit: 'contain', background: matte }).jpeg({ quality: 88 }).toBuffer()
    }
    const hashes = Object.fromEntries(Object.entries(retainedOutputs).map(([file, entry]) => [file, entry.sha256]))
    const outputSources = { ...retainedOutputs }
    for (const [file, bytes] of outputs) {
      fs.writeFileSync(path.join(publicDir, file), bytes)
      if (file.endsWith('.svg')) fs.writeFileSync(path.join(inlineDir, file), bytes)
      hashes[file] = sha256(bytes)
      outputSources[file] = { sourceCommit: commit, scene: selected[file.replace(/\.(svg|png)$/, '')] ?? 'hero', sha256: hashes[file] }
    }
    if (og) {
      fs.writeFileSync(path.join(ogDir, OG_NAME), og)
      hashes[OG_NAME] = sha256(og)
      outputSources[OG_NAME] = { sourceCommit: commit, scene: 'hero', sha256: hashes[OG_NAME] }
    }
    fs.writeFileSync(path.join(publicDir, 'provenance.json'), JSON.stringify({
      sourceRepository: 'https://github.com/markmhendrickson/neotoma', sourceCommit: commit,
      sourceFiles: Object.keys(sourceHashes), sourceHashes, scenes: PAPER_SCENES,
      sourceInputsByCommit: { ...(previous.sourceInputsByCommit ?? { [previous.sourceCommit]: { sourceFiles: previous.sourceFiles, sourceHashes: previous.sourceHashes } }), [commit]: { sourceFiles: Object.keys(sourceHashes), sourceHashes } },
      refreshedScenes: requestedScenes,
      retainedOutputs, outputSources, derivedRasterMatte: { color: matte, source: 'Authored hero ground radial-gradient outer stop; no older beige letterbox' },
      texture: { ...donorProvenance, embedded: 'image/webp data URI; decoded losslessly to PNG data URI for librsvg rasterization', bytes: texture.length, bundled_sha256: sha256(texture) },
      cutouts: hybridProvenance,
      staticTransformation: 'One exact known cutoutReady binding is validated: authored true remains unchanged; legacy false becomes true only for hash/decode-verified embedded assets. Matches successful-load settled image state and hides duplicate vector fallback/shadows. staticAssetPath is identity in SSR without window. No donor mutation or client app runtime.',
      deduplication: `One embedded WebP per cutout per SVG, symbols preserve stretch/slice fit; local use references retain clip/opacity/blend and motion groups. ${requestedScenes.length} refreshed 1200x800 raster comparisons must be exact or differ in at most 16 channels by one 8-bit level (symbol sampling roundoff); per-scene measurements follow. Other outputs are retained byte-exact with their own source provenance.`,
      renderFidelity,
      method: 'Pinned Git-object authored settled SVG exports, scoped CSS, literal colors and embedded trusted local texture; identical inline/public SVGs and derived PNG/square/OG exports. No external fetch.',
      hashes,
    }, null, 2) + '\n')
    console.log(`Exported ${requestedScenes.length} wordless paper scenes from ${commit}; retained ${Object.keys(retainedOutputs).length} outputs`)
  } finally { fs.rmSync(temp, { recursive: true, force: true }) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--authored') await exportAuthoredPaperArtwork(process.argv[3])
  else await exportPaperArtwork(process.argv[2], process.argv[3], process.argv[4]?.split(','))
}
