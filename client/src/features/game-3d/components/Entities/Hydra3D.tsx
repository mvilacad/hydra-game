import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import { animated, useSpring, config } from "@react-spring/three";
import type * as THREE from "three";
import { useBattle } from "@/lib/stores/useBattle";

interface Hydra3DProps {
	position?: [number, number, number];
	scale?: number;
}

export function Hydra3D({ position = [0, 0, 0], scale = 1 }: Hydra3DProps) {
	const meshRef = useRef<THREE.Group>(null);
	const { hydraHealth, maxHydraHealth, lastAttack } = useBattle();

	// Carrega o modelo Hydra
	const { scene } = useGLTF("/3d/hydra.glb"); // modelo na pasta public

	// Percentual de vida
	const healthPercent = hydraHealth / maxHydraHealth;

	// Animações com react-spring
	const { damageFlash, angerLevel } = useSpring({
		damageFlash: lastAttack ? 1 : 0,
		angerLevel: 1 - healthPercent,
		config: config.wobbly,
	});

	// Loop de animação - mexe no modelo
	useFrame((state) => {
		if (!meshRef.current) return;

		const t = state.clock.getElapsedTime();
		const anger = 1 - healthPercent;

		// Movimento básico do corpo
		meshRef.current.position.y =
			position[1] + Math.sin(t * 1.2) * (0.2 + anger * 0.3);
		meshRef.current.rotation.y = Math.sin(t * 0.5) * (0.1 + anger * 0.3);
	});

	return (
		<animated.group
			ref={meshRef}
			position={position}
			scale={[scale, scale, scale]}
		>
			{/* Hydra 3D real */}
			<Center>
				<primitive object={scene} scale={[50, 50, 50]} />
			</Center>
			{/* Flash de dano */}
			<animated.mesh
				scale={damageFlash.to((v) => [3 + v, 3 + v, 3 + v])}
				visible={damageFlash.to((v) => v > 0.3)}
			>
				<sphereGeometry args={[3, 24, 18]} />
				<animated.meshBasicMaterial
					color="orange"
					transparent
					opacity={damageFlash.to((v) => v * 0.5)}
				/>
			</animated.mesh>

			{/* Aura de raiva */}
			{healthPercent < 0.5 && (
				<animated.mesh
					scale={angerLevel.to((v) => [4 + v * 2, 4 + v * 2, 4 + v * 2])}
				>
					<sphereGeometry args={[3.5, 32, 24]} />
					<animated.meshBasicMaterial
						color="red"
						transparent
						opacity={angerLevel.to((v) => v * 0.2)}
					/>
				</animated.mesh>
			)}
		</animated.group>
	);
}

// 🚨 Garante que o modelo é pré-carregado
useGLTF.preload("/3d/hydra.glb");
