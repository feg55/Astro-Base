import { Canvas, useFrame, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Mesh } from 'three'
import { animated, useSpring } from "@react-spring/three";

function SphereMesh(props: ThreeElements['mesh']) {
  const meshRef = useRef<Mesh | null>(null)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  useFrame((_state, delta: number) => {
    if (meshRef.current) meshRef.current.rotation.y += delta
  })

  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 3}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation()
        setActive(!active)
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        setHover(true)
      }}
      onPointerOut={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        setHover(false)
      }}
    >
      <sphereGeometry />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

export default function RenderedSphere() {
  return (
    <Canvas style={{ width: '100%', height: '400px' }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <SphereMesh position={[0, 0, 0]} />
    </Canvas>
  )
}
