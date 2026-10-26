/** Keep existing default-English fragments stable while retaining letters in translated headings. */
export function slugifyHeading(text: string, asciiOnly = false): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/gu, '-')
  return normalized
    .replace(asciiOnly ? /[^a-z0-9-]/g : /[^\p{L}\p{M}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section'
}

/** Avoid duplicate targets for genuinely repeated headings and slug collisions. */
export function createHeadingIdAllocator(asciiOnly = false): (text: string) => string {
  const used = new Set<string>()
  return (text) => {
    const base = slugifyHeading(text, asciiOnly)
    let id = base
    let suffix = 2
    while (used.has(id)) id = `${base}-${suffix++}`
    used.add(id)
    return id
  }
}

/** Router hashes are percent encoded; malformed fragments simply have no matching target. */
export function headingIdFromHash(hash: string): string {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}
