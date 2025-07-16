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
    class="text-neutral-7 hover:bg-neutral-7/10 px-2 py-1 rounded flex gap-4 min-w-48 cursor-pointer transition-all items-center"
  >
    <Icon :name="icon" class="text-2xl" />
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
