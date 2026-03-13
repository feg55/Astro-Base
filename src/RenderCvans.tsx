import { Canvas } from '@react-three/fiber'
import { usePlanet } from './Sphere.tsx'

const CustomPlanets = () => {
  const Planet = usePlanet({id: 5})
  return (
    <>
      {Planet}
    </>
  )
}

export default function RenderCvans() {
  return (
    <Canvas style={{ width: '600px', height: '600px' }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <CustomPlanets/>
      {/* <SphereMesh position={[0, 0, 0]} /> */}
    </Canvas>
  )
}