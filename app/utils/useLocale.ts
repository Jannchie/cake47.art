export type Locale = 'zh-CN' | 'en' | 'ja'
export function useLocale(): Locale {
  const locale = useRoute().params.locale
  if (!locale) {
    return 'en'
  }
  return typeof locale === 'string' ? locale as Locale : locale[0] as Locale
}
