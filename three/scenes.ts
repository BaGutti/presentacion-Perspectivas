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

// ─── SLIDE 02: Crisis del método — Caos → Orden → Dispersión (loop) ──────────
// Ciclo de 24s que se repite indefinidamente:
//   tc  0– 4s : caos puro (crisis escolar)
//   tc  3.5s  : pulso expansivo desde el centro (punto de inflexión)
//   tc  4–14s : partículas se organizan en anillos concéntricos giratorios
//   tc 14–19s : anillos estables (el nuevo método en acción)
//   tc 19–24s : dispersión — el orden se rompe y el ciclo recomienza
export function scene02(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 6

  const CYCLE = 24 // segundos por ciclo completo

  const count = 3000
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const vel = new Float32Array(count * 3)
  const ringAngle  = new Float32Array(count)
  const ringRadius = new Float32Array(count)
  const ringSpeed  = new Float32Array(count)

  const numRings = 7
  const perRing  = Math.floor(count / numRings)

  for (let i = 0; i < count; i++) {
    // Posición inicial caótica
    pos[i * 3]     = (Math.random() - 0.5) * 14
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14
    pos[i * 3 + 2] = (Math.random() - 0.5) * 3
    // Velocidad inicial aleatoria
    vel[i * 3]     = (Math.random() - 0.5) * 0.05
    vel[i * 3 + 1] = (Math.random() - 0.5) * 0.05
    vel[i * 3 + 2] = 0

    // Asignar anillo destino
    const ring      = Math.min(Math.floor(i / perRing), numRings - 1)
    const posInRing = i % perRing
    ringRadius[i]   = 0.45 + ring * 0.5 + (Math.random() - 0.5) * 0.1
    ringAngle[i]    = (posInRing / perRing) * Math.PI * 2 + Math.random() * 0.08
    // Anillos alternos giran en sentidos opuestos (efecto de engranaje / método)
    const speed     = 0.22 / (ring + 1)
    ringSpeed[i]    = ring % 2 === 0 ? speed : -speed * 1.15
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ size: 0.04, color: 0xe03535, transparent: true, opacity: 0.8 })
  const points = new THREE.Points(geo, mat)
  scene.add(points)

  // Esfera de pulso central — destella en el punto de inflexión de cada ciclo
  const pulseMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff7777, transparent: true, opacity: 0 })
  )
  scene.add(pulseMesh)

  // Acumulador de rotación de anillos: avanza sólo durante la fase de orden
  let ringAccum    = 0
  let prevT        = 0
  let dispersalReset = -1 // último ciclo en que se re-aleatorizaron las velocidades

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t  = clock.getElapsedTime()
    const dt = t - prevT
    prevT    = t

    const arr      = geo.attributes.position.array as Float32Array
    const cycleNum = Math.floor(t / CYCLE)
    const tc       = t % CYCLE  // tiempo dentro del ciclo actual [0, 24)

    // ── Calcular lerp según la fase del ciclo ─────────────────────────────────
    let lerp: number
    if (tc < 4) {
      lerp = 0
    } else if (tc < 14) {
      const raw = (tc - 4) / 10
      lerp = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2
    } else if (tc < 19) {
      lerp = 1
    } else {
      // Dispersión: tc de 19 a 24 → lerp de 1 a 0
      const raw = (tc - 19) / 5
      lerp = 1 - (raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2)
    }

    // ── Re-aleatorizar velocidades al inicio de la fase de dispersión ─────────
    if (tc >= 19 && dispersalReset !== cycleNum) {
      dispersalReset = cycleNum
      for (let i = 0; i < count; i++) {
        vel[i * 3]     = (Math.random() - 0.5) * 0.06
        vel[i * 3 + 1] = (Math.random() - 0.5) * 0.06
      }
    }

    // ── Avanzar acumulador de rotación de anillos (sólo cuando hay orden) ─────
    if (lerp > 0) ringAccum += dt

    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2

      // Posición destino en el anillo (rotación continua acumulada)
      const angle = ringAngle[i] + ringSpeed[i] * ringAccum
      const tx = Math.cos(angle) * ringRadius[i]
      const ty = Math.sin(angle) * ringRadius[i]

      // Movimiento caótico (se apaga al formarse el orden, vuelve al dispersarse)
      arr[ix] += vel[ix] * (1 - lerp)
      arr[iy] += vel[iy] * (1 - lerp)
      if (Math.abs(arr[ix]) > 7) vel[ix] *= -1
      if (Math.abs(arr[iy]) > 7) vel[iy] *= -1

      // Atracción hacia el anillo destino
      const pull = lerp * 0.06
      arr[ix] += (tx - arr[ix]) * pull
      arr[iy] += (ty - arr[iy]) * pull
      arr[iz] += (0  - arr[iz]) * pull
    }
    geo.attributes.position.needsUpdate = true

    // ── Pulso expansivo en tc ≈ 3.5s de cada ciclo ───────────────────────────
    const pt       = Math.max(0, tc - 3.5)
    const pulseMat = pulseMesh.material as THREE.MeshBasicMaterial
    if (pt < 2.0) {
      pulseMesh.scale.setScalar(1 + pt * 9)
      pulseMat.opacity = Math.max(0, 0.65 - pt * 0.33)
    } else {
      pulseMat.opacity = 0
    }

    // ── Color: sigue al lerp — rojo vivo en caos, carmesí profundo en orden ───
    mat.color.setRGB(0.88, 0.1 + lerp * 0.12, 0.04)

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

// ─── SLIDE 06: Comenio/Exilio — Ascuas que ascienden ─────────────────────────
// De las llamas de la Guerra de los Treinta Años emergen ascuas que suben
// lentamente y se desvanecen en la oscuridad — la luz de Comenio que persiste
// y se eleva a pesar de la devastación del exilio.
// Naranja/ámbar (accent #E67E22), AdditiveBlending para efecto de brasa real.
export function scene06(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 6

  const count = 1400
  const geo   = new THREE.BufferGeometry()
  const pos       = new Float32Array(count * 3)
  const vel       = new Float32Array(count * 3)  // vx, vy, vz
  const life      = new Float32Array(count)       // [0, 1]
  const lifeSpeed = new Float32Array(count)       // tasa de envejecimiento
  const baseCol   = new Float32Array(count * 3)  // color base R,G,B

  // Inicializa una partícula. scattered=true la coloca en posición aleatoria
  // para poblar la escena desde el primer frame sin que aparezca vacía.
  const initParticle = (i: number, scattered: boolean) => {
    pos[i*3]   = (Math.random() - 0.5) * 10
    pos[i*3+1] = scattered ? -4.5 + Math.random() * 10.5 : -4.5 + (Math.random() - 0.5) * 2
    pos[i*3+2] = (Math.random() - 0.5) * 2

    vel[i*3]   = (Math.random() - 0.5) * 0.006  // deriva lateral suave
    vel[i*3+1] = 0.006 + Math.random() * 0.014  // ascenso (velocidad variable)
    vel[i*3+2] = 0

    life[i]      = scattered ? Math.random() : 0
    lifeSpeed[i] = 0.0022 + Math.random() * 0.005

    // Variedad cálida: naranja profundo → ámbar → dorado pálido
    const w      = Math.random()
    baseCol[i*3]   = 0.85 + w * 0.15  // R siempre alto
    baseCol[i*3+1] = 0.22 + w * 0.48  // G: naranja → ámbar
    baseCol[i*3+2] = w * 0.10          // B: toque cálido en los más pálidos
  }

  // Poblar la escena con partículas ya en distintos estados de vida
  for (let i = 0; i < count; i++) initParticle(i, true)

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const colAttr = new Float32Array(count * 3)
  geo.setAttribute('color', new THREE.BufferAttribute(colAttr, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.065,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,  // necesario para AdditiveBlending correcto
  })
  scene.add(new THREE.Points(geo, mat))

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const arr    = geo.attributes.position.array as Float32Array
    const colArr = geo.attributes.color.array    as Float32Array

    for (let i = 0; i < count; i++) {
      life[i] += lifeSpeed[i]

      // Renacer al morir o al salir por arriba del canvas
      if (life[i] >= 1 || arr[i*3+1] > 5.5) {
        initParticle(i, false)
        continue
      }

      // Curva de opacidad: aparición rápida (primeros 12%), desvanecimiento lento
      const l = life[i]
      let alpha = l < 0.12 ? l / 0.12 : (1 - (l - 0.12) / 0.88)
      // Smoothstep para suavizar los extremos
      alpha = alpha * alpha * (3 - 2 * alpha)

      // Deriva lateral orgánica (simula corrientes de aire / viento del exilio)
      vel[i*3] += (Math.random() - 0.5) * 0.0009
      vel[i*3]  = Math.max(-0.018, Math.min(0.018, vel[i*3])) // clamp

      // Mover: el ascenso se frena a medida que la brasa envejece y se enfría
      arr[i*3]   += vel[i*3]
      arr[i*3+1] += vel[i*3+1] * (1 - l * 0.55)
      arr[i*3+2] += vel[i*3+2]

      // Color final = color base × alpha (AdditiveBlending lo suma sobre negro)
      colArr[i*3]   = baseCol[i*3]   * alpha
      colArr[i*3+1] = baseCol[i*3+1] * alpha
      colArr[i*3+2] = baseCol[i*3+2] * alpha
    }

    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate    = true
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
// ─── SLIDE 09: Jansenismo/Port-Royal — Rayos de luz catedralicia ─────────────
// Rayos de luz que caen desde arriba sobre un fondo casi negro (0x01030a).
// Cada rayo tiene dos capas: núcleo interior brillante + halo exterior suave.
// AdditiveBlending hace que la luz se acumule sobre la oscuridad igual que en
// una catedral. Polvo dorado cae lentamente atravesando los haces.
export function scene09(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 4
  renderer.setClearColor(0x01030a, 1)

  const rayCount  = 7
  const innerRays: THREE.Mesh[] = []
  const outerRays: THREE.Mesh[] = []
  // Fase de pulso individual para que cada rayo parpadee de forma independiente
  const rayPhase: number[] = []

  for (let i = 0; i < rayCount; i++) {
    const x    = (i - (rayCount - 1) / 2) * 1.05
    const tilt = (Math.random() - 0.5) * 0.28
    rayPhase.push(Math.random() * Math.PI * 2)

    // Halo exterior: cono ancho y tenue
    const outerGeo = new THREE.ConeGeometry(0.55 + Math.random() * 0.25, 10, 20, 1, true)
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xd4a030,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const outer = new THREE.Mesh(outerGeo, outerMat)
    outer.position.set(x, 3.5, 0)
    outer.rotation.z = tilt
    outerRays.push(outer)
    scene.add(outer)

    // Núcleo interior: cono estrecho y brillante
    const innerGeo = new THREE.ConeGeometry(0.12 + Math.random() * 0.08, 10, 20, 1, true)
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xfff4cc,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const inner = new THREE.Mesh(innerGeo, innerMat)
    inner.position.set(x, 3.5, 0)
    inner.rotation.z = tilt
    innerRays.push(inner)
    scene.add(inner)
  }

  // Polvo dorado cayendo a través de los haces
  const dustCount = 3000
  const dustGeo   = new THREE.BufferGeometry()
  const dustPos   = new Float32Array(dustCount * 3)
  const dustCol   = new Float32Array(dustCount * 3)
  const dustSpeed = new Float32Array(dustCount)

  for (let i = 0; i < dustCount; i++) {
    dustPos[i*3]   = (Math.random() - 0.5) * 8
    dustPos[i*3+1] = (Math.random() - 0.5) * 10
    dustPos[i*3+2] = (Math.random() - 0.5) * 3
    dustSpeed[i]   = 0.002 + Math.random() * 0.003
    // Variedad: dorado brillante → blanco cálido
    const b        = 0.65 + Math.random() * 0.35
    dustCol[i*3]   = b
    dustCol[i*3+1] = b * 0.82
    dustCol[i*3+2] = b * 0.38
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  dustGeo.setAttribute('color',    new THREE.BufferAttribute(dustCol, 3))
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.022,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }))
  scene.add(dust)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()

    // Pulso lento e independiente por rayo — simula luz a través de vitral
    outerRays.forEach((r, i) => {
      ;(r.material as THREE.MeshBasicMaterial).opacity =
        0.06 + Math.sin(t * 0.35 + rayPhase[i]) * 0.03
    })
    innerRays.forEach((r, i) => {
      ;(r.material as THREE.MeshBasicMaterial).opacity =
        0.18 + Math.sin(t * 0.35 + rayPhase[i]) * 0.08
    })

    // Polvo cayendo con leve deriva lateral
    const dp = dustGeo.attributes.position.array as Float32Array
    for (let i = 0; i < dustCount; i++) {
      dp[i*3+1] -= dustSpeed[i]
      dp[i*3]   += (Math.random() - 0.5) * 0.0008
      if (dp[i*3+1] < -5) dp[i*3+1] = 5
    }
    dustGeo.attributes.position.needsUpdate = true
    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 10: Pascal — Razón vs Corazón ─────────────────────────────────────
// La silueta REAL de un corazón dividida en dos mitades:
//   izquierda → frío azul (la Razón)    derecha → cálido rojo (el Corazón)
// Ecuación algebraica del corazón: (x²+y²−1)³ − x²y³ ≤ 0
// Rejection sampling para distribuir partículas dentro de la silueta.
// La animación pulsa como un latido — rise rápido, caída rápida, pausa.
export function scene10(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 6

  const S      = 2.7   // escala del corazón en unidades de escena
  const YSHIFT = 0.18  // desplazamiento vertical para centrar la silueta

  // Punto dentro del corazón algebraico (escala S, centrado con YSHIFT)
  const inHeart = (x: number, y: number): boolean => {
    const nx = x / S
    const ny = y / S + YSHIFT
    const a  = nx * nx + ny * ny - 1
    return a * a * a - nx * nx * ny * ny * ny <= 0
  }

  const COUNT = 2800 // partículas por mitad
  const lPos  = new Float32Array(COUNT * 3)
  const rPos  = new Float32Array(COUNT * 3)

  // Mitad izquierda — Razón (azul frío)
  let filled = 0
  while (filled < COUNT) {
    const x = -Math.random() * S                    // x ∈ [−S, 0]
    const y = (Math.random() - 0.5) * S * 2.5
    if (inHeart(x, y)) {
      lPos[filled * 3]     = x
      lPos[filled * 3 + 1] = y
      lPos[filled * 3 + 2] = (Math.random() - 0.5) * 0.6
      filled++
    }
  }

  // Mitad derecha — Corazón (rojo cálido)
  filled = 0
  while (filled < COUNT) {
    const x = Math.random() * S                     // x ∈ [0, S]
    const y = (Math.random() - 0.5) * S * 2.5
    if (inHeart(x, y)) {
      rPos[filled * 3]     = x
      rPos[filled * 3 + 1] = y
      rPos[filled * 3 + 2] = (Math.random() - 0.5) * 0.6
      filled++
    }
  }

  const lGeo = new THREE.BufferGeometry()
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3))
  const lPts = new THREE.Points(lGeo, new THREE.PointsMaterial({
    size: 0.028, color: 0x85c1e9,
    transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }))
  scene.add(lPts)

  const rGeo = new THREE.BufferGeometry()
  rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3))
  const rPts = new THREE.Points(rGeo, new THREE.PointsMaterial({
    size: 0.032, color: 0xe74c3c,
    transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }))
  scene.add(rPts)

  // Línea divisoria dorada en el centro del corazón
  const divGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -S * 1.05, 0),
    new THREE.Vector3(0,  S * 0.95, 0),
  ])
  const div = new THREE.Line(divGeo, new THREE.LineBasicMaterial({
    color: 0xffd700, transparent: true, opacity: 0.45,
  }))
  scene.add(div)

  let id: number
  const BEAT_PERIOD = 1.1  // segundos por latido (~55 BPM)

  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()

    // Pulso de latido: subida rápida → bajada rápida → pausa
    const phase = (t % BEAT_PERIOD) / BEAT_PERIOD  // [0, 1]
    let beat: number
    if      (phase < 0.12) beat = phase / 0.12            // subida rápida
    else if (phase < 0.28) beat = 1 - (phase - 0.12) / 0.16  // bajada rápida
    else                   beat = 0                        // pausa

    const scale = 1 + beat * 0.055
    lPts.scale.setScalar(scale)
    rPts.scale.setScalar(scale)
    div.scale.setScalar(scale)

    // Razón: casi inmóvil, fría, apenas reacciona al latido
    const lMat = lPts.material as THREE.PointsMaterial
    lMat.opacity = 0.42 + beat * 0.08

    // Corazón: detona en cada latido — oscuro en reposo, casi blanco cálido en el pico
    const rMat = rPts.material as THREE.PointsMaterial
    rMat.opacity = 0.28 + beat * 0.68
    // Color: carmesí oscuro en reposo → rojo vivo encendido en el pico (sin salir del rojo)
    rMat.color.setRGB(0.55 + beat * 0.45, 0.06 + beat * 0.08, 0.06 + beat * 0.04)

    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 11: La Salle — Convergencia ───────────────────────────────────────
// ─── SLIDE 11: La Salle — Red de escuelas que crece ──────────────────────────
// 18 nodos (escuelas) aparecen uno a uno cada 1.2s.
// Cuando ambos extremos de una conexión están activos, la línea se dibuja.
// Partículas fluyen a lo largo de cada enlace (alumnos/conocimiento).
// Ciclo: ~22s creciendo → 7s estable → 2.5s fade-out → reinicio.
export function scene11(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 8

  // ── Posiciones de los nodos distribuidas por el viewport ─────────────────
  const nodePos: [number, number, number][] = [
    [-3.8, 2.8, 0.0], [-1.2, 3.1, 0.2], [ 1.5, 2.9,-0.1], [ 3.9, 2.5, 0.1],
    [-4.2, 1.0,-0.2], [-2.0, 1.4, 0.3], [ 0.2, 1.6, 0.0], [ 2.8, 1.2, 0.2],
    [ 4.5, 0.8,-0.1], [-3.2,-0.4, 0.1], [-0.8,-0.2,-0.2], [ 1.9,-0.5, 0.3],
    [ 4.0,-1.0, 0.0], [-4.0,-2.0, 0.2], [-1.8,-2.4,-0.1], [ 0.5,-2.8, 0.1],
    [ 3.0,-2.6, 0.0], [ 4.8,-2.2, 0.2],
  ]
  const N = nodePos.length  // 18

  const APPEAR = 1.2   // segundos entre cada nodo nuevo
  const STABLE = 7.0   // segundos con la red completa
  const FADE   = 2.5   // segundos de fade-out
  const CYCLE  = N * APPEAR + STABLE + FADE  // ≈30s

  // ── Meshes de nodos (invisibles al inicio) ────────────────────────────────
  const nodeMeshes = nodePos.map(([x, y, z]) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x1abc9c, transparent: true, opacity: 0 })
    )
    m.position.set(x, y, z)
    m.scale.setScalar(0.01)
    scene.add(m)
    return m
  })

  // ── Conexiones: precomputar todos los pares dentro de distancia ───────────
  const CONN_DIST = 3.0
  const connData: { i: number; j: number }[] = []
  const connLines: THREE.Line[] = []

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const [ax, ay, az] = nodePos[i]
      const [bx, by, bz] = nodePos[j]
      if (Math.hypot(ax - bx, ay - by, az - bz) < CONN_DIST) {
        connData.push({ i, j })
        const g = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(ax, ay, az),
          new THREE.Vector3(bx, by, bz),
        ])
        const l = new THREE.Line(g, new THREE.LineBasicMaterial({
          color: 0x1abc9c, transparent: true, opacity: 0,
        }))
        scene.add(l)
        connLines.push(l)
      }
    }
  }

  // ── Partículas fluyendo por las conexiones (3 por enlace) ─────────────────
  const PPC       = 3
  const totalFlow = connData.length * PPC
  const flowGeo   = new THREE.BufferGeometry()
  const flowPos   = new Float32Array(totalFlow * 3)
  const flowProg  = new Float32Array(totalFlow)   // progreso [0,1] a lo largo del enlace
  const flowSpeed = new Float32Array(totalFlow)
  const flowConn  = new Int32Array(totalFlow)     // índice de conexión asignada

  for (let i = 0; i < totalFlow; i++) {
    flowProg[i]  = Math.random()
    flowSpeed[i] = 0.003 + Math.random() * 0.004
    flowConn[i]  = Math.floor(i / PPC)
  }
  flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3))
  const flowMat = new THREE.PointsMaterial({
    size: 0.055, color: 0x7eeedd,
    transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  scene.add(new THREE.Points(flowGeo, flowMat))

  // Alpha global: 1 durante crecimiento y estabilidad, baja a 0 en fade-out
  const globalAlpha = (tc: number) =>
    tc < N * APPEAR + STABLE ? 1 : Math.max(0, 1 - (tc - N * APPEAR - STABLE) / FADE)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t  = clock.getElapsedTime()
    const tc = t % CYCLE
    const ga = globalAlpha(tc)

    // ── Nodos ───────────────────────────────────────────────────────────────
    for (let i = 0; i < N; i++) {
      const age = tc - i * APPEAR
      const mat = nodeMeshes[i].material as THREE.MeshBasicMaterial
      if (age < 0) {
        mat.opacity = 0
        nodeMeshes[i].scale.setScalar(0.01)
      } else if (age < 0.4) {
        // Destello de aparición: nace grande y se contrae al tamaño real
        const p = age / 0.4
        nodeMeshes[i].scale.setScalar((1 + (1 - p) * 1.8) * ga)
        mat.opacity = p * 0.9 * ga
      } else {
        // Pulso suave una vez establecido
        nodeMeshes[i].scale.setScalar((1 + Math.sin(t * 0.7 + i * 0.5) * 0.12) * ga)
        mat.opacity = (0.7 + Math.sin(t * 0.5 + i * 0.4) * 0.2) * ga
      }
    }

    // ── Conexiones ──────────────────────────────────────────────────────────
    connData.forEach(({ i, j }, idx) => {
      const age = tc - Math.max(i, j) * APPEAR - 0.3
      const mat = connLines[idx].material as THREE.LineBasicMaterial
      if (age < 0) {
        mat.opacity = 0
      } else if (age < 0.6) {
        mat.opacity = (age / 0.6) * 0.28 * ga
      } else {
        mat.opacity = (0.22 + Math.sin(t * 0.25 + idx * 0.15) * 0.07) * ga
      }
    })

    // ── Partículas fluyendo ─────────────────────────────────────────────────
    const fp = flowGeo.attributes.position.array as Float32Array
    let anyActive = false
    for (let i = 0; i < totalFlow; i++) {
      const ci       = flowConn[i]
      const { i: ni, j: nj } = connData[ci]
      const connAge  = tc - Math.max(ni, nj) * APPEAR - 0.3
      if (connAge < 0.6) continue  // enlace aún no activo

      anyActive = true
      flowProg[i] = (flowProg[i] + flowSpeed[i]) % 1
      const p = flowProg[i]
      const [ax, ay, az] = nodePos[ni]
      const [bx, by, bz] = nodePos[nj]
      fp[i * 3]     = ax + (bx - ax) * p
      fp[i * 3 + 1] = ay + (by - ay) * p
      fp[i * 3 + 2] = az + (bz - az) * p
    }
    flowGeo.attributes.position.needsUpdate = true
    flowMat.opacity = anyActive ? 0.72 * ga : 0

    renderer.render(scene, camera)
  }
  animate()
  return () => { cancelAnimationFrame(id); removeResize(); renderer.dispose() }
}

// ─── SLIDE 12: Hobbes — Estado de Naturaleza → Leviatán ──────────────────────
// Ciclo de 24s que narra el pensamiento hobbsiano:
//   0– 8s : caos puro — homo homini lupus, partículas colisionan libremente
//   8–14s : el Leviatán emerge y atrae las partículas hacia su órbita
//  14–20s : orden absoluto — partículas orbitan al soberano
//  20–24s : disolución — sin gracia el orden se rompe, ciclo reinicia
export function scene12(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 7
  renderer.setClearColor(0x050000, 1)

  const COUNT = 1800
  const pos         = new Float32Array(COUNT * 3)
  const vel         = new Float32Array(COUNT * 3)
  const orbitAngle  = new Float32Array(COUNT)
  const orbitRadius = new Float32Array(COUNT)
  const orbitSpeed  = new Float32Array(COUNT)

  function randomize() {
    for (let i = 0; i < COUNT; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 10
      pos[i*3+1] = (Math.random() - 0.5) * 8
      pos[i*3+2] = (Math.random() - 0.5) * 2
      vel[i*3]   = (Math.random() - 0.5) * 0.04
      vel[i*3+1] = (Math.random() - 0.5) * 0.04
      vel[i*3+2] = 0
      orbitAngle[i]  = Math.random() * Math.PI * 2
      orbitRadius[i] = 0.8 + Math.random() * 2.8
      orbitSpeed[i]  = (0.3 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1)
    }
  }
  randomize()

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

  const col = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    const t = Math.random()
    col[i*3]   = 0.5 + t * 0.5  // rojo vivo → carmesí
    col[i*3+1] = 0.03 + t * 0.07
    col[i*3+2] = 0.03
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.04, vertexColors: true,
    transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  scene.add(new THREE.Points(geo, mat))

  // Leviatán — esfera central de poder
  const levMat = new THREE.MeshBasicMaterial({
    color: 0xff3300, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const leviathan = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), levMat)
  scene.add(leviathan)

  // Halo exterior del Leviatán
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x922b21, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
    side: THREE.BackSide,
  })
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 32), haloMat)
  scene.add(halo)

  const CYCLE   = 24
  const T_CHAOS = 8
  const T_RISE  = 6   // 8–14s
  const T_ORDER = 6   // 14–20s
  const T_FALL  = 4   // 20–24s

  let prevTc = 0
  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t  = clock.getElapsedTime()
    const tc = t % CYCLE

    // Detectar reinicio del ciclo y re-aleatorizar posiciones
    if (tc < prevTc) randomize()
    prevTc = tc

    // Fase: 0 = caos puro, 1 = orden absoluto
    let order: number
    if      (tc < T_CHAOS)                      order = 0
    else if (tc < T_CHAOS + T_RISE)             order = (tc - T_CHAOS) / T_RISE
    else if (tc < T_CHAOS + T_RISE + T_ORDER)   order = 1
    else                                         order = 1 - (tc - T_CHAOS - T_RISE - T_ORDER) / T_FALL
    order = Math.max(0, Math.min(1, order))
    const ease = order * order * (3 - 2 * order)  // smoothstep

    // Leviatán visible y pulsante conforme emerge el orden
    levMat.opacity  = ease * (0.55 + Math.sin(t * 2.5) * 0.12)
    haloMat.opacity = ease * 0.18
    leviathan.scale.setScalar(1 + Math.sin(t * 2.0) * 0.08 * ease)
    halo.scale.setScalar(1 + Math.sin(t * 1.5) * 0.15 * ease)

    const arr = geo.attributes.position.array as Float32Array
    for (let i = 0; i < COUNT; i++) {
      // Movimiento caótico (se atenúa cuando sube el orden)
      arr[i*3]   += vel[i*3]   * (1 - ease * 0.85)
      arr[i*3+1] += vel[i*3+1] * (1 - ease * 0.85)
      if (Math.abs(arr[i*3])   > 5.5) vel[i*3]   *= -1
      if (Math.abs(arr[i*3+1]) > 4.5) vel[i*3+1] *= -1

      if (ease > 0.01) {
        // Avanzar ángulo de órbita y calcular posición target
        orbitAngle[i] += orbitSpeed[i] * 0.016
        const tx = Math.cos(orbitAngle[i]) * orbitRadius[i]
        const ty = Math.sin(orbitAngle[i]) * orbitRadius[i] * 0.55
        const tz = Math.sin(orbitAngle[i] * 0.7) * orbitRadius[i] * 0.3
        // Lerp suave hacia la órbita
        arr[i*3]   += (tx - arr[i*3])   * ease * 0.03
        arr[i*3+1] += (ty - arr[i*3+1]) * ease * 0.03
        arr[i*3+2] += (tz - arr[i*3+2]) * ease * 0.03
      }
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
    // Esmeralda oscuro → teal vivo: evoca "Deus sive Natura" (lo orgánico-infinito)
    col[i*3]   = 0.04 * (1-t) + 0.18 * t   // casi sin rojo
    col[i*3+1] = 0.40 * (1-t) + 0.65 * t   // verde dominante
    col[i*3+2] = 0.32 * (1-t) + 0.50 * t   // teal
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

// ─── SLIDE 14: Locke/Tabula Rasa — La Mente en Blanco ────────────────────────
// La escena empieza en oscuridad total — la mente vacía.
// Partículas aparecen una a una: destello blanco al nacer → se asientan en azul suave.
// Una vez vivas derivan muy lentamente, como pensamientos flotando.
// Ciclo 24s: 18s llenándose → 4s nebulosa tranquila → 2s fade → oscuridad → reinicio.
export function scene14(canvas: HTMLCanvasElement): SceneCleanup {
  const { renderer, scene, camera, clock } = createBaseContext(canvas)
  const removeResize = addResizeHandler(renderer, camera)
  camera.position.z = 5

  const CYCLE    = 24
  const FILL_DUR = 18
  const STABLE   =  4
  // FADE_DUR = CYCLE - FILL_DUR - STABLE = 2s

  const COUNT      = 1800
  const spawnTime  = new Float32Array(COUNT)
  const baseX      = new Float32Array(COUNT)
  const baseY      = new Float32Array(COUNT)
  const baseZ      = new Float32Array(COUNT)
  const driftX     = new Float32Array(COUNT)
  const driftY     = new Float32Array(COUNT)
  const brightness = new Float32Array(COUNT)

  function initParticles() {
    for (let i = 0; i < COUNT; i++) {
      spawnTime[i]  = (i / COUNT) * FILL_DUR + Math.random() * (FILL_DUR / COUNT) * 3
      baseX[i]      = (Math.random() - 0.5) * 9
      baseY[i]      = (Math.random() - 0.5) * 6
      baseZ[i]      = (Math.random() - 0.5) * 3
      driftX[i]     = (Math.random() - 0.5) * 0.0008
      driftY[i]     = (Math.random() - 0.5) * 0.0008
      brightness[i] = 0.5 + Math.random() * 0.5
    }
  }
  initParticles()

  const pos = new Float32Array(COUNT * 3)
  const col = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    pos[i*3]   = baseX[i]; pos[i*3+1] = baseY[i]; pos[i*3+2] = baseZ[i]
    col[i*3]   = 0;        col[i*3+1] = 0;        col[i*3+2] = 0  // negro al inicio
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
  const mat = new THREE.PointsMaterial({
    size: 0.05, vertexColors: true,
    transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  scene.add(new THREE.Points(geo, mat))

  let prevTc = 0
  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t  = clock.getElapsedTime()
    const tc = t % CYCLE

    if (tc < prevTc) initParticles()
    prevTc = tc

    // Factor global de fade al final del ciclo
    const fadeStart = FILL_DUR + STABLE
    const ga = tc < fadeStart ? 1 : Math.max(0, 1 - (tc - fadeStart) / (CYCLE - fadeStart))

    const arr  = geo.attributes.position.array as Float32Array
    const carr = geo.attributes.color.array    as Float32Array

    for (let i = 0; i < COUNT; i++) {
      const age = tc - spawnTime[i]

      if (age < 0) {
        // No ha nacido todavía — invisible
        carr[i*3] = 0; carr[i*3+1] = 0; carr[i*3+2] = 0
      } else {
        // Deriva muy lenta desde la posición base
        arr[i*3]   = baseX[i] + driftX[i] * age * 60
        arr[i*3+1] = baseY[i] + driftY[i] * age * 60
        arr[i*3+2] = baseZ[i]

        const b = brightness[i]
        if (age < 0.45) {
          // Destello de nacimiento: blanco brillante → azul claro (#3498DB)
          const p = age / 0.45
          carr[i*3]   = (0.9 - p * 0.70) * ga
          carr[i*3+1] = (0.9 - p * 0.30) * ga
          carr[i*3+2] = (1.0 - p * 0.14) * ga
        } else {
          // Vida normal — azul claro con leve respiración individual
          const breathe = 0.85 + Math.sin(t * 0.4 + i * 0.15) * 0.15
          carr[i*3]   = 0.20 * b * breathe * ga
          carr[i*3+1] = 0.60 * b * breathe * ga
          carr[i*3+2] = 0.86 * b * breathe * ga
        }
      }
    }
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate    = true
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

  const CYCLE = 20

  const count = 2000
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)

  const targetPos = new Float32Array(count * 3)
  const scatterPos = new Float32Array(count * 3)
  const delay = new Float32Array(count)

  const palette = [0xd35400, 0xe67e22, 0xf39c12, 0xf5b041, 0xdc7633]

  for (let i = 0; i < count; i++) {
    scatterPos[i * 3] = (Math.random() - 0.5) * 10
    scatterPos[i * 3 + 1] = (Math.random() - 0.5) * 8
    scatterPos[i * 3 + 2] = (Math.random() - 0.5) * 4

    const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)])
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b

    delay[i] = Math.random() * 0.3
  }

  const layers = 14
  const pyramidH = 5.5
  const halfBase = 2.8
  let idx = 0
  for (let layer = 0; layer < layers; layer++) {
    const t = layer / layers
    const halfW = halfBase * (1 - t)
    const y = -2.8 + layer * (pyramidH / layers)
    const perLayer = Math.floor(count / layers)
    for (let j = 0; j < perLayer && idx < count; j++) {
      const side = Math.floor(Math.random() * 4)
      const edgeDist = Math.random()
      const innerShrink = 0.15 + Math.random() * 0.85
      const hw = halfW * innerShrink
      if (side === 0) {
        targetPos[idx * 3] = -hw + edgeDist * hw * 2
        targetPos[idx * 3 + 2] = -hw
      } else if (side === 1) {
        targetPos[idx * 3] = -hw + edgeDist * hw * 2
        targetPos[idx * 3 + 2] = hw
      } else if (side === 2) {
        targetPos[idx * 3] = -hw
        targetPos[idx * 3 + 2] = -hw + edgeDist * hw * 2
      } else {
        targetPos[idx * 3] = hw
        targetPos[idx * 3 + 2] = -hw + edgeDist * hw * 2
      }
      targetPos[idx * 3 + 1] = y
      idx++
    }
  }
  while (idx < count) {
    targetPos[idx * 3] = (Math.random() - 0.5) * 0.5
    targetPos[idx * 3 + 1] = -2.8 + Math.random() * 5
    targetPos[idx * 3 + 2] = (Math.random() - 0.5) * 0.5
    idx++
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.06, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }))
  scene.add(pts)

  let id: number
  const animate = () => {
    id = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    const ct = t % CYCLE
    const arr = geo.attributes.position.array as Float32Array

    let buildProgress = 0
    if (ct < 2) {
      buildProgress = 0
    } else if (ct < 10) {
      buildProgress = (ct - 2) / 8
    } else if (ct < 14) {
      buildProgress = 1
    } else if (ct < 18) {
      buildProgress = 1 - (ct - 14) / 4
    } else {
      buildProgress = 0
    }

    buildProgress = buildProgress * buildProgress * (3 - 2 * buildProgress)

    for (let i = 0; i < count; i++) {
      const d = delay[i]
      const p = Math.max(0, Math.min(1, (buildProgress - d) / (1 - d)))
      const ep = p * p * (3 - 2 * p)
      arr[i * 3] = scatterPos[i * 3] + (targetPos[i * 3] - scatterPos[i * 3]) * ep
      arr[i * 3 + 1] = scatterPos[i * 3 + 1] + (targetPos[i * 3 + 1] - scatterPos[i * 3 + 1]) * ep
      arr[i * 3 + 2] = scatterPos[i * 3 + 2] + (targetPos[i * 3 + 2] - scatterPos[i * 3 + 2]) * ep
    }
    geo.attributes.position.needsUpdate = true
    pts.rotation.y = ct * 0.03
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
      new THREE.MeshBasicMaterial({ color: 0x2e86c1, wireframe: true, transparent: true, opacity: 0.6 })
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
  const spiral = new THREE.Line(spiralGeo, new THREE.LineBasicMaterial({ color: 0x85c1e9, transparent: true, opacity: 0.5 }))
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
