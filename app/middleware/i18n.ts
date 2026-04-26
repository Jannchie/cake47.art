import { DEFAULT_LOCALE, isLocale, normalizeLocale, type Locale } from '~/utils/useLocale'

function prefixFullPath(locale: Locale, fullPath: string) {
  if (fullPath === '/') {
    return `/${locale}`
  }
  if (fullPath.startsWith('/?') || fullPath.startsWith('/#')) {
    return `/${locale}${fullPath.slice(1)}`
  }
  return `/${locale}${fullPath}`
}

function replaceLeadingLocale(fullPath: string, locale: Locale) {
  return fullPath.replace(/^\/[^/?#]*/, `/${locale}`)
}

function preferredLocaleFromHeader(header: string | undefined): Locale {
  if (!header) {
    return DEFAULT_LOCALE
  }

  return header
    .split(',')
    .map((entry) => {
      const [tag = '', ...params] = entry.trim().split(';')
      const q = params
        .map(param => param.trim())
        .find(param => param.startsWith('q='))

      return {
        locale: normalizeLocale(tag),
        q: q ? Number(q.slice(2)) : 1,
      }
    })
    .filter((entry): entry is { locale: Locale; q: number } => !!entry.locale && !Number.isNaN(entry.q) && entry.q > 0)
    .sort((a, b) => b.q - a.q)[0]?.locale ?? DEFAULT_LOCALE
}

export default defineNuxtRouteMiddleware((to) => {
  try {
    const firstSegment = to.path.split('/')[1] || ''
    const normalizedPathLocale = normalizeLocale(firstSegment)
    const cookie = useCookie<Locale>('locale')
    const cookieLocale = normalizeLocale(cookie.value)
    const routeLocaleParam = Array.isArray(to.params.locale) ? to.params.locale[0] : to.params.locale

    if (isLocale(firstSegment)) {
      cookie.value = firstSegment
      return
    }

    if (normalizedPathLocale) {
      cookie.value = normalizedPathLocale
      return navigateTo(replaceLeadingLocale(to.fullPath, normalizedPathLocale), { redirectCode: 302 })
    }

    if (routeLocaleParam) {
      const headers = useRequestHeaders(['accept-language'])
      const targetLocale = cookieLocale ?? preferredLocaleFromHeader(headers['accept-language'])
      cookie.value = targetLocale
      return navigateTo(replaceLeadingLocale(to.fullPath, targetLocale), { redirectCode: 302 })
    }

    if (cookieLocale) {
      return navigateTo(prefixFullPath(cookieLocale, to.fullPath), { redirectCode: 302 })
    }

    const headers = useRequestHeaders(['accept-language'])
    return navigateTo(prefixFullPath(preferredLocaleFromHeader(headers['accept-language']), to.fullPath), { redirectCode: 302 })
  }
  catch (error) {
    console.error(error)
    return navigateTo(prefixFullPath(DEFAULT_LOCALE, to.fullPath), { redirectCode: 302 })
  }
})
