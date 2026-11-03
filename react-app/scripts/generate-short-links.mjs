import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const template = JSON.parse(readFileSync(new URL('./short-link-template.json', import.meta.url), 'utf8'))
if (template.version !== 1 || Object.keys(template).sort().join(',') !== 'html,script,version' ||
    template.script.split('{{DESTINATION_JSON}}').length !== 2 ||
    template.html.split('{{SCRIPT}}').length !== 2 || template.html.split('{{CSP_DIGEST}}').length !== 2) {
  throw new Error('Invalid short-link template contract')
}

/** Private build configuration only; never put access tokens in this value. */
export function parseShortLinks(raw) {
  if (!raw?.trim()) return []
  let config
  try { config = JSON.parse(raw) } catch { throw new Error('Short-link configuration must be valid JSON') }
  if (!config || Array.isArray(config) || typeof config !== 'object' ||
      Object.keys(config).sort().join(',') !== 'links,origin') {
    throw new Error('Short-link configuration requires only origin and links')
  }
  let origin
  try { origin = new URL(config.origin) } catch { throw new Error('Short-link origin must be an HTTPS origin') }
  if (typeof config.origin !== 'string' || origin.protocol !== 'https:' || origin.username || origin.password ||
      origin.pathname !== '/' || origin.search || origin.hash || origin.origin !== config.origin) {
    throw new Error('Short-link origin must be an HTTPS origin without a path, credentials, or query')
  }
  if (!config.links || Array.isArray(config.links) || typeof config.links !== 'object') {
    throw new Error('Short-link links must map slugs to entity IDs')
  }
  return Object.entries(config.links).map(([slug, entityId]) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80 ||
        typeof entityId !== 'string' || !/^ent_[a-f0-9]{24}$/.test(entityId)) {
      throw new Error('Short-link configuration contains an invalid slug or entity ID')
    }
    return { slug, destination: new URL(`/entities/${entityId}/html`, origin).href }
  })
}

export function shortLinkHtml(destination) {
  const script = template.script.replace('{{DESTINATION_JSON}}', JSON.stringify(destination).replaceAll('<', '\\u003c'))
  const digest = createHash('sha256').update(script).digest('base64')
  return template.html.replace('{{CSP_DIGEST}}', digest).replace('{{SCRIPT}}', script)
}

export function generateShortLinks({ raw, dist }) {
  // Validate everything before touching an existing build. No configuration values are logged.
  const links = parseShortLinks(raw)
  const directory = path.join(dist, 'p')
  rmSync(directory, { recursive: true, force: true })
  for (const { slug, destination } of links) {
    const pageDirectory = path.join(directory, slug)
    mkdirSync(pageDirectory, { recursive: true })
    writeFileSync(path.join(pageDirectory, 'index.html'), shortLinkHtml(destination))
  }
  return links.length
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const count = generateShortLinks({
      raw: process.env.NEOTOMA_SHORT_LINKS_JSON,
      dist: fileURLToPath(new URL('../dist/', import.meta.url)),
    })
    console.log(`Generated ${count} short-link pages`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
