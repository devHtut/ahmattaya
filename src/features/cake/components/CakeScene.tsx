import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { CakeRecipe } from '../../../shared/models/cake'
import { buildCake, disposeCake } from '../lib/build-cake'

interface Runtime {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  renderer: THREE.WebGLRenderer
  render: () => void
  cake: THREE.Group | null
}
export default function CakeScene({
  recipe,
  onFailure,
}: {
  recipe: CakeRecipe
  onFailure: () => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const runtime = useRef<Runtime | null>(null)
  useEffect(() => {
    const container = host.current
    if (!container) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      onFailure()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30)
    camera.position.set(4, 3.5, 5.5)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0.7, 0)
    controls.enablePan = false
    controls.enableDamping = false
    controls.minDistance = 4
    controls.maxDistance = 10
    controls.minPolarAngle = 0.2
    controls.maxPolarAngle = Math.PI / 2
    controls.update()
    const ambient = new THREE.HemisphereLight(0xffffff, 0xb8a9b9, 2.2)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xfff3e2, 3)
    key.position.set(3, 6, 4)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -3
    key.shadow.camera.right = 3
    key.shadow.camera.top = 4
    key.shadow.camera.bottom = -3
    key.shadow.bias = -0.001
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xe3d8ff, 1.3)
    fill.position.set(-3, 2, -2)
    scene.add(fill)
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(3.8, 64),
      new THREE.ShadowMaterial({ opacity: 0.15 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.49
    ground.receiveShadow = true
    scene.add(ground)
    const render = () => renderer.render(scene, camera)
    controls.addEventListener('change', render)
    container.appendChild(renderer.domElement)
    const state: Runtime = {
      scene,
      camera,
      controls,
      renderer,
      render,
      cake: null,
    }
    runtime.current = state
    const resize = () => {
      const width = container.clientWidth,
        height = container.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      render()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()
    const lost = (event: Event) => {
      event.preventDefault()
      onFailure()
    }
    renderer.domElement.addEventListener('webglcontextlost', lost)
    return () => {
      observer.disconnect()
      controls.removeEventListener('change', render)
      controls.dispose()
      renderer.domElement.removeEventListener('webglcontextlost', lost)
      if (state.cake) disposeCake(state.cake)
      ground.geometry.dispose()
      ground.material.dispose()
      key.shadow.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      runtime.current = null
    }
  }, [onFailure])
  useEffect(() => {
    const state = runtime.current
    if (!state) return
    const next = buildCake(recipe)
    if (state.cake) {
      state.scene.remove(state.cake)
      disposeCake(state.cake)
    }
    state.cake = next
    state.scene.add(next)
    state.render()
  }, [recipe])
  return (
    <div className="cake-scene-shell">
      <div
        className="cake-scene"
        ref={host}
        role="img"
        aria-label={`${recipe.flavor} cake ${recipe.tiers} ထပ် 3D preview`}
      />
      <button
        className="button secondary cake-rotate-view"
        onClick={() => {
          const state = runtime.current
          if (!state) return
          state.camera.position.applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            Math.PI / 6,
          )
          state.controls.update()
          state.render()
        }}
      >
        Cake လှည့်ကြည့်မယ်
      </button>
      <button
        className="button secondary cake-reset-view"
        onClick={() => {
          const state = runtime.current
          if (!state) return
          state.camera.position.set(4, 3.5, 5.5)
          state.controls.target.set(0, 0.7, 0)
          state.controls.update()
          state.render()
        }}
      >
        မြင်ကွင်း ပြန်ညှိမယ်
      </button>
    </div>
  )
}
