import { Canvas } from '@react-three/fiber'
import { usePlanet } from './Sphere.tsx'

const CustomPlanets = () => {
  const Sun = usePlanet({id: 0})
  const Mercury = usePlanet({id: 1})
  const Venus = usePlanet({id:2})
  const Earth = usePlanet({id: 3})
  const Mars = usePlanet({id: 4})
  const Jupiter = usePlanet({id: 5})
  const Saturn = usePlanet({id: 6})
  const Uranus = usePlanet({id: 7})
  const Neptune = usePlanet({id: 8})
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
  return (
    <Canvas camera={{position: [0, 20, 1]}} style={{ position: 'relative', inset: 0, width: '100vw', height: '100vh' }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.25} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <CustomPlanets/>
      {/* <SphereMesh position={[0, 0, 0]} /> */}
    </Canvas>
  )
}