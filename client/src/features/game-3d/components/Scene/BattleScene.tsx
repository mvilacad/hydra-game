// BattleScene2DBackground.tsx
import { useGameStore } from "@/lib/stores/useGameStore";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { Hydra3D } from "../Entities/Hydra3D";
import { PlayerAvatar } from "../Entities/PlayerAvatar";

interface BattleSceneProps {
	className?: string;
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

	// radial positions (same as your original idea)
	const playerPositions = useMemo(() => {
		return players.map((_, index) => {
			const angle = (index / Math.max(players.length, 1)) * Math.PI * 2;
			const radius = 6;
			return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [
				number,
				number,
				number,
			];
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
				<color attach="background" args={["#---"]} />
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
					<mesh
						receiveShadow
						rotation={[-Math.PI / 2, 0, 0]}
						position={[0, -0.1, 0]}
					>
						<planeGeometry args={[50, 50]} />
						<meshStandardMaterial
							color={0x90ee90}
							roughness={0.8}
							metalness={0.0}
						/>
					</mesh>
					<Hydra3D position={[0, 2, 0]} scale={1} />

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

					{/* Camera controls - keep users able to zoom/rotate a bit */}
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
