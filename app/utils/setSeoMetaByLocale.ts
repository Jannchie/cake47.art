import { tForLocale } from '~/utils/i18n'
import { DEFAULT_LOCALE, LOCALES, localeLanguageTags, localizedPath, useRouteLocale, type Locale } from '~/utils/useLocale'

const SITE_URL = 'https://cake47.art'
const DEFAULT_OG_IMAGE = `${SITE_URL}/api/files/gallery/snowcake47/anime-fanart/vocaloid/racing-miku.jpg`

const ogLocaleTags: Record<Locale, string> = {
  'zh-CN': 'zh_CN',
  'en': 'en_US',
  'ja': 'ja_JP',
}

const KEYWORDS_BY_LOCALE: Record<Locale, string> = {
  'zh-CN': 'snowcake47, 私期, cake47, 插画师, 插画作品集, 同人, 原创角色, 商单, 委托, Vocaloid',
  'en': 'snowcake47, Shiki, cake47, illustrator, illustration portfolio, anime, fan art, original character, commission, Vocaloid',
  'ja': 'snowcake47, 私期, cake47, イラストレーター, ポートフォリオ, ファンアート, オリジナルキャラクター, 商業, 依頼, ボカロ',
}

type OgType = 'website' | 'article' | 'book' | 'profile'

interface LocaleSeoOptions {
  path?: string
  title?: Record<Locale, string>
  description?: Record<Locale, string>
  image?: string
  ogType?: OgType
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
  const title = () => options.title?.[locale.value] ?? tForLocale('title', locale.value)
  const description = () => options.description?.[locale.value] ?? tForLocale('description', locale.value)
  const image = toAbsolute(options.image ?? DEFAULT_OG_IMAGE)
  const ogType = options.ogType ?? 'website'

  useSeoMeta({
    title,
    description,
    keywords: () => KEYWORDS_BY_LOCALE[locale.value],
    ogType,
    ogSiteName: 'cake47.art',
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    ogImageAlt: () => `${tForLocale('title', locale.value)} — snowcake47 / 私期`,
    ogUrl: () => absoluteLocalizedUrl(locale.value, options.path),
    ogLocale: () => ogLocaleTags[locale.value],
    ogLocaleAlternate: () => LOCALES.filter(code => code !== locale.value).map(code => ogLocaleTags[code]),
    twitterCard: 'summary_large_image',
    twitterSite: '@snowcake47',
    twitterCreator: '@snowcake47',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    twitterImageAlt: () => `${tForLocale('title', locale.value)} — snowcake47 / 私期`,
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
      // Markdown alternate so agent-readability auditors (and crawlers that
      // probe <link rel="alternate">) discover the Markdown representation
      // without needing to send Accept: text/markdown.
      {
        rel: 'alternate',
        type: 'text/markdown',
        href: `${absoluteLocalizedUrl(locale.value, options.path)}.md`,
      },
    ],
  }))
}
