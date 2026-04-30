import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { usePlanet, usePlanetsStore } from './Sphere.tsx'
import SkySphere from './planets/SkySphere.tsx'
import { planetMeshById } from './planets/runtimeState.ts'

// const positione = [0, 20, 1] as const
type CamPosT = [number, number, number]
const START_POS: CamPosT = [0, 45, 1]
const CAMERA_DISTANCE_SCALE = 1.2
const CAMERA_FOV = 40
const CAMERA_NEAR = 0.01
const CAMERA_FAR = 2000

function SimpleCamera({ targetId }: { targetId: number | null }) {
  const { camera } = useThree()
  const planets = usePlanetsStore((state) => state.planets)
  
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

    const planetScale = planets.find((p) => p.id === targetId)?.scale ?? 1
    const followDistance = Math.max(0.8, planetScale * 2.2) * CAMERA_DISTANCE_SCALE
    const upDistance = Math.max(0.4, planetScale * 0.9) * CAMERA_DISTANCE_SCALE
    const { x, y, z } = targetMesh.position
    const desiredDistance = Math.hypot(followDistance, upDistance, followDistance)

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


const CustomPlanets = ({ onSelectPlanet, selectedPlanetId }: { onSelectPlanet: (planetId: number) => void, selectedPlanetId: number | null }) => {
  const Sun = usePlanet({id: 0, onSelect: onSelectPlanet, selectedPlanetId})
  const Mercury = usePlanet({id: 1, onSelect: onSelectPlanet, selectedPlanetId})
  const Venus = usePlanet({id:2, onSelect: onSelectPlanet, selectedPlanetId})
  const Earth = usePlanet({id: 3, onSelect: onSelectPlanet, selectedPlanetId})
  const Mars = usePlanet({id: 4, onSelect: onSelectPlanet, selectedPlanetId})
  const Jupiter = usePlanet({id: 5, onSelect: onSelectPlanet, selectedPlanetId})
  const Saturn = usePlanet({id: 6, onSelect: onSelectPlanet, selectedPlanetId})
  const Uranus = usePlanet({id: 7, onSelect: onSelectPlanet, selectedPlanetId})
  const Neptune = usePlanet({id: 8, onSelect: onSelectPlanet, selectedPlanetId})
  return (
    <>
      {Sun}
      {Mercury}
      {Venus}
      {Earth}
      {Mars}
      {Jupiter}
      {Saturn}
      {Uranus}
      {Neptune}
    </>
  )
}

type RenderCvansProps = {
  selectedPlanetId: number | null
  onSelectPlanet: (planetId: number) => void
}

export default function RenderCvans({ selectedPlanetId, onSelectPlanet }: RenderCvansProps) {

  return (
    <Canvas
      camera={{
        position: START_POS,
        fov: CAMERA_FOV,
        near: CAMERA_NEAR,
        far: CAMERA_FAR,
      }}
      style={{ position: 'relative', inset: 0, width: '100%', height: '100%' }}
    >
      {/* <ambientLight intensity={Math.PI / 20} /> */}
      <SimpleCamera targetId={selectedPlanetId} />
      {/* <spotLight position={[0, 20, 0]} angle={0.25} penumbra={1} decay={0} intensity={Math.PI * 0.1} /> */}
      <pointLight position={[0, 0, 0]} decay={0} intensity={Math.PI} />
      <SkySphere />
      <CustomPlanets onSelectPlanet={onSelectPlanet} selectedPlanetId={selectedPlanetId}/>
      {/* <SphereMesh position={[0, 0, 0]} /> */}
    </Canvas>
  )
}
