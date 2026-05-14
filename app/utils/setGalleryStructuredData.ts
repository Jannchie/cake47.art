import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { tForLocale } from '~/utils/i18n'
import { useRouteLocale, type Locale } from '~/utils/useLocale'

const SITE_URL = 'https://cake47.art'

interface GalleryStructuredDataOptions {
  title?: MaybeRefOrGetter<Record<Locale, string> | undefined>
  description?: MaybeRefOrGetter<Record<Locale, string> | undefined>
  // Relative to the locale root, e.g. "/gallery" or "/gallery/fan-works/vocaloid".
  path?: MaybeRefOrGetter<string | undefined>
}

// JSON-LD for /{locale}/gallery (and its path-based filters). Uses
// CollectionPage + ImageGallery so search engines understand this is a
// curated index of artwork rather than a single document, and BreadcrumbList
// so the gallery shows up under its parent in SERPs. The breadcrumb is
// extended for filtered views so /fan-works/vocaloid produces a 3-level chain.
export function setGalleryStructuredData(options: GalleryStructuredDataOptions = {}) {
  const locale = useRouteLocale()

  useHead(() => {
    const titleMap = toValue(options.title)
    const descriptionMap = toValue(options.description)
    const path = toValue(options.path) ?? '/gallery'

    const title = titleMap?.[locale.value] ?? tForLocale('title', locale.value)
    const description = descriptionMap?.[locale.value] ?? tForLocale('description', locale.value)
    const localeRoot = `${SITE_URL}/${locale.value}`
    const pageUrl = `${localeRoot}${path}`
    const galleryRootUrl = `${localeRoot}/gallery`

    const breadcrumbItems: { '@type': 'ListItem', position: number, name: string, item: string }[] = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: localeRoot },
      { '@type': 'ListItem', position: 2, name: 'Gallery', item: galleryRootUrl },
    ]
    const segments = path.replace(/^\/gallery\/?/, '').split('/').filter(Boolean)
    let acc = galleryRootUrl
    for (let i = 0; i < segments.length; i++) {
      acc += `/${segments[i]}`
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 3 + i,
        name: segments[i]!,
        item: acc,
      })
    }

    const graph = [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#collection`,
        'url': pageUrl,
        'name': title,
        'description': description,
        'inLanguage': locale.value,
        'isPartOf': { '@id': `${SITE_URL}/#website` },
        'about': { '@id': `${SITE_URL}/#person` },
        'mainEntity': { '@id': `${pageUrl}#imagegallery` },
      },
      {
        '@type': 'ImageGallery',
        '@id': `${pageUrl}#imagegallery`,
        'name': title,
        'description': description,
        'inLanguage': locale.value,
        'creator': { '@id': `${SITE_URL}/#person` },
        'isPartOf': { '@id': `${SITE_URL}/#website` },
        'license': `${SITE_URL}/llms.txt`,
        'genre': ['anime illustration', 'character design', 'fan art'],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        'itemListElement': breadcrumbItems,
      },
    ]

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
