<script setup>
import '@unocss/reset/tailwind.css'

useSeoMeta({
  title: '私期的画室',
  description: '欢迎来到私期的画室。',
  ogTitle: '私期的画室',
  ogDescription: '欢迎来到私期的画室。',
  ogImage: '',
  ogUrl: 'https://cake47.art',
  twitterTitle: '私期的画室',
  twitterDescription: '欢迎来到私期的画室。',
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
      type: 'image/png',
      href: '/favicon.png',
    },
  ],
})
</script>

<template>
  <div class="w-[100vw] h-[100vh] relative bg-neutral-2">
    <ThreeScene />
    <h1 class="absolute right-8 bottom-8 text-neutral-7">
      <div class="md:text-9xl font-black">
        cake47.art
      </div>
      <div class="md:text-7xl md:px-1">
        私期的画室。
      </div>
    </h1>
  </div>
  <NuxtPage />
</template>

<style>
:root {
  font-family: 'Zen Maru Gothic', Inter;
}
</style>
