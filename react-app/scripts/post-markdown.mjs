import fs from 'node:fs'
import path from 'node:path'

const text = (value) => typeof value === 'string' ? value.trim() : ''
const variants = (post) => [post.slug, ...(Array.isArray(post.alternativeSlugs) ? post.alternativeSlugs : [])]
const isPublic = (post) => post.published !== false && post.unlisted !== true
const takeawaysHeading = /^##\s+(?:Key\s+takeaways|Conclusiones\s+clave|Mencions\s+clau\s+per\s+emportar|要点|मुख्य\s+बातें|الوجبات\s+الرئيسية|Points\s+clés\s+à\s+retenir|Principais\s+conclusões|Ключевые\s+выводы|মূল\s+উপায়|اہم\s+نکات|Poin-poin\s+penting|Wichtige\s+Erkenntnisse)\s*$/i

function sectionLine(lines, matches) {
  let fence
  for (let index = 0; index < lines.length; index++) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(lines[index])?.[1]
    if (marker) {
      if (!fence) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined
      continue
    }
    if (!fence && matches(lines[index])) return index
  }
  return -1
}

function splitTakeaways(body) {
  const lines = body.split(/\r?\n/)
  const start = sectionLine(lines, (line) => takeawaysHeading.test(line.trim()))
  if (start < 0) return { body }
  let end = start + 1
  const bullets = []
  while (end < lines.length) {
    const line = lines[end]
    if (!line.trim() && !bullets.length) { end++; continue }
    if (!/^[\t ]*([-*+]|\d+\.)\s/.test(line)) break
    bullets.push(line)
    end++
  }
  return bullets.length ? { body: [...lines.slice(0, start), ...lines.slice(end)].join('\n'), summary: bullets.join('\n') } : { body }
}

function displayedSummary(raw, limit) {
  const result = []
  let count = 0
  for (const line of text(raw).split('\n')) {
    if (/^[-*]\s/.test(line.trim()) && count++ >= limit) break
    result.push(line)
  }
  return result.join('\n').replace(/\*\*([\s\S]*?)\*\*|__([\s\S]*?)__/g, (_match, stars, underscores) => stars ?? underscores).trim()
}

function readJson(file, fallback = []) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function stripFrontmatter(raw) {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')
}

function frontmatter(raw) {
  const block = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw)?.[1]
  if (!block) return {}
  const result = {}
  for (const line of block.split(/\r?\n/)) {
    const match = /^(title|excerpt|heroImage|heroImageStyle):\s*(.*)$/.exec(line)
    if (match) result[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return result
}

function imageUrl(image) {
  if (/^(?:https?:\/\/|\/)/.test(image)) return image
  return `/images/${image.startsWith('og/') ? '' : 'posts/'}${image}`
}

/** Assemble a readable document, rather than exporting only the body fragment. */
export function composePostMarkdown(post, { body = post.body, summary = post.summary, postscript = post.postscript, takeawaysLabel = 'Key takeaways' } = {}) {
  let main = stripFrontmatter(typeof body === 'string' ? body : '').trim()
  const title = text(post.title)
  // A source may already carry its own title. Keep that heading exactly once.
  if (title && (main === `# ${title}` || main.startsWith(`# ${title}\n`))) main = main.slice(title.length + 3).trimStart()
  const embedded = splitTakeaways(main)
  main = embedded.body.trim()
  const bodyLines = main.split('\n')
  const postscriptLine = sectionLine(bodyLines, (line) => /^##\s+postscript\b/i.test(line))
  const inlinePostscript = postscriptLine < 0 ? '' : bodyLines.slice(postscriptLine).join('\n')
  if (postscriptLine >= 0) main = bodyLines.slice(0, postscriptLine).join('\n').trimEnd()
  const sections = []
  if (title) sections.push(`# ${title}`)
  if (text(post.excerpt)) sections.push(text(post.excerpt))
  const takeaways = displayedSummary(text(summary) || embedded.summary, post.slug === 'six-agentic-trends-betting-on' ? 6 : 5)
  if (takeaways && takeaways !== text(post.excerpt)) {
    sections.push(`## ${takeawaysLabel}\n\n${takeaways}`)
  }
  if (text(post.heroImage)) {
    const url = imageUrl(post.heroImage)
    // Do not repeat a hero already authored in the body.
    if (!main.includes(url) && !main.includes(`](${post.heroImage}`)) {
      const alt = text(post.heroImageAlt) || title
      sections.push(`![${alt.replace(/([\\\[\]])/g, '\\$1')}](<${url}>)`)
      const caption = [text(post.heroImageLabel), text(post.heroImageCaption)].filter(Boolean).join('. ')
      if (caption) sections.push(caption)
    }
  }
  if (main) sections.push(main)
  const ending = text(postscript) || text(inlinePostscript)
  if (ending && !main.includes(ending)) {
    sections.push(/^#{1,6}\s/.test(ending) ? ending : `## Postscript\n\n${ending}`)
  }
  return sections.join('\n\n') + '\n'
}

/** One resolver backs dev HTTP, generated Markdown files and SSR HTTP. */
export function createPostMarkdownRepository(root, { defaultLocale = 'en' } = {}) {
  const cache = path.join(root, 'cache')
  const content = path.join(root, 'src/content/posts')
  const cachedFiles = new Map()
  const readPosts = (locale) => {
    const file = path.join(cache, locale && locale !== defaultLocale ? `posts.${locale}.json` : 'posts.json')
    if (!fs.existsSync(file)) return []
    const stat = fs.statSync(file)
    const previous = cachedFiles.get(file)
    if (previous?.mtime === stat.mtimeMs && previous?.size === stat.size) return previous.posts
    const posts = readJson(file)
    cachedFiles.set(file, { mtime: stat.mtimeMs, size: stat.size, posts })
    return posts
  }
  const sidecar = (slug, suffix, drafts = false) => {
    for (const dir of drafts ? [path.join(content, 'drafts'), content] : [content]) {
      const file = path.join(dir, `${slug}${suffix}.md`)
      if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8')
    }
    return undefined
  }
  const dictionaries = readJson(path.join(root, 'src/i18n/dictionaries.generated.json'), {})

  function resolve(slug, locale = defaultLocale, { allowDrafts = false } = {}) {
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) return null
    // Review records deliberately have no public raw-Markdown surface.
    if (readJson(path.join(cache, 'unlisted-posts.json')).some((post) => variants(post).includes(slug))) return null
    const localized = locale !== defaultLocale
    const posts = readPosts(locale)
    let post = posts.find((candidate) => variants(candidate).includes(slug))
    if (!post && allowDrafts && !localized) {
      post = readJson(path.join(cache, 'posts.private.json')).find((candidate) => variants(candidate).includes(slug))
    }
    if (post && (post.unlisted === true || (!allowDrafts && !isPublic(post)))) return null
    if (!post && (!allowDrafts || localized)) return null
    const canonical = post?.slug || slug
    const draftSource = allowDrafts && (!post || !isPublic(post))
    const raw = localized ? post?.body : (sidecar(canonical, '', draftSource) ?? post?.body)
    if (!text(raw)) return null
    const meta = { ...post, ...(!localized ? frontmatter(raw) : {}) }
    const summary = localized ? post?.summary : (sidecar(canonical, '.summary', draftSource) ?? post?.summary)
    const postscript = localized ? post?.postscript : (sidecar(canonical, '.postscript', draftSource) ?? post?.postscript)
    return composePostMarkdown(meta, { body: raw, summary, postscript, takeawaysLabel: dictionaries[locale]?.keyTakeaways || 'Key takeaways' })
  }

  function publishedOutputs() {
    const outputs = new Map()
    const files = fs.existsSync(cache) ? fs.readdirSync(cache).filter((name) => /^posts(?:\.[a-z]{2})?\.json$/.test(name)) : []
    for (const file of files) {
      const locale = /^posts(?:\.([a-z]{2}))?\.json$/.exec(file)?.[1]
      const routeLocale = locale || defaultLocale
      const posts = readJson(path.join(cache, file))
      for (const post of posts) {
        if (!isPublic(post) || !text(post.slug)) continue
        const body = resolve(post.slug, routeLocale)
        if (body == null) continue
        for (const slug of variants(post).filter((value) => typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value))) {
          outputs.set(path.posix.join(locale || '', 'posts', `${slug}.md`), body)
        }
      }
    }
    return [...outputs].map(([outputPath, body]) => ({ outputPath, body }))
  }

  return { resolve, publishedOutputs }
}
