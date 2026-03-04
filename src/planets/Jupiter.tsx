import { useLoader, type ThreeEvent } from "@react-three/fiber";
import { animated, SpringValue } from "@react-spring/three"
import { Mesh, TextureLoader } from "three";
import type { Dispatch, RefObject, SetStateAction } from "react";

type planetProps = {
    meshRef: RefObject<Mesh | null>;
    scale: SpringValue<number>;
    active: boolean;
    hovered: boolean;
    setActive: Dispatch<SetStateAction<boolean>>;
    setHover: Dispatch<SetStateAction<boolean>>;
}

const Jupiter = ({meshRef, scale, setActive, setHover, active}:planetProps) => {
    const texture = useLoader(TextureLoader, '/textures/2k_jupiter.jpg')
    return (
        <animated.mesh
            ref={meshRef}
            scale={scale}
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
            <sphereGeometry args={[1, 64, 64]}/>
            <meshStandardMaterial map={texture} />
        </animated.mesh>
    )
}

export default Jupiter