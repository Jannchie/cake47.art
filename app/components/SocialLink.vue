<script setup lang="ts">
const props = defineProps<{
  href: string
  title: string
  description: string
  icon: string
  target?: string
}>()

let target = props.target
if (!target) {
  target = '_blank'
}
</script>

<template>
  <NuxtLink
    :href="href"
    :target="target"
    class="enhance-hover flex button-hover transform cursor-pointer items-center justify-center glassmorphism rounded-full p-2 text-neutral-7 transition-all md:min-w-48 md:gap-4 md:rounded-xl md:px-3 md:py-2"
  >
    <div class="relative">
      <Icon :name="icon" class="text-lg md:text-2xl" />
      <div class="absolute inset-0 rounded-full from-blue-500/20 to-purple-500/20 bg-gradient-to-r opacity-0 blur-md transition-opacity group-hover:opacity-100" />
    </div>
    <!-- Desktop: Show full text content -->
    <div class="hidden flex-1 md:block">
      <div class="text-sm font-medium">
        {{ props.title }}
      </div>
      <div class="text-xs opacity-75">
        {{ props.description }}
      </div>
    </div>
  </NuxtLink>
</template>
