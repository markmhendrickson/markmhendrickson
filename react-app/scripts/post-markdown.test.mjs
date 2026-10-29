import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { composePostMarkdown, createPostMarkdownRepository } from './post-markdown.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const essay = 'your-agents-need-a-system-of-record'

test('the real essay export includes its title, excerpt, takeaways, hero and unchanged prose in reading order', () => {
  const post = JSON.parse(fs.readFileSync(path.join(root, 'cache/posts.json'), 'utf8')).find((p) => p.slug === essay)
  const body = fs.readFileSync(path.join(root, `src/content/posts/${essay}.md`), 'utf8').trim()
  const result = createPostMarkdownRepository(root).resolve(essay)
  assert(result.startsWith(`# ${post.title}\n\n${post.excerpt}\n\n## Key takeaways\n`))
  assert(result.includes(post.summary.trim()))
  assert(result.includes(`![${post.heroImageAlt}](</images/posts/neotoma-paper/hero.svg>)`))
  assert(result.indexOf(post.summary.trim()) < result.indexOf(`![${post.heroImageAlt}]`))
  assert(result.indexOf(post.heroImageCaption) < result.indexOf(body))
  assert(result.endsWith(body + '\n'), 'body including authored images and links is retained')
})

test('an unrelated post and localized post use their own metadata and content', () => {
  const repository = createPostMarkdownRepository(root)
  const unrelated = repository.resolve('three-types-of-design')
  assert(unrelated.startsWith('# Three types of design\n'))
  assert(unrelated.includes('I tend to divide design into three main types:'))
  const es = JSON.parse(fs.readFileSync(path.join(root, 'cache/posts.es.json'), 'utf8')).find((p) => p.slug === essay)
  const translated = repository.resolve(essay, 'es')
  assert(translated.startsWith(`# ${es.title}\n\n${es.excerpt}`))
  assert(translated.includes(es.summary))
  assert(translated.includes(es.body.trim()))
  assert(!translated.includes('# Your agents need a system of record'))
})

test('composition does not duplicate title, embedded takeaways, hero or postscript and preserves fenced examples', () => {
  const code = '```md\n## Key takeaways\n- code example\n## Postscript\nexample\n```'
  const body = `# Title\n\n${code}\n\n## Key takeaways\n\n- Embedded point\n\nNarrative.\n\n![Already there](/images/posts/hero.svg)\n\n## Postscript\n\nOld ending.`
  const result = composePostMarkdown({ title: 'Title', body, heroImage: 'hero.svg' }, { postscript: 'Replacement ending.' })
  assert.equal(result.split('# Title').length - 1, 1)
  assert.equal(result.split('- Embedded point').length - 1, 1)
  assert(result.indexOf('- Embedded point') < result.indexOf(code))
  assert(result.includes(code), 'headings within code blocks are not metadata sections')
  assert.equal(result.split('/images/posts/hero.svg').length - 1, 1)
  assert(!result.includes('Old ending.'))
  assert(result.endsWith('## Postscript\n\nReplacement ending.\n'))
})

test('public generation resolves aliases and excludes drafts, unlisted records and their source files', (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'post-markdown-fixture-'))
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }))
  fs.mkdirSync(path.join(fixture, 'cache'), { recursive: true })
  fs.mkdirSync(path.join(fixture, 'src/content/posts/drafts'), { recursive: true })
  const published = { slug: 'public', alternativeSlugs: ['older-name'], title: 'Public title', excerpt: 'Public excerpt', published: true, body: 'Cached body.' }
  const draft = { slug: 'draft', title: 'Draft title', published: false, body: 'Private draft.' }
  const unlisted = { slug: 'review', alternativeSlugs: ['review-alias'], title: 'Review title', unlisted: true, published: true, body: 'Private review.' }
  fs.writeFileSync(path.join(fixture, 'cache/posts.json'), JSON.stringify([published, draft, unlisted]))
  fs.writeFileSync(path.join(fixture, 'cache/posts.private.json'), JSON.stringify([draft]))
  fs.writeFileSync(path.join(fixture, 'cache/unlisted-posts.json'), JSON.stringify([unlisted]))
  fs.writeFileSync(path.join(fixture, 'src/content/posts/public.md'), 'Source body.')
  fs.writeFileSync(path.join(fixture, 'src/content/posts/drafts/draft.md'), '---\ntitle: Fresh draft title\nexcerpt: Fresh draft excerpt\n---\nDraft source.')
  fs.writeFileSync(path.join(fixture, 'src/content/posts/review.md'), 'Private review source.')
  const repository = createPostMarkdownRepository(fixture)
  assert.equal(repository.resolve('older-name'), repository.resolve('public'))
  assert(repository.resolve('public').includes('Source body.'))
  for (const slug of ['draft', 'review', 'review-alias', 'missing', '../public']) assert.equal(repository.resolve(slug), null, slug)
  assert.equal(repository.resolve('review', 'en', { allowDrafts: true }), null)
  assert(repository.resolve('draft', 'en', { allowDrafts: true }).startsWith('# Fresh draft title\n\nFresh draft excerpt'))
  const outputs = repository.publishedOutputs()
  assert.deepEqual(outputs.map((o) => o.outputPath).sort(), ['posts/older-name.md', 'posts/public.md'])
  assert(outputs.every((o) => !/Private|Draft|review/.test(o.body)))
})

test('missing optional metadata does not invent summary, image, excerpt or postscript', () => {
  assert.equal(composePostMarkdown({ title: 'Only title', body: 'Only body.' }), '# Only title\n\nOnly body.\n')
})

test('only recognized publication flags expose source content or emit public Markdown', (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'post-markdown-flags-'))
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }))
  fs.mkdirSync(path.join(fixture, 'cache'), { recursive: true })
  const allowed = [true, 1, 'true', '1', ' TRUE ']
  const denied = [false, 'false', 0, null, undefined, 'junk', {}, [], 2]
  const posts = [...allowed, ...denied].map((published, index) => ({ slug: `post-${index}`, title: `Post ${index}`, published, body: `Unique source ${index}.` }))
  fs.writeFileSync(path.join(fixture, 'cache/posts.json'), JSON.stringify(posts))
  const repository = createPostMarkdownRepository(fixture)
  for (let index = 0; index < posts.length; index++) {
    const actual = repository.resolve(posts[index].slug)
    if (index < allowed.length) assert(actual?.includes(posts[index].body))
    else assert.equal(actual, null, `rejects ${JSON.stringify(posts[index].published)}`)
  }
  assert.deepEqual(repository.publishedOutputs().map(({ outputPath }) => outputPath), allowed.map((_, index) => `posts/post-${index}.md`))
})

test('an image example inside fenced code does not suppress the metadata hero or caption', () => {
  const code = '```md\n![example](/images/posts/hero.svg)\n```'
  const result = composePostMarkdown({ title: 'Title', heroImage: 'hero.svg', heroImageCaption: 'Caption', body: `${code}\n\nNarrative.` })
  assert(result.includes('![Title](</images/posts/hero.svg>)\n\nCaption\n\n' + code))
  assert.equal(result.split('/images/posts/hero.svg').length - 1, 2, 'one rendered hero and one preserved code example')
})
