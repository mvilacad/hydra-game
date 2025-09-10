import { Text, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Player } from "@shared/types";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

interface PlayerAvatarProps {
	player: Player;
	position: [number, number, number];
	isAttacking?: boolean;
	chosenModel: string; // <- vem do pai
}

function useNormalizedModel(path: string) {
	const { scene } = useGLTF(path);

	const model = useMemo(() => {
		const clone = SkeletonUtils.clone(scene);

		const box = new THREE.Box3().setFromObject(clone);
		const center = new THREE.Vector3();
		box.getCenter(center);

		clone.position.x -= center.x;
		clone.position.z -= center.z;
		clone.position.y -= box.min.y;

		return clone;
	}, [scene]);

	return model;
}

export function PlayerAvatar({
	player,
	position,
	isAttacking = false,
	chosenModel,
}: PlayerAvatarProps) {
	const meshRef = useRef<THREE.Group>(null);

	const model = useNormalizedModel(chosenModel);

	// Idle animation
	useFrame((state) => {
		if (meshRef.current) {
			meshRef.current.position.y =
				Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;

			meshRef.current.lookAt(0, meshRef.current.position.y, 0);
			meshRef.current.rotation.y +=
				Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.01;
		}
	});

	return (
		<group position={position}>
			<group ref={meshRef}>
				<primitive object={model} />
			</group>

			{/* Caixa do nome */}
			<group position={[0, 2.5, 0]}>
				{/* Background */}
				<mesh>
					<planeGeometry args={[player.name.length * 0.18, 0.4]} />
					<meshBasicMaterial color="black" transparent opacity={0.6} />
				</mesh>

				{/* Texto */}
				<Text
					position={[0, 0, 0.01]} // levemente à frente do plano
					fontSize={0.3}
					color="white"
					anchorX="center"
					anchorY="middle"
				>
					{player.name}
				</Text>
			</group>
		</group>
	);
}

useGLTF.preload("/3d/heroes/matheus.glb");
useGLTF.preload("/3d/heroes/guilherme_m.glb");
useGLTF.preload("/3d/heroes/rafael.glb");
