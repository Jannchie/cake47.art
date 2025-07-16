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
[lang="en"] {
  font-family: 'Zen Maru Gothic', 'Noto Sans JP', 'Inter', sans-serif;
}

[lang="ja"]  {
  font-family: 'Zen Maru Gothic', 'Noto Sans JP', 'Inter', sans-serif;
}

[lang="zh-CN"] {
  font-family: 'Zen Maru Gothic', 'Noto Sans SC', 'Inter', sans-serif;
}
</style>
