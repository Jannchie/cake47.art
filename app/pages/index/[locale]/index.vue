<script setup lang="ts">
// Import the translation function from utils
import { t } from '~/utils/i18n'

setHtmlLangByLocale()
setSeoMetaByLocale()

const isMobile = computed(() => {
  if (typeof navigator === 'undefined') {
    return false
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})
</script>

<template>
  <div>
    <div class="relative h-100dvh w-full">
      <!-- Language selector with improved mobile design -->
      <div class="absolute right-4 top-4 z-20 flex gap-3 text-neutral-7 md:right-8 md:top-8">
        <NuxtLink
          href="/zh-CN"
          class="rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
        >
          中文
        </NuxtLink>
        <NuxtLink
          href="/en"
          class="rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
        >
          English
        </NuxtLink>
        <NuxtLink
          href="/ja"
          class="rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
        >
          日本語
        </NuxtLink>
      </div>

      <!-- Social links with improved mobile support -->
      <ClientOnly>
        <div class="absolute bottom-4 left-1/2 z-20 flex flex-col transform gap-2 font-[Intel] lg:bottom-8 lg:left-8 -translate-x-1/2 lg:translate-x-0">
          <div v-if="isMobile" class="mb-2 flex gap-2">
            <a
              href="https://x.com/snowcake47"
              target="_blank"
              class="rounded-full bg-white/10 p-2 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
            >
              <Icon name="ri:twitter-x-line" class="text-xl text-neutral-7" />
            </a>
            <a
              href="https://www.pixiv.net/users/3626004"
              target="_blank"
              class="rounded-full bg-white/10 p-2 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
            >
              <Icon name="simple-icons:pixiv" class="text-xl text-neutral-7" />
            </a>
            <a
              href="https://weibo.com/2861524284"
              target="_blank"
              class="rounded-full bg-white/10 p-2 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
            >
              <Icon name="simple-icons:sinaweibo" class="text-xl text-neutral-7" />
            </a>
          </div>

          <div v-else class="flex gap-2">
            <SocialLink
              :title="t('x')" icon="ri:twitter-x-line" href="https://x.com/snowcake47"
              description="@snowcake47"
            />
            <SocialLink
              title="Pixiv" icon="simple-icons:pixiv" href="https://www.pixiv.net/users/3626004"
              description="3626004"
            />
            <SocialLink
              :title="t('weibo')" icon="simple-icons:sinaweibo" href="https://weibo.com/2861524284"
              description="2861524284"
            />
          </div>
        </div>
      </ClientOnly>

      <!-- Main title with improved typography and responsive positioning -->
      <div class="absolute bottom-20 left-1/2 z-20 w-max transform text-center text-neutral-7 lg:bottom-8 lg:right-8 md:w-auto -translate-x-1/2 lg:translate-x-0 lg:text-right">
        <div class="mb-2 text-4xl font-black leading-none lg:text-7xl xl:text-9xl">
          cake47.art
        </div>
        <div class="text-xl leading-none lg:text-2xl md:text-xl xl:text-5xl">
          {{ t("title") }}
        </div>
      </div>

      <!-- Decorative gradient overlay -->
      <div class="pointer-events-none absolute inset-0 z-10 from-transparent via-transparent to-black/5 bg-gradient-to-br" />
    </div>
  </div>
</template>
