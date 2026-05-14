import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { tForLocale } from '~/utils/i18n'
import { DEFAULT_LOCALE, LOCALES, localeLanguageTags, localizedPath, useRouteLocale, type Locale } from '~/utils/useLocale'

const SITE_URL = 'https://cake47.art'
const DEFAULT_OG_IMAGE = `${SITE_URL}/api/files/gallery/snowcake47/anime-fanart/vocaloid/racing-miku.jpg`

const ogLocaleTags: Record<Locale, string> = {
  'zh-CN': 'zh_CN',
  'en': 'en_US',
  'ja': 'ja_JP',
}

type OgType = 'website' | 'article' | 'book' | 'profile'

interface LocaleSeoOptions {
  // All inputs accept refs / getters so that path-based routes can recompute
  // canonical + hreflang + og when the active filter changes.
  path?: MaybeRefOrGetter<string | undefined>
  title?: MaybeRefOrGetter<Record<Locale, string> | undefined>
  description?: MaybeRefOrGetter<Record<Locale, string> | undefined>
  image?: MaybeRefOrGetter<string | undefined>
  ogType?: OgType
  // When false / resolves to false, suppresses the
  // <link rel="alternate" type="text/markdown"> hint because the URL has no
  // .md representation. Accepts a getter so route-aware pages (e.g. gallery
  // with filters) can flip it per-path.
  markdownAlternate?: MaybeRefOrGetter<boolean | undefined>
}

function absoluteLocalizedUrl(locale: Locale, path = '') {
  return `${SITE_URL}${localizedPath(locale, path)}`
}

function toAbsolute(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export function setSeoMetaByLocale(options: LocaleSeoOptions = {}) {
  const locale = useRouteLocale()
  const titles = () => toValue(options.title)
  const descriptions = () => toValue(options.description)
  const path = () => toValue(options.path) ?? ''
  const imageUrl = () => toAbsolute(toValue(options.image) ?? DEFAULT_OG_IMAGE)

  const title = () => titles()?.[locale.value] ?? tForLocale('title', locale.value)
  const description = () => descriptions()?.[locale.value] ?? tForLocale('description', locale.value)
  const ogType = options.ogType ?? 'website'
  const resolveMarkdownAlternate = () => toValue(options.markdownAlternate) ?? true

  useSeoMeta({
    title,
    description,
    ogType,
    ogSiteName: 'cake47.art',
    ogTitle: title,
    ogDescription: description,
    ogImage: imageUrl,
    ogImageAlt: () => `${tForLocale('title', locale.value)} — snowcake47 / 私期`,
    ogUrl: () => absoluteLocalizedUrl(locale.value, path()),
    ogLocale: () => ogLocaleTags[locale.value],
    ogLocaleAlternate: () => LOCALES.filter(code => code !== locale.value).map(code => ogLocaleTags[code]),
    twitterCard: 'summary_large_image',
    twitterSite: '@snowcake47',
    twitterCreator: '@snowcake47',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imageUrl,
    twitterImageAlt: () => `${tForLocale('title', locale.value)} — snowcake47 / 私期`,
  })

  useHead(() => {
    const currentPath = path()
    const links: { rel: string, hreflang?: string, type?: string, href: string }[] = [
      { rel: 'canonical', href: absoluteLocalizedUrl(locale.value, currentPath) },
      ...LOCALES.map(code => ({
        rel: 'alternate',
        hreflang: localeLanguageTags[code],
        href: absoluteLocalizedUrl(code, currentPath),
      })),
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: absoluteLocalizedUrl(DEFAULT_LOCALE, currentPath),
      },
    ]
    if (resolveMarkdownAlternate()) {
      // Crawlers / agent-readiness auditors that probe <link rel="alternate">
      // discover the Markdown representation here without needing to send
      // Accept: text/markdown.
      links.push({
        rel: 'alternate',
        type: 'text/markdown',
        href: `${absoluteLocalizedUrl(locale.value, currentPath)}.md`,
      })
    }
    return { link: links }
  })
}
