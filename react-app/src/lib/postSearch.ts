type SearchablePrimitive = string | number | boolean

export interface SearchablePost extends Record<string, unknown> {
  slug?: string
  title?: string
  excerpt?: string
  body?: string
  summary?: string
  category?: string
  tags?: string[]
  series?: string
  seriesSlug?: string
  canonicalSlug?: string
  postId?: string
  shareTweet?: string
}

interface SearchField {
  key: string
  text: string
}

type TokenMatchKind = 'exact' | 'prefix' | 'fuzzy' | null

export interface HighlightPart {
  text: string
  highlight: boolean
}

const FIELD_WEIGHTS: Record<string, number> = {
  title: 140,
  slug: 110,
  canonicalSlug: 110,
  postId: 100,
  tags: 95,
  series: 85,
  seriesSlug: 80,
  category: 65,
  excerpt: 55,
  summary: 50,
  shareTweet: 40,
  linkedTweetUrl: 30,
  body: 18,
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
}

function getQueryTokens(query: string): string[] {
  return Array.from(new Set(tokenize(query)))
}

function pushField(fields: SearchField[], key: string, value: SearchablePrimitive): void {
  const text = String(value).trim()
  if (!text) return
  fields.push({ key, text })
}

function collectSearchFields(value: unknown, key: string, fields: SearchField[]): void {
  if (value == null) return

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    pushField(fields, key, value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) collectSearchFields(item, key, fields)
    return
  }

  if (typeof value === 'object') {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      collectSearchFields(nestedValue, key, fields)
    }
  }
}

function getSearchFields(post: SearchablePost): SearchField[] {
  const fields: SearchField[] = []
  for (const [key, value] of Object.entries(post)) collectSearchFields(value, key, fields)
  return fields
}

function getMaxTypoDistance(token: string): number {
  if (token.length <= 4) return 0
  if (token.length <= 7) return 1
  return 2
}

function getEditDistance(a: string, b: string, maxDistance: number): number {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    let rowMin = current[0]

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      const value = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost,
      )
      current.push(value)
      rowMin = Math.min(rowMin, value)
    }

    if (rowMin > maxDistance) return maxDistance + 1
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j]
  }

  return previous[b.length]
}

function getTokenMatchKind(fieldToken: string, queryToken: string): TokenMatchKind {
  if (fieldToken === queryToken) return 'exact'

  if (
    queryToken.length >= 4 &&
    fieldToken.startsWith(queryToken) &&
    fieldToken.length - queryToken.length <= 2
  ) {
    return 'prefix'
  }

  const maxDistance = Math.min(getMaxTypoDistance(fieldToken), getMaxTypoDistance(queryToken))
  if (maxDistance === 0) return null

  const distance = getEditDistance(fieldToken, queryToken, maxDistance)
  return distance <= maxDistance ? 'fuzzy' : null
}

function hasOrderedTokenMatch(text: string, queryTokens: string[]): boolean {
  let index = 0
  for (const token of queryTokens) {
    index = text.indexOf(token, index)
    if (index === -1) return false
    index += token.length
  }
  return true
}

function getFieldWeight(key: string): number {
  return FIELD_WEIGHTS[key] ?? 10
}

function getNormalizedTokenWithMap(text: string): { normalized: string; indexMap: number[] } {
  let normalized = ''
  const indexMap: number[] = []

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const normalizedChar = normalizeText(char)
    for (const piece of normalizedChar) {
      normalized += piece
      indexMap.push(index)
    }
  }

  return { normalized, indexMap }
}

function mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (ranges.length === 0) return ranges

  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end)
  const merged = [sorted[0]]

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index]
    const previous = merged[merged.length - 1]
    if (current.start <= previous.end) previous.end = Math.max(previous.end, current.end)
    else merged.push(current)
  }

  return merged
}

function getTokenHighlightParts(text: string, queryTokens: string[]): HighlightPart[] {
  const normalizedToken = normalizeText(text)
  if (!normalizedToken) return [{ text, highlight: false }]

  const { normalized, indexMap } = getNormalizedTokenWithMap(text)
  const ranges: Array<{ start: number; end: number }> = []

  for (const queryToken of queryTokens) {
    const matchKind = getTokenMatchKind(normalizedToken, queryToken)
    if (matchKind != null) {
      ranges.push({ start: 0, end: text.length })
      continue
    }

    let searchIndex = normalized.indexOf(queryToken)
    while (searchIndex !== -1) {
      const start = indexMap[searchIndex]
      const endIndex = searchIndex + queryToken.length - 1
      const end = (indexMap[endIndex] ?? (text.length - 1)) + 1
      ranges.push({ start, end })
      searchIndex = normalized.indexOf(queryToken, searchIndex + 1)
    }
  }

  const mergedRanges = mergeRanges(ranges)
  if (mergedRanges.length === 0) return [{ text, highlight: false }]

  const parts: HighlightPart[] = []
  let cursor = 0

  for (const range of mergedRanges) {
    if (range.start > cursor) parts.push({ text: text.slice(cursor, range.start), highlight: false })
    parts.push({ text: text.slice(range.start, range.end), highlight: true })
    cursor = range.end
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor), highlight: false })
  return parts
}

export function scorePostMatch(post: SearchablePost, query: string): number | null {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return null

  const queryTokens = getQueryTokens(normalizedQuery)
  if (queryTokens.length === 0) return null

  let totalScore = 0
  let phraseMatched = false
  const matchedTokens = new Set<string>()

  for (const field of getSearchFields(post)) {
    const normalizedField = normalizeText(field.text)
    if (!normalizedField) continue

    const weight = getFieldWeight(field.key)
    let fieldScore = 0

    if (normalizedField === normalizedQuery) {
      fieldScore += 14
      phraseMatched = true
    } else if (normalizedField.startsWith(normalizedQuery)) {
      fieldScore += 11
      phraseMatched = true
    } else if (normalizedField.includes(normalizedQuery)) {
      fieldScore += 8
      phraseMatched = true
    }

    const fieldTokens = Array.from(new Set(tokenize(normalizedField)))
    if (fieldTokens.length === 0) continue

    let matchedTokensInField = 0
    for (const queryToken of queryTokens) {
      let bestMatchKind: TokenMatchKind = null

      for (const fieldToken of fieldTokens) {
        const matchKind = getTokenMatchKind(fieldToken, queryToken)
        if (matchKind === 'exact') {
          bestMatchKind = 'exact'
          break
        }
        if (matchKind === 'prefix') bestMatchKind = bestMatchKind ?? 'prefix'
        else if (matchKind === 'fuzzy' && bestMatchKind == null) bestMatchKind = 'fuzzy'
      }

      if (bestMatchKind) {
        matchedTokens.add(queryToken)
        matchedTokensInField += 1
        if (bestMatchKind === 'exact') fieldScore += 3.5
        else if (bestMatchKind === 'prefix') fieldScore += 2.5
        else fieldScore += 1.5
      }
    }

    if (matchedTokensInField > 0) {
      if (matchedTokensInField === queryTokens.length) fieldScore += 5
      if (queryTokens.length > 1 && hasOrderedTokenMatch(normalizedField, queryTokens)) fieldScore += 2
    }

    if (fieldScore > 0) totalScore += fieldScore * weight
  }

  if (!phraseMatched && matchedTokens.size < queryTokens.length) return null
  return totalScore > 0 ? totalScore : null
}

export function getHighlightedParts(text: string, query: string): HighlightPart[] {
  if (!text) return [{ text, highlight: false }]

  const queryTokens = getQueryTokens(query)
  if (queryTokens.length === 0) return [{ text, highlight: false }]

  const parts: HighlightPart[] = []
  const tokenPattern = /[\p{L}\p{N}]+/gu
  let cursor = 0

  for (const match of text.matchAll(tokenPattern)) {
    const matchedText = match[0]
    const start = match.index ?? 0
    const end = start + matchedText.length

    if (start > cursor) parts.push({ text: text.slice(cursor, start), highlight: false })

    parts.push(...getTokenHighlightParts(matchedText, queryTokens))
    cursor = end
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor), highlight: false })
  return parts.length > 0 ? parts : [{ text, highlight: false }]
}
