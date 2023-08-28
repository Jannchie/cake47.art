<script setup lang="ts">
setHtmlLangByLocale()
setSeoMetaByLocale()

const isMobile = computed(() => {
  if (typeof navigator === 'undefined')
    return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})
</script>

<template>
  <div class="w-full h-full">
    <div class="absolute top-8 right-8 gap-4 flex text-neutral-7">
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
      <div v-if="!isMobile" class="absolute bottom-8 left-8 flex gap-2 font-[Intel]">
        <SocialLink
          :title="t('twitter')"
          icon="i-ri-twitter-x-line"
          href="https://twitter.com/snowcake47"
          description="@snowcake47"
        />
        <SocialLink
          title="Pixiv"
          icon="i-simple-icons-pixiv"
          href="https://www.pixiv.net/users/3626004"
          description="3626004"
        />
        <SocialLink
          :title="t('weibo')"
          icon="i-simple-icons-sinaweibo"
          href="https://weibo.com/2861524284"
          description="2861524284"
        />
      </div>
    </ClientOnly>
    <h1 class="absolute right-8 bottom-8 text-neutral-7 text-right">
      <div class="md:text-9xl font-black">
        cake47.art
      </div>
      <div class="md:text-7xl">
        {{ t("title") }}
      </div>
    </h1>
  </div>
</template>
