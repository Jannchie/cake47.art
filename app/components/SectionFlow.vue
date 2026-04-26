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
      viewBox="0 0 1440 130"
      preserveAspectRatio="none"
    >
      <path
        d="M-20 95 C 280 0, 540 130, 820 50"
        fill="none"
        stroke="#8a1827"
        stroke-width="1.4"
        stroke-linecap="round"
        opacity="0.55"
      />
      <path
        d="M960 60 C 1080 30, 1180 90, 1320 40"
        fill="none"
        stroke="#8a1827"
        stroke-width="1"
        stroke-linecap="round"
        stroke-dasharray="2 7"
        opacity="0.45"
      />
      <circle cx="888" cy="55" r="2.4" fill="#8a1827" opacity="0.7" />
    </svg>

    <svg
      v-else-if="variant === 'cluster'"
      class="flow-svg"
      viewBox="0 0 1440 110"
      preserveAspectRatio="none"
    >
      <path
        d="M120 70 Q 360 0 600 60"
        fill="none"
        stroke="#8a1827"
        stroke-width="1.2"
        stroke-linecap="round"
        opacity="0.55"
      />
      <circle cx="700" cy="62" r="1.7" fill="#8a1827" opacity="0.7" />
      <circle cx="734" cy="56" r="1" fill="#8a1827" opacity="0.55" />
      <path
        d="M820 64 Q 980 100 1180 30"
        fill="none"
        stroke="#8a1827"
        stroke-width="1"
        stroke-linecap="round"
        stroke-dasharray="3 5"
        opacity="0.5"
      />
    </svg>

    <svg
      v-else-if="variant === 'split'"
      class="flow-svg"
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
    >
      <path
        d="M0 60 Q 200 30 380 80"
        fill="none"
        stroke="#8a1827"
        stroke-width="1.1"
        stroke-linecap="round"
        opacity="0.55"
      />
      <text
        x="640"
        y="62"
        fill="#8a1827"
        opacity="0.7"
        font-family="'Shippori Mincho', 'Cormorant Garamond', serif"
        font-style="italic"
        font-size="18"
        text-anchor="middle"
      >
        ✦
      </text>
      <path
        d="M780 70 Q 1020 100 1200 50"
        fill="none"
        stroke="#8a1827"
        stroke-width="1"
        stroke-linecap="round"
        stroke-dasharray="2 6"
        opacity="0.5"
      />
      <path
        d="M1240 48 L 1380 30"
        fill="none"
        stroke="#8a1827"
        stroke-width="1"
        stroke-linecap="round"
        opacity="0.55"
      />
    </svg>

    <svg
      v-else-if="variant === 'corner'"
      class="flow-svg"
      viewBox="0 0 1440 140"
      preserveAspectRatio="none"
    >
      <circle cx="180" cy="70" r="2" fill="#8a1827" opacity="0.6" />
      <circle cx="220" cy="78" r="1.2" fill="#8a1827" opacity="0.45" />
      <path
        d="M340 90 Q 380 86 410 92"
        fill="none"
        stroke="#8a1827"
        stroke-width="1"
        stroke-linecap="round"
        opacity="0.5"
      />
      <path
        d="M820 130 C 1020 40, 1220 110, 1440 30"
        fill="none"
        stroke="#8a1827"
        stroke-width="1.3"
        stroke-linecap="round"
        opacity="0.55"
      />
    </svg>

    <svg
      v-else
      class="flow-svg"
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
    >
      <path
        d="M80 50 Q 280 0 480 60"
        fill="none"
        stroke="#8a1827"
        stroke-width="1.1"
        stroke-linecap="round"
        opacity="0.55"
      />
      <text
        x="600"
        y="56"
        fill="#8a1827"
        opacity="0.65"
        font-family="'Shippori Mincho', 'Cormorant Garamond', serif"
        font-style="italic"
        font-size="20"
      >
        ◇
      </text>
      <path
        d="M700 56 L 1040 56"
        fill="none"
        stroke="#8a1827"
        stroke-width="0.8"
        stroke-linecap="round"
        stroke-dasharray="1 9"
        opacity="0.45"
      />
      <circle cx="1100" cy="56" r="2" fill="#8a1827" opacity="0.7" />
    </svg>
  </div>
</template>

<style scoped>
.flow {
  position: relative;
  width: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 0;
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

.flow-sweep { height: 110px; margin: -28px 0 -34px; }
.flow-cluster { height: 96px; margin: -16px 0 -22px; }
.flow-split { height: 90px; margin: -8px 0 -14px; }
.flow-corner { height: 130px; margin: -32px 0 -42px; }
.flow-mark { height: 78px; margin: -6px 0 -12px; }

@media (max-width: 720px) {
  .flow-sweep { height: 84px; margin: -20px 0 -24px; }
  .flow-cluster { height: 72px; margin: -12px 0 -16px; }
  .flow-split { height: 70px; margin: -6px 0 -10px; }
  .flow-corner { height: 96px; margin: -22px 0 -30px; }
  .flow-mark { height: 64px; margin: -4px 0 -8px; }
}
</style>
