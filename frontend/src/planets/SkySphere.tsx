import { useLoader, useThree } from "@react-three/fiber";
import { memo, useEffect } from "react";
import {
  EquirectangularReflectionMapping,
  SRGBColorSpace,
  TextureLoader,
  type Scene,
  type Texture,
} from "three";
import { withBasePath } from "../lib/config";

function configureStarsBackground(scene: Scene, stars: Texture, maxAnisotropy: number) {
      stars.colorSpace = SRGBColorSpace
      stars.mapping = EquirectangularReflectionMapping
      stars.anisotropy = maxAnisotropy
      stars.needsUpdate = true

      const previousBackground = scene.background
      scene.background = stars

      return () => {
        scene.background = previousBackground
      }
}

const STARS_TEXTURE_PATH = withBasePath('textures/8k_stars_milky_way.jpg')

useLoader.preload(TextureLoader, STARS_TEXTURE_PATH)

const SkySphere = memo(function SkySphere() {
    const gl = useThree((state) => state.gl)
    const scene = useThree((state) => state.scene)
    const stars = useLoader(TextureLoader, STARS_TEXTURE_PATH)

    useEffect(() => {
      return configureStarsBackground(scene, stars, Math.max(1, gl.capabilities.getMaxAnisotropy()))
    }, [gl, scene, stars])

    return null
})
export default SkySphere
