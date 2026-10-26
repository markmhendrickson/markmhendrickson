/** Apply only trusted Helmet language attributes to the prerendered document. */
export function applyDocumentLanguage(html, helmetContext, allowedTags, fallbackTag, fallbackDir = 'ltr') {
  const attributes = helmetContext?.helmet?.htmlAttributes?.toString?.() || ''
  const requestedTag = /(?:^|\s)lang="([A-Za-z0-9-]+)"/.exec(attributes)?.[1]
  const requestedDir = /(?:^|\s)dir="(ltr|rtl)"/.exec(attributes)?.[1]
  const trustedTag = allowedTags.has(requestedTag) ? requestedTag : fallbackTag
  const trustedDir = trustedTag === requestedTag && requestedDir ? requestedDir : fallbackDir
  return html.replace(/<html\b[^>]*>/i, (opening) =>
    `${opening.replace(/\s+lang="[^"]*"/i, '').replace(/\s+dir="[^"]*"/i, '').slice(0, -1)} lang="${trustedTag}" dir="${trustedDir}">`,
  )
}
