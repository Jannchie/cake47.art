export function setHtmlLangByLocale() {
  const locale = useLocale()
  useHead({
    htmlAttrs: { lang: locale },
  })
}
