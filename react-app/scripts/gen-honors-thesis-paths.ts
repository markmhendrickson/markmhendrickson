/**
 * Writes cache/honors-thesis-paths.json for SSR prerender (chapter + section URLs).
 * Must match routing in App.tsx and parsing in src/lib/honorsThesisStructure.ts.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseChapters, parseChapterSubsections } from '../src/lib/honorsThesisStructure.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const thesisBody = fs.readFileSync(path.join(root, 'src/content/honors-thesis-body.md'), 'utf8')
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/pages/honors-thesis.json'), 'utf8')) as {
  copy: { en: { toc: { slug: string; label: string; page: string }[] } }
}
const toc = data.copy.en.toc
const chapters = parseChapters(thesisBody, toc)
const out: string[] = []
for (const ch of chapters) {
  out.push(`/honors-thesis/chapter/${ch.slug}`)
  for (const sub of parseChapterSubsections(ch.content, ch.label)) {
    out.push(`/honors-thesis/chapter/${ch.slug}/section/${sub.slug}`)
  }
}
const cacheDir = path.join(root, 'cache')
fs.mkdirSync(cacheDir, { recursive: true })
const outPath = path.join(cacheDir, 'honors-thesis-paths.json')
fs.writeFileSync(outPath, `${JSON.stringify(out)}\n`)
console.log('gen-honors-thesis-paths:', out.length, 'paths ->', path.relative(root, outPath))
