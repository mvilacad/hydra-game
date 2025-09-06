import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { useBattle } from "@/lib/stores/useBattle";
import { Hydra3D } from "../Entities/Hydra3D";
import { PlayerAvatar } from "../Entities/PlayerAvatar";

interface BattleSceneProps {
	className?: string;
}

export function BattleScene({ className }: BattleSceneProps) {
	const { players, attacks, clearAttack } = useBattle();

	const [particles, setParticles] = useState<
		Array<{
			id: string;
			type: "hit" | "glow" | "smoke" | "sparks" | "magic" | "explosion";
			position: [number, number, number];
			timestamp: number;
		}>
	>([]);

	// Handle new attacks
	useEffect(() => {
		attacks.forEach((attack) => {
			// Create particle effect for attack
			const particleType:
				| "hit"
				| "glow"
				| "smoke"
				| "sparks"
				| "magic"
				| "explosion" =
				attack.type === "magic"
					? "magic"
					: attack.type === "fire"
						? "explosion"
						: attack.type === "arrow"
							? "sparks"
							: "hit";

			const newParticle = {
				id: `${attack.id}-${Date.now()}`,
				type: particleType,
				position: [0, 2, 0] as [number, number, number], // Hydra position
				timestamp: Date.now(),
			};

			setParticles((prev) => [...prev, newParticle]);

			// Clear attack after showing effect
			setTimeout(() => {
				clearAttack(attack.id);
			}, 1000);
		});
	}, [attacks, clearAttack]);

	// Clean up old particles
	useEffect(() => {
		const interval = setInterval(() => {
			const now = Date.now();
			setParticles((prev) => prev.filter((p) => now - p.timestamp < 3000));
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	// Calculate player positions in a circle around the hydra
	const playerPositions = players.map((_, index) => {
		const angle = (index / Math.max(players.length, 1)) * Math.PI * 2;
		const radius = 6;
		return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [
			number,
			number,
			number,
		];
	});

	return (
		<div className={`relative w-full h-full ${className}`}>
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
				{/* Epic Fantasy Background */}
				<fog attach="fog" args={["#0d0d1a", 5, 60]} />
				<color attach="background" args={["#0d0d1a"]} />

				{/* Bright Fantasy Lighting */}
				<ambientLight intensity={0.3} />
				<directionalLight
					position={[10, 20, 10]}
					intensity={1.2}
					color={0xfff8dc}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
					shadow-camera-far={50}
					shadow-camera-left={-20}
					shadow-camera-right={20}
					shadow-camera-top={20}
					shadow-camera-bottom={-20}
				/>

				{/* Magical Colorful Lighting */}
				{/* <pointLight
          position={[0, 12, 0]}
          intensity={0.8}
          color={0xffd700}
          distance={25}
          decay={1}
        /> */}

				{/* Rainbow Battle Lights */}
				{/* <pointLight
          position={[-10, 8, 10]}
          intensity={0.6}
          color={0xff6b9d}
          distance={20}
          decay={1}
        />
        <pointLight
          position={[10, 8, -10]}
          intensity={0.6}
          color={0x6bcfff}
          distance={20}
          decay={1}
        />
        <pointLight
          position={[0, 8, 12]}
          intensity={0.6}
          color={0x9d6bff}
          distance={20}
          decay={1}
        /> */}

				<Suspense fallback={null}>
					{/* Environment for reflections */}
					{/* <Environment preset="sunset" /> */}

					{/* Epic Fantasy Ground */}
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

					{/* Colorful Magical Arena */}
					<group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
						{/* Outer rainbow circle */}
						<mesh>
							{/* <ringGeometry args={[12, 12.5, 64]} />
              <meshBasicMaterial
                color={0xffd700}
                transparent
                opacity={0.8}
              /> */}
						</mesh>

						{/* Middle rainbow circle */}
						<mesh>
							{/* <ringGeometry args={[10, 10.5, 48]} />
              <meshBasicMaterial
                color={0xff69b4}
                transparent
                opacity={0.7}
              /> */}
						</mesh>

						{/* Inner magical circle */}
						<mesh>
							{/* <ringGeometry args={[8, 8.5, 32]} />
              <meshBasicMaterial
                color={0x00bfff}
                transparent
                opacity={0.6}
              /> */}
						</mesh>

						{/* Center battle platform */}
						<mesh>
							<circleGeometry args={[7.5, 32]} />
							<meshStandardMaterial
								color={0xffffff}
								transparent
								opacity={0.3}
								emissive={0xffd700}
								emissiveIntensity={0.1}
							/>
						</mesh>
					</group>

					{/* Floating Crystal Pillars */}
					{/* {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 15;
            return (
              <group key={i} position={[Math.cos(angle) * radius, 3, Math.sin(angle) * radius]}>
                <mesh>
                  <coneGeometry args={[0.8, 4, 8]} />
                  <meshStandardMaterial
                    color={[0xff69b4, 0x00bfff, 0xffd700, 0x9370db, 0x32cd32, 0xff4500][i]}
                    emissive={[0xff69b4, 0x00bfff, 0xffd700, 0x9370db, 0x32cd32, 0xff4500][i]}
                    emissiveIntensity={0.3}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
                <mesh position={[0, 2.5, 0]}>
                  <octahedronGeometry args={[0.5]} />
                  <meshStandardMaterial
                    color={0xffffff}
                    emissive={[0xff69b4, 0x00bfff, 0xffd700, 0x9370db, 0x32cd32, 0xff4500][i]}
                    emissiveIntensity={0.8}
                  />
                </mesh>
              </group>
            );
          })} */}

					{/* Magical Floating Particles */}
					{/* <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={300}
                array={new Float32Array(Array.from({ length: 900 }, (_, i) =>
                  i % 3 === 0 ? (Math.random() - 0.5) * 60 : // x
                    i % 3 === 1 ? Math.random() * 15 + 2 :      // y
                      (Math.random() - 0.5) * 60                 // z
                ))}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              color={0xffd700}
              size={0.3}
              transparent
              opacity={0.6}
              sizeAttenuation
            />
          </points> */}

					{/* Central Hydra */}
					<Hydra3D position={[0, 2, 0]} scale={1} />

					{/* Player Avatars */}
					{players.map((player, index) => (
						<PlayerAvatar
							key={player.id}
							player={player}
							position={playerPositions[index]}
							isAttacking={attacks.some((a) => a.playerId === player.id)}
						/>
					))}

					{/* Enhanced Camera Controls - static target for better performance */}
					<OrbitControls
						enablePan={false}
						enableZoom={true}
						minDistance={6}
						maxDistance={25}
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
