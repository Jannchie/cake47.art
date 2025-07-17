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
    class="enhance-hover text-neutral-7 p-2 glassmorphism rounded-full button-hover flex cursor-pointer transform transition-all items-center justify-center md:px-3 md:py-2 md:rounded-xl md:gap-4 md:min-w-48"
  >
    <div class="relative">
      <Icon :name="icon" class="text-lg md:text-2xl" />
      <div class="bg-gradient-to-r rounded-full opacity-0 transition-opacity inset-0 absolute from-blue-500/20 to-purple-500/20 blur-md group-hover:opacity-100" />
    </div>
    <!-- Desktop: Show full text content -->
    <div class="flex-1 hidden md:block">
      <div class="text-sm font-medium">
        {{ props.title }}
      </div>
      <div class="text-xs opacity-75">
        {{ props.description }}
      </div>
    </div>
  </NuxtLink>
</template>
