<script setup lang="ts">
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
  <div class="h-full w-full">
    <div class="text-neutral-7 flex gap-4 right-8 top-8 absolute">
      <NuxtLink href="/zh-CN">
        中文
      </NuxtLink>
      <NuxtLink href="/en">
        English
      </NuxtLink>
      <NuxtLink href="/ja">
        日本語
      </NuxtLink>
    </div>
    <ClientOnly>
      <div v-if="!isMobile" class="font-[Intel] flex gap-2 bottom-8 left-8 absolute">
        <SocialLink
          :title="t('twitter')" icon="ri:twitter-x-line" href="https://twitter.com/snowcake47"
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
    </ClientOnly>
    <h1 class="text-neutral-7 text-right bottom-8 right-8 absolute">
      <div class="font-black md:text-9xl">
        cake47.art
      </div>
      <div class="md:text-7xl">
        {{ t("title") }}
      </div>
    </h1>
  </div>
</template>
