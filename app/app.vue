<script setup>
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'

useSeoMeta({
  ogImage: '',
  ogUrl: 'https://cake47.art',
  twitterImage: '',
  twitterCard: 'summary_large_image',
})

useHead({
  htmlAttrs: {
    lang: 'zh-CN',
  },
  meta: [
    {
      name: 'color-scheme',
      content: 'only light',
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
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
