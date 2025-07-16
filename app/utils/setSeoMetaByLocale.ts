export function setSeoMetaByLocale() {
  useSeoMeta({
    title: t('title'),
    description: t('description'),
    ogTitle: t('title'),
    ogDescription: t('description'),
    twitterTitle: t('title'),
    twitterDescription: t('description'),
  })
}
