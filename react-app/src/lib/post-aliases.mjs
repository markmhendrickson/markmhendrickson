/** Canonicalize an already-resolved alternativeSlug without losing reader context. */
export function canonicalPostAliasPath(requestUrl, canonicalSlug) {
  if (typeof canonicalSlug !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(canonicalSlug)) return null
  const url = new URL(requestUrl, 'https://local.invalid')
  const match = /^\/(?:([a-z]{2})\/)?posts\/([a-zA-Z0-9_-]+)\/?$/.exec(url.pathname)
  if (!match || match[2] === canonicalSlug) return null
  return `${match[1] ? `/${match[1]}` : ''}/posts/${canonicalSlug}${url.search}${url.hash}`
}
