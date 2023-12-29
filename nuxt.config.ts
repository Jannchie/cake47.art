// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@unocss/nuxt',
    '@nuxtjs/google-fonts',
    '@vueuse/nuxt',
    'nuxt-gtag',
  ],
  googleFonts: {
    prefetch: true,
    preconnect: true,
    preload: true,
    download: true,
    families: {
      'Inter': true,
      'Zen Maru Gothic': true,
      'Noto Sans JP': true,
      'Noto Sans SC': true,
    },
  },
  gtag: {
    id: 'G-HYM1QE9PCP'
  }
})