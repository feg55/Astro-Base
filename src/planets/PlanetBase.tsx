import { animated, SpringValue } from "@react-spring/three"
import { useLoader, useThree, type ThreeEvent } from "@react-three/fiber"
import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import { DoubleSide, SRGBColorSpace, TextureLoader, type Mesh } from "three";


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
    const { gl } = useThree()
    const texture = useLoader(TextureLoader, texture_path)
    const ringTexture = useLoader(TextureLoader, '/textures/2k_saturn_ring_alpha.png')

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())

        texture.colorSpace = SRGBColorSpace
        texture.anisotropy = maxAnisotropy
        texture.needsUpdate = true

        ringTexture.colorSpace = SRGBColorSpace
        ringTexture.anisotropy = maxAnisotropy
        ringTexture.needsUpdate = true
    }, [gl, texture, ringTexture])

    const handleClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation()
        onSelect?.()
    }

    const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        setHover(true)
    }

    const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        setHover(false)
    }

    return (
        <>
            <animated.mesh
                ref={meshRef}
                position={position}
                scale={scale}
                onClick={handleClick}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
            >
                <sphereGeometry args={[1, 128, 96]}/>
                {isStar ? (
                    <meshStandardMaterial 
                        map={texture} 
                        emissive={'#ffffff'}
                        emissiveMap={texture}
                        emissiveIntensity={0.8}
                        toneMapped={false}
                    />
                ) : (
                    <meshStandardMaterial map={texture} />
                )}
            </animated.mesh>

            {hasRing && (
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
            )}
        </>
    )
}
