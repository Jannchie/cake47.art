<script setup lang="ts">
import { TextTrace } from '@text-trace/vue'
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

const props = withDefaults(defineProps<{
  subtitle?: string
}>(), {
  subtitle: '私期作品集',
})

const titleText = 'snowcake47'
const titleGlyphStyles = [
  {
    at: [8, 9],
    style: {
      textColor: '#8a1827',
      guideColor: '#8a1827',
    },
  },
]
const titleTiming = {
  guide: 0.08,
  stroke: 0.3,
  fill: 0.78,
  erase: 1,
}

const visible = ref(true)
const fading = ref(false)
const subtitleVisible = ref(false)
const prefersReducedMotion = ref(false)
const traceController = shallowRef<TextTraceController | null>(null)
const timers: number[] = []
let introTimersStarted = false

type TextTraceController = {
  replay: () => Promise<void>
}

function startIntroTimers() {
  if (introTimersStarted) {
    return
  }
  introTimersStarted = true

  const total = 3600
  const fadeStart = 2900

  timers.push(window.setTimeout(() => { fading.value = true }, fadeStart))
  timers.push(window.setTimeout(() => {
    visible.value = false
  }, total))

  document.documentElement.style.overflow = 'hidden'
  timers.push(window.setTimeout(() => {
    document.documentElement.style.overflow = ''
  }, total))
}

function handleTraceReady(controller: TextTraceController) {
  traceController.value = controller
  timers.push(window.setTimeout(() => {
    void traceController.value?.replay()
  }, 80))
}

function handleTracePhaseChange(phase: string) {
  if (phase === 'Stroking letters') {
    startIntroTimers()
  }
  else if (phase === 'Filling letters' || phase === 'Erasing guides' || phase === 'Done') {
    subtitleVisible.value = true
  }
  else if (phase.startsWith('Font load failed')) {
    subtitleVisible.value = true
    startIntroTimers()
  }
}

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion.value) {
    subtitleVisible.value = true
    startIntroTimers()
    return
  }

  timers.push(window.setTimeout(() => {
    subtitleVisible.value = true
    startIntroTimers()
  }, 1800))
})

onBeforeUnmount(() => {
  timers.forEach(timer => window.clearTimeout(timer))
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <Transition>
    <div v-if="visible" class="loading-overlay" :class="{ 'is-fading': fading }">
      <div class="loading-wordmark" :aria-label="`${titleText} ${props.subtitle}`">
        <span class="loading-title-row">
          <ClientOnly>
            <TextTrace
              v-if="!prefersReducedMotion"
              class="loading-title-trace"
              :text="titleText"
              font-key="garamond"
              text-color="#16181f"
              guide-color="#16181f"
              :duration="1600"
              :timing="titleTiming"
              :glyph-styles="titleGlyphStyles"
              :aria-label="titleText"
              @ready="handleTraceReady"
              @phase-change="handleTracePhaseChange"
            />
            <template #fallback>
              <span class="loading-title-placeholder" aria-hidden="true" />
            </template>
          </ClientOnly>
          <span v-if="prefersReducedMotion" class="loading-title-fallback" aria-hidden="true">
            Snowcake<span class="is-accent">47</span>
          </span>
        </span>
        <span class="loading-subtitle" :class="{ 'is-visible': subtitleVisible }" aria-hidden="true">
          <span class="loading-subtitle-deco">◆</span>
          <span class="loading-subtitle-text">
            {{ props.subtitle }}
          </span>
          <span class="loading-subtitle-deco">◆</span>
        </span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-loading, 1000);
  display: grid;
  place-items: center;
  --loading-paper: #fbfaf8;
  overflow: hidden;
  background: var(--loading-paper);
  isolation: isolate;
}

.loading-overlay.is-fading {
  pointer-events: none;
  background: transparent;
}

.loading-overlay::before,
.loading-overlay::after {
  content: '';
  position: absolute;
  left: 0;
  z-index: 0;
  width: 100%;
  height: calc(50% + 2.5rem);
  background: var(--loading-paper);
  will-change: transform;
}

.loading-overlay::before {
  top: 0;
  clip-path: polygon(
    0 0,
    100% 0,
    100% calc(100% - 1.1rem),
    86% 100%,
    68% calc(100% - 0.85rem),
    50% 100%,
    32% calc(100% - 0.65rem),
    14% 100%,
    0 calc(100% - 1.1rem)
  );
}

.loading-overlay::after {
  bottom: 0;
  clip-path: polygon(
    0 1.1rem,
    14% 0,
    32% 0.65rem,
    50% 0,
    68% 0.85rem,
    86% 0,
    100% 1.1rem,
    100% 100%,
    0 100%
  );
}

.loading-overlay.is-fading::before {
  animation: loadingMaskTop 0.7s cubic-bezier(.76, 0, .24, 1) forwards;
}

.loading-overlay.is-fading::after {
  animation: loadingMaskBottom 0.7s cubic-bezier(.76, 0, .24, 1) forwards;
}

.loading-overlay.is-fading .loading-wordmark {
  animation: loadingWordmarkExit 0.34s cubic-bezier(.4, 0, .2, 1) forwards;
}

.loading-wordmark {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 1rem;
  width: min(86vw, 680px);
  color: var(--color-ink);
  font-family: var(--font-display);
  text-align: center;
  user-select: none;
}

.loading-title-row {
  position: relative;
  display: block;
  width: 100%;
  min-height: clamp(4.6rem, 18vw, 10.2rem);
}

.loading-title-trace {
  display: block;
  width: 100%;
}

.loading-title-placeholder {
  display: block;
  width: 100%;
  min-height: inherit;
}

.loading-title-fallback {
  display: block;
  font-size: clamp(3.2rem, 12vw, 7.4rem);
  font-weight: 400;
  line-height: 0.92;
  color: var(--color-ink);
}

.loading-title-fallback .is-accent {
  color: var(--color-cinnabar);
}

.loading-subtitle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.9em;
  font-size: clamp(0.9rem, 2.1vw, 1.22rem);
  font-weight: 400;
  color: var(--color-ink-soft);
  opacity: 0;
  transform: translateY(6px);
}

.loading-subtitle.is-visible {
  animation: subtitleFadeIn 0.9s cubic-bezier(.2, .8, .2, 1) forwards;
}

.loading-subtitle-deco {
  color: var(--color-cinnabar);
  font-size: 0.72em;
}

.loading-subtitle-text {
  display: inline-block;
  letter-spacing: 0.58em;
}

.loading-subtitle.is-visible .loading-subtitle-text {
  animation: subtitleTighten 0.9s cubic-bezier(.2, .8, .2, 1) forwards;
}

@keyframes subtitleFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes subtitleTighten {
  to {
    letter-spacing: 0.22em;
  }
}

@keyframes loadingMaskTop {
  to {
    transform: translateY(-104%);
  }
}

@keyframes loadingMaskBottom {
  to {
    transform: translateY(104%);
  }
}

@keyframes loadingWordmarkExit {
  to {
    opacity: 0;
    transform: translateY(-0.35rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-overlay,
  .loading-overlay::before,
  .loading-overlay::after,
  .loading-overlay * {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
  }
}
</style>
