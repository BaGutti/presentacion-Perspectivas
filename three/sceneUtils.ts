import * as THREE from 'three'

export type SceneCleanup = () => void

export interface SceneContext {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  clock: THREE.Clock
}

export function createBaseContext(canvas: HTMLCanvasElement): SceneContext {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 1)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  )
  camera.position.z = 5

  const clock = new THREE.Clock()
  return { renderer, scene, camera, clock }
}

export function addResizeHandler(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera
): () => void {
  const handle = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', handle)
  return () => window.removeEventListener('resize', handle)
}

export function makeParticles(
  count: number,
  spread: number,
  color: number,
  size = 0.03
): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const c = new THREE.Color(color)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread
    const brightness = 0.5 + Math.random() * 0.5
    colors[i * 3] = c.r * brightness
    colors[i * 3 + 1] = c.g * brightness
    colors[i * 3 + 2] = c.b * brightness
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
  })

  return new THREE.Points(geo, mat)
}

export function hexToThreeColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}
