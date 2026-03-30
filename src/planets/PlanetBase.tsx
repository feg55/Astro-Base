import { animated, SpringValue } from "@react-spring/three"
import { useLoader, type ThreeEvent } from "@react-three/fiber"
import type { Dispatch, RefObject, SetStateAction } from "react";
import { DoubleSide, TextureLoader, type Mesh } from "three";


export type PlanetBaseProps = {
    texture_path: string,
    hasRing: boolean,
    isStar: boolean,
    position?: [number, number, number]
    meshRef: RefObject<Mesh | null>;
    ringRef?: RefObject<Mesh | null>;
    scale: SpringValue<number>;
    active: boolean;
    hovered: boolean;
    setActive: Dispatch<SetStateAction<boolean>>;
    setHover: Dispatch<SetStateAction<boolean>>;
    onSelect?: () => void
}

export const Planet = ({texture_path, hasRing, isStar, position, meshRef, ringRef, scale, setHover, onSelect}: PlanetBaseProps) => {
    const texture = useLoader(TextureLoader, texture_path)
    const ringTexture = useLoader(TextureLoader, '/textures/2k_saturn_ring_alpha.png')
    if(hasRing) {
        return(
            <>
                <animated.mesh
                    ref={meshRef}
                    position={position}
                    scale={scale}
                    onClick={(event: ThreeEvent<MouseEvent>) => {
                        event.stopPropagation()
                        onSelect?.()
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
                    <meshStandardMaterial map={texture}/>
                </animated.mesh>
                <animated.mesh
                rotation={[-Math.PI / 2.8, 0, 0]}
                position={position}
                scale={scale}
                ref={ringRef}
                >
                    <ringGeometry args={[1.2, 1.8, 64]}/>
                    <meshBasicMaterial
                    transparent={true}
                    side={DoubleSide}
                    map={ringTexture}
                    opacity={0.95}
                    depthWrite={false}
                    />
                </animated.mesh>
            </>
        )
    }
    if(isStar) {
    return (
    <>
        <animated.mesh
            ref={meshRef}
            position={position}
            scale={scale}
            onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation()
                onSelect?.()
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
            <meshStandardMaterial 
            map={texture} 
            emissive={'#ffffff'}
            emissiveMap={texture}
            emissiveIntensity={0.8}
            toneMapped={false}
            />
        </animated.mesh>
    </>
    )
    }
    return (
    <>
        <animated.mesh
            ref={meshRef}
            position={position}
            scale={scale}
            onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation()
                onSelect?.()
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
    </>
    )
}