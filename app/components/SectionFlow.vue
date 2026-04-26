<script setup lang="ts">
defineProps<{
  variant: 'sweep' | 'cluster' | 'split' | 'corner' | 'mark'
  mirror?: boolean
}>()
</script>

<template>
  <div class="flow" :class="[`flow-${variant}`, { 'is-mirror': mirror }]" aria-hidden="true">
    <svg
      v-if="variant === 'sweep'"
      class="flow-svg"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        d="M-40 300 C 200 280, 460 250, 680 220 C 880 200, 1200 100, 1500 30"
        fill="none"
        stroke="#8a1827"
        stroke-width="1.8"
        stroke-linecap="round"
        pathLength="100"
        stroke-dasharray="40 18 42"
        opacity="0.65"
      />
      <circle cx="1380" cy="60" r="3.2" fill="#8a1827" opacity="0.72" />
    </svg>

    <svg
      v-else-if="variant === 'cluster'"
      class="flow-svg"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        d="M-20 280 C 240 130, 460 280, 640 200 C 820 110, 1100 290, 1480 160"
        fill="none"
        stroke="#8a1827"
        stroke-width="1.7"
        stroke-linecap="round"
        pathLength="100"
        stroke-dasharray="40 18 42"
        opacity="0.62"
      />
    </svg>

    <svg
      v-else-if="variant === 'split'"
      class="flow-svg"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        d="M-40 220 C 280 260, 540 280, 720 280 C 900 280, 1160 220, 1500 60"
        fill="none"
        stroke="#8a1827"
        stroke-width="1.9"
        stroke-linecap="round"
        pathLength="100"
        stroke-dasharray="40 18 42"
        opacity="0.65"
      />
    </svg>

    <svg
      v-else-if="variant === 'corner'"
      class="flow-svg"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        d="M40 290 C 200 280, 360 290, 540 270 C 720 250, 1180 100, 1500 -20"
        fill="none"
        stroke="#8a1827"
        stroke-width="1.8"
        stroke-linecap="round"
        pathLength="100"
        stroke-dasharray="32 18 50"
        opacity="0.62"
      />
    </svg>

    <svg
      v-else
      class="flow-svg"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        d="M-40 280 C 280 240, 480 280, 700 230 C 920 180, 1180 290, 1500 130"
        fill="none"
        stroke="#8a1827"
        stroke-width="1.8"
        stroke-linecap="round"
        pathLength="100"
        stroke-dasharray="40 18 42"
        opacity="0.62"
      />
      <circle cx="1340" cy="155" r="3" fill="#8a1827" opacity="0.7" />
    </svg>
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

.flow-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.flow.is-mirror .flow-svg {
  transform: scaleX(-1);
}

@media (max-width: 720px) {
  .flow {
    top: -90px;
    height: 280px;
  }
}
</style>
