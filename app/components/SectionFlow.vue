<script setup lang="ts">
import { computed } from 'vue'
import { InkTraceCanvas } from '@ink-trace/vue'
import { useInkTraceViewportProgress } from '~/composables/useInkTraceViewportProgress'

type FlowVariant = 'sweep' | 'cluster' | 'split' | 'corner' | 'mark'

const props = defineProps<{
  variant: FlowVariant
  mirror?: boolean
}>()

interface FlowDot {
  cx: number
  cy: number
  r: number
}

interface FlowConfig {
  d: string
  dashArray: string
  opacity: number
  strokeWidth: number
  dots?: FlowDot[]
}

const FLOW_VIEW_BOX = '0 0 1440 320'
const FLOW_PATH_LENGTH = 100
const { target: flowTarget, progress: flowProgress } = useInkTraceViewportProgress({
  duration: 1200,
})

const flowByVariant: Record<FlowVariant, FlowConfig> = {
  sweep: {
    d: 'M-40 300 C 200 280, 460 250, 680 220 C 880 200, 1200 100, 1500 30',
    dashArray: '40 18 42',
    opacity: 0.65,
    strokeWidth: 1.8,
    dots: [{ cx: 1380, cy: 60, r: 3.2 }],
  },
  cluster: {
    d: 'M-20 280 C 240 130, 460 280, 640 200 C 820 110, 1100 290, 1480 160',
    dashArray: '40 18 42',
    opacity: 0.62,
    strokeWidth: 1.7,
  },
  split: {
    d: 'M-40 220 C 280 260, 540 280, 720 280 C 900 280, 1160 220, 1500 60',
    dashArray: '40 18 42',
    opacity: 0.65,
    strokeWidth: 1.9,
  },
  corner: {
    d: 'M40 290 C 200 280, 360 290, 540 270 C 720 250, 1180 100, 1500 -20',
    dashArray: '32 18 50',
    opacity: 0.62,
    strokeWidth: 1.8,
  },
  mark: {
    d: 'M-40 280 C 280 240, 480 280, 700 230 C 920 180, 1180 290, 1500 130',
    dashArray: '40 18 42',
    opacity: 0.62,
    strokeWidth: 1.8,
    dots: [{ cx: 1340, cy: 155, r: 3 }],
  },
}

const flow = computed(() => flowByVariant[props.variant])

const flowPaths = computed(() => [
  {
    d: flow.value.d,
    closed: false,
    dashArray: flow.value.dashArray,
    pathLength: FLOW_PATH_LENGTH,
  },
  ...(flow.value.dots ?? []).map(dot => ({
    d: circlePath(dot),
    fill: true,
  })),
])

const flowSettings = computed(() => ({
  nib: {
    width: flow.value.strokeWidth * 0.7,
  },
  ink: {
    color: '#8a1827',
    alpha: Math.min(0.86, flow.value.opacity + 0.16),
  },
}))

function circlePath(dot: FlowDot) {
  const diameter = dot.r * 2
  return `M ${dot.cx} ${dot.cy} m -${dot.r} 0 a ${dot.r} ${dot.r} 0 1 0 ${diameter} 0 a ${dot.r} ${dot.r} 0 1 0 -${diameter} 0`
}
</script>

<template>
  <div ref="flowTarget" class="flow" :class="[`flow-${variant}`, { 'is-mirror': mirror }]" aria-hidden="true">
    <ClientOnly>
      <InkTraceCanvas
        class="flow-canvas"
        preset="dipPen"
        :settings="flowSettings"
        :paths="flowPaths"
        :width="1440"
        :height="320"
        :view-box="FLOW_VIEW_BOX"
        :progress="flowProgress"
        :draw-labels="false"
        :seed="17"
        role="presentation"
        aria-hidden="true"
        :style="{ width: '100%', height: '100%', display: 'block' }"
      />
    </ClientOnly>
  </div>
</template>

<style scoped>
.flow {
  position: absolute;
  left: 0;
  right: 0;
  top: -140px;
  height: 380px;
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}

.flow-canvas {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.flow.is-mirror .flow-canvas {
  transform: scaleX(-1);
}

@media (max-width: 720px) {
  .flow {
    top: -90px;
    height: 280px;
  }
}
</style>
