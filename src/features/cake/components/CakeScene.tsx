import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  MAX_CREAM_STROKES,
  type CakeRecipe,
  type CakePoint,
  type CreamStroke,
} from '../../../shared/models/cake'
import { buildCreamStroke } from '../lib/build-decorations'
import { appendPoint, insideSurface, tierRadii } from '../lib/surface'
import type { CakeEditorSession } from '../lib/useCakeEditor'
import { buildCake, disposeCake } from '../lib/build-cake'

interface Runtime {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  renderer: THREE.WebGLRenderer
  render: () => void
  cake: THREE.Group | null
  cancelGesture?: () => void
}
export default function CakeScene({
  recipe,
  onFailure,
  editor,
  extinguishedCandleIds = [],
  onToggleCandle,
}: {
  recipe: CakeRecipe
  onFailure: () => void
  editor?: CakeEditorSession
  extinguishedCandleIds?: string[]
  onToggleCandle?: (candleId: string) => void
}) {
  const selectedId = editor?.tools.selectedId
  const mode = editor?.tools.mode ?? 'orbit'
  const host = useRef<HTMLDivElement>(null)
  const runtime = useRef<Runtime | null>(null)
  const latest = useRef({ recipe, editor, onToggleCandle })
  useEffect(() => {
    latest.current = { recipe, editor, onToggleCandle }
  }, [recipe, editor, onToggleCandle])
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
    type Gesture = {
      pointerId: number
      kind: 'cream' | 'new-candle' | 'move-candle'
      points: CakePoint[]
      color: string
      width: number
      candleId?: string
      original?: CakePoint
    }
    let gesture: Gesture | null = null
    let live: THREE.Object3D | null = null
    let frame: number | null = null
    const raycaster = new THREE.Raycaster()
    const pointAt = (event: PointerEvent): CakePoint | null => {
      const rect = renderer.domElement.getBoundingClientRect()
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      )
      const config = latest.current.recipe
      const hit = raycaster.ray.intersectPlane(
        new THREE.Plane(new THREE.Vector3(0, 1, 0), -config.tiers * 0.67),
        new THREE.Vector3(),
      )
      if (!hit) return null
      const radius = tierRadii[config.tiers - 1],
        point = { x: hit.x / radius, z: hit.z / radius }
      return insideSurface(point) ? point : null
    }
    const clearLive = () => {
      if (live) {
        scene.remove(live)
        disposeCake(live)
        live = null
      }
    }
    const cancel = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
        frame = null
      }
      clearLive()
      if (gesture?.candleId && gesture.original) {
        const object = state.cake?.getObjectByName(`candle:${gesture.candleId}`)
        const radius = tierRadii[latest.current.recipe.tiers - 1]
        object?.position.set(
          gesture.original.x * radius,
          latest.current.recipe.tiers * 0.67,
          gesture.original.z * radius,
        )
      }
      const pointer = gesture?.pointerId
      gesture = null
      if (
        pointer !== undefined &&
        renderer.domElement.hasPointerCapture(pointer)
      )
        renderer.domElement.releasePointerCapture(pointer)
      render()
    }
    state.cancelGesture = cancel
    const draw = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        if (!gesture || gesture.kind !== 'cream') return
        clearLive()
        live = buildCreamStroke(
          {
            id: 'live',
            color: gesture.color,
            width: gesture.width,
            points: gesture.points,
          },
          latest.current.recipe,
        )
        scene.add(live)
        render()
      })
    }
    let tapStart: { x: number; y: number } | null = null
    const down = (event: PointerEvent) => {
      const session = latest.current.editor
      if (!session) {
        if (event.isPrimary && event.button === 0) {
          tapStart = { x: event.clientX, y: event.clientY }
        }
        return
      }
      if (
        session.tools.mode === 'orbit' ||
        !event.isPrimary ||
        event.button !== 0 ||
        gesture
      )
        return
      if (
        session.tools.mode === 'cream' &&
        latest.current.recipe.strokes.length >= MAX_CREAM_STROKES
      )
        return
      const point = pointAt(event)
      if (!point) return
      event.preventDefault()
      event.stopImmediatePropagation()
      renderer.domElement.setPointerCapture(event.pointerId)
      if (session.tools.mode === 'cream') {
        gesture = {
          pointerId: event.pointerId,
          kind: 'cream',
          points: [point],
          color: session.tools.brushColor,
          width: session.tools.brushWidth,
        }
        draw()
        return
      }
      const hit = state.cake
        ? raycaster
          .intersectObject(state.cake, true)
          .find((item) => typeof item.object.userData.candleId === 'string')
        : undefined
      const id = hit?.object.userData.candleId as string | undefined
      const candle = latest.current.recipe.candles.find(
        (item) => item.id === id,
      )
      session.actions.onSelectCandle(id ?? null)
      gesture = {
        pointerId: event.pointerId,
        kind: candle ? 'move-candle' : 'new-candle',
        points: [point],
        color: '',
        width: 0,
        candleId: candle?.id,
        original: candle?.position,
      }
    }
    const move = (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return
      const point = pointAt(event)
      if (!point) return
      if (gesture.kind === 'cream') {
        gesture.points = appendPoint(gesture.points, point)
        draw()
      } else {
        gesture.points = [point]
        if (gesture.candleId) {
          const object = state.cake?.getObjectByName(
            `candle:${gesture.candleId}`,
          )
          const radius = tierRadii[latest.current.recipe.tiers - 1]
          object?.position.set(
            point.x * radius,
            latest.current.recipe.tiers * 0.67,
            point.z * radius,
          )
          render()
        }
      }
    }
    const up = (event: PointerEvent) => {
      const session = latest.current.editor
      if (!session && tapStart) {
        const dx = Math.abs(event.clientX - tapStart.x)
        const dy = Math.abs(event.clientY - tapStart.y)
        tapStart = null
        if (dx < 8 && dy < 8 && state.cake && latest.current.onToggleCandle) {
          const rect = renderer.domElement.getBoundingClientRect()
          raycaster.setFromCamera(
            new THREE.Vector2(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
              (-(event.clientY - rect.top) / rect.height) * 2 + 1,
            ),
            camera,
          )
          const hit = raycaster
            .intersectObject(state.cake, true)
            .find((item) => typeof item.object.userData.candleId === 'string')
          const id = hit?.object.userData.candleId as string | undefined
          if (id) {
            latest.current.onToggleCandle(id)
          }
        }
        return
      }
      if (!gesture || event.pointerId !== gesture.pointerId) return
      const completed = gesture
      const point = pointAt(event) ?? completed.points.at(-1)!
      cancel()
      if (completed.kind === 'cream')
        session?.actions.onStroke({
          id: crypto.randomUUID(),
          color: completed.color,
          width: completed.width,
          points: completed.points,
        } satisfies CreamStroke)
      else if (completed.candleId)
        session?.actions.onMoveCandle(completed.candleId, point)
      else session?.actions.onAddCandle(point)
    }
    renderer.domElement.addEventListener('pointerdown', down, true)
    renderer.domElement.addEventListener('pointermove', move)
    renderer.domElement.addEventListener('pointerup', up)
    renderer.domElement.addEventListener('pointercancel', cancel)
    renderer.domElement.addEventListener('lostpointercapture', cancel)
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
      cancel()
      renderer.domElement.removeEventListener('pointerdown', down, true)
      renderer.domElement.removeEventListener('pointermove', move)
      renderer.domElement.removeEventListener('pointerup', up)
      renderer.domElement.removeEventListener('pointercancel', cancel)
      renderer.domElement.removeEventListener('lostpointercapture', cancel)
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
    const selected = selectedId
      ? recipe.candles.find((item) => item.id === selectedId)
      : undefined
    if (selected) {
      const marker = new THREE.Mesh(
        new THREE.TorusGeometry(0.095, 0.009, 6, 32),
        new THREE.MeshBasicMaterial({ color: '#8b5cf6' }),
      )
      marker.rotation.x = Math.PI / 2
      const radius = tierRadii[recipe.tiers - 1]
      marker.position.set(
        selected.position.x * radius,
        recipe.tiers * 0.67 + 0.02,
        selected.position.z * radius,
      )
      next.add(marker)
    }
    for (const candle of recipe.candles) {
      if (extinguishedCandleIds.includes(candle.id)) {
        const candleObj = next.getObjectByName(`candle:${candle.id}`)
        const flame = candleObj?.getObjectByName('flame')
        if (flame) flame.visible = false
      }
    }
    state.cake = next
    state.scene.add(next)
    state.render()
  }, [recipe, selectedId, extinguishedCandleIds])
  useEffect(() => {
    const state = runtime.current
    if (!state) return
    state.cancelGesture?.()
    const editing = mode !== 'orbit'
    state.controls.enabled = !editing
    state.controls.minPolarAngle = editing ? 0 : 0.2
    state.controls.minDistance = editing ? 1 : 4
    if (editing) {
      state.controls.target.set(0, recipe.tiers * 0.67, 0)
      state.camera.position.set(
        0,
        recipe.tiers * 0.67 + tierRadii[recipe.tiers - 1] * 4.5,
        0.001,
      )
    } else {
      state.controls.target.set(0, 0.7, 0)
      state.camera.position.set(4, 3.5, 5.5)
    }
    state.controls.update()
    state.render()
  }, [mode, recipe.tiers])
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
        disabled={mode !== 'orbit'}
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
        disabled={mode !== 'orbit'}
        onClick={() => {
          const state = runtime.current
          if (!state) return
          state.camera.position.set(4, 3.5, 5.5)
          state.controls.target.set(0, 0.7, 0)
          state.controls.update()
          state.render()
        }}
      >
        Reset
      </button>
    </div>
  )
}
