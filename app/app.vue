<script setup>
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'

const SITE_URL = 'https://cake47.art'
const DEFAULT_OG_IMAGE = `${SITE_URL}/api/files/gallery/snowcake47/anime-fanart/vocaloid/racing-miku.jpg`

useSeoMeta({
  ogType: 'website',
  ogSiteName: 'cake47.art',
  ogUrl: SITE_URL,
  ogImage: DEFAULT_OG_IMAGE,
  twitterCard: 'summary_large_image',
  twitterSite: '@snowcake47',
  twitterCreator: '@snowcake47',
  twitterImage: DEFAULT_OG_IMAGE,
  author: 'snowcake47 / 私期 / Shiki',
  applicationName: 'cake47.art',
  themeColor: '#f8f7f7',
})

useHead({
  htmlAttrs: {
    lang: 'en',
  },
  meta: [
    { name: 'color-scheme', content: 'only light' },
    { name: 'format-detection', content: 'telephone=no' },
    // Per-page setSeoMetaByLocale() emits canonical + hreflang. The defaults here
    // are intentionally conservative so unconfigured pages still expose minimum metadata.
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'shortcut icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/api/files/brand/avatar.jpg' },
    // Profile-style "rel=me" links so social verifiers can attest identity.
    { rel: 'me', href: 'https://x.com/snowcake47' },
    { rel: 'me', href: 'https://bsky.app/profile/snowcake47.bsky.social' },
  ],
})
</script>

<template>
  <NuxtPage />
</template>

<style>
:root,
html,
body {
  color-scheme: light only;
}

[lang="en"],
[lang="ja"] {
  font-family: 'Shippori Mincho', 'Noto Serif JP', 'Noto Sans JP', 'Inter', serif;
}

[lang="zh-CN"] {
  --font-display: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', SimSun, 'Shippori Mincho', serif;
  --font-body: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', SimSun, 'Shippori Mincho', serif;
  font-family: var(--font-body);
}
</style>
