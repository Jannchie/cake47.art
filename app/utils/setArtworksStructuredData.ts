import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useRouteLocale, type Locale } from '~/utils/useLocale'

const SITE_URL = 'https://cake47.art'

interface ArtworkInput {
  id: string
  url: string
  width: number
  height: number
  titleZh: string
  titleEn: string
  titleJa: string
  descriptionZh: string
  descriptionEn: string
  descriptionJa: string
  seriesSlug: string
  seriesNameZh: string
  seriesNameEn: string
  seriesNameJa: string
  categoryId: string
  createdAt: number | string | Date
}

function pickLocalized(locale: Locale, zh: string, en: string, ja: string): string {
  if (locale === 'zh-CN') {
    return zh || en || ja
  }
  if (locale === 'ja') {
    return ja || en || zh
  }
  return en || ja || zh
}

function absoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

function toIso(value: number | string | Date | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }
  const d = value instanceof Date ? value : new Date(typeof value === 'string' ? value : Number(value))
  if (Number.isNaN(d.getTime())) {
    return undefined
  }
  return d.toISOString()
}

// JSON-LD VisualArtwork + ImageObject graph for an artwork list. Emit at most
// 50 entries so Googlebot doesn't time out, and dedupe by artwork id. Each
// artwork gets a stable @id (`{SITE_URL}/#artwork/{id}`) so other graphs (the
// home/profile page) can reference it later. Use this alongside
// setGalleryStructuredData() — the latter emits the collection/breadcrumb
// envelope; this one emits the items.
export function setArtworksStructuredData(items: MaybeRefOrGetter<ArtworkInput[] | undefined>) {
  const locale = useRouteLocale()

  useHead(() => {
    const list = toValue(items) ?? []
    if (list.length === 0) {
      return {}
    }

    const sliced = list.slice(0, 50)
    const graph = sliced.flatMap((a) => {
      const name = pickLocalized(locale.value, a.titleZh, a.titleEn, a.titleJa)
        || pickLocalized(locale.value, a.seriesNameZh, a.seriesNameEn, a.seriesNameJa)
      const description = pickLocalized(locale.value, a.descriptionZh, a.descriptionEn, a.descriptionJa)
      const seriesName = pickLocalized(locale.value, a.seriesNameZh, a.seriesNameEn, a.seriesNameJa)
      const contentUrl = absoluteUrl(a.url)
      const artworkId = `${SITE_URL}/#artwork/${a.id}`
      const created = toIso(a.createdAt)

      return [
        {
          '@type': 'VisualArtwork',
          '@id': artworkId,
          'name': name,
          'description': description || undefined,
          'creator': { '@id': `${SITE_URL}/#person` },
          'copyrightHolder': { '@id': `${SITE_URL}/#person` },
          'artform': 'Illustration',
          'artMedium': 'Digital',
          'artworkSurface': 'Digital canvas',
          'width': a.width ? { '@type': 'QuantitativeValue', value: a.width, unitCode: 'E37' } : undefined,
          'height': a.height ? { '@type': 'QuantitativeValue', value: a.height, unitCode: 'E37' } : undefined,
          'image': { '@id': `${artworkId}/image` },
          'inLanguage': locale.value,
          'isPartOf': seriesName ? { '@type': 'CreativeWorkSeries', name: seriesName } : undefined,
          'genre': a.categoryId,
          'dateCreated': created,
          'datePublished': created,
        },
        {
          '@type': 'ImageObject',
          '@id': `${artworkId}/image`,
          'contentUrl': contentUrl,
          'url': contentUrl,
          'caption': name,
          'description': description || undefined,
          'width': a.width || undefined,
          'height': a.height || undefined,
          'creator': { '@id': `${SITE_URL}/#person` },
          'creditText': 'snowcake47 / 私期',
          'copyrightNotice': 'All rights reserved. Re-distribution requires permission.',
          'license': `${SITE_URL}/llms.txt`,
          'acquireLicensePage': 'https://x.com/snowcake47',
          'representativeOfPage': false,
          'inLanguage': locale.value,
        },
      ]
    })

    return {
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
        },
      ],
    }
  })
}
