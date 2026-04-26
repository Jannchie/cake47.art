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
[lang="en"],
[lang="ja"] {
  font-family: 'Shippori Mincho', 'Noto Serif JP', 'Noto Sans JP', 'Inter', serif;
}

[lang="zh-CN"] {
  font-family: 'Shippori Mincho', 'Noto Serif SC', 'Noto Sans SC', 'Inter', serif;
}
</style>
