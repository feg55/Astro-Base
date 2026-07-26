import { animated, type SpringValue } from "@react-spring/three"
import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber"
import {
    memo,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type RefObject,
    type SetStateAction,
} from "react";
import {
    DoubleSide,
    SRGBColorSpace,
    TextureLoader,
    type Mesh,
    type Texture,
    type WebGLRenderer,
} from "three";
import { withBasePath } from "../lib/config";

const EARTH_NORMAL_MAP_PATH = withBasePath('textures/2k_earth_normal_map.png')
const EARTH_SPECULAR_MAP_PATH = withBasePath('textures/2k_earth_specular_map.jpg')
const EARTH_CLOUDS_MAP_PATH = withBasePath('textures/2k_earth_clouds.jpg')
const SATURN_RING_MAP_PATH = withBasePath('textures/2k_saturn_ring_alpha.png')
const EARTH_NORMAL_MAP_PREVIEW_PATH = withBasePath('textures/preview/2k_earth_normal_map.png')
const EARTH_SPECULAR_MAP_PREVIEW_PATH = withBasePath('textures/preview/2k_earth_specular_map.jpg')
const EARTH_CLOUDS_MAP_PREVIEW_PATH = withBasePath('textures/preview/2k_earth_clouds.jpg')
const SATURN_RING_MAP_PREVIEW_PATH = withBasePath('textures/preview/2k_saturn_ring_alpha.png')
const FULL_RESOLUTION_DELAY_MS = 100

function getPreviewTexturePath(texturePath: string): string {
    const separatorIndex = texturePath.lastIndexOf('/')

    if (separatorIndex < 0) {
        return `preview/${texturePath}`
    }

    return `${texturePath.slice(0, separatorIndex + 1)}preview/${texturePath.slice(separatorIndex + 1)}`
}

function configureTexture(texture: Texture, maxAnisotropy: number, colorSpace?: Texture['colorSpace']) {
    if (colorSpace) {
        texture.colorSpace = colorSpace
    }

    texture.anisotropy = maxAnisotropy
    texture.needsUpdate = true
}

function scheduleWhenIdle(task: () => void): () => void {
    if ('requestIdleCallback' in window) {
        const idleCallbackId = window.requestIdleCallback(task, { timeout: 500 })
        return () => window.cancelIdleCallback(idleCallbackId)
    }

    const timerId = globalThis.setTimeout(task, 16)
    return () => globalThis.clearTimeout(timerId)
}

type TexturePreparationJob = {
    renderer: WebGLRenderer
    textures: readonly Texture[]
    textureIndex: number
    onComplete: () => void
    isCancelled: boolean
}

const texturePreparationQueue: TexturePreparationJob[] = []
let cancelQueueTask: (() => void) | null = null

function scheduleTexturePreparationQueue(): void {
    if (cancelQueueTask || texturePreparationQueue.length === 0) {
        return
    }

    cancelQueueTask = scheduleWhenIdle(() => {
        cancelQueueTask = null

        let job = texturePreparationQueue.shift()

        while (job?.isCancelled) {
            job = texturePreparationQueue.shift()
        }

        if (!job) {
            return
        }

        job.renderer.initTexture(job.textures[job.textureIndex])
        job.textureIndex += 1

        if (job.textureIndex < job.textures.length) {
            texturePreparationQueue.push(job)
        } else {
            window.requestAnimationFrame(() => {
                if (!job.isCancelled) {
                    job.onComplete()
                }
            })
        }

        scheduleTexturePreparationQueue()
    })
}

function enqueueTexturePreparation(
    renderer: WebGLRenderer,
    textures: readonly Texture[],
    onComplete: () => void,
): () => void {
    const job: TexturePreparationJob = {
        renderer,
        textures,
        textureIndex: 0,
        onComplete,
        isCancelled: false,
    }

    texturePreparationQueue.push(job)
    scheduleTexturePreparationQueue()

    return () => {
        job.isCancelled = true
    }
}

function usePreparedTextures(textures: readonly Texture[]): boolean {
    const gl = useThree((state) => state.gl)
    const [isPrepared, setIsPrepared] = useState(false)

    useEffect(() => {
        return enqueueTexturePreparation(gl, textures, () => {
            setIsPrepared(true)
        })
    }, [gl, textures])

    return isPrepared
}

export type PlanetBaseProps = {
    texture_path: string,
    hasRing: boolean,
    isStar: boolean,
    position?: [number, number, number]
    meshRef: RefObject<Mesh | null>;
    ringRef?: RefObject<Mesh | null>;
    scale: SpringValue<number>;
    setHover: Dispatch<SetStateAction<boolean>>;
    onSelect?: () => void
}

type EarthMaterialProps = {
    texture: Texture
    normalMapPath: string
    specularMapPath: string
}

const EarthMaterial = memo(function EarthMaterial({
    texture,
    normalMapPath,
    specularMapPath,
}: EarthMaterialProps) {
    const gl = useThree((state) => state.gl)
    const normalMap = useLoader(TextureLoader, normalMapPath)
    const specularMap = useLoader(TextureLoader, specularMapPath)

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())

        configureTexture(normalMap, maxAnisotropy)
        configureTexture(specularMap, maxAnisotropy)
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
})

type PlanetSurfaceMaterialProps = {
    texturePath: string
    normalMapPath: string
    specularMapPath: string
    isEarth: boolean
    isStar: boolean
}

const PlanetSurfaceMaterial = memo(function PlanetSurfaceMaterial({
    texturePath,
    normalMapPath,
    specularMapPath,
    isEarth,
    isStar,
}: PlanetSurfaceMaterialProps) {
    const gl = useThree((state) => state.gl)
    const texture = useLoader(TextureLoader, texturePath)

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())
        configureTexture(texture, maxAnisotropy, SRGBColorSpace)
    }, [gl, texture])

    if (isStar) {
        return (
            <meshStandardMaterial
                map={texture}
                emissive={'#ffffff'}
                emissiveMap={texture}
                emissiveIntensity={0.8}
                toneMapped={false}
            />
        )
    }

    if (isEarth) {
        return (
            <EarthMaterial
                texture={texture}
                normalMapPath={normalMapPath}
                specularMapPath={specularMapPath}
            />
        )
    }

    return <meshStandardMaterial map={texture} />
})

type PreparedPlanetSurfaceProps = {
    previewTexturePath: string
    texturePath: string
    isEarth: boolean
    isStar: boolean
}

const PreparedStandardSurface = memo(function PreparedStandardSurface({
    previewTexturePath,
    texturePath,
    isStar,
}: Omit<PreparedPlanetSurfaceProps, 'isEarth'>) {
    const gl = useThree((state) => state.gl)
    const previewTexture = useLoader(TextureLoader, previewTexturePath)
    const fullTexture = useLoader(TextureLoader, texturePath)
    const texturesToPrepare = useMemo(() => [fullTexture], [fullTexture])
    const isPrepared = usePreparedTextures(texturesToPrepare)
    const texture = isPrepared ? fullTexture : previewTexture

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())
        configureTexture(previewTexture, maxAnisotropy, SRGBColorSpace)
        configureTexture(fullTexture, maxAnisotropy, SRGBColorSpace)
    }, [fullTexture, gl, previewTexture])

    if (isStar) {
        return (
            <meshStandardMaterial
                map={texture}
                emissive={'#ffffff'}
                emissiveMap={texture}
                emissiveIntensity={0.8}
                toneMapped={false}
            />
        )
    }

    return <meshStandardMaterial map={texture} />
})

const PreparedEarthSurface = memo(function PreparedEarthSurface({
    previewTexturePath,
    texturePath,
}: Pick<PreparedPlanetSurfaceProps, 'previewTexturePath' | 'texturePath'>) {
    const gl = useThree((state) => state.gl)
    const previewTexture = useLoader(TextureLoader, previewTexturePath)
    const previewNormalMap = useLoader(TextureLoader, EARTH_NORMAL_MAP_PREVIEW_PATH)
    const previewSpecularMap = useLoader(TextureLoader, EARTH_SPECULAR_MAP_PREVIEW_PATH)
    const fullTexture = useLoader(TextureLoader, texturePath)
    const fullNormalMap = useLoader(TextureLoader, EARTH_NORMAL_MAP_PATH)
    const fullSpecularMap = useLoader(TextureLoader, EARTH_SPECULAR_MAP_PATH)
    const texturesToPrepare = useMemo(
        () => [fullTexture, fullNormalMap, fullSpecularMap],
        [fullNormalMap, fullSpecularMap, fullTexture],
    )
    const isPrepared = usePreparedTextures(texturesToPrepare)

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())

        configureTexture(previewTexture, maxAnisotropy, SRGBColorSpace)
        configureTexture(previewNormalMap, maxAnisotropy)
        configureTexture(previewSpecularMap, maxAnisotropy)
        configureTexture(fullTexture, maxAnisotropy, SRGBColorSpace)
        configureTexture(fullNormalMap, maxAnisotropy)
        configureTexture(fullSpecularMap, maxAnisotropy)
    }, [
        fullNormalMap,
        fullSpecularMap,
        fullTexture,
        gl,
        previewNormalMap,
        previewSpecularMap,
        previewTexture,
    ])

    return (
        <meshPhongMaterial
            map={isPrepared ? fullTexture : previewTexture}
            normalMap={isPrepared ? fullNormalMap : previewNormalMap}
            specularMap={isPrepared ? fullSpecularMap : previewSpecularMap}
            shininess={12}
            specular={'#2f2f2f'}
        />
    )
})

const PreparedPlanetSurface = memo(function PreparedPlanetSurface({
    previewTexturePath,
    texturePath,
    isEarth,
    isStar,
}: PreparedPlanetSurfaceProps) {
    if (isEarth) {
        return (
            <PreparedEarthSurface
                previewTexturePath={previewTexturePath}
                texturePath={texturePath}
            />
        )
    }

    return (
        <PreparedStandardSurface
            previewTexturePath={previewTexturePath}
            texturePath={texturePath}
            isStar={isStar}
        />
    )
})

type ProgressivePlanetSurfaceProps = {
    previewTexturePath: string
    texturePath: string
    isEarth: boolean
    isStar: boolean
    loadFullResolution: boolean
}

const ProgressivePlanetSurface = memo(function ProgressivePlanetSurface({
    previewTexturePath,
    texturePath,
    isEarth,
    isStar,
    loadFullResolution,
}: ProgressivePlanetSurfaceProps) {
    const previewMaterial = (
        <PlanetSurfaceMaterial
            texturePath={previewTexturePath}
            normalMapPath={EARTH_NORMAL_MAP_PREVIEW_PATH}
            specularMapPath={EARTH_SPECULAR_MAP_PREVIEW_PATH}
            isEarth={isEarth}
            isStar={isStar}
        />
    )

    if (!loadFullResolution) {
        return previewMaterial
    }

    return (
        <Suspense fallback={previewMaterial}>
            <PreparedPlanetSurface
                previewTexturePath={previewTexturePath}
                texturePath={texturePath}
                isEarth={isEarth}
                isStar={isStar}
            />
        </Suspense>
    )
})

const EarthCloudMaterial = memo(function EarthCloudMaterial({
    texturePath,
}: {
    texturePath: string
}) {
    const gl = useThree((state) => state.gl)
    const cloudTexture = useLoader(TextureLoader, texturePath)

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())
        configureTexture(cloudTexture, maxAnisotropy, SRGBColorSpace)
    }, [gl, cloudTexture])

    return (
        <meshPhongMaterial
            map={cloudTexture}
            alphaMap={cloudTexture}
            transparent={true}
            opacity={0.99}
            depthWrite={false}
        />
    )
})

const PreparedEarthCloudMaterial = memo(function PreparedEarthCloudMaterial() {
    const gl = useThree((state) => state.gl)
    const previewTexture = useLoader(TextureLoader, EARTH_CLOUDS_MAP_PREVIEW_PATH)
    const fullTexture = useLoader(TextureLoader, EARTH_CLOUDS_MAP_PATH)
    const texturesToPrepare = useMemo(() => [fullTexture], [fullTexture])
    const isPrepared = usePreparedTextures(texturesToPrepare)
    const texture = isPrepared ? fullTexture : previewTexture

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())
        configureTexture(previewTexture, maxAnisotropy, SRGBColorSpace)
        configureTexture(fullTexture, maxAnisotropy, SRGBColorSpace)
    }, [fullTexture, gl, previewTexture])

    return (
        <meshPhongMaterial
            map={texture}
            alphaMap={texture}
            transparent={true}
            opacity={0.99}
            depthWrite={false}
        />
    )
})

const EarthClouds = memo(function EarthClouds() {
    const cloudsRef = useRef<Mesh | null>(null)
    const [loadFullResolution, setLoadFullResolution] = useState(false)
    const previewMaterial = <EarthCloudMaterial texturePath={EARTH_CLOUDS_MAP_PREVIEW_PATH} />

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setLoadFullResolution(true)
        }, FULL_RESOLUTION_DELAY_MS)

        return () => window.clearTimeout(timer)
    }, [])

    useFrame((_state, delta) => {
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += delta * 0.01
        }
    })

    return (
        <mesh ref={cloudsRef}>
            <sphereGeometry args={[1.01, 64, 64]}/>
            {loadFullResolution ? (
                <Suspense fallback={previewMaterial}>
                    <PreparedEarthCloudMaterial />
                </Suspense>
            ) : previewMaterial}
        </mesh>
    )
})

const PlanetRingMaterial = memo(function PlanetRingMaterial({
    texturePath,
}: {
    texturePath: string
}) {
    const gl = useThree((state) => state.gl)
    const ringTexture = useLoader(TextureLoader, texturePath)

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())
        configureTexture(ringTexture, maxAnisotropy, SRGBColorSpace)
    }, [gl, ringTexture])

    return (
        <meshBasicMaterial
            transparent={true}
            side={DoubleSide}
            map={ringTexture}
            opacity={0.95}
            depthWrite={false}
        />
    )
})

const PreparedPlanetRingMaterial = memo(function PreparedPlanetRingMaterial() {
    const gl = useThree((state) => state.gl)
    const previewTexture = useLoader(TextureLoader, SATURN_RING_MAP_PREVIEW_PATH)
    const fullTexture = useLoader(TextureLoader, SATURN_RING_MAP_PATH)
    const texturesToPrepare = useMemo(() => [fullTexture], [fullTexture])
    const isPrepared = usePreparedTextures(texturesToPrepare)
    const texture = isPrepared ? fullTexture : previewTexture

    useEffect(() => {
        const maxAnisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())
        configureTexture(previewTexture, maxAnisotropy, SRGBColorSpace)
        configureTexture(fullTexture, maxAnisotropy, SRGBColorSpace)
    }, [fullTexture, gl, previewTexture])

    return (
        <meshBasicMaterial
            transparent={true}
            side={DoubleSide}
            map={texture}
            opacity={0.95}
            depthWrite={false}
        />
    )
})

type PlanetRingProps = Pick<PlanetBaseProps, 'position' | 'ringRef' | 'scale'>

const PlanetRing = memo(function PlanetRing({
    position,
    ringRef,
    scale,
}: PlanetRingProps) {
    const [loadFullResolution, setLoadFullResolution] = useState(false)
    const previewMaterial = <PlanetRingMaterial texturePath={SATURN_RING_MAP_PREVIEW_PATH} />

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setLoadFullResolution(true)
        }, FULL_RESOLUTION_DELAY_MS)

        return () => window.clearTimeout(timer)
    }, [])

    return (
        <animated.mesh
            rotation={[-Math.PI / 2.8, 0, 0]}
            position={position}
            scale={scale}
            ref={ringRef}
        >
            <ringGeometry args={[1.2, 1.8, 64]}/>
            {loadFullResolution ? (
                <Suspense fallback={previewMaterial}>
                    <PreparedPlanetRingMaterial />
                </Suspense>
            ) : previewMaterial}
        </animated.mesh>
    )
})

export const Planet = memo(function Planet({
    texture_path,
    hasRing,
    isStar,
    position,
    meshRef,
    ringRef,
    scale,
    setHover,
    onSelect,
}: PlanetBaseProps) {
    const isEarth = texture_path.includes('earth')
    const previewTexturePath = getPreviewTexturePath(texture_path)
    const [loadFullResolution, setLoadFullResolution] = useState(false)

    const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation()
        onSelect?.()
    }, [onSelect])

    const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        setHover(true)
    }, [setHover])

    const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        setHover(false)
    }, [setHover])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setLoadFullResolution(true)
        }, FULL_RESOLUTION_DELAY_MS)

        return () => window.clearTimeout(timer)
    }, [])

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
                <ProgressivePlanetSurface
                    previewTexturePath={previewTexturePath}
                    texturePath={texture_path}
                    isEarth={isEarth}
                    isStar={isStar}
                    loadFullResolution={loadFullResolution}
                />
                {isEarth && (
                    <Suspense fallback={null}>
                        <EarthClouds />
                    </Suspense>
                )}
            </animated.mesh>

            {hasRing && (
                <Suspense fallback={null}>
                    <PlanetRing
                        position={position}
                        ringRef={ringRef}
                        scale={scale}
                    />
                </Suspense>
            )}
        </>
    )
})
