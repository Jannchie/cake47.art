const locales = ['en', 'zh-CN', 'ja']

export default defineNuxtRouteMiddleware((to) => {
  const { locale } = to.params as { locale: string }
  if (locales.includes(locale))
    return
  // get preferred language from browser
  if (typeof window === 'undefined')
    return
  let preferredLanguage = (typeof navigator !== 'undefined') ? navigator.language : 'en'
  if (preferredLanguage === 'zh-TW' || preferredLanguage === 'zh-HK' || preferredLanguage === 'zh')
    preferredLanguage = 'zh-CN'
  else if (preferredLanguage === 'ja-JP' || preferredLanguage === 'ja')
    preferredLanguage = 'ja'
  if (!locales.includes(preferredLanguage))
    preferredLanguage = 'en'
  return navigateTo(`/${preferredLanguage}${to.path}`)
})
