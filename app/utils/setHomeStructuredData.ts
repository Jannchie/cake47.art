import { tForLocale } from '~/utils/i18n'
import { useRouteLocale } from '~/utils/useLocale'

const SITE_URL = 'https://cake47.art'

const SAME_AS = [
  'https://x.com/snowcake47',
  'https://bsky.app/profile/snowcake47.bsky.social',
  'https://weibo.com/2861524284',
  'https://www.mihuashi.com/profiles/2397',
  'https://www.rednote.com/user/profile/629e56300000000021029847',
] as const

// Schema.org JSON-LD graph for the home page. Combines:
//   - Person: the illustrator (snowcake47 / 私期)
//   - WebSite: the cake47.art domain (with SearchAction pointing at /gallery)
//   - WebPage: the current localised landing page
//   - BreadcrumbList: home → gallery
//   - SpeakableSpecification: which CSS selectors are safe for TTS readout
//   - FAQPage: a short FAQ that helps agents answer common questions
//   - Service: commission service entry covering the commercial-commission category
export function setHomeStructuredData() {
  const locale = useRouteLocale()

  useHead(() => {
    const description = tForLocale('description', locale.value)
    const title = tForLocale('title', locale.value)
    const localePath = `${SITE_URL}/${locale.value}`

    const graph = [
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        'name': 'snowcake47',
        'alternateName': ['私期', 'Shiki', 'cake47'],
        'description': description,
        'url': SITE_URL,
        'image': `${SITE_URL}/api/files/brand/avatar.jpg`,
        'jobTitle': 'Illustrator',
        'sameAs': [...SAME_AS],
        'worksFor': { '@id': `${SITE_URL}/#org` },
        'knowsAbout': [
          'Anime illustration',
          'Character design',
          'Fan art',
          'Vocaloid illustration',
          'Original character design',
          'Commission illustration',
        ],
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#org`,
        'name': 'snowcake47 Illustration',
        'alternateName': ['私期の画室', 'cake47.art'],
        'url': SITE_URL,
        'logo': `${SITE_URL}/api/files/brand/avatar.jpg`,
        'image': `${SITE_URL}/api/files/brand/avatar.jpg`,
        'description': description,
        'founder': { '@id': `${SITE_URL}/#person` },
        'sameAs': [...SAME_AS],
        'address': {
          '@type': 'PostalAddress',
          'addressCountry': 'JP',
        },
        'contactPoint': [
          {
            '@type': 'ContactPoint',
            'contactType': 'commissions',
            'url': 'https://www.mihuashi.com/profiles/2397',
            'availableLanguage': ['zh-CN', 'en', 'ja'],
          },
          {
            '@type': 'ContactPoint',
            'contactType': 'general',
            'url': 'https://x.com/snowcake47',
            'availableLanguage': ['en', 'ja', 'zh-CN'],
          },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        'url': SITE_URL,
        'name': 'cake47.art',
        'alternateName': ['snowcake47 portfolio', '私期の画室', 'snowcake47 Illustration'],
        'description': description,
        'inLanguage': ['en', 'zh-CN', 'ja'],
        'publisher': { '@id': `${SITE_URL}/#person` },
        'sameAs': [...SAME_AS],
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': `${SITE_URL}/${locale.value}/gallery?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${localePath}#webpage`,
        'url': localePath,
        'name': title,
        'description': description,
        'inLanguage': locale.value,
        'isPartOf': { '@id': `${SITE_URL}/#website` },
        'about': { '@id': `${SITE_URL}/#person` },
        'primaryImageOfPage': `${SITE_URL}/api/files/brand/avatar.jpg`,
        'speakable': {
          '@type': 'SpeakableSpecification',
          'cssSelector': ['h1', '.profile-bio', '[data-speakable]'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${localePath}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': localePath,
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Gallery',
            'item': `${localePath}/gallery`,
          },
        ],
      },
      {
        '@type': 'CreativeWork',
        '@id': `${SITE_URL}/#portfolio`,
        'name': title,
        'creator': { '@id': `${SITE_URL}/#person` },
        'inLanguage': ['en', 'zh-CN', 'ja'],
        'genre': ['anime illustration', 'character design', 'fan art'],
        'about': [
          { '@type': 'Thing', 'name': 'Fan works' },
          { '@type': 'Thing', 'name': 'Original characters' },
          { '@type': 'Thing', 'name': 'Commercial / commission' },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${SITE_URL}/#commission-service`,
        'serviceType': 'Illustration commission',
        'provider': { '@id': `${SITE_URL}/#person` },
        'areaServed': 'Global',
        'availableChannel': [
          {
            '@type': 'ServiceChannel',
            'name': '米画师',
            'serviceUrl': 'https://www.mihuashi.com/profiles/2397',
          },
          {
            '@type': 'ServiceChannel',
            'name': 'X / Twitter DM',
            'serviceUrl': 'https://x.com/snowcake47',
          },
        ],
        'description': 'Anime-style illustration commissions: character art, fan art, original character design.',
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Who is snowcake47?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'snowcake47 (also written 私期 / Shiki) is an illustrator. cake47.art is their official portfolio site, featuring fan works, original characters, and commercial commission samples.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does snowcake47 take commissions?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Commission requests go through 米画师 (id 2397) or X DMs (@snowcake47).',
            },
          },
          {
            '@type': 'Question',
            'name': 'Where can I see snowcake47\'s artwork?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'On cake47.art under /gallery, organised by category (fan works, original characters, commercial / commission) and series.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is cake47.art related to the band Cake or to a bakery?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. cake47.art is the personal portfolio of illustrator snowcake47 / 私期. It is unrelated to the band Cake or to any bakery business.',
            },
          },
        ],
      },
    ]

    return {
      script: [
        {
          type: 'application/ld+json',
          // h3 / unhead serialises objects automatically, but we explicitly
          // hand it a JSON string to avoid surprises with reactivity.
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': graph,
          }),
        },
      ],
    }
  })
}
