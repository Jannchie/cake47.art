export function setSeoMetaByLocale() {
  useSeoMeta({
    title: t('title'),
    description: t('description'),
    ogTitle: t('title'),
    ogDescription: t('description'),
    ogImage: '/api/files/gallery/snowcake47/anime-fanart/vocaloid/racing-miku.jpg',
    twitterTitle: t('title'),
    twitterDescription: t('description'),
    twitterImage: '/api/files/gallery/snowcake47/anime-fanart/vocaloid/racing-miku.jpg',
  })
}
