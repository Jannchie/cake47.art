import { tForLocale } from '~/utils/i18n'
import { useRouteLocale, type Locale } from '~/utils/useLocale'

const SITE_URL = 'https://cake47.art'

interface GalleryStructuredDataOptions {
  title?: Record<Locale, string>
  description?: Record<Locale, string>
}

// JSON-LD for /{locale}/gallery. Uses CollectionPage + ImageGallery so search
// engines understand this is a curated index of artwork rather than a single
// document, and BreadcrumbList so the gallery shows up under its parent in SERPs.
export function setGalleryStructuredData(options: GalleryStructuredDataOptions = {}) {
  const locale = useRouteLocale()

  useHead(() => {
    const title = options.title?.[locale.value] ?? tForLocale('title', locale.value)
    const description = options.description?.[locale.value] ?? tForLocale('description', locale.value)
    const localeRoot = `${SITE_URL}/${locale.value}`
    const galleryUrl = `${localeRoot}/gallery`

    const graph = [
      {
        '@type': 'CollectionPage',
        '@id': `${galleryUrl}#collection`,
        'url': galleryUrl,
        'name': title,
        'description': description,
        'inLanguage': locale.value,
        'isPartOf': { '@id': `${SITE_URL}/#website` },
        'about': { '@id': `${SITE_URL}/#person` },
        'mainEntity': { '@id': `${galleryUrl}#imagegallery` },
      },
      {
        '@type': 'ImageGallery',
        '@id': `${galleryUrl}#imagegallery`,
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
        '@id': `${galleryUrl}#breadcrumb`,
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': localeRoot },
          { '@type': 'ListItem', 'position': 2, 'name': 'Gallery', 'item': galleryUrl },
        ],
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
