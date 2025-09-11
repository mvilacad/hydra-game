// BattleScene2DBackground.tsx
import { useGameStore } from "@/lib/stores/useGameStore";
import { OrbitControls, useFBX } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { PlayerAvatar } from "../Entities/PlayerAvatar";

interface BattleSceneProps {
	className?: string;
}

const arenaSize = 50; // ou use a escala real do FBX

export function GrassFloor() {
	const fbx = useFBX("/3d/scenario/Grass.fbx");

	// Ajuste escala e posição conforme necessário
	fbx.scale.set(0.2, 0.2, 0.2);
	fbx.position.set(0, 0, 0);

	// Habilita sombras
	fbx.traverse((child: any) => {
		if (child.isMesh) {
			child.receiveShadow = true;
			child.castShadow = false;
		}
	});

	return <primitive object={fbx} />;
}
export function BattleScene({ className }: BattleSceneProps) {
	const { players, attacks } = useGameStore();

	const heroAssignments = useMemo(() => {
		const HERO_MODELS = [
			"/3d/heroes/matheus.glb",
			"/3d/heroes/guilherme_m.glb",
			"/3d/heroes/rafael.glb",
		];
		const shuffled = [...HERO_MODELS].sort(() => Math.random() - 0.5);
		const assignments: Record<string, string> = {};
		players.forEach((player, i) => {
			assignments[player.id] = shuffled[i % shuffled.length];
		});
		return assignments;
	}, [players]);

	const playerPositions = useMemo(() => {
		const numPlayers = players.length;
		const radius = arenaSize / 3; // deixa um espaço do centro
		return players.map((_, i) => {
			const angle = (i / numPlayers) * Math.PI * 2;
			const x = Math.cos(angle) * radius;
			const z = Math.sin(angle) * radius;
			const y = 0.1; // altura para os pés tocarem o chão
			return [x, y, z] as [number, number, number];
		});
	}, [players.length]);

	return (
		<div className={`relative w-full h-full ${className ?? ""}`}>
			<Canvas
				shadows
				camera={{
					position: [8, 6, 8],
					fov: 65,
					near: 0.1,
					far: 1000,
				}}
				gl={{
					antialias: true,
					powerPreference: "high-performance",
					alpha: false,
				}}
			>
				<color attach="background" args={["#a0a0a0"]} />
				<ambientLight intensity={0.35} />
				<directionalLight
					position={[10, 20, 10]}
					intensity={1.0}
					color={0xfff8dc}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
				/>

				<Suspense fallback={null}>
					{/* Arena FBX */}
					<GrassFloor />

					{/* 3D Hydra */}
					{/* <Hydra3D position={[0, 2, 0]} scale={1} /> */}

					{/* 3D player avatars */}
					{players.filter(Boolean).map((player, index) => (
						<PlayerAvatar
							key={player.id}
							player={player}
							position={playerPositions[index]}
							isAttacking={attacks.some((a) => a.playerId === player.id)}
							chosenModel={heroAssignments[player.id]}
						/>
					))}

					{/* Camera controls */}
					<OrbitControls
						enablePan={false}
						enableZoom={true}
						minDistance={6}
						maxDistance={30}
						minPolarAngle={Math.PI / 6}
						maxPolarAngle={Math.PI / 2.2}
						target={[0, 2, 0]}
						autoRotate={attacks.length > 0}
						autoRotateSpeed={attacks.length * 2}
						enableDamping
						dampingFactor={0.05}
					/>
				</Suspense>
			</Canvas>
		</div>
	);
}
