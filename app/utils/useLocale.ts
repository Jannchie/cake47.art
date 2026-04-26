export const LOCALES = ['zh-CN', 'en', 'ja'] as const
export const DEFAULT_LOCALE: Locale = 'en'

export type Locale = typeof LOCALES[number]

export const localeLanguageTags: Record<Locale, string> = {
  'zh-CN': 'zh-CN',
  en: 'en',
  ja: 'ja',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function normalizeLocale(value: unknown): Locale | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().replace('_', '-').toLowerCase()
  if (!normalized) {
    return null
  }

  if (normalized === 'zh' || normalized.startsWith('zh-')) {
    return 'zh-CN'
  }
  if (normalized === 'ja' || normalized.startsWith('ja-')) {
    return 'ja'
  }
  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en'
  }

  return null
}

function readRouteLocaleParam(value: unknown): Locale | null {
  return normalizeLocale(Array.isArray(value) ? value[0] : value)
}

export function useRouteLocale() {
  const route = useRoute()
  return computed<Locale>(() => readRouteLocaleParam(route.params.locale) ?? DEFAULT_LOCALE)
}

export function useLocale(): Locale {
  return readRouteLocaleParam(useRoute().params.locale) ?? DEFAULT_LOCALE
}

export function localizedPath(locale: Locale, path = '') {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return suffix === '/' ? `/${locale}` : `/${locale}${suffix}`
}
