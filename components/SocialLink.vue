<script setup lang="ts">
const props = defineProps<{
  href: string
  title: string
  description: string
  icon: string
  target?: string
}>()

let target = props.target
if (!target)
  target = '_blank'
</script>

<template>
  <NuxtLink
    :href="href"
    :target="target"
    class="min-w-48 flex gap-4 items-center hover:bg-neutral-7/10 transition-all px-2 py-1 rounded cursor-pointer text-neutral-7"
  >
    <i class="text-2xl" :class="icon" />
    <div>
      <div>
        {{ props.title }}
      </div>
      <div class="text-xs">
        {{ props.description }}
      </div>
    </div>
  </NuxtLink>
</template>
