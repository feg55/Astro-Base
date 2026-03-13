import { animated, SpringValue } from "@react-spring/three"
import { useLoader, type ThreeEvent } from "@react-three/fiber"
import type { Dispatch, RefObject, SetStateAction } from "react";
import { TextureLoader, type Mesh } from "three";


export type PlanetBaseProps = {
    texture_path: string,
    meshRef: RefObject<Mesh | null>;
    scale: SpringValue<number>;
    active: boolean;
    hovered: boolean;
    setActive: Dispatch<SetStateAction<boolean>>;
    setHover: Dispatch<SetStateAction<boolean>>;
}

export const Planet = ({texture_path, meshRef, scale, setActive, setHover}: PlanetBaseProps) => {
    const texture = useLoader(TextureLoader, texture_path)
    return (
        <animated.mesh
            ref={meshRef}
            scale={scale}
            onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation()
                setActive(prev => !prev)
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
            <sphereGeometry args={[1, 64, 64]}/>
            <meshStandardMaterial map={texture} />
        </animated.mesh>
    )
}