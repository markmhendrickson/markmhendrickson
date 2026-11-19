/** Map a retired locale URL to the same English path, preserving query and fragment. */
export function redirectRemovedLocaleUrl(input, removedLocales) {
  const url = new URL(input || '/', 'https://website.invalid')
  const match = /^\/([^/]+)(\/.*)?$/.exec(url.pathname)
  if (!match || !removedLocales.includes(match[1].toLowerCase())) return null
  // Collapse leading slashes so the target can never be protocol-relative (`//host`), and
  // refuse anything that would resolve off this origin. The URL parser has already turned
  // backslashes in the path into slashes.
  const target = `${(match[2] || '/').replace(/^\/+/, '/')}${url.search}${url.hash}`
  return new URL(target, 'https://website.invalid').origin === 'https://website.invalid' ? target : '/'
}

/** The 404 fallback runs this before the client entry module loads. */
export function removedLocaleRedirectScript(removedLocales) {
  return `<script>var target=(${redirectRemovedLocaleUrl.toString()})(window.location.href,${JSON.stringify(removedLocales)});if(target)window.location.replace(target)</script>`
}
