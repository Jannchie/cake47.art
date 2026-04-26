<script setup lang="ts">
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  subtitle?: string
}>(), {
  subtitle: 'snowcake47 Studio',
})

const visible = ref(true)
const fading = ref(false)
const containerRef = ref<HTMLDivElement | null>(null)
const timers: number[] = []
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
uniform vec2 uResolution;
uniform float uLogoScale;
uniform float uReduced;
uniform vec3 uInk;
uniform vec3 uVine;
uniform vec3 uPetal;
uniform vec3 uPetalDeep;
uniform vec3 uPetalCore;

#define PI 3.14159265

float hash11(float n) { return fract(sin(n * 12.9898 + 91.0) * 43758.5453); }
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float vnoise(float x) {
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash11(i), hash11(i + 1.0), f);
}

float vnoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm2(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise2(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float segSDF(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float triSDF(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
  vec2 e0 = p1 - p0;
  vec2 e1 = p2 - p1;
  vec2 e2 = p0 - p2;
  vec2 v0 = p - p0;
  vec2 v1 = p - p1;
  vec2 v2 = p - p2;
  vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
  vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
  vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(
    vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)),
    vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))),
    vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}

float fillMask(float d, float aaR) {
  return smoothstep(aaR, -aaR, d);
}

float strokeMask(float d, float halfW, float aaR) {
  return smoothstep(aaR, -aaR, abs(d) - halfW);
}

// Lance-shaped stroke pointing along +y, narrowing toward tip.
float sparkLeaf(vec2 p, float baseR, float tipR, float baseW) {
  float span = max(tipR - baseR, 0.001);
  float t = clamp((p.y - baseR) / span, 0.0, 1.0);
  float w = baseW * pow(1.0 - t, 0.7);
  w *= 0.85 + 0.3 * vnoise(p.y * 0.06 + 13.0);
  float dx = abs(p.x) - w;
  float dy = max(baseR - p.y, p.y - tipR);
  return max(dx, dy);
}

float thornMask(vec2 p, vec2 a, vec2 b, vec2 c, float prog, float aa) {
  if (prog < 0.001) return 0.0;
  vec2 cen = (a + b + c) / 3.0;
  float s = mix(0.2, 1.0, prog);
  vec2 q = (p - cen) / s + cen;
  float d = triSDF(q, a, b, c);
  return fillMask(d, aa) * 0.78 * prog;
}

void main() {
  // Math-style coords: +y is up (top of screen), +x is right.
  // PlaneGeometry's vUv.y=1 maps to clip-space top, so fragPx.y > 0 already
  // points up — no flip needed.
  vec2 fragPx = (vUv - 0.5) * uResolution;
  vec2 p = fragPx * uLogoScale;

  // 1 CSS pixel expressed in logo units. Used as the AA half-radius and as the
  // floor for stroke widths so nothing drops below sub-pixel.
  float pxW = uLogoScale;
  float aa = pxW * 0.7;

  float realT = uTime;
  float t = (uReduced > 0.5) ? 100.0 : realT;

  float pSparkN = smoothstep(0.0, 0.9, t);
  float pSparkE = smoothstep(0.08, 0.98, t);
  float pSparkS = smoothstep(0.14, 1.04, t);
  float pSparkW = smoothstep(0.08, 0.98, t);
  float pSparkMin = smoothstep(0.22, 0.78, t);
  float pRing = smoothstep(0.2, 1.0, t);
  float pRingRot = (uReduced > 0.5) ? 0.0 : max(realT - 0.2, 0.0) * (2.0 * PI / 18.0);
  float pCenter = smoothstep(0.38, 0.93, t);
  float pVine = smoothstep(0.92, 2.82, t);
  float pTopStem = smoothstep(1.82, 2.52, t);
  float pThorn1 = smoothstep(1.35, 1.69, t);
  float pThorn2 = smoothstep(1.55, 1.89, t);
  float pThorn3 = smoothstep(1.75, 2.09, t);
  float pThorn4 = smoothstep(1.95, 2.29, t);
  float pPet1 = smoothstep(1.96, 2.88, t);
  float pPet2 = smoothstep(2.08, 2.94, t);
  float pPet3 = smoothstep(2.20, 2.98, t);
  float pCore = smoothstep(2.28, 3.00, t);

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  // Time-tick ring
  {
    float r = length(p);
    float ringBand = smoothstep(99.0, 102.0, r) * (1.0 - smoothstep(112.0, 115.0, r));
    if (ringBand > 0.0 && pRing > 0.001) {
      vec2 q = rot2(pRingRot) * p;
      // theta = 0 at top, increases clockwise
      float theta = atan(q.x, q.y);
      float n = 48.0;
      float k = (theta + PI) * (n / (2.0 * PI));
      float idx = floor(k);
      float frac = k - idx - 0.5;
      float dx = frac * (2.0 * PI * r / n);
      float modVal = mod(idx, 6.0);
      float majorFlag = 1.0 - step(0.5, modVal);
      float rMin = 104.0;
      float rMax = mix(108.0, 111.0, majorFlag);
      float radial = max(rMin - r, r - rMax);
      float halfW = mix(max(0.17, 0.4 * pxW), max(0.27, 0.6 * pxW), majorFlag);
      float d = max(abs(dx) - halfW, radial);
      float opacity = mix(0.34, 0.58, majorFlag);
      float mask = fillMask(d, aa) * pRing * opacity;
      col = mix(col, uInk, mask);
      alpha = max(alpha, mask);
    }
  }

  // Major spark rays — 4 cardinal lances drawn from center outward.
  {
    float prog;
    float tipR;
    float widthScale;
    float d;
    float mask;

    // North (+y)
    prog = pSparkN;
    if (prog > 0.001) {
      tipR = mix(8.0, 124.0, prog);
      widthScale = mix(0.4, 1.0, prog);
      d = sparkLeaf(p, 8.0, tipR, 2.9 * widthScale);
      mask = fillMask(d, aa) * 0.88;
      col = mix(col, uInk, mask);
      alpha = max(alpha, mask);
    }

    // South (-y)
    prog = pSparkS;
    if (prog > 0.001) {
      tipR = mix(8.0, 124.0, prog);
      widthScale = mix(0.4, 1.0, prog);
      d = sparkLeaf(vec2(p.x, -p.y), 8.0, tipR, 2.9 * widthScale);
      mask = fillMask(d, aa) * 0.88;
      col = mix(col, uInk, mask);
      alpha = max(alpha, mask);
    }

    // East (+x) — rotate so +x maps to +y
    prog = pSparkE;
    if (prog > 0.001) {
      tipR = mix(8.0, 124.0, prog);
      widthScale = mix(0.4, 1.0, prog);
      d = sparkLeaf(vec2(p.y, p.x), 8.0, tipR, 2.9 * widthScale);
      mask = fillMask(d, aa) * 0.88;
      col = mix(col, uInk, mask);
      alpha = max(alpha, mask);
    }

    // West (-x)
    prog = pSparkW;
    if (prog > 0.001) {
      tipR = mix(8.0, 124.0, prog);
      widthScale = mix(0.4, 1.0, prog);
      d = sparkLeaf(vec2(-p.y, -p.x), 8.0, tipR, 2.9 * widthScale);
      mask = fillMask(d, aa) * 0.88;
      col = mix(col, uInk, mask);
      alpha = max(alpha, mask);
    }

    // Diagonal minor sparks
    if (pSparkMin > 0.001) {
      tipR = mix(7.0, 43.0, pSparkMin);
      widthScale = mix(0.4, 1.0, pSparkMin);
      vec2 q;

      q = rot2(-PI * 0.25) * p;
      d = sparkLeaf(q, 7.0, tipR, 1.15 * widthScale);
      mask = fillMask(d, aa) * 0.85;
      col = mix(col, uInk, mask);
      alpha = max(alpha, mask);

      q = rot2(-PI * 0.75) * p;
      d = sparkLeaf(q, 7.0, tipR, 1.15 * widthScale);
      mask = fillMask(d, aa) * 0.85;
      col = mix(col, uInk, mask);
      alpha = max(alpha, mask);

      q = rot2(-PI * 1.25) * p;
      d = sparkLeaf(q, 7.0, tipR, 1.15 * widthScale);
      mask = fillMask(d, aa) * 0.85;
      col = mix(col, uInk, mask);
      alpha = max(alpha, mask);

      q = rot2(-PI * 1.75) * p;
      d = sparkLeaf(q, 7.0, tipR, 1.15 * widthScale);
      mask = fillMask(d, aa) * 0.85;
      col = mix(col, uInk, mask);
      alpha = max(alpha, mask);
    }
  }

  // Center ring + hole punch
  if (pCenter > 0.001) {
    float r = length(p);
    float scale = mix(0.2, 1.0, pCenter);

    // Hole — clear out alpha so background shows through
    float dHole = r - 7.8 * scale;
    float maskHole = fillMask(dHole, aa) * pCenter;
    alpha *= (1.0 - maskHole);

    // Rim
    float dRim = abs(r - 8.7 * scale) - max(0.21, 0.55 * pxW);
    float maskRim = fillMask(dRim, aa) * pCenter;
    col = mix(col, uInk, maskRim);
    alpha = max(alpha, maskRim);
  }

  // Climbing rose vine — sinuous stroke from y=-116 (bottom of screen) to y=+104 (top).
  if (pVine > 0.001) {
    float botY = -116.0;
    float topY = 104.0;
    // Front advances from bottom to top as pVine goes 0 → 1.
    float curFrontY = mix(botY, topY, pVine);

    float vineDist = 1e9;
    for (int i = 0; i < 24; i++) {
      float fi = float(i);
      float t0 = fi / 23.0;
      float t1 = (fi + 1.0) / 23.0;
      float y0 = mix(botY, topY, t0);
      float y1 = mix(botY, topY, t1);
      float x0 = sin(y0 * 0.075) * 7.5 + sin(y0 * 0.18 + 1.3) * 1.6;
      float x1 = sin(y1 * 0.075) * 7.5 + sin(y1 * 0.18 + 1.3) * 1.6;
      vineDist = min(vineDist, segSDF(p, vec2(x0, y0), vec2(x1, y1)));
    }
    float vineLine = strokeMask(vineDist, max(0.46, 0.7 * pxW), aa);
    // Reveal mask: visible where the front has already swept past (p.y <= curFrontY).
    vineLine *= smoothstep(curFrontY + 3.0, curFrontY - 1.5, p.y);
    // Slight ink density variation
    vineLine *= 0.55 + 0.45 * vnoise(p.y * 0.04 + 1.7);
    col = mix(col, uVine, vineLine);
    alpha = max(alpha, vineLine);
  }

  // Top stem connector — between vine head (+104) and rose base (+124).
  if (pTopStem > 0.001) {
    float dStem = segSDF(p, vec2(0.0, 104.0), vec2(0.0, 124.0));
    float stemMask = strokeMask(dStem, max(0.28, 0.5 * pxW), aa) * pTopStem;
    col = mix(col, uVine, stemMask);
    alpha = max(alpha, stemMask);
  }

  // Thorns — positions translated from SVG (where +y is down) into math coords (+y up).
  {
    float m;
    m = thornMask(p, vec2(-7.0, -74.0), vec2(-21.0, -68.0), vec2(-9.0, -63.0), pThorn1, aa);
    col = mix(col, uInk, m);
    alpha = max(alpha, m);

    m = thornMask(p, vec2(8.0, -38.0), vec2(23.0, -32.0), vec2(10.0, -27.0), pThorn2, aa);
    col = mix(col, uInk, m);
    alpha = max(alpha, m);

    m = thornMask(p, vec2(-6.0, 10.0), vec2(-20.0, 17.0), vec2(-7.0, 22.0), pThorn3, aa);
    col = mix(col, uInk, m);
    alpha = max(alpha, m);

    m = thornMask(p, vec2(7.0, 54.0), vec2(20.0, 62.0), vec2(8.0, 66.0), pThorn4, aa);
    col = mix(col, uInk, m);
    alpha = max(alpha, m);
  }

  // Crowning rose at the top of the spark
  if (pPet1 > 0.001) {
    vec2 fp = p - vec2(0.0, 124.0);

    // Outer petals
    {
      float scale = mix(0.18, 1.0, pPet1);
      vec2 fp1 = fp / scale;
      float ry = mix(6.0, 21.0, smoothstep(-2.0, 4.0, fp1.y));
      float rx = 19.0 * (1.0 - 0.18 * smoothstep(-5.0, 21.0, fp1.y));
      float d1 = length(vec2(fp1.x / rx, fp1.y / ry)) - 1.0;
      d1 += (fbm2(fp1 * 0.18 + 6.0) - 0.5) * 0.32;
      float mask = fillMask(d1, aa * 0.06) * pPet1;
      float shade = smoothstep(20.0, -2.0, length(fp1));
      vec3 c1 = mix(uPetalDeep, uPetal, shade);
      col = mix(col, c1, mask);
      alpha = max(alpha, mask);
    }

    // Mid petals
    if (pPet2 > 0.001) {
      float scale = mix(0.18, 1.0, pPet2);
      vec2 fp2 = fp / scale;
      float ry = mix(5.0, 14.0, smoothstep(-2.0, 4.0, fp2.y));
      float rx = 18.0 * (1.0 - 0.22 * smoothstep(-3.0, 14.0, fp2.y));
      float d2 = length(vec2(fp2.x / rx, fp2.y / ry)) - 1.0;
      float mask = fillMask(d2, aa * 0.06) * pPet2;
      vec3 c2 = mix(uPetalDeep, uPetal, 0.55);
      col = mix(col, c2 * 0.92, mask);
      alpha = max(alpha, mask);
    }

    // Inner petals
    if (pPet3 > 0.001) {
      float scale = mix(0.18, 1.0, pPet3);
      vec2 fp3 = fp / scale;
      float ry = mix(3.0, 8.0, smoothstep(-1.5, 3.0, fp3.y));
      float rx = 10.0 * (1.0 - 0.22 * smoothstep(-2.0, 8.0, fp3.y));
      float d3 = length(vec2(fp3.x / rx, fp3.y / ry)) - 1.0;
      float mask = fillMask(d3, aa * 0.06) * pPet3;
      col = mix(col, uPetalDeep * 0.78, mask);
      alpha = max(alpha, mask);
    }

    // Core
    if (pCore > 0.001) {
      float scale = mix(0.18, 1.0, pCore);
      vec2 fp4 = fp / scale;
      float dC = length(fp4 - vec2(0.0, 1.0)) - 4.5;
      float mask = fillMask(dC, aa * 0.06) * pCore;
      col = mix(col, uPetalCore, mask);
      alpha = max(alpha, mask);
    }
  }

  gl_FragColor = vec4(col, alpha);
}
`

function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex)
  return new THREE.Vector3(c.r, c.g, c.b)
}

const INTRO_FLAG = 'cake47-intro-played'

onMounted(() => {
  const alreadyPlayed = (() => {
    try {
      return window.sessionStorage.getItem(INTRO_FLAG) === '1'
    }
    catch {
      return false
    }
  })()

  if (alreadyPlayed) {
    visible.value = false
    return
  }

  const total = 4200
  const fadeStart = 3500

  timers.push(window.setTimeout(() => { fading.value = true }, fadeStart))
  timers.push(window.setTimeout(() => {
    visible.value = false
    try {
      window.sessionStorage.setItem(INTRO_FLAG, '1')
    }
    catch {
      // ignore storage errors (private mode, etc.)
    }
  }, total))

  document.documentElement.style.overflow = 'hidden'
  timers.push(window.setTimeout(() => {
    document.documentElement.style.overflow = ''
  }, total))

  if (!containerRef.value) {
    return
  }

  const container = containerRef.value
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1)

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uLogoScale: { value: 1 },
    uReduced: { value: reduced ? 1.0 : 0.0 },
    uInk: { value: hexToVec3('#16181f') },
    uVine: { value: hexToVec3('#1a1c23') },
    uPetal: { value: hexToVec3('#c33b4c') },
    uPetalDeep: { value: hexToVec3('#4c0d18') },
    uPetalCore: { value: hexToVec3('#3a0710') },
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
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    renderer.setSize(w, h, false)
    uniforms.uResolution.value.set(w, h)
    // Logo viewBox is 380 units tall. Fit the logo into ~85% of the smaller side
    // so there's some breathing room around the artwork.
    const logoTargetPx = Math.min(w, h) * 0.85
    uniforms.uLogoScale.value = 380 / logoTargetPx
  }
  updateSize()

  const ro = new ResizeObserver(updateSize)
  ro.observe(container)

  let frameId = 0
  const start = performance.now()
  function tick() {
    frameId = requestAnimationFrame(tick)
    uniforms.uTime.value = (performance.now() - start) * 0.001
    renderer.render(scene, camera)
  }
  tick()

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
  timers.forEach(timer => window.clearTimeout(timer))
  document.documentElement.style.overflow = ''
  dispose?.()
})
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="loading-overlay" :class="{ 'is-fading': fading }">
      <div class="logo-stage">
        <div ref="containerRef" class="shader-canvas" aria-hidden="true" />
        <div class="wordmark">
          <h2>Snowcake47</h2>
          <small>{{ props.subtitle }}</small>
        </div>
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
  background: #fbfaf8;
}

.loading-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 42%, rgb(251 250 248 / 0) 0%, rgb(232 230 226 / 0.72) 100%);
  pointer-events: none;
}

.loading-overlay.is-fading {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.7s cubic-bezier(.4, 0, .2, 1);
}

.fade-leave-active { transition: opacity 0.7s cubic-bezier(.4, 0, .2, 1); }
.fade-leave-to { opacity: 0; }

.logo-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.shader-canvas {
  width: clamp(260px, 38vmin, 420px);
  aspect-ratio: 1 / 1;
  pointer-events: none;
}

.shader-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.wordmark {
  text-align: center;
  font-family: var(--font-display);
  user-select: none;
}

.wordmark h2 {
  margin: 0;
  font-size: clamp(1.4rem, 2.4vw, 1.9rem);
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--color-ink);
  opacity: 0;
  animation: wordIn 1.1s cubic-bezier(.2, .8, .2, 1) 2.55s forwards;
}

.wordmark small {
  display: block;
  margin-top: 0.45rem;
  font-family: var(--font-body);
  font-size: 0.66rem;
  font-weight: 400;
  letter-spacing: 0.62em;
  color: var(--color-ink-soft);
  opacity: 0;
  animation: wordIn 1.1s cubic-bezier(.2, .8, .2, 1) 2.75s forwards;
}

@keyframes wordIn {
  0% { opacity: 0; transform: translateY(8px); letter-spacing: 0.3em; }
  100% { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .loading-overlay,
  .loading-overlay * {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
  }
}
</style>
