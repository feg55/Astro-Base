import { useLoader, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import {
  EquirectangularReflectionMapping,
  SRGBColorSpace,
  TextureLoader,
  type Scene,
  type Texture,
} from "three";

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

const SkySphere = () => {
    const { gl, scene } = useThree()
    const stars = useLoader(TextureLoader, '/textures/8k_stars_milky_way.jpg')

    useEffect(() => {
      return configureStarsBackground(scene, stars, Math.max(1, gl.capabilities.getMaxAnisotropy()))
    }, [gl, scene, stars])

    return null
}
export default SkySphere
