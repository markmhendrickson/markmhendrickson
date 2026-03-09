export const supportedLocales = ['en', 'es', 'ca'] as const

export type SupportedLocale = (typeof supportedLocales)[number]

export const defaultLocale: SupportedLocale = 'en'

export const localeToLanguageTag: Record<SupportedLocale, string> = {
  en: 'en-US',
  es: 'es-ES',
  ca: 'ca-ES',
}

export const localeToOgLocale: Record<SupportedLocale, string> = {
  en: 'en_US',
  es: 'es_ES',
  ca: 'ca_ES',
}

/** Full language names for the language switcher (native form). */
export const localeToLanguageName: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  ca: 'Català',
}

export function isSupportedLocale(value: string | undefined | null): value is SupportedLocale {
  if (!value) return false
  return (supportedLocales as readonly string[]).includes(value.toLowerCase())
}
