<script setup lang="ts">
import * as THREE from 'three'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const threeSceneRef = ref<HTMLDivElement | null>(null)
const loading = ref(true)
let disposeThreeScene: (() => void) | undefined

interface OrbitState {
  offset: number
  cardYaw: number
}

function createRoundedRectangleWithThickness(width: number, height: number, radius: number, thickness: number = 0.02) {
  const outerShape = new THREE.Shape()

  outerShape.moveTo(-width / 2 + radius, -height / 2)
  outerShape.lineTo(width / 2 - radius, -height / 2)
  outerShape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius)
  outerShape.lineTo(width / 2, height / 2 - radius)
  outerShape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2)
  outerShape.lineTo(-width / 2 + radius, height / 2)
  outerShape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius)
  outerShape.lineTo(-width / 2, -height / 2 + radius)
  outerShape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2)

  const extrudeSettings = {
    depth: thickness,
    bevelEnabled: false,
  }

  const geometry = new THREE.ExtrudeGeometry(outerShape, extrudeSettings)

  const uvs = geometry.attributes.uv?.array
  if (uvs) {
    for (let i = 0; i < uvs.length; i += 2) {
      const u = uvs[i]
      const v = uvs[i + 1]
      if (u !== undefined) {
        uvs[i] = (u + width / 2) / width
      }
      if (v !== undefined) {
        uvs[i + 1] = (v + height / 2) / height
      }
    }
  }

  return geometry
}

function loadTextureWithPromise(url: string) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => { // onLoad callback
        resolve(texture)
      },
      undefined, // onProgress callback, 不使用可以为undefined
      (error) => { // onError callback
        reject(new Error(`Error loading texture: ${error}`))
      },
    )
  })
}

async function loadImage(imgPath: string, scene: THREE.Scene, orbitState: OrbitState, delta = 0) {
  const texture = await loadTextureWithPromise(imgPath)
  const width = texture.image.width
  const height = texture.image.height

  const scale = 2.7

  const planeGeometry = createRoundedRectangleWithThickness(scale, height / width * scale, 0.2)
  const planeMaterial = new THREE.MeshBasicMaterial({ map: texture })
  const plane = new THREE.Mesh(planeGeometry, [planeMaterial, new THREE.MeshBasicMaterial({ color: 0xFF_FF_FF })])

  const angleInRadians = THREE.MathUtils.degToRad(5)
  // plane.rotation.y = angleInRadians * 3
  plane.rotation.x = -angleInRadians
  plane.rotation.z = angleInRadians
  // 设定 plane 的坐标，为绕着 Z 轴一周的圆形， delta 0 和 1 位置相同，delta 0.5 位置在最后面
  plane.position.z = Math.cos(Math.PI * 2 * delta) * 10
  plane.position.x = Math.sin(Math.PI * 2 * delta) * 20
  // texture.colorSpace = THREE.SRGBColorSpace
  scene.add(plane)
  function animate(time: number) {
    requestAnimationFrame(animate)
    const orbitProgress = delta + time / 60_000 + orbitState.offset
    plane.position.z = Math.cos(Math.PI * 2 * orbitProgress) * 5
    plane.position.x = Math.sin(Math.PI * 2 * orbitProgress) * 10
    plane.position.y = Math.sin(Math.PI * 2 * (delta + time / 5000 + orbitState.offset)) * 0.2
    plane.rotation.y = orbitState.cardYaw
  }
  animate(0)
}

onBeforeUnmount(() => {
  disposeThreeScene?.()
})

onMounted(async () => {
  if (!threeSceneRef.value) {
    return
  }

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, threeSceneRef.value.clientWidth / threeSceneRef.value.clientHeight, 0.1, 200)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setClearColor(new THREE.Color(0xE5_E5_E5))
  renderer.setSize(threeSceneRef.value.clientWidth, threeSceneRef.value.clientHeight)
  renderer.domElement.style.cursor = 'grab'
  renderer.domElement.style.touchAction = 'pan-y'
  threeSceneRef.value.append(renderer.domElement)
  const previousBodyTouchAction = document.body.style.touchAction
  document.body.style.touchAction = 'pan-y'
  const orbitState = { offset: 0, cardYaw: 0 }
  const imgPathList = [
    '/imgs/cake.af390a65.png',
    '/imgs/FbfB5CXakAAEr4T.jpg',
    '/imgs/miku.d66461fc.jpeg',
    '/imgs/oc2.7bee0420.jpeg',
    '/imgs/ななみ.c4dafa62.jpeg',
    '/imgs/白銀つむぎ.3e70dc15.jpeg',
    '/imgs/舞園さやか.a060f725.jpeg',
    '/imgs/赤松楓.9d64b955.jpeg',

  ]
  const n = 20
  for (let i = 0; i < n; i++) {
    const imgPath = imgPathList[i % imgPathList.length]
    if (imgPath) {
      await loadImage(imgPath, scene, orbitState, i / n)
    }
  }

  camera.position.copy(new THREE.Vector3(-4, -1.25, 9))
  camera.rotation.y = 180

  // 在 scene 绘制坐标轴网格
  // const axesHelper = new THREE.AxesHelper(5)
  // scene.add(axesHelper)

  const composer = new EffectComposer(renderer)

  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  const bokehPass = new BokehPass(scene, camera, {
    focus: 5,
    aperture: 0.001,
    maxblur: 0.01,
  })
  composer.addPass(bokehPass)

  // 允许鼠标控制相机
  // const controls = new OrbitControls(camera, renderer.domElement)
  // controls.enableDamping = true

  const orbitOffsetPerPixel = 0.00004
  const inertiaDamping = 0.0035
  const maxOrbitVelocity = 0.0011
  const maxCardYaw = THREE.MathUtils.degToRad(60)
  const cardYawVelocityMultiplier = 2000
  const cardYawSpring = 0.04
  const cardYawDamping = 0.008

  let isDragging = false
  let activePointerId: number | null = null
  let previousPointerX = 0
  let previousPointerTime = 0
  let orbitVelocity = 0
  let cardYawVelocity = 0
  let previousAnimationTime = 0
  let animationFrameId = 0

  function isInteractiveTarget(target: EventTarget | null) {
    return target instanceof Element && !!target.closest('a, button, input, textarea, select, label, [role="button"], [role="link"]')
  }

  function handlePointerDown(event: PointerEvent) {
    if (activePointerId !== null || (event.pointerType === 'mouse' && event.button !== 0) || isInteractiveTarget(event.target)) {
      return
    }

    isDragging = true
    activePointerId = event.pointerId
    previousPointerX = event.clientX
    previousPointerTime = event.timeStamp
    orbitVelocity = 0
    renderer.domElement.style.cursor = 'grabbing'
    document.body.style.cursor = 'grabbing'
  }

  function handlePointerMove(event: PointerEvent) {
    if (!isDragging || event.pointerId !== activePointerId) {
      return
    }

    const deltaX = event.clientX - previousPointerX
    const deltaTime = Math.max(event.timeStamp - previousPointerTime, 16)
    const orbitDelta = deltaX * orbitOffsetPerPixel

    event.preventDefault()
    orbitState.offset += orbitDelta
    orbitVelocity = THREE.MathUtils.clamp(orbitDelta / deltaTime, -maxOrbitVelocity, maxOrbitVelocity)
    previousPointerX = event.clientX
    previousPointerTime = event.timeStamp
  }

  function handlePointerEnd(event: PointerEvent) {
    if (event.pointerId !== activePointerId) {
      return
    }

    isDragging = false
    activePointerId = null
    renderer.domElement.style.cursor = 'grab'
    document.body.style.cursor = ''
  }

  function handleWindowBlur() {
    isDragging = false
    activePointerId = null
    renderer.domElement.style.cursor = 'grab'
    document.body.style.cursor = ''
  }

  const pointerMoveOptions: AddEventListenerOptions = { passive: false }

  window.addEventListener('pointerdown', handlePointerDown)
  window.addEventListener('pointermove', handlePointerMove, pointerMoveOptions)
  window.addEventListener('pointerup', handlePointerEnd)
  window.addEventListener('pointercancel', handlePointerEnd)
  window.addEventListener('blur', handleWindowBlur)

  function animate(time = 0) {
    animationFrameId = requestAnimationFrame(animate)
    const deltaTime = previousAnimationTime === 0 ? 16 : Math.min(time - previousAnimationTime, 64)
    previousAnimationTime = time

    if (!isDragging && Math.abs(orbitVelocity) > 0.000001) {
      orbitState.offset += orbitVelocity * deltaTime
      orbitVelocity *= Math.exp(-inertiaDamping * deltaTime)
    }
    else if (!isDragging) {
      orbitVelocity = 0
    }

    const targetCardYaw = THREE.MathUtils.clamp(orbitVelocity * cardYawVelocityMultiplier, -maxCardYaw, maxCardYaw)
    const frameScale = deltaTime / 16
    cardYawVelocity += (targetCardYaw - orbitState.cardYaw) * cardYawSpring * frameScale
    cardYawVelocity *= Math.exp(-cardYawDamping * deltaTime)
    orbitState.cardYaw += cardYawVelocity * frameScale

    // controls.update()
    camera.lookAt(scene.position)
    composer.render()
  }
  animate()
  loading.value = false

  function handleResize() {
    if (!threeSceneRef.value) {
      return
    }
    // 更新相机的纵横比
    camera.aspect = threeSceneRef.value.clientWidth / threeSceneRef.value.clientHeight

    // 更新相机的投影矩阵
    camera.updateProjectionMatrix()
    renderer.setSize(threeSceneRef.value.clientWidth, threeSceneRef.value.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    composer.setSize(threeSceneRef.value.clientWidth, threeSceneRef.value.clientHeight)
    bokehPass.setSize(threeSceneRef.value.clientWidth, threeSceneRef.value.clientHeight)
  }

  window.addEventListener('resize', handleResize, false)

  disposeThreeScene = () => {
    cancelAnimationFrame(animationFrameId)
    window.removeEventListener('resize', handleResize, false)
    window.removeEventListener('pointerdown', handlePointerDown)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerEnd)
    window.removeEventListener('pointercancel', handlePointerEnd)
    window.removeEventListener('blur', handleWindowBlur)
    document.body.style.cursor = ''
    document.body.style.touchAction = previousBodyTouchAction
    renderer.dispose()
  }
})
</script>

<template>
  <div class="absolute inset-0 z-0 h-screen w-full">
    <!-- Loading overlay -->
    <div
      v-if="loading"
      class="absolute z-30 h-full w-full flex items-center justify-center from-neutral-100 to-neutral-200 bg-gradient-to-br"
    >
      <div class="text-center">
        <div class="loading-spinner mx-auto mb-4" />
        <p class="animate-pulse text-sm text-neutral-600">
          Loading artwork...
        </p>
      </div>
    </div>

    <!-- Three.js scene -->
    <div
      ref="threeSceneRef"
      class="h-full w-full transition-all duration-1000"
      :class="{
        'opacity-0': loading,
        'opacity-100': !loading,
      }"
    />
  </div>
</template>
