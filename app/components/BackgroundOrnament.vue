<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let cleanup: (() => void) | undefined

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  hue: 'ink' | 'cinnabar'
  phase: number
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) {
    return
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  let width = 0
  let height = 0
  const particles: Particle[] = []

  function rand(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }

  function spawn(initialY?: number): Particle {
    return {
      x: rand(0, Math.max(width, 1)),
      y: initialY ?? rand(0, Math.max(height, 1)),
      vx: rand(-0.04, 0.04),
      vy: -rand(0.04, 0.18),
      size: rand(0.5, 1.7),
      opacity: rand(0.18, 0.5),
      hue: Math.random() < 0.22 ? 'cinnabar' : 'ink',
      phase: Math.random() * Math.PI * 2,
    }
  }

  function resize() {
    if (!canvas) {
      return
    }
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx!.setTransform(1, 0, 0, 1, 0, 0)
    ctx!.scale(dpr, dpr)

    const target = 100
    while (particles.length < target) {
      particles.push(spawn())
    }
    while (particles.length > target) {
      particles.pop()
    }
  }

  resize()
  window.addEventListener('resize', resize)

  let lastTime = performance.now()
  let raf = 0

  function tick(now: number) {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(now - lastTime, 64)
    lastTime = now

    if (document.hidden) {
      return
    }

    ctx!.clearRect(0, 0, width, height)
    const tSec = now * 0.001
    const frameScale = dt / 16

    for (const p of particles) {
      if (!reduced) {
        const lateral = p.vx + Math.sin(tSec * 0.5 + p.phase) * 0.05
        p.x += lateral * frameScale
        p.y += p.vy * frameScale

        if (p.y < -8) {
          p.y = height + 8
          p.x = rand(0, width)
        }
        if (p.x < -8) {
          p.x = width + 8
        }
        else if (p.x > width + 8) {
          p.x = -8
        }
      }

      const flick = reduced ? 1 : 0.78 + 0.22 * Math.sin(tSec * 0.9 + p.phase * 1.7)
      const o = p.opacity * flick

      ctx!.beginPath()
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx!.fillStyle = p.hue === 'cinnabar'
        ? `rgba(138, 24, 39, ${o})`
        : `rgba(22, 24, 31, ${o * 0.85})`
      ctx!.fill()
    }
  }

  raf = requestAnimationFrame(tick)

  cleanup = () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }
})

onBeforeUnmount(() => {
  cleanup?.()
})
</script>

<template>
  <div class="bg-ornament" aria-hidden="true">
    <div class="bg-ornament-grid" />
    <canvas ref="canvasRef" class="bg-ornament-canvas" />
  </div>
</template>

<style scoped>
.bg-ornament {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg-ornament, 1);
  pointer-events: none;
  overflow: hidden;
}

/* Manuscript / scroll fold guides — vertical, very faint, slow opacity breathing. */
.bg-ornament-grid {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    to right,
    rgba(22, 24, 31, 0.05) 0,
    rgba(22, 24, 31, 0.05) 1px,
    transparent 1px,
    transparent 168px
  );
  background-position: center top;
  animation: gridBreathe 22s ease-in-out infinite;
  opacity: 0.7;
}

@keyframes gridBreathe {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.9; }
}

.bg-ornament-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .bg-ornament-grid {
    animation: none;
    opacity: 0.7;
  }
}
</style>
