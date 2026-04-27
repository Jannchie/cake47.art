<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
  paths: readonly string[]
  mobilePaths: readonly string[]
  dashArray: string
  opacity: number
  strokeWidth: number
  dots?: FlowDot[]
}

const FLOW_VIEW_BOX = '0 0 1440 320'
const FLOW_PATH_LENGTH = 100
const isMobileFlow = ref(false)
const { target: flowTarget, progress: flowProgress } = useInkTraceViewportProgress({
  duration: 1200,
})

let mobileMedia: MediaQueryList | undefined

function updateMobileFlow() {
  isMobileFlow.value = !!mobileMedia?.matches
}

onMounted(() => {
  mobileMedia = window.matchMedia('(max-width: 720px)')
  updateMobileFlow()
  mobileMedia.addEventListener('change', updateMobileFlow)
})

onBeforeUnmount(() => {
  mobileMedia?.removeEventListener('change', updateMobileFlow)
})

const flowByVariant: Record<FlowVariant, FlowConfig> = {
  sweep: {
    paths: [
      'M-40 300 C 200 280, 460 250, 680 220 C 880 200, 1200 100, 1500 30',
    ],
    mobilePaths: [
      'M-40 284 C 48 282, 136 278, 216 272',
      'M1224 140 C 1308 132, 1392 124, 1500 112',
    ],
    dashArray: '40 18 42',
    opacity: 0.65,
    strokeWidth: 1.8,
    dots: [{ cx: 1380, cy: 60, r: 3.2 }],
  },
  cluster: {
    paths: [
      'M-20 280 C 240 130, 460 280, 640 200 C 820 110, 1100 290, 1480 160',
    ],
    mobilePaths: [
      'M-20 240 C 60 226, 142 236, 216 226',
      'M1224 198 C 1304 190, 1386 204, 1480 190',
    ],
    dashArray: '40 18 42',
    opacity: 0.62,
    strokeWidth: 1.7,
  },
  split: {
    paths: [
      'M-40 220 C 280 260, 540 280, 720 280 C 900 280, 1160 220, 1500 60',
    ],
    mobilePaths: [
      'M-40 226 C 56 232, 140 236, 216 236',
      'M1224 224 C 1310 216, 1400 198, 1500 174',
    ],
    dashArray: '40 18 42',
    opacity: 0.65,
    strokeWidth: 1.9,
  },
  corner: {
    paths: [
      'M40 290 C 200 280, 360 290, 540 270 C 720 250, 1180 100, 1500 -20',
    ],
    mobilePaths: [
      'M40 286 C 92 284, 156 284, 216 280',
      'M1224 154 C 1314 142, 1404 130, 1500 116',
    ],
    dashArray: '32 18 50',
    opacity: 0.62,
    strokeWidth: 1.8,
  },
  mark: {
    paths: [
      'M-40 280 C 280 240, 480 280, 700 230 C 920 180, 1180 290, 1500 130',
    ],
    mobilePaths: [
      'M-40 270 C 56 264, 140 266, 216 260',
      'M1224 198 C 1310 200, 1400 190, 1500 172',
    ],
    dashArray: '40 18 42',
    opacity: 0.62,
    strokeWidth: 1.8,
    dots: [{ cx: 1340, cy: 155, r: 3 }],
  },
}

const flow = computed(() => flowByVariant[props.variant])
const activePaths = computed(() => isMobileFlow.value ? flow.value.mobilePaths : flow.value.paths)

const flowPaths = computed(() => [
  ...activePaths.value.map(d => ({
    d,
    closed: false,
    dashArray: flow.value.dashArray,
    pathLength: FLOW_PATH_LENGTH,
  })),
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
        :style="{ height: '100%', display: 'block' }"
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
  --flow-canvas-offset: 0;
  --flow-canvas-width: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}

.flow-canvas {
  display: block;
  width: var(--flow-canvas-width);
  height: 100%;
  margin-left: var(--flow-canvas-offset);
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
