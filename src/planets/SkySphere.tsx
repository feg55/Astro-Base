import { useLoader, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { EquirectangularReflectionMapping, SRGBColorSpace, TextureLoader } from "three";

const SkySphere = () => {
    const { gl, scene } = useThree()
    const stars = useLoader(TextureLoader, '/textures/8k_stars_milky_way.jpg')

    useEffect(() => {
      stars.colorSpace = SRGBColorSpace
      stars.mapping = EquirectangularReflectionMapping
      stars.anisotropy = Math.max(1, gl.capabilities.getMaxAnisotropy())
      stars.needsUpdate = true

      const previousBackground = scene.background
      scene.background = stars

      return () => {
        scene.background = previousBackground
      }
    }, [gl, scene, stars])

    return null
}
export default SkySphere
