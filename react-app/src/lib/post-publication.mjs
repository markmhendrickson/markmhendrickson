/** Normalize potentially string/number boolean flags from cache or MCP exports. */
export function isTruthyFlag(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1'
  }
  return false
}

export function isPublishedPost(post) {
  return isTruthyFlag(post.published)
}
