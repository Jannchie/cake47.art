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
    <div class="h-100dvh w-full relative">
      <!-- Language selector with improved mobile design -->
      <div class="text-neutral-7 flex gap-3 right-4 top-4 absolute z-20 md:right-8 md:top-8">
        <NuxtLink
          href="/zh-CN"
          class="text-sm font-medium px-3 py-1 rounded-full bg-white/10 transition-all duration-300 backdrop-blur-sm hover:bg-white/20"
        >
          中文
        </NuxtLink>
        <NuxtLink
          href="/en"
          class="text-sm font-medium px-3 py-1 rounded-full bg-white/10 transition-all duration-300 backdrop-blur-sm hover:bg-white/20"
        >
          English
        </NuxtLink>
        <NuxtLink
          href="/ja"
          class="text-sm font-medium px-3 py-1 rounded-full bg-white/10 transition-all duration-300 backdrop-blur-sm hover:bg-white/20"
        >
          日本語
        </NuxtLink>
      </div>

      <!-- Social links with improved mobile support -->
      <ClientOnly>
        <div class="font-[Intel] flex flex-col gap-2 transform bottom-4 left-1/2 absolute z-20 -translate-x-1/2 lg:translate-x-0 lg:bottom-8 lg:left-8">
          <div v-if="isMobile" class="mb-2 flex gap-2">
            <a
              href="https://x.com/snowcake47"
              target="_blank"
              class="p-2 rounded-full bg-white/10 transition-all duration-300 backdrop-blur-sm hover:bg-white/20"
            >
              <Icon name="ri:twitter-x-line" class="text-neutral-7 text-xl" />
            </a>
            <a
              href="https://www.pixiv.net/users/3626004"
              target="_blank"
              class="p-2 rounded-full bg-white/10 transition-all duration-300 backdrop-blur-sm hover:bg-white/20"
            >
              <Icon name="simple-icons:pixiv" class="text-neutral-7 text-xl" />
            </a>
            <a
              href="https://weibo.com/2861524284"
              target="_blank"
              class="p-2 rounded-full bg-white/10 transition-all duration-300 backdrop-blur-sm hover:bg-white/20"
            >
              <Icon name="simple-icons:sinaweibo" class="text-neutral-7 text-xl" />
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
      <div class="text-neutral-7 text-center w-max transform bottom-20 left-1/2 absolute z-20 lg:text-right md:w-auto -translate-x-1/2 lg:translate-x-0 lg:bottom-8 lg:right-8">
        <div class="text-4xl leading-none font-black mb-2 lg:text-7xl xl:text-9xl">
          cake47.art
        </div>
        <div class="text-xl leading-none lg:text-2xl md:text-xl xl:text-5xl">
          {{ t("title") }}
        </div>
      </div>

      <!-- Decorative gradient overlay -->
      <div class="bg-gradient-to-br pointer-events-none inset-0 absolute z-10 from-transparent to-black/5 via-transparent" />
    </div>
  </div>
</template>
