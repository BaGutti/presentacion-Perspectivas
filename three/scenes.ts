import * as THREE from 'three'
import {
  createBaseContext,
  addResizeHandler,
  makeParticles,
  SceneCleanup,
} from './sceneUtils'

// ─── SLIDE 01: Portada — Galaxia dorada ──────────────────────────────────────
export function scene01(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 4

  const count = 6000
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const r = Math.random() * 8
    const theta = Math.random() * Math.PI * 2
    const phi = (Math.random() - 0.5) * 0.6
    pos[i * 3] = r * Math.cos(theta) * Math.cos(phi)
    pos[i * 3 + 1] = r * Math.sin(phi) * 1.2
    pos[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi) - 3
    const t = Math.random()
    col[i * 3] = 0.8 + t * 0.2
    col[i * 3 + 1] = 0.6 + t * 0.3
    col[i * 3 + 2] = 0.1 + t * 0.2
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const mat = new THREE.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true, opacity: 0.9 })
  const points = new THREE.Points(geo, mat)
  scene.add(points)

  // Core glow
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.15 })
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), coreMat)
  scene.add(core)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    points.rotation.y = t * 0.04
    points.rotation.x = Math.sin(t * 0.02) * 0.1
    core.material.opacity = 0.1 + Math.sin(t * 1.5) * 0.07
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 02: Crisis del método — Caos y orden ──────────────────────────────
export function scene02(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 6

  const count = 3000
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const vel = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 12
    pos[i * 3 + 1] = (Math.random() - 0.5) * 12
    pos[i * 3 + 2] = (Math.random() - 0.5) * 4
    vel[i * 3] = (Math.random() - 0.5) * 0.02
    vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02
    vel[i * 3 + 2] = 0
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

  const mat = new THREE.PointsMaterial({ size: 0.04, color: 0xff4444, transparent: true, opacity: 0.7 })
  const points = new THREE.Points(geo, mat)
  scene.add(points)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    const arr = geo.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3] += vel[i * 3] * (1 - Math.min(t / 8, 0.85))
      arr[i * 3 + 1] += vel[i * 3 + 1] * (1 - Math.min(t / 8, 0.85))
      if (Math.abs(arr[i * 3]) > 6) vel[i * 3] *= -1
      if (Math.abs(arr[i * 3 + 1]) > 6) vel[i * 3 + 1] *= -1
    }
    geo.attributes.position.needsUpdate = true
    const r = Math.max(0.2, 1 - t / 10)
    ;(mat as THREE.PointsMaterial).color.setRGB(r + 0.5, 0.3 * (1 - r), 0.1)
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 03: Descartes/Cogito — Plano cartesiano ───────────────────────────
export function scene03(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.set(3, 2, 5)
  camera.lookAt(0, 0, 0)

  // Axes
  const axisGeo = (from: THREE.Vector3, to: THREE.Vector3) => {
    const g = new THREE.BufferGeometry().setFromPoints([from, to])
    return g
  }
  const axisMat = new THREE.LineBasicMaterial({ color: 0x2980b9, transparent: true, opacity: 0.6 })
  scene.add(new THREE.Line(axisGeo(new THREE.Vector3(-4, 0, 0), new THREE.Vector3(4, 0, 0)), axisMat))
  scene.add(new THREE.Line(axisGeo(new THREE.Vector3(0, -4, 0), new THREE.Vector3(0, 4, 0)), axisMat))
  scene.add(new THREE.Line(axisGeo(new THREE.Vector3(0, 0, -4), new THREE.Vector3(0, 0, 4)), axisMat))

  // Grid points
  const pts = makeParticles(2000, 8, 0x4a90d9, 0.025)
  scene.add(pts)

  // Floating sphere (the thinking subject)
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 })
  )
  scene.add(sphere)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    pts.rotation.y = t * 0.08
    sphere.position.set(Math.sin(t * 0.4) * 1.5, Math.cos(t * 0.3) * 0.8, Math.sin(t * 0.5) * 0.5)
    sphere.rotation.y = t * 0.5
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 04: Descartes/Dualismo — Dos esferas ──────────────────────────────
export function scene04(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 6

  // Soul (blue, left)
  const soulGeo = new THREE.BufferGeometry()
  const sp = new Float32Array(1500 * 3)
  for (let i = 0; i < 1500; i++) {
    const r = 1.2 + Math.random() * 0.4
    const t = Math.random() * Math.PI * 2
    const p = Math.random() * Math.PI
    sp[i*3] = -2.5 + r * Math.sin(p) * Math.cos(t)
    sp[i*3+1] = r * Math.sin(p) * Math.sin(t)
    sp[i*3+2] = r * Math.cos(p)
  }
  soulGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3))
  const soulPts = new THREE.Points(soulGeo, new THREE.PointsMaterial({ size: 0.04, color: 0x5dade2, transparent: true, opacity: 0.8 }))
  scene.add(soulPts)

  // Body (red, right)
  const bodyGeo = new THREE.BufferGeometry()
  const bp = new Float32Array(1500 * 3)
  for (let i = 0; i < 1500; i++) {
    const r = 1.2 + Math.random() * 0.4
    const t = Math.random() * Math.PI * 2
    const p = Math.random() * Math.PI
    bp[i*3] = 2.5 + r * Math.sin(p) * Math.cos(t)
    bp[i*3+1] = r * Math.sin(p) * Math.sin(t)
    bp[i*3+2] = r * Math.cos(p)
  }
  bodyGeo.setAttribute('position', new THREE.BufferAttribute(bp, 3))
  const bodyPts = new THREE.Points(bodyGeo, new THREE.PointsMaterial({ size: 0.04, color: 0xe74c3c, transparent: true, opacity: 0.8 }))
  scene.add(bodyPts)

  // Connection beam (pineal gland)
  const beamGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-1.2, 0, 0),
    new THREE.Vector3(1.2, 0, 0),
  ])
  const beam = new THREE.Line(beamGeo, new THREE.LineBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.4 }))
  scene.add(beam)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    soulPts.rotation.y = t * 0.15
    bodyPts.rotation.y = -t * 0.12
    ;(beam.material as THREE.LineBasicMaterial).opacity = 0.2 + Math.sin(t * 2) * 0.3
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 05: Precursores — Tres orbes orbitando ────────────────────────────
export function scene05(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 7

  const colors = [0x27ae60, 0xf39c12, 0x8e44ad]
  const orbs: THREE.Points[] = []

  colors.forEach((color, idx) => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(800 * 3)
    for (let i = 0; i < 800; i++) {
      const r = 0.5 + Math.random() * 0.2
      const t = Math.random() * Math.PI * 2
      const p = Math.random() * Math.PI
      pos[i*3] = r * Math.sin(p) * Math.cos(t)
      pos[i*3+1] = r * Math.sin(p) * Math.sin(t)
      pos[i*3+2] = r * Math.cos(p)
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const orb = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.035, color, transparent: true, opacity: 0.85 }))
    orbs.push(orb)
    scene.add(orb)
  })

  // Orbit rings
  const ringColors = [0x27ae60, 0xf39c12, 0x8e44ad]
  ringColors.forEach((color, idx) => {
    const rGeo = new THREE.RingGeometry(2.5 + idx * 0.8, 2.51 + idx * 0.8, 128)
    const rMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.15 })
    const ring = new THREE.Mesh(rGeo, rMat)
    ring.rotation.x = Math.PI / 2 + idx * 0.3
    scene.add(ring)
  })

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    orbs.forEach((orb, idx) => {
      const speed = 0.3 + idx * 0.15
      const radius = 2.5 + idx * 0.8
      orb.position.x = Math.cos(t * speed) * radius
      orb.position.y = Math.sin(t * speed * 0.5) * 0.8
      orb.position.z = Math.sin(t * speed) * radius * 0.3
      orb.rotation.y = t * 0.5
    })
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 06: Comenio/Vida — Rutas de luz ───────────────────────────────────
export function scene06(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 5
  scene.fog = new THREE.FogExp2(0x000000, 0.08)

  // Stars background
  const stars = makeParticles(3000, 20, 0x888888, 0.015)
  scene.add(stars)

  // Trail particles simulating journeys
  const trailCount = 400
  const trailGeo = new THREE.BufferGeometry()
  const trailPos = new Float32Array(trailCount * 3)
  const trailCol = new Float32Array(trailCount * 3)
  const trailPhases = new Float32Array(trailCount)

  for (let i = 0; i < trailCount; i++) {
    trailPhases[i] = Math.random() * Math.PI * 2
    trailPos[i*3] = 0; trailPos[i*3+1] = 0; trailPos[i*3+2] = 0
    trailCol[i*3] = 0.9 + Math.random() * 0.1
    trailCol[i*3+1] = 0.6 + Math.random() * 0.2
    trailCol[i*3+2] = 0.1
  }
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
  trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3))
  const trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.9 }))
  scene.add(trail)

  // Destination points (cities)
  const cities = [[-3,1,0],[2,0.5,0],[-1,-1,0],[3,-0.5,0],[-2,-2,0],[1,2,0],[0,0,0]]
  cities.forEach(([x,y,z]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06,16,16), new THREE.MeshBasicMaterial({color:0xffd700}))
    m.position.set(x,y,z)
    scene.add(m)
  })

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    const arr = trailGeo.attributes.position.array as Float32Array
    for (let i = 0; i < trailCount; i++) {
      const phase = trailPhases[i] + t * 0.3
      const cityIdx = Math.floor(trailPhases[i] / (Math.PI * 2) * cities.length) % cities.length
      const nextIdx = (cityIdx + 1) % cities.length
      const prog = (phase % (Math.PI * 2)) / (Math.PI * 2)
      const cx = cities[cityIdx], nx = cities[nextIdx]
      arr[i*3] = cx[0] + (nx[0] - cx[0]) * prog
      arr[i*3+1] = cx[1] + (nx[1] - cx[1]) * prog + Math.sin(prog * Math.PI) * 0.5
      arr[i*3+2] = 0
    }
    trailGeo.attributes.position.needsUpdate = true
    stars.rotation.y = t * 0.01
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 07: Comenio/Pansofía — Red neuronal ───────────────────────────────
export function scene07(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 6

  const nodeCount = 60
  const nodes: THREE.Vector3[] = []
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 3
    ))
  }

  // Node meshes
  const nodeMeshes: THREE.Mesh[] = []
  nodes.forEach(pos => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xf39c12, transparent: true, opacity: 0.9 })
    )
    m.position.copy(pos)
    scene.add(m)
    nodeMeshes.push(m)
  })

  // Connections
  const lines: THREE.Line[] = []
  nodes.forEach((a, i) => {
    nodes.forEach((b, j) => {
      if (j <= i) return
      if (a.distanceTo(b) < 2.5) {
        const geo = new THREE.BufferGeometry().setFromPoints([a, b])
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.2 }))
        scene.add(line)
        lines.push(line)
      }
    })
  })

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    nodeMeshes.forEach((m, i) => {
      m.position.y = nodes[i].y + Math.sin(t * 0.5 + i * 0.3) * 0.15
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(t + i) * 0.4
    })
    lines.forEach((l, i) => {
      ;(l.material as THREE.LineBasicMaterial).opacity = 0.05 + Math.sin(t * 0.7 + i * 0.2) * 0.15
    })
    camera.position.x = Math.sin(t * 0.1) * 1
    camera.position.y = Math.cos(t * 0.08) * 0.5
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 08: Comenio/Método — Espiral de Fibonacci ─────────────────────────
export function scene08(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 5

  const count = 1200
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const phi = (1 + Math.sqrt(5)) / 2

  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(i / count) * 4
    const theta = i * phi * Math.PI * 2
    pos[i*3] = r * Math.cos(theta)
    pos[i*3+1] = r * Math.sin(theta)
    pos[i*3+2] = (i / count - 0.5) * 2
    const t = i / count
    col[i*3] = 0.09 * (1 - t) + 0.95 * t
    col[i*3+1] = 0.63 * (1 - t) + 0.77 * t
    col[i*3+2] = 0.0 * (1 - t) + 0.07 * t
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.9 }))
  scene.add(pts)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    pts.rotation.z = t * 0.1
    pts.rotation.x = Math.sin(t * 0.2) * 0.3
    camera.position.z = 4 + Math.sin(t * 0.3) * 1
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 09: Jansenismo — Rayos de luz de catedral ─────────────────────────
export function scene09(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 4
  renderer.setClearColor(0x01030a, 1)

  const rayCount = 7
  const rays: THREE.Mesh[] = []
  for (let i = 0; i < rayCount; i++) {
    const x = (i - rayCount / 2) * 0.8
    const geo = new THREE.ConeGeometry(0.3 + Math.random() * 0.2, 8, 8, 1, true)
    const mat = new THREE.MeshBasicMaterial({
      color: 0xc8a84b,
      transparent: true,
      opacity: 0.04 + Math.random() * 0.04,
      side: THREE.DoubleSide,
    })
    const ray = new THREE.Mesh(geo, mat)
    ray.position.set(x, 2, 0)
    ray.rotation.z = (Math.random() - 0.5) * 0.3
    rays.push(ray)
    scene.add(ray)
  }

  // Dust particles in beams
  const dustGeo = new THREE.BufferGeometry()
  const dustPos = new Float32Array(2000 * 3)
  for (let i = 0; i < 2000; i++) {
    dustPos[i*3] = (Math.random() - 0.5) * 6
    dustPos[i*3+1] = (Math.random() - 0.5) * 8
    dustPos[i*3+2] = Math.random() * 2 - 1
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.015, color: 0xd4af37, transparent: true, opacity: 0.4 }))
  scene.add(dust)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    rays.forEach((r, i) => {
      ;(r.material as THREE.MeshBasicMaterial).opacity = 0.03 + Math.sin(t * 0.5 + i) * 0.02
    })
    const dp = dustGeo.attributes.position.array as Float32Array
    for (let i = 0; i < 2000; i++) {
      dp[i*3+1] -= 0.003
      if (dp[i*3+1] < -4) dp[i*3+1] = 4
    }
    dustGeo.attributes.position.needsUpdate = true
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 10: Pascal — Razón vs Corazón ─────────────────────────────────────
export function scene10(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 6

  // Left: cold reason (blue/white)
  const lGeo = new THREE.BufferGeometry()
  const lPos = new Float32Array(2000 * 3)
  for (let i = 0; i < 2000; i++) {
    lPos[i*3] = -3 + (Math.random() - 0.5) * 3
    lPos[i*3+1] = (Math.random() - 0.5) * 6
    lPos[i*3+2] = (Math.random() - 0.5) * 2
  }
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3))
  const lPts = new THREE.Points(lGeo, new THREE.PointsMaterial({ size: 0.025, color: 0x85c1e9, transparent: true, opacity: 0.6 }))
  scene.add(lPts)

  // Right: warm heart (gold/red)
  const rGeo = new THREE.BufferGeometry()
  const rPos = new Float32Array(2000 * 3)
  for (let i = 0; i < 2000; i++) {
    rPos[i*3] = 3 + (Math.random() - 0.5) * 3
    rPos[i*3+1] = (Math.random() - 0.5) * 6
    rPos[i*3+2] = (Math.random() - 0.5) * 2
  }
  rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3))
  const rPts = new THREE.Points(rGeo, new THREE.PointsMaterial({ size: 0.03, color: 0xe74c3c, transparent: true, opacity: 0.7 }))
  scene.add(rPts)

  // Dividing line
  const divGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-4,0), new THREE.Vector3(0,4,0)])
  const div = new THREE.Line(divGeo, new THREE.LineBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.4 }))
  scene.add(div)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    lPts.rotation.z = t * 0.05
    rPts.rotation.z = -t * 0.07
    ;(lPts.material as THREE.PointsMaterial).opacity = 0.4 + Math.sin(t * 0.5) * 0.2
    ;(rPts.material as THREE.PointsMaterial).opacity = 0.4 + Math.cos(t * 0.7) * 0.3
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 11: La Salle — Convergencia ───────────────────────────────────────
export function scene11(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 6

  const count = 2500
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const origins = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = 5 + Math.random() * 3
    origins[i*3] = r * Math.cos(angle)
    origins[i*3+1] = r * Math.sin(angle)
    origins[i*3+2] = (Math.random() - 0.5) * 4
    pos[i*3] = origins[i*3]; pos[i*3+1] = origins[i*3+1]; pos[i*3+2] = origins[i*3+2]
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.04, color: 0x1abc9c, transparent: true, opacity: 0.8 }))
  scene.add(pts)

  // Center glow
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.15,16,16), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.8}))
  scene.add(center)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    const arr = geo.attributes.position.array as Float32Array
    const progress = (Math.sin(t * 0.4) * 0.5 + 0.5)
    for (let i = 0; i < count; i++) {
      arr[i*3] = origins[i*3] * (1 - progress * 0.7)
      arr[i*3+1] = origins[i*3+1] * (1 - progress * 0.7)
    }
    geo.attributes.position.needsUpdate = true
    center.material.opacity = 0.4 + progress * 0.6
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 12: Hobbes — Choque de partículas ─────────────────────────────────
export function scene12(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 7
  renderer.setClearColor(0x050000, 1)

  const count = 2000
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const vel = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    pos[i*3] = (Math.random() - 0.5) * 10
    pos[i*3+1] = (Math.random() - 0.5) * 8
    pos[i*3+2] = (Math.random() - 0.5) * 3
    vel[i*3] = (Math.random() - 0.5) * 0.05
    vel[i*3+1] = (Math.random() - 0.5) * 0.05
    vel[i*3+2] = 0
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ size: 0.05, color: 0xff2200, transparent: true, opacity: 0.7 })
  const pts = new THREE.Points(geo, mat)
  scene.add(pts)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const arr = geo.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i*3] += vel[i*3]
      arr[i*3+1] += vel[i*3+1]
      if (Math.abs(arr[i*3]) > 5) vel[i*3] *= -1
      if (Math.abs(arr[i*3+1]) > 4) vel[i*3+1] *= -1
    }
    geo.attributes.position.needsUpdate = true
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 13: Spinoza — Deus sive Natura ────────────────────────────────────
export function scene13(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 5

  const count = 5000
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    // Torus-like distribution (one substance)
    const u = Math.random() * Math.PI * 2
    const v = Math.random() * Math.PI * 2
    const R = 2.5, r = 1.2
    pos[i*3] = (R + r * Math.cos(v)) * Math.cos(u)
    pos[i*3+1] = (R + r * Math.cos(v)) * Math.sin(u)
    pos[i*3+2] = r * Math.sin(v)
    const t = Math.random()
    col[i*3] = 0.18 * (1-t) + 0.1 * t
    col[i*3+1] = 0.53 * (1-t) + 0.75 * t
    col[i*3+2] = 0.75 * (1-t) + 0.9 * t
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true, opacity: 0.8 }))
  scene.add(pts)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    pts.rotation.y = t * 0.12
    pts.rotation.x = Math.sin(t * 0.1) * 0.2
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 14: Locke/Tabula Rasa — Superficie vacía ──────────────────────────
export function scene14(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.set(0, 3, 6)
  camera.lookAt(0, 0, 0)

  // Flat plane (tabula rasa)
  const planeGeo = new THREE.PlaneGeometry(10, 8, 40, 32)
  const planeMat = new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true, transparent: true, opacity: 0.15 })
  const plane = new THREE.Mesh(planeGeo, planeMat)
  scene.add(plane)

  // Particles that appear over time
  const count = 2500
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const times = new Float32Array(count) // spawn time

  for (let i = 0; i < count; i++) {
    pos[i*3] = (Math.random() - 0.5) * 9
    pos[i*3+1] = (Math.random() - 0.5) * 0.3
    pos[i*3+2] = (Math.random() - 0.5) * 7
    times[i] = Math.random() * 15
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.04, color: 0x2980b9, transparent: true, opacity: 0.0 }))
  scene.add(pts)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    const visibleFrac = Math.min(t / 12, 1)
    ;(pts.material as THREE.PointsMaterial).opacity = visibleFrac * 0.8
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 15: Locke/Educación — Partículas lúdicas ──────────────────────────
export function scene15(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 7

  const count = 1200
  const radii = new Float32Array(count)
  const speeds = new Float32Array(count)
  const offsets = new Float32Array(count)
  const heights = new Float32Array(count)
  const colors = new Float32Array(count * 3)

  const palette = [0x27ae60, 0xf39c12, 0x2980b9, 0xe74c3c, 0x8e44ad, 0x1abc9c]

  for (let i = 0; i < count; i++) {
    radii[i] = 0.5 + Math.random() * 3.5
    speeds[i] = 0.2 + Math.random() * 0.8
    offsets[i] = Math.random() * Math.PI * 2
    heights[i] = (Math.random() - 0.5) * 4
    const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)])
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b
  }

  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.9 }))
  scene.add(pts)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    const arr = geo.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const angle = t * speeds[i] + offsets[i]
      arr[i*3] = Math.cos(angle) * radii[i]
      arr[i*3+1] = heights[i] + Math.sin(t * speeds[i] * 1.5 + offsets[i]) * 0.5
      arr[i*3+2] = Math.sin(angle) * radii[i] * 0.3
    }
    geo.attributes.position.needsUpdate = true
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 16: Leibniz/Vico — Mónadas y espiral ──────────────────────────────
export function scene16(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 7

  // Isolated monadic bubbles
  const monadCount = 20
  const monads: { mesh: THREE.Mesh; vel: THREE.Vector3 } [] = []
  for (let i = 0; i < monadCount; i++) {
    const size = 0.08 + Math.random() * 0.2
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(size, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x8e44ad, wireframe: true, transparent: true, opacity: 0.6 })
    )
    m.position.set((Math.random()-0.5)*8, (Math.random()-0.5)*6, (Math.random()-0.5)*3)
    const vel = new THREE.Vector3((Math.random()-0.5)*0.01, (Math.random()-0.5)*0.01, 0)
    monads.push({ mesh: m, vel })
    scene.add(m)
  }

  // Historical spiral (Vico)
  const spiralPts: THREE.Vector3[] = []
  for (let i = 0; i < 500; i++) {
    const t = (i / 500) * Math.PI * 6
    const r = (i / 500) * 4
    spiralPts.push(new THREE.Vector3(r * Math.cos(t), r * Math.sin(t) * 0.4, 0))
  }
  const spiralGeo = new THREE.BufferGeometry().setFromPoints(spiralPts)
  const spiral = new THREE.Line(spiralGeo, new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.5 }))
  scene.add(spiral)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    monads.forEach(({ mesh, vel }) => {
      mesh.position.add(vel)
      if (Math.abs(mesh.position.x) > 4) vel.x *= -1
      if (Math.abs(mesh.position.y) > 3) vel.y *= -1
      mesh.rotation.y = t * 0.3
    })
    spiral.rotation.z = t * 0.05
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 17: Hume — Niebla de incertidumbre ────────────────────────────────
export function scene17(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 5
  scene.fog = new THREE.FogExp2(0x000000, 0.15)

  const count = 4000
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const vel = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    pos[i*3] = (Math.random()-0.5)*10
    pos[i*3+1] = (Math.random()-0.5)*8
    pos[i*3+2] = (Math.random()-0.5)*5
    vel[i*3] = (Math.random()-0.5)*0.003
    vel[i*3+1] = (Math.random()-0.5)*0.003
    vel[i*3+2] = (Math.random()-0.5)*0.002
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.03, color: 0x7f8c8d, transparent: true, opacity: 0.45 }))
  scene.add(pts)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    const arr = geo.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i*3] += vel[i*3] + Math.sin(t * 0.2 + i) * 0.001
      arr[i*3+1] += vel[i*3+1]
      if (Math.abs(arr[i*3]) > 5) vel[i*3] *= -1
      if (Math.abs(arr[i*3+1]) > 4) vel[i*3+1] *= -1
    }
    geo.attributes.position.needsUpdate = true
    ;(pts.material as THREE.PointsMaterial).opacity = 0.3 + Math.sin(t * 0.3) * 0.15
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 18: Ilustración — Explosión de luz ────────────────────────────────
export function scene18(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 5

  const count = 5000
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const radii = new Float32Array(count)
  const angles = new Float32Array(count)
  const pAngles = new Float32Array(count) // polar angle

  for (let i = 0; i < count; i++) {
    const r = 0.1 + Math.random() * 5
    const theta = Math.random() * Math.PI * 2
    const phi = (Math.random() - 0.5) * Math.PI
    radii[i] = r
    angles[i] = theta
    pAngles[i] = phi
    pos[i*3] = r * Math.cos(theta) * Math.cos(phi)
    pos[i*3+1] = r * Math.sin(phi) * 1.5
    pos[i*3+2] = r * Math.sin(theta) * Math.cos(phi)
    const brightness = 1 - r / 5
    col[i*3] = 0.9 + brightness * 0.1
    col[i*3+1] = 0.8 + brightness * 0.1
    col[i*3+2] = 0.1 + brightness * 0.3
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.03, vertexColors: true, transparent: true, opacity: 0.9 }))
  scene.add(pts)

  // Core
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.2,16,16), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.9}))
  scene.add(core)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    const arr = geo.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const r = radii[i] + Math.sin(t * 0.5 + radii[i]) * 0.05
      const theta = angles[i] + t * (0.05 / radii[i])
      const phi = pAngles[i]
      arr[i*3] = r * Math.cos(theta) * Math.cos(phi)
      arr[i*3+1] = r * Math.sin(phi) * 1.5
      arr[i*3+2] = r * Math.sin(theta) * Math.cos(phi)
    }
    geo.attributes.position.needsUpdate = true
    core.material.opacity = 0.5 + Math.sin(t * 2) * 0.4
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 19: Proyectos Ilustrados — Red incompleta ─────────────────────────
export function scene19(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 7

  const nodeCount = 40
  const nodes: THREE.Vector3[] = []
  const nodeMeshes: THREE.Mesh[] = []

  for (let i = 0; i < nodeCount; i++) {
    const pos = new THREE.Vector3(
      (Math.random()-0.5)*10,
      (Math.random()-0.5)*7,
      (Math.random()-0.5)*2
    )
    nodes.push(pos)
    const active = Math.random() > 0.4
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 8),
      new THREE.MeshBasicMaterial({ color: active ? 0xe74c3c : 0x333333, transparent: true, opacity: active ? 0.9 : 0.3 })
    )
    m.position.copy(pos)
    scene.add(m)
    nodeMeshes.push(m)
  }

  // Broken connections
  nodes.forEach((a, i) => {
    nodes.forEach((b, j) => {
      if (j <= i) return
      if (a.distanceTo(b) < 3 && Math.random() > 0.6) {
        const broken = Math.random() > 0.4
        const geo = new THREE.BufferGeometry().setFromPoints([a, b])
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
          color: broken ? 0x333333 : 0xe74c3c,
          transparent: true,
          opacity: broken ? 0.1 : 0.3
        }))
        scene.add(line)
      }
    })
  })

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    nodeMeshes.forEach((m, i) => {
      m.position.y = nodes[i].y + Math.sin(t * 0.3 + i) * 0.1
    })
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 20: Conclusión — Gran convergencia ─────────────────────────────────
export function scene20(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 5

  const count = 8000
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const targets = new Float32Array(count * 3)
  const origins = new Float32Array(count * 3)

  const palette = [0xd4af37, 0x2980b9, 0x27ae60, 0xe74c3c, 0x8e44ad, 0xf39c12, 0x1abc9c]

  for (let i = 0; i < count; i++) {
    origins[i*3] = (Math.random()-0.5)*12
    origins[i*3+1] = (Math.random()-0.5)*10
    origins[i*3+2] = (Math.random()-0.5)*5
    // Target: spiral toward center
    const u = Math.random() * Math.PI * 2
    const r = Math.random() * 0.3
    targets[i*3] = r * Math.cos(u)
    targets[i*3+1] = r * Math.sin(u)
    targets[i*3+2] = (Math.random()-0.5)*0.2
    pos[i*3] = origins[i*3]; pos[i*3+1] = origins[i*3+1]; pos[i*3+2] = origins[i*3+2]
    const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)])
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true, opacity: 0.85 }))
  scene.add(pts)

  // Center orb
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.25,32,32), new THREE.MeshBasicMaterial({color:0xffd700, transparent:true, opacity:0}))
  scene.add(orb)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    const arr = geo.attributes.position.array as Float32Array
    const progress = Math.min(t / 20, 1)
    const ease = progress * progress * (3 - 2 * progress) // smoothstep
    for (let i = 0; i < count; i++) {
      arr[i*3] = origins[i*3] + (targets[i*3] - origins[i*3]) * ease
      arr[i*3+1] = origins[i*3+1] + (targets[i*3+1] - origins[i*3+1]) * ease
      arr[i*3+2] = origins[i*3+2] + (targets[i*3+2] - origins[i*3+2]) * ease
    }
    geo.attributes.position.needsUpdate = true
    orb.material.opacity = ease * 0.9
    pts.rotation.y = t * 0.05
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// Scene registry
export const sceneRegistry: Record<number, (canvas: HTMLCanvasElement) => SceneCleanup> = {
  1: scene01, 2: scene02, 3: scene03, 4: scene04, 5: scene05,
  6: scene06, 7: scene07, 8: scene08, 9: scene09, 10: scene10,
  11: scene11, 12: scene12, 13: scene13, 14: scene14, 15: scene15,
  16: scene16, 17: scene17, 18: scene18, 19: scene19, 20: scene20,
}
