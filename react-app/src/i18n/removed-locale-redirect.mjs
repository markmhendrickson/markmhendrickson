/** Map a retired locale URL to the same English path, preserving query and fragment. */
export function redirectRemovedLocaleUrl(input, removedLocales) {
  const url = new URL(input || '/', 'https://website.invalid')
  const match = /^\/([^/]+)(\/.*)?$/.exec(url.pathname)
  if (!match || !removedLocales.includes(match[1].toLowerCase())) return null
  return `${match[2] || '/'}${url.search}${url.hash}`
}

/** The 404 fallback runs this before the client entry module loads. */
export function removedLocaleRedirectScript(removedLocales) {
  return `<script>var target=(${redirectRemovedLocaleUrl.toString()})(window.location.href,${JSON.stringify(removedLocales)});if(target)window.location.replace(target)</script>`
}
