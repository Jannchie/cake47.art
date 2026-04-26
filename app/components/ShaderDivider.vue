<script setup lang="ts">
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  height?: number
  seed?: number
  animate?: boolean
  accentColor?: string
}>(), {
  height: 120,
  seed: 1.0,
  animate: true,
  accentColor: '#8a1827',
})

const containerRef = ref<HTMLDivElement | null>(null)
let dispose: (() => void) | undefined

const vertexShader = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */`
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform float uAspect;
uniform float uHeight;
uniform float uSeed;
uniform vec3 uAccent;

const float PI = 3.14159265359;

float hash11(float n) {
  return fract(sin(n * 12.9898 + uSeed * 7.13) * 43758.5453);
}

float vnoise(float x) {
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash11(i), hash11(i + 1.0), f);
}

// y is in [-1, 1] space. Convert pixel thickness to y-space.
float pxToY(float px) {
  return px * 2.0 / uHeight;
}

// Antialiased horizontal line of given pixel thickness centred at lineY.
float strokeAt(float y, float lineY, float pxThickness) {
  float halfT = pxToY(pxThickness) * 0.5;
  float aa = pxToY(1.0);
  float d = abs(y - lineY);
  return 1.0 - smoothstep(halfT - aa, halfT + aa, d);
}

void main() {
  vec2 uv = vUv;
  float y = (uv.y - 0.5) * 2.0;

  // Mirror x around centre: xs = 0 at the far edges, 0.5 at the centre.
  float xs = min(uv.x, 1.0 - uv.x);
  // signed side, used to mirror noise/phases so left/right read symmetrically.
  float side = uv.x < 0.5 ? -1.0 : 1.0;
  // a coordinate that grows from each edge inward
  float xEdge = xs;

  float t = uTime;

  // ── Main calligraphic stroke ──
  // Static low-frequency drift only — no time-driven jitter, the line should look calm.
  float drift = (vnoise(xs * 6.0) - 0.5) * pxToY(0.8);
  float baseY = drift;

  // Stroke envelope:
  //   xs ∈ [0.00, 0.04]  edge fade-in (almost dry tip of the brush)
  //   xs ∈ [0.04, 0.28]  brush body — thickness ramps thin→thick
  //   xs ∈ [0.28, 0.40]  hand-off to DNA, main stroke fades out
  //   xs > 0.40          empty centre
  float strokeRamp = smoothstep(0.04, 0.28, xs);
  float pxThick = mix(0.5, 2.0, strokeRamp);

  float mainLine = strokeAt(y, baseY, pxThick);

  float edgeIn = smoothstep(0.0, 0.04, xs);
  // Fade the main stroke quickly once the DNA region begins, so it doesn't linger as a phantom strand.
  float branchOut = smoothstep(0.33, 0.27, xs);
  mainLine *= edgeIn * branchOut;

  // ── DNA-like split strands ──
  // Branching starts where the main stroke fades out.
  float branchStart = 0.27;

  float dna = 0.0;
  const int STRANDS = 3;
  // Three strands: a lead that drifts furthest (and straightens before the centre),
  // a companion, and a ghost that fades in and out of existence.
  const float STRAND_OPACITY[STRANDS] = float[STRANDS](0.72, 0.36, 0.30);
  const float STRAND_PHASE[STRANDS] = float[STRANDS](0.0, 2.094, 4.189);
  const float STRAND_FREQ[STRANDS] = float[STRANDS](3.0, 3.6, 4.0);
  const float STRAND_AMP_PX[STRANDS] = float[STRANDS](12.0, 8.5, 6.0);
  const float STRAND_THICK_PX[STRANDS] = float[STRANDS](0.7, 0.5, 0.45);
  // Each strand reaches a different distance toward the centre (xs = 0.5).
  // Only strand 0 makes it close — the others tuck back early.
  const float STRAND_REACH[STRANDS] = float[STRANDS](0.47, 0.36, 0.33);
  // 1.0 means this strand respects the slow reveal/hide cycle; 0.0 means always visible.
  const float STRAND_REVEAL[STRANDS] = float[STRANDS](0.0, 0.0, 1.0);
  // Opacity-shimmer offset per strand so they don't pulse in lockstep.
  const float STRAND_FLICK_OFFSET[STRANDS] = float[STRANDS](0.0, 1.9, 3.7);

  // Slow half-wave rectified pulse: 0 → 1 → 0 with rest at 0 between cycles.
  // Period ≈ 2π / 0.45 ≈ 14s. The ghost strand spends ~half of the cycle invisible.
  float revealCycle = max(0.0, sin(t * 0.45 - 1.2));

  for (int i = 0; i < STRANDS; i++) {
    float fi = float(i);
    float reach = STRAND_REACH[i];

    if (xs > reach) {
      continue;
    }

    // Local progress along this strand's own arc.
    float localT = clamp((xs - branchStart) / (reach - branchStart), 0.0, 1.0);

    // Amplitude rises and then collapses back to zero — strand "straightens" near its tip.
    float bell_i = sin(localT * PI);
    float breath = 0.85 + 0.15 * sin(t * 0.4 + fi * 1.7);
    float ampY = pxToY(STRAND_AMP_PX[i]) * bell_i * bell_i * breath;

    float strandY = baseY + sin(localT * STRAND_FREQ[i] * PI + STRAND_PHASE[i]) * ampY * side;
    float strand = strokeAt(y, strandY, STRAND_THICK_PX[i]);

    // Visibility envelope along this strand's run; longer ease at the tip lets it look like it relaxes into a straight line.
    float visibility = smoothstep(0.0, 0.05, localT) * smoothstep(1.0, 0.82, localT);

    // Per-strand opacity shimmer (small wobble so the ink isn't dead-flat).
    float shimmer = 0.7 + 0.3 * sin(t * 0.7 + STRAND_FLICK_OFFSET[i]);
    // Ghost strand: multiply by the reveal cycle, others are unaffected.
    float reveal = mix(1.0, revealCycle, STRAND_REVEAL[i]);

    dna = max(dna, strand * STRAND_OPACITY[i] * visibility * shimmer * reveal);
  }

  float total = max(mainLine, dna);

  // Soft outer fade on the very edge so the brush tip dries out gracefully
  total *= smoothstep(0.0, 0.012, xs);

  gl_FragColor = vec4(uAccent, total);
}
`

function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex)
  return new THREE.Vector3(c.r, c.g, c.b)
}

onMounted(() => {
  if (!containerRef.value) {
    return
  }

  const container = containerRef.value
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1)

  const uniforms = {
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uHeight: { value: props.height },
    uSeed: { value: props.seed },
    uAccent: { value: hexToVec3(props.accentColor) },
  }

  const geometry = new THREE.PlaneGeometry(1, 1)
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  container.append(renderer.domElement)

  function updateSize() {
    const w = container.clientWidth
    const h = container.clientHeight || props.height
    if (w === 0 || h === 0) {
      return
    }
    renderer.setSize(w, h, false)
    uniforms.uAspect.value = w / h
    uniforms.uHeight.value = h * Math.min(window.devicePixelRatio, 2)
  }
  updateSize()

  let frameId = 0
  const start = performance.now()
  function tick() {
    frameId = requestAnimationFrame(tick)
    if (props.animate) {
      uniforms.uTime.value = (performance.now() - start) * 0.001
    }
    renderer.render(scene, camera)
  }
  tick()

  const ro = new ResizeObserver(updateSize)
  ro.observe(container)

  dispose = () => {
    cancelAnimationFrame(frameId)
    ro.disconnect()
    geometry.dispose()
    material.dispose()
    renderer.dispose()
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }
})

onBeforeUnmount(() => {
  dispose?.()
})
</script>

<template>
  <div
    ref="containerRef"
    class="shader-divider"
    :style="{ height: `${height}px` }"
    aria-hidden="true"
  />
</template>

<style scoped>
.shader-divider {
  width: 100%;
  display: block;
  pointer-events: none;
}

.shader-divider :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
