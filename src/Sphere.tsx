/* eslint-disable react-refresh/only-export-components */
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Mesh } from 'three'
import { useSpring } from "@react-spring/three";
import { create } from 'zustand';
import { Planet } from './planets/PlanetBase.tsx';
import { useShallow } from 'zustand/shallow';
import { planetMeshById } from './planets/runtimeState.ts';

const NOOP_RAYCAST: Mesh['raycast'] = () => {}

const ORBIT_SCALE = 0.9
const orbitPosition = (x: number, y = 0, z = 0): [number, number, number] => [x * ORBIT_SCALE, y, z * ORBIT_SCALE]

type PlanetType = {
  id: number,
  name: string,
  scale: number,
  args?: [radius?: number | undefined, widthSegments?: number | undefined, heightSegments?: number | undefined, phiStart?: number | undefined, phiLength?: number | undefined, thetaStart?: number | undefined, thetaLength?: number | undefined] | Readonly<[radius?: number | undefined, widthSegments?: number | undefined, heightSegments?: number | undefined, phiStart?: number | undefined, phiLength?: number | undefined, thetaStart?: number | undefined, thetaLength?: number | undefined] | undefined>,
  texture_path: string,
  position?: [number, number, number],
  hasRing?: boolean,
  isStar?: boolean
}

interface PlanetsStoreI {
  planets: PlanetType[],
  setPlanets: (planets: PlanetType[]) => void
}

export const usePlanetsStore = create<PlanetsStoreI>((set) => ({
  planets: [
    {
      id: 0,
      name: "Sun",
      scale: 1.8,
      texture_path: '/textures/2k_sun.jpg',
      args: [1, 64, 64],
      position: orbitPosition(0, 0, 0),
      isStar: true
    },
    {
      id: 1,
      name: "Mercury",
      scale: 0.3,
      texture_path: '/textures/2k_mercury.jpg',
      args: [1, 64, 64],
      position: orbitPosition(4, 0, 0),
    },
    {
      id: 2,
      name: "Venus",
      scale: 0.5,
      texture_path: '/textures/2k_venus_atmosphere.jpg',
      args: [1, 64, 64],
      position: orbitPosition(6, 0, 0),
    },
    {
      id: 3,
      name: "Earth",
      scale: 0.5,
      texture_path: '/textures/2k_earth_daymap.jpg',
      args: [1, 64, 64],
      position: orbitPosition(8, 0, 0),
    },
    {
      id: 4,
      name: "Mars",
      scale: 0.4,
      texture_path: '/textures/2k_mars.jpg',
      args: [1, 64, 64],
      position: orbitPosition(10, 0, 0),
    },
    {
      id: 5,
      name: "Jupiter",
      scale: 1,
      texture_path: '/textures/2k_jupiter.jpg',
      args: [1, 64, 64],
      position: orbitPosition(12, 0, 0),
    },
    {
      id: 6,
      name: "Saturn",
      scale: 0.9,
      texture_path: '/textures/2k_saturn.jpg',
      args: [1, 64, 64],
      position: orbitPosition(16, 0, 0),
      hasRing: true,
    },
    {
      id: 7,
      name: "Uranus",
      scale: 0.6,
      texture_path: '/textures/2k_uranus.jpg',
      args: [1, 64, 64],
      position: orbitPosition(19.5, 0, 0),
    },
    {
      id: 8,
      name: "Neptune",
      scale: 0.6,
      texture_path: '/textures/2k_neptune.jpg',
      args: [1, 64, 64],
      position: orbitPosition(21, 0, 0),
    },
  ],
  setPlanets: (planets) => {
    set(state => ({...state, planets: planets}))
  }
}))

type UsePlanetProps = {
  id?: number,
  name?: string
  onSelect?: (planetId: number) => void
  selectedPlanetId?: number | null
}

export const usePlanet = (props: UsePlanetProps) => {
  const {planets} = usePlanetsStore(useShallow(state => ({planets: state.planets})))
  const meshRef = useRef<Mesh | null>(null)
  const ringRef = useRef<Mesh | null>(null)
  const angleRef = useRef((props.id ?? 0) * 0.7)

  const handleSelect = () => {
    if (props.id === undefined || !props.onSelect) return
    props.onSelect(props.id)
  }

  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  const planet = planets.find((el) => el.id === props.id)
  const baseScale = planet?.scale ?? 1

  const { scale } = useSpring({
    scale: active ? baseScale * 2 : hovered ? baseScale * 1.1 : baseScale,
    config: { tension: 170, friction: 18 },
  });
  
  const start = planet?.position ?? [0, 0, 0]
  const orbitRadius = Math.hypot(start[0], start[2])
  const orbitSpeed = planet?.id === 0 ? 0 : 0.35 / Math.sqrt(Math.max(orbitRadius, 0.1))

  useFrame((_state, delta: number) => {
    if (!meshRef.current) return

    const colliderEnabled = props.selectedPlanetId == null || props.id === props.selectedPlanetId
    const raycastImpl = colliderEnabled ? Mesh.prototype.raycast : NOOP_RAYCAST
    if (meshRef.current.raycast !== raycastImpl) {
      meshRef.current.raycast = raycastImpl
    }
    if (ringRef.current && ringRef.current.raycast !== raycastImpl) {
      ringRef.current.raycast = raycastImpl
    }

    if (props.id !== undefined) {
      planetMeshById.set(props.id, meshRef.current)
    }
    meshRef.current.rotation.y += delta

    if (orbitRadius > 0) {
      angleRef.current += delta * orbitSpeed * -4
      const x = Math.cos(angleRef.current) * orbitRadius
      const z = Math.sin(angleRef.current) * orbitRadius

      meshRef.current.position.set(x, start[1], z)
      ringRef.current?.position.set(x, start[1], z)
    }
  })

  useEffect(() => {
    return () => {
      if (props.id !== undefined) {
        planetMeshById.delete(props.id)
      }
    }
  }, [props.id])

  if (!planet) {
    return null
  }

  return (
    <Planet
      texture_path={planet.texture_path}
      position={planet.position}
      scale={scale}
      meshRef={meshRef}
      ringRef={ringRef}
      hovered={hovered}
      active={active}
      setHover={setHover}
      setActive={setActive}
      onSelect={handleSelect}
      hasRing={planet.hasRing ?? false}
      isStar={planet.isStar ?? false}
    />
  )
}


// export function SphereMesh(props: ThreeElements['mesh']) {
//   const meshRef = useRef<Mesh | null>(null)
//   const [hovered, setHover] = useState(false)
//   const [active, setActive] = useState(false)

//   useFrame((_state, delta: number) => {
//     if (meshRef.current) meshRef.current.rotation.y += delta
//   })

//   const { scale } = useSpring({
//     scale: active ? 3 : hovered ? 1.65 : 1.5,
//     config: { tension: 170, friction: 18 },
//   });
//   if(planetId === 5){
//     return (
//       <Jupiter 
//       {...props}
//       scale={scale}
//       meshRef={meshRef}
//       hovered={hovered}
//       active={active}
//       setHover={setHover}
//       setActive={setActive}
//       />
//    )
//   }
// }


