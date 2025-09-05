import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { Player } from "@shared/types";

interface PlayerAvatarProps {
  player: Player;
  position: [number, number, number];
  isAttacking?: boolean;
}

/** Centralized class config */
const CLASS_CONFIG: Record<string, { color: number; accessories?: JSX.Element }> = {
  warrior: {
    color: 0xff6b35,
    accessories: (
      <mesh position={[0.5, 0.8, 0]} rotation-z={Math.PI / 6}>
        <boxGeometry args={[0.05, 0.8, 0.05]} />
        <meshPhongMaterial color={0xc0c0c0} />
      </mesh>
    ),
  },
  mage: {
    color: 0x9b59b6,
    accessories: (
      <>
        <mesh position={[-0.4, 0.8, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
          <meshPhongMaterial color={0x8b4513} />
        </mesh>
        <mesh position={[-0.4, 1.4, 0]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshPhongMaterial color={0x9932cc} emissive={0x4b0082} emissiveIntensity={0.3} />
        </mesh>
      </>
    ),
  },
  archer: {
    color: 0x2ecc71,
    accessories: (
      <mesh position={[-0.5, 1, 0]} rotation-z={Math.PI / 2}>
        <torusGeometry args={[0.3, 0.02, 4, 8, Math.PI]} />
        <meshPhongMaterial color={0x8b4513} />
      </mesh>
    ),
  },
  paladin: {
    color: 0xf1c40f,
    accessories: (
      <mesh position={[-0.5, 0.8, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 8]} />
        <meshPhongMaterial color={0xffd700} shininess={100} />
      </mesh>
    ),
  },
};

export function PlayerAvatar({ player, position, isAttacking = false }: PlayerAvatarProps) {
  const meshRef = useRef<THREE.Group>(null);
  const config = CLASS_CONFIG[player.character] || { color: 0x888888 };

  // Attack glow animation
  const { glowIntensity } = useSpring({
    glowIntensity: isAttacking ? 1 : 0,
    config: { duration: 300 },
  });

  // Idle animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;

      meshRef.current.lookAt(0, meshRef.current.position.y, 0);
      meshRef.current.rotation.y += Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.01;
    }
  });

  return (
    <group position={position}>
      <group ref={meshRef}>
        {/* Body */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 1.2, 8]} />
          <meshPhongMaterial color={config.color} shininess={30} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.25, 8, 6]} />
          <meshPhongMaterial color={new THREE.Color(config.color).multiplyScalar(1.2)} />
        </mesh>

        {/* Accessories */}
        {config.accessories}

        {/* Attack glow effect */}
        <animated.mesh
          scale={[1.5, 1.5, 1.5]}
          visible={glowIntensity.to((v) => v > 0.1)}
        >
          <sphereGeometry args={[0.8, 16, 12]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={0.3}
          />
        </animated.mesh>
      </group>

      {/* Player name */}
      <Text position={[0, 2.5, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {player.name}
      </Text>
    </group>
  );
}
