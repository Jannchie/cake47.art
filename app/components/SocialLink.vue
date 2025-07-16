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
    class="enhance-hover text-neutral-7 glassmorphism button-hover px-3 py-2 rounded-xl flex gap-4 min-w-48 cursor-pointer transform transition-all items-center"
  >
    <div class="relative">
      <Icon :name="icon" class="text-2xl" />
      <div class="bg-gradient-to-r rounded-full opacity-0 transition-opacity inset-0 absolute from-blue-500/20 to-purple-500/20 blur-md group-hover:opacity-100" />
    </div>
    <div class="flex-1">
      <div class="text-sm font-medium">
        {{ props.title }}
      </div>
      <div class="text-xs opacity-75">
        {{ props.description }}
      </div>
    </div>
  </NuxtLink>
</template>
