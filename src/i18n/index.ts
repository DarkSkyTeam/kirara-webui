import { computed, ref } from 'vue'
import type { App } from 'vue'
import {
  dateEnUS,
  dateRuRU,
  dateZhCN,
  enUS,
  ruRU,
  zhCN
} from 'naive-ui'
import enUSMessages from './locales/en-US'
import ruRUMessages from './locales/ru-RU'

export type AppLocale = 'zh-CN' | 'en-US' | 'ru-RU'

export interface LocaleOption {
  label: string
  value: AppLocale
}

const STORAGE_KEY = 'kirara-locale'

const messages: Record<AppLocale, Record<string, string>> = {
  'zh-CN': {},
  'en-US': enUSMessages,
  'ru-RU': ruRUMessages
}

export const localeOptions: LocaleOption[] = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
  { label: 'Русский', value: 'ru-RU' }
]

function isAppLocale(value: string | null): value is AppLocale {
  return value === 'zh-CN' || value === 'en-US' || value === 'ru-RU'
}

function detectLocale(): AppLocale {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (isAppLocale(saved)) {
      return saved
    }
  }

  const browserLocale =
    typeof navigator !== 'undefined' ? (navigator.language || '').toLowerCase() : ''

  if (browserLocale.startsWith('zh')) {
    return 'zh-CN'
  }
  if (browserLocale.startsWith('ru')) {
    return 'ru-RU'
  }
  return 'en-US'
}

export const locale = ref<AppLocale>(detectLocale())

export const naiveLocale = computed(() => {
  switch (locale.value) {
    case 'zh-CN':
      return zhCN
    case 'ru-RU':
      return ruRU
    default:
      return enUS
  }
})

export const naiveDateLocale = computed(() => {
  switch (locale.value) {
    case 'zh-CN':
      return dateZhCN
    case 'ru-RU':
      return dateRuRU
    default:
      return dateEnUS
  }
})

function interpolate(text: string, params?: Record<string, unknown> | unknown[]): string {
  if (!params) {
    return text
  }

  if (Array.isArray(params)) {
    return params.reduce(
      (result, value, index) => result.split(`{${index}}`).join(String(value)),
      text
    )
  }

  return Object.entries(params).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    text
  )
}

/**
 * Translate a source string (the original Chinese text is used as the key).
 * Unknown strings fall back to the source text, so missing translations never
 * break the UI.
 */
export function t(source: string, params?: Record<string, unknown> | unknown[]): string {
  const translated = messages[locale.value][source] ?? source
  return interpolate(translated, params)
}

function applyDocumentLang(value: AppLocale) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = value
  }
}

export function setLocale(value: AppLocale, options: { reload?: boolean } = {}) {
  if (!isAppLocale(value)) {
    return
  }

  locale.value = value

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, value)
  }

  applyDocumentLang(value)

  if (options.reload !== false && typeof window !== 'undefined') {
    // Some view models build their labels once during setup. Reloading makes
    // sure every part of the UI immediately uses the newly selected language.
    window.setTimeout(() => window.location.reload(), 80)
  }
}

export function installI18n(app: App) {
  app.config.globalProperties.$t = t
  applyDocumentLang(locale.value)
}

export function useI18n() {
  return {
    t,
    locale,
    setLocale,
    localeOptions,
    naiveLocale,
    naiveDateLocale
  }
}
