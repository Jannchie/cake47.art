import { tForLocale } from '~/utils/i18n'
import { DEFAULT_LOCALE, LOCALES, localeLanguageTags, localizedPath, useRouteLocale, type Locale } from '~/utils/useLocale'

const SITE_URL = 'https://cake47.art'
const DEFAULT_OG_IMAGE = '/api/files/gallery/snowcake47/anime-fanart/vocaloid/racing-miku.jpg'

interface LocaleSeoOptions {
  path?: string
  title?: Record<Locale, string>
  description?: Record<Locale, string>
}

function absoluteLocalizedUrl(locale: Locale, path = '') {
  return `${SITE_URL}${localizedPath(locale, path)}`
}

export function setSeoMetaByLocale(options: LocaleSeoOptions = {}) {
  const locale = useRouteLocale()
  const title = () => options.title?.[locale.value] ?? tForLocale('title', locale.value)
  const description = () => options.description?.[locale.value] ?? tForLocale('description', locale.value)

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: DEFAULT_OG_IMAGE,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: DEFAULT_OG_IMAGE,
  })

  useHead(() => ({
    link: [
      { rel: 'canonical', href: absoluteLocalizedUrl(locale.value, options.path) },
      ...LOCALES.map(code => ({
        rel: 'alternate',
        hreflang: localeLanguageTags[code],
        href: absoluteLocalizedUrl(code, options.path),
      })),
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: absoluteLocalizedUrl(DEFAULT_LOCALE, options.path),
      },
    ],
  }))
}
