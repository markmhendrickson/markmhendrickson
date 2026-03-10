export const supportedLocales = [
  'en',
  'es',
  'ca',
  'zh',
  'hi',
  'ar',
  'fr',
  'pt',
  'ru',
  'bn',
  'ur',
  'id',
  'de',
] as const

export type SupportedLocale = (typeof supportedLocales)[number]

export const defaultLocale: SupportedLocale = 'en'

export const nonDefaultLocales = supportedLocales.filter(
  (locale) => locale !== defaultLocale
) as Exclude<SupportedLocale, typeof defaultLocale>[]

export const localeToLanguageTag: Record<SupportedLocale, string> = {
  en: 'en-US',
  es: 'es-ES',
  ca: 'ca-ES',
  zh: 'zh-CN',
  hi: 'hi-IN',
  ar: 'ar',
  fr: 'fr-FR',
  pt: 'pt-PT',
  ru: 'ru-RU',
  bn: 'bn-BD',
  ur: 'ur-PK',
  id: 'id-ID',
  de: 'de-DE',
}

export const localeToOgLocale: Record<SupportedLocale, string> = {
  en: 'en_US',
  es: 'es_ES',
  ca: 'ca_ES',
  zh: 'zh_CN',
  hi: 'hi_IN',
  ar: 'ar_AR',
  fr: 'fr_FR',
  pt: 'pt_PT',
  ru: 'ru_RU',
  bn: 'bn_BD',
  ur: 'ur_PK',
  id: 'id_ID',
  de: 'de_DE',
}

/** Full language names for the language switcher (native form). */
export const localeToLanguageName: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  ca: 'Català',
  zh: 'Mandarin Chinese (中文)',
  hi: 'Hindi (हिन्दी)',
  ar: 'Arabic (العربية)',
  fr: 'Français',
  pt: 'Português',
  ru: 'Russian (Русский)',
  bn: 'Bengali (বাংলা)',
  ur: 'Urdu (اردو)',
  id: 'Bahasa Indonesia',
  de: 'Deutsch',
}

export const localeToDirection: Record<SupportedLocale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  es: 'ltr',
  ca: 'ltr',
  zh: 'ltr',
  hi: 'ltr',
  ar: 'rtl',
  fr: 'ltr',
  pt: 'ltr',
  ru: 'ltr',
  bn: 'ltr',
  ur: 'rtl',
  id: 'ltr',
  de: 'ltr',
}

export function isSupportedLocale(value: string | undefined | null): value is SupportedLocale {
  if (!value) return false
  return (supportedLocales as readonly string[]).includes(value.toLowerCase())
}
