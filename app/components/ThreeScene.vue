<script setup lang="ts">
import * as THREE from 'three'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { onMounted, ref } from 'vue'

const threeSceneRef = ref<HTMLDivElement | null>(null)
const loading = ref(true)

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

async function loadImage(imgPath: string, scene: THREE.Scene, delta = 0) {
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
    plane.position.z = Math.cos(Math.PI * 2 * (delta + time / 60_000)) * 5
    plane.position.x = Math.sin(Math.PI * 2 * (delta + time / 60_000)) * 10
    plane.position.y = Math.sin(Math.PI * 2 * (delta + time / 5000)) * 0.2
  }
  animate(0)
}

onMounted(async () => {
  if (!threeSceneRef.value) {
    return
  }

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setClearColor(new THREE.Color(0xE5_E5_E5))
  renderer.setSize(window.innerWidth, window.innerHeight)
  threeSceneRef.value.append(renderer.domElement)
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
      await loadImage(imgPath, scene, i / n)
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

  function animate() {
    requestAnimationFrame(animate)
    // controls.update()
    camera.lookAt(scene.position)
    composer.render()
  }
  animate()
  loading.value = false

  window.addEventListener('resize', () => {
    // 更新相机的纵横比
    camera.aspect = window.innerWidth / window.innerHeight

    // 更新相机的投影矩阵
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    composer.setSize(window.innerWidth, window.innerHeight)
    bokehPass.setSize(window.innerWidth, window.innerHeight)
  }, false)
})
</script>

<template>
  <div class="h-[100vh] w-[100vw] absolute z-0">
    <!-- Loading overlay -->
    <div
      v-if="loading"
      class="bg-gradient-to-br flex h-full w-full items-center justify-center absolute z-30 from-neutral-100 to-neutral-200"
    >
      <div class="text-center">
        <div class="loading-spinner mx-auto mb-4" />
        <p class="text-sm text-neutral-600 animate-pulse">
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
