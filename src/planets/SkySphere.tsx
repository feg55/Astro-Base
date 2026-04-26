import { useLoader } from "@react-three/fiber";
import { BackSide, TextureLoader } from "three";

const SkySphere = () => {
    const stars = useLoader(TextureLoader, '/textures/2k_stars_milky_way.jpg')

    return(
    <mesh>
      <sphereGeometry args={[1000, 16, 16]} />
      <meshBasicMaterial
        map={stars}
        side={BackSide}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
    )
}
export default SkySphere