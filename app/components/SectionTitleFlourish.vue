<script setup lang="ts">
import { computed } from 'vue'
import { InkTraceCanvas } from '@ink-trace/vue'
import { useInkTraceViewportProgress } from '~/composables/useInkTraceViewportProgress'

type FlourishVariant = 'rise' | 'dip'

const props = withDefaults(defineProps<{
  variant?: FlourishVariant
  color?: string
  alpha?: number
  seed?: number
}>(), {
  variant: 'rise',
  color: '#16181f',
  alpha: 0.62,
  seed: 29,
})

const { target: flourishTarget, progress: flourishProgress } = useInkTraceViewportProgress({
  duration: 700,
})

const flourishPaths = computed(() => [
  {
    d: props.variant === 'dip'
      ? 'M0,10 Q50,25 100,10 T200,10'
      : 'M0,10 Q50,-5 100,10 T200,10',
    closed: false,
  },
])

const flourishSettings = computed(() => ({
  nib: {
    width: 0.82,
  },
  ink: {
    color: props.color,
    alpha: props.alpha,
  },
}))
</script>

<template>
  <span ref="flourishTarget" class="ink-title-flourish" aria-hidden="true">
    <ClientOnly>
      <InkTraceCanvas
        preset="dipPen"
        :settings="flourishSettings"
        :paths="flourishPaths"
        :width="220"
        :height="24"
        view-box="0 0 200 20"
        :progress="flourishProgress"
        :seed="seed"
        aria-hidden="true"
        role="presentation"
        :style="{ width: '100%', height: '100%', display: 'block' }"
      />
    </ClientOnly>
  </span>
</template>

<style scoped>
.ink-title-flourish {
  display: block;
}
</style>
