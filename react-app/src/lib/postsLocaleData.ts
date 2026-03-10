import postsDefault from '@cache/posts.json'
import { defaultLocale, type SupportedLocale } from '@/i18n/config'

type PostRecord = Record<string, unknown>

const localeModules = import.meta.glob('@cache/posts.*.json', { eager: true }) as Record<
  string,
  { default?: PostRecord[] } | PostRecord[]
>

const localizedPostsByLocale = new Map<SupportedLocale, PostRecord[]>()
for (const [modulePath, moduleValue] of Object.entries(localeModules)) {
  const match = modulePath.match(/posts\.([a-z]{2})\.json$/)
  if (!match) continue
  const locale = match[1] as SupportedLocale
  const payload = (moduleValue as { default?: PostRecord[] }).default ?? (moduleValue as PostRecord[])
  if (Array.isArray(payload)) localizedPostsByLocale.set(locale, payload)
}

export function getLocalizedPublicPosts(locale: SupportedLocale): PostRecord[] {
  return localizedPostsByLocale.get(locale) ?? localizedPostsByLocale.get(defaultLocale) ?? (postsDefault as PostRecord[])
}

export function getDefaultPublicPosts(): PostRecord[] {
  return postsDefault as PostRecord[]
}
