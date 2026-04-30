import { animated, SpringValue } from "@react-spring/three"
import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber"
import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import { DoubleSide, SRGBColorSpace, TextureLoader, type Mesh, type Texture } from "three";

const EARTH_NORMAL_MAP_PATH = '/textures/2k_earth_normal_map.png'
const EARTH_SPECULAR_MAP_PATH = '/textures/2k_earth_specular_map.jpg'
const EARTH_CLOUDS_MAP_PATH = '/textures/2k_earth_clouds.jpg'


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

const EarthMaterial = ({ texture }: { texture: Texture }) => {
    const { gl } = useThree()
    const normalMap = useLoader(TextureLoader, EARTH_NORMAL_MAP_PATH)
    const specularMap = useLoader(TextureLoader, EARTH_SPECULAR_MAP_PATH)

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())

        normalMap.anisotropy = maxAnisotropy
        normalMap.needsUpdate = true

        specularMap.anisotropy = maxAnisotropy
        specularMap.needsUpdate = true
    }, [gl, normalMap, specularMap])

    return (
        <meshPhongMaterial
            map={texture}
            normalMap={normalMap}
            specularMap={specularMap}
            shininess={12}
            specular={'#2f2f2f'}
        />
    )
}

const EarthClouds = () => {
    const { gl } = useThree()
    const cloudsRef = useRef<Mesh | null>(null)
    const cloudTexture = useLoader(TextureLoader, EARTH_CLOUDS_MAP_PATH)

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())

        cloudTexture.colorSpace = SRGBColorSpace
        cloudTexture.anisotropy = maxAnisotropy
        cloudTexture.needsUpdate = true
    }, [gl, cloudTexture])

    useFrame((_state, delta) => {
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += delta * 0.01
        }
    })

    return (
        <mesh ref={cloudsRef}>
            <sphereGeometry args={[1.01, 64, 64]}/>
            <meshPhongMaterial
                map={cloudTexture}
                alphaMap={cloudTexture}
                transparent={true}
                opacity={0.99}
                depthWrite={false}
            />
        </mesh>
    )
}

export const Planet = ({texture_path, hasRing, isStar, position, meshRef, ringRef, scale, setHover, onSelect}: PlanetBaseProps) => {
    const { gl } = useThree()
    const texture = useLoader(TextureLoader, texture_path)
    const ringTexture = useLoader(TextureLoader, '/textures/2k_saturn_ring_alpha.png')
    const isEarth = texture_path.includes('earth')

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
                <sphereGeometry args={[1, 64, 64]}/>
                {isStar ? (
                    <meshStandardMaterial 
                        map={texture} 
                        emissive={'#ffffff'}
                        emissiveMap={texture}
                        emissiveIntensity={0.8}
                        toneMapped={false}
                    />
                ) : isEarth ? (
                    <EarthMaterial texture={texture} />
                ) : (
                    <meshStandardMaterial map={texture} />
                )}
                {isEarth && <EarthClouds />}
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
