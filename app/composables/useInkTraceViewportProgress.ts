import { onBeforeUnmount, onMounted, ref } from 'vue'

interface InkTraceViewportProgressOptions {
  duration?: number
  rootMargin?: string
  threshold?: number
}

export function useInkTraceViewportProgress(options: InkTraceViewportProgressOptions = {}) {
  const target = ref<HTMLElement | null>(null)
  const progress = ref(0)

  let observer: IntersectionObserver | null = null
  let frame = 0
  let started = false

  function stopFrame() {
    if (frame) {
      window.cancelAnimationFrame(frame)
      frame = 0
    }
  }

  function start() {
    if (started) {
      return
    }
    started = true
    observer?.disconnect()
    observer = null

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      progress.value = 1
      return
    }

    const duration = options.duration ?? 900
    const startAt = performance.now()

    function tick(now: number) {
      const linear = Math.min(1, (now - startAt) / duration)
      progress.value = 1 - (1 - linear) ** 3

      if (linear < 1) {
        frame = window.requestAnimationFrame(tick)
        return
      }

      progress.value = 1
      frame = 0
    }

    frame = window.requestAnimationFrame(tick)
  }

  onMounted(() => {
    if (!target.value || !('IntersectionObserver' in window)) {
      start()
      return
    }

    observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        start()
      }
    }, {
      rootMargin: options.rootMargin ?? '0px 0px -12% 0px',
      threshold: options.threshold ?? 0.01,
    })

    observer.observe(target.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    stopFrame()
  })

  return { target, progress }
}
