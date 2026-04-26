import type { Locale } from '~/utils/useLocale'

const LOCALES: Locale[] = ['zh-CN', 'en', 'ja']

function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as string[]).includes(value)
}

export function useLocaleState() {
  const cookie = useCookie<Locale>('locale', { default: () => 'en', watch: true })
  const route = useRoute()
  const queryLang = computed(() => {
    const value = route.query.lang
    if (Array.isArray(value)) {
      return isLocale(value[0]) ? value[0] : null
    }
    return isLocale(value as string | undefined) ? (value as Locale) : null
  })

  const locale = computed<Locale>(() => queryLang.value ?? cookie.value ?? 'en')

  function setLocale(next: Locale) {
    cookie.value = next
    const router = useRouter()
    router.replace({ query: { ...route.query, lang: next } })
  }

  return { locale, setLocale, locales: LOCALES }
}
