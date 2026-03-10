import { defaultLocale, isSupportedLocale, type SupportedLocale } from './config'

export const LOCALE_STORAGE_KEY = 'preferred_locale'
const browserAutoDetectLocales: ReadonlySet<SupportedLocale> = new Set(['en', 'es', 'ca'])

export function getLocaleFromPath(pathname: string): SupportedLocale | null {
  const [, first] = pathname.split('/')
  if (isSupportedLocale(first)) return first
  return null
}

export function stripLocaleFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return '/'
  if (isSupportedLocale(parts[0])) {
    const rest = parts.slice(1).join('/')
    return rest ? `/${rest}` : '/'
  }
  return pathname || '/'
}

export function localizePath(pathname: string, locale: SupportedLocale): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  const barePath = stripLocaleFromPath(normalized)
  if (locale === defaultLocale) return barePath
  return barePath === '/' ? `/${locale}` : `/${locale}${barePath}`
}

export function readSavedLocale(): SupportedLocale | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  return isSupportedLocale(raw) ? raw : null
}

export function saveLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

export function resolvePreferredLocale(): SupportedLocale {
  const saved = readSavedLocale()
  if (saved) return saved
  if (typeof navigator === 'undefined') return defaultLocale
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const lang of langs) {
    const primary = lang?.toLowerCase().split('-')[0]
    if (isSupportedLocale(primary) && browserAutoDetectLocales.has(primary)) return primary
  }
  return defaultLocale
}
