import { DEFAULT_LOCALE, LOCALES, normalizeLocale, type Locale } from '~/utils/useLocale'

function readQueryLocale(value: unknown): Locale | null {
  return normalizeLocale(Array.isArray(value) ? value[0] : value)
}

export function useLocaleState() {
  const cookie = useCookie<Locale>('locale', { default: () => DEFAULT_LOCALE, watch: true })
  const route = useRoute()
  const routeLocale = computed(() => readQueryLocale(route.params.locale))
  const queryLang = computed(() => readQueryLocale(route.query.lang))

  const locale = computed<Locale>(() => routeLocale.value ?? queryLang.value ?? normalizeLocale(cookie.value) ?? DEFAULT_LOCALE)

  watch(locale, (next) => {
    cookie.value = next
  }, { immediate: true })

  function setLocale(next: Locale) {
    cookie.value = next
    const router = useRouter()
    if (routeLocale.value) {
      const segments = route.path.split('/')
      segments[1] = next
      const query = { ...route.query }
      delete query.lang
      router.replace({ path: segments.join('/'), query, hash: route.hash })
      return
    }
    router.replace({ query: { ...route.query, lang: next } })
  }

  return { locale, setLocale, locales: LOCALES }
}
