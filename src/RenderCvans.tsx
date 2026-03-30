import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { usePlanet } from './Sphere.tsx'
import SkySphere from './planets/SkySphere.tsx'
import { useState } from 'react'

// const positione = [0, 20, 1] as const
type CamPosT = [number, number, number]
const START_POS: CamPosT = [0, 20, 1]
function SimpleCamera({ target }: { target: CamPosT | null }) {
  const { camera } = useThree()

  useFrame(() => {
    if (!target) return
    const [x, y, z] = target
    const k = 0.08
    
    const nx = camera.position.x + (x + 2.5 - camera.position.x) * k
    const ny = camera.position.y + (y + 1.0 - camera.position.y) * k
    const nz = camera.position.z + (z + 2.5 - camera.position.z) * k
    camera.position.set(nx, ny, nz)
    camera.lookAt(x, y, z)
  })

  return null
}


const CustomPlanets = ({ onSelectPlanet }: { onSelectPlanet: (p: CamPosT) => void }) => {
  const Sun = usePlanet({id: 0, onSelect: onSelectPlanet})
  const Mercury = usePlanet({id: 1, onSelect: onSelectPlanet})
  const Venus = usePlanet({id:2, onSelect: onSelectPlanet})
  const Earth = usePlanet({id: 3, onSelect: onSelectPlanet})
  const Mars = usePlanet({id: 4, onSelect: onSelectPlanet})
  const Jupiter = usePlanet({id: 5, onSelect: onSelectPlanet})
  const Saturn = usePlanet({id: 6, onSelect: onSelectPlanet})
  const Uranus = usePlanet({id: 7, onSelect: onSelectPlanet})
  const Neptune = usePlanet({id: 8, onSelect: onSelectPlanet})
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



export default function RenderCvans() {
  const [pos, setPos] = useState<CamPosT | null>(null)
  return (
    <Canvas camera={{position: START_POS}} style={{ position: 'relative', inset: 0, width: '100vw', height: '100vh'}}>
      {/* <ambientLight intensity={Math.PI / 20} /> */}
      <SimpleCamera target={pos} />
      {/* <spotLight position={[0, 20, 0]} angle={0.25} penumbra={1} decay={0} intensity={Math.PI * 0.1} /> */}
      <pointLight position={[0, 0, 0]} decay={0} intensity={Math.PI} />
      <SkySphere />
      <CustomPlanets onSelectPlanet={setPos}/>
      {/* <SphereMesh position={[0, 0, 0]} /> */}
    </Canvas>
  )
}