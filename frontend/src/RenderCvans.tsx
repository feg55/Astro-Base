import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { memo, Suspense, useEffect, useMemo, type CSSProperties } from 'react'
import { PlanetNode, usePlanetsStore } from './Sphere.tsx'
import SkySphere from './planets/SkySphere.tsx'
import { planetMeshById, selectedPlanetIdRef } from './planets/runtimeState.ts'

// const positione = [0, 20, 1] as const
type CamPosT = [number, number, number]
const START_POS: CamPosT = [0, 45, 1]
const CAMERA_DISTANCE_SCALE = 1.2
const CAMERA_FOV = 40
const CAMERA_NEAR = 0.01
const CAMERA_FAR = 2000
const PLANET_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const
const BACKGROUND_COLOR_ARGS: [string] = ['#01030a']
const CANVAS_STYLE: CSSProperties = {
  position: 'relative',
  inset: 0,
  width: '100%',
  height: '100%',
}
const CAMERA_CONFIG = {
  position: START_POS,
  fov: CAMERA_FOV,
  near: CAMERA_NEAR,
  far: CAMERA_FAR,
}

function SimpleCamera({ targetId }: { targetId: number | null }) {
  const camera = useThree((state) => state.camera)
  const planets = usePlanetsStore((state) => state.planets)
  const scaleByPlanetId = useMemo(
    () => new Map(planets.map((planet) => [planet.id, planet.scale])),
    [planets],
  )

  useEffect(() => {
    selectedPlanetIdRef.current = targetId
  }, [targetId])
  
  useFrame(() => {
    const k = 0.08

    if (targetId === null) {
      const [sx, sy, sz] = START_POS
      const nx = camera.position.x + (sx - camera.position.x) * k
      const ny = camera.position.y + (sy - camera.position.y) * k
      const nz = camera.position.z + (sz - camera.position.z) * k
      camera.position.set(nx, ny, nz)
      camera.lookAt(0, 0, 0)
      return
    }
    
    const targetMesh = planetMeshById.get(targetId)
    if (!targetMesh) return

    const planetScale = scaleByPlanetId.get(targetId) ?? 1
    const followDistance = Math.max(0.8, planetScale * 2.2) * CAMERA_DISTANCE_SCALE
    const upDistance = Math.max(0.4, planetScale * 0.9) * CAMERA_DISTANCE_SCALE
    const { x, y, z } = targetMesh.position
    const desiredDistance = Math.hypot(followDistance, upDistance, followDistance)

    if (targetId === 0) {
      const sideDistance = Math.max(4.8, planetScale * 2.8) * CAMERA_DISTANCE_SCALE
      const planeHeight = Math.max(0.35, planetScale * 0.45) * CAMERA_DISTANCE_SCALE
      const nx = camera.position.x + (x + sideDistance - camera.position.x) * k
      const ny = camera.position.y + (y + planeHeight - camera.position.y) * k
      const nz = camera.position.z + (z + sideDistance - camera.position.z) * k
      camera.position.set(nx, ny, nz)
      camera.lookAt(x, y, z)
      return
    }

    let ox = camera.position.x - x
    let oy = camera.position.y - y
    let oz = camera.position.z - z
    const currentDistance = Math.hypot(ox, oy, oz)

    if (currentDistance > 1e-6) {
      const ratio = desiredDistance / currentDistance
      ox *= ratio
      oy *= ratio
      oz *= ratio
    } else {
      ox = followDistance
      oy = upDistance
      oz = followDistance
    }

    // Keep exact radius to the selected planet so distance doesn't "breathe".
    camera.position.set(x + ox, y + oy, z + oz)
    camera.lookAt(x, y, z)
  })

  return null
}

function CanvasVisibilityController() {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const setFrameloop = useThree((state) => state.setFrameloop)

  useEffect(() => {
    const canvas = gl.domElement
    let isInViewport = true

    const syncFrameloop = () => {
      const shouldAnimate = isInViewport && document.visibilityState !== 'hidden'
      setFrameloop(shouldAnimate ? 'always' : 'never')

      if (shouldAnimate) {
        invalidate()
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      isInViewport = entry?.isIntersecting ?? true
      syncFrameloop()
    })

    observer.observe(canvas)
    document.addEventListener('visibilitychange', syncFrameloop)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', syncFrameloop)
    }
  }, [gl, invalidate, setFrameloop])

  return null
}

const CustomPlanets = memo(function CustomPlanets({
  onSelectPlanet,
}: {
  onSelectPlanet: (planetId: number) => void
}) {
  return (
    <>
      {PLANET_IDS.map((planetId) => (
        <Suspense key={planetId} fallback={null}>
          <PlanetNode id={planetId} onSelectPlanet={onSelectPlanet} />
        </Suspense>
      ))}
    </>
  )
})

type RenderCvansProps = {
  selectedPlanetId: number | null
  onSelectPlanet: (planetId: number) => void
}

const RenderCvans = memo(function RenderCvans({ selectedPlanetId, onSelectPlanet }: RenderCvansProps) {
  return (
    <Canvas
      camera={CAMERA_CONFIG}
      style={CANVAS_STYLE}
    >
      {/* <ambientLight intensity={Math.PI / 20} /> */}
      <CanvasVisibilityController />
      <SimpleCamera targetId={selectedPlanetId} />
      {/* <spotLight position={[0, 20, 0]} angle={0.25} penumbra={1} decay={0} intensity={Math.PI * 0.1} /> */}
      <pointLight position={[0, 0, 0]} decay={0} intensity={Math.PI} />
      <color attach="background" args={BACKGROUND_COLOR_ARGS} />
      <Suspense fallback={null}>
        <SkySphere />
      </Suspense>
      <CustomPlanets onSelectPlanet={onSelectPlanet} />
      {/* <SphereMesh position={[0, 0, 0]} /> */}
    </Canvas>
  )
})

export default RenderCvans
