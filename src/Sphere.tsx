import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState, type JSX } from 'react'
import type { Mesh } from 'three'
import { useSpring } from "@react-spring/three";
// import Jupiter from './planets/Jupiter';
import { create } from 'zustand';
import { Planet } from './planets/planetBase';
import { useShallow } from 'zustand/shallow';

type PlanetType = {
  id: number,
  name: string,
  scale: number,
  args?: [radius?: number | undefined, widthSegments?: number | undefined, heightSegments?: number | undefined, phiStart?: number | undefined, phiLength?: number | undefined, thetaStart?: number | undefined, thetaLength?: number | undefined] | Readonly<[radius?: number | undefined, widthSegments?: number | undefined, heightSegments?: number | undefined, phiStart?: number | undefined, phiLength?: number | undefined, thetaStart?: number | undefined, thetaLength?: number | undefined] | undefined>,
  texture_path: string
}

export interface PlanetsStoreI {
  planets: PlanetType[],
  setPlanets: (planets: PlanetType[]) => void
}

export const usePlanetsStore = create<PlanetsStoreI>((set, get) => ({
  planets: [
    {
      id: 5,
      name: "Jupiter",
      scale: 1.5,
      texture_path: '/textures/2k_jupiter.jpg',
      args: [1, 64, 64]
    }
  ],
  setPlanets: (planets) => {
    set(state => ({...state, planets: planets}))
  }
}))

type UsePlanetProps = {
  id?: number,
  name?: string
}


export const usePlanet = (props: UsePlanetProps) => {
  const [PlanetJSX, setPlanet] = useState<JSX.Element|null>(null);
  const {planets} = usePlanetsStore(useShallow(state => ({planets: state.planets})))

  const meshRef = useRef<Mesh | null>(null)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  useFrame((_state, delta: number) => {
    if (meshRef.current) meshRef.current.rotation.y += delta
  })

  const { scale  } = useSpring({
    scale: active ? 3 : hovered ? 1.65 : 1.5,
    config: { tension: 170, friction: 18 },
  });


  useEffect(() => {
    const _planet = planets.find(el => el.id === props.id)
    if (_planet) {
      const planet = <Planet 
                        texture_path={_planet?.texture_path}
                        scale={scale}
                        meshRef={meshRef}
                        hovered={hovered}
                        active={active}
                        setHover={setHover}
                        setActive={setActive}/>
                        setPlanet(planet)
    }
  }, [props.id])

  return PlanetJSX
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


