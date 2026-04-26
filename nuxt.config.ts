// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/eslint',
    '@unocss/nuxt',
    '@nuxthub/core',
  ],
  css: ['~/assets/css/main.css'],
  hub: {
    db: 'sqlite',
    blob: true,
  },
  nitro: {
    experimental: {
      tasks: true,
    },
  },
  runtimeConfig: {
    adminToken: '',
  },
})
