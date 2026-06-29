'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { it } from './translations/it'
import { en } from './translations/en'

export type Locale = 'it' | 'en'
export type Translations = typeof it

const translations: Record<Locale, Translations> = { it: it as Translations, en: en as Translations }

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc == null || typeof acc !== 'object') return undefined
    return (acc as Record<string, unknown>)[key]
  }, obj)
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`))
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  tr: Translations
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('it')
  const tr = translations[locale]

  function t(key: string, vars?: Record<string, string | number>): string {
    const value = getNestedValue(tr as unknown as Record<string, unknown>, key)
    if (typeof value === 'string') return interpolate(value, vars)
    return key
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tr }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
