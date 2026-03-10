import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { getDictionary } from './dictionaries'
import { localeToDirection, localeToLanguageTag, type SupportedLocale } from './config'

type LocaleContextValue = {
  locale: SupportedLocale
  languageTag: string
  direction: 'ltr' | 'rtl'
  t: ReturnType<typeof getDictionary>
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ locale, children }: { locale: SupportedLocale; children: ReactNode }) {
  const value = useMemo<LocaleContextValue>(() => {
    return {
      locale,
      languageTag: localeToLanguageTag[locale],
      direction: localeToDirection[locale],
      t: getDictionary(locale),
    }
  }, [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return value
}
