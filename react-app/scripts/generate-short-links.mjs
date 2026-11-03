import { createHash } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
  const script = `(() => {
  const message = document.getElementById('message');
  try {
    const incoming = new URL(window.location.href);
    const entries = [...incoming.searchParams];
    const token = incoming.searchParams.get('t');
    if (entries.length !== 1 || entries[0][0] !== 't' || !token || token.length > 4096 || /[\\s\\u0000-\\u001f\\u007f\\ufffd]/u.test(token) || incoming.hash || /%(?![0-9a-f]{2})/i.test(incoming.search)) {
      message.textContent = 'This link needs a valid access token. Ask the person who shared it for the complete link.';
      return;
    }
    const destination = new URL(${JSON.stringify(destination).replaceAll('<', '\\u003c')});
    destination.searchParams.set('access_token', token);
    window.location.replace(destination.href);
  } catch {
    message.textContent = 'This link could not be opened. Ask the person who shared it for a new link.';
  }
})();`
  const digest = createHash('sha256').update(script).digest('base64')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${digest}'; base-uri 'none'; form-action 'none'">
<title>Opening shared page</title></head>
<body><p id="message">Opening shared page…</p>
<noscript>JavaScript is required to open this shared link. Ask the person who shared it for the original page link.</noscript>
<script>${script}</script></body></html>
`
}

export function generateShortLinks({ raw, dist }) {
  // Validate everything before touching an existing build. No configuration values are logged.
  const links = parseShortLinks(raw)
  const directory = path.join(dist, 'l')
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
