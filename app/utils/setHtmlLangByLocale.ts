import { useRouteLocale } from '~/utils/useLocale'

export function setHtmlLangByLocale() {
  const locale = useRouteLocale()
  useHead(() => ({
    htmlAttrs: { lang: locale.value },
  }))
}
