import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Hydra3D } from './Hydra3D';
import { PlayerAvatar } from './PlayerAvatar';
import { AttackEffect } from './AttackEffect';
import { ParticleSystem } from './ParticleSystem';
import { useBattle } from '@/lib/stores/useBattle';
import { useWebSocket } from '@/lib/stores/useWebSocket';

interface BattleSceneProps {
  className?: string;
}

export function BattleScene({ className }: BattleSceneProps) {
  const { 
    players, 
    hydraHealth, 
    maxHydraHealth, 
    gamePhase, 
    attacks,
    clearAttack
  } = useBattle();
  
  const [particles, setParticles] = useState<Array<{
    id: string;
    type: 'hit' | 'glow' | 'smoke' | 'sparks' | 'magic' | 'explosion';
    position: [number, number, number];
    timestamp: number;
  }>>([]);

  // Handle new attacks
  useEffect(() => {
    attacks.forEach(attack => {
      // Create particle effect for attack
      const particleType: 'hit' | 'glow' | 'smoke' | 'sparks' | 'magic' | 'explosion' = 
        attack.type === 'magic' ? 'magic' : 
        attack.type === 'fire' ? 'explosion' : 
        attack.type === 'arrow' ? 'sparks' : 'hit';
        
      const newParticle = {
        id: `${attack.id}-${Date.now()}`,
        type: particleType,
        position: [0, 2, 0] as [number, number, number], // Hydra position
        timestamp: Date.now()
      };
      
      setParticles(prev => [...prev, newParticle]);
      
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
      setParticles(prev => prev.filter(p => now - p.timestamp < 3000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate player positions in a circle around the hydra
  const playerPositions = players.map((_, index) => {
    const angle = (index / Math.max(players.length, 1)) * Math.PI * 2;
    const radius = 6;
    return [
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    ] as [number, number, number];
  });

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        shadows
        camera={{
          position: [8, 6, 8],
          fov: 65,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false
        }}
      >
        {/* Background */}
        <color attach="background" args={["#0a0a0a"]} />
        
        {/* Enhanced Atmospheric Lighting */}
        <ambientLight intensity={0.2} color={0x202040} />
        <directionalLight
          position={[10, 15, 5]}
          intensity={0.8}
          color={0xffffff}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        {/* Dynamic battle lighting */}
        <pointLight 
          position={[0, 8, 0]} 
          intensity={1.2 + Math.sin(Date.now() * 0.002) * 0.3} 
          color={0xff3300} 
          distance={20}
          decay={2}
        />
        
        {/* Magical ambient lights */}
        <pointLight 
          position={[-8, 5, 8]} 
          intensity={0.8 + Math.sin(Date.now() * 0.003) * 0.4} 
          color={0x6600ff} 
          distance={15}
          decay={1.5}
        />
        <pointLight 
          position={[8, 5, -8]} 
          intensity={0.8 + Math.cos(Date.now() * 0.0025) * 0.4} 
          color={0x00ff66} 
          distance={15}
          decay={1.5}
        />
        
        {/* Battle attack lighting */}
        {attacks.map((attack, index) => (
          <pointLight
            key={attack.id}
            position={playerPositions[players.findIndex(p => p.id === attack.playerId)] || [0, 2, 0]}
            intensity={2}
            color={
              attack.type === 'magic' ? 0x9932CC :
              attack.type === 'fire' ? 0xFF4500 :
              attack.type === 'arrow' ? 0x00FF00 :
              0xFFFFFF
            }
            distance={10}
            decay={2}
          />
        ))}
        
        <Suspense fallback={null}>
          {/* Environment for reflections */}
          <Environment preset="night" />
          
          {/* Enhanced Ground plane with texture */}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial 
              color={0x0a0a0a} 
              roughness={0.9}
              metalness={0.1}
              emissive={0x111122}
              emissiveIntensity={0.05}
            />
          </mesh>
          
          {/* Epic battle arena with glowing runes */}
          <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <mesh>
              <ringGeometry args={[8, 9, 64]} />
              <meshBasicMaterial 
                color={0x6600ff}
                transparent 
                opacity={0.6 + Math.sin(Date.now() * 0.002) * 0.2}
              />
            </mesh>
            
            {/* Inner magic circle */}
            <mesh>
              <ringGeometry args={[7, 7.2, 32]} />
              <meshBasicMaterial 
                color={0x00ffff}
                transparent 
                opacity={0.4 + Math.cos(Date.now() * 0.003) * 0.2}
              />
            </mesh>
            
            {/* Outer runic circle */}
            <mesh>
              <ringGeometry args={[9.2, 9.5, 48]} />
              <meshBasicMaterial 
                color={0xff6600}
                transparent 
                opacity={0.3 + Math.sin(Date.now() * 0.0025) * 0.15}
              />
            </mesh>
          </group>
          
          {/* Atmospheric fog particles */}
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={200}
                array={new Float32Array(Array.from({ length: 600 }, (_, i) => 
                  i % 3 === 0 ? (Math.random() - 0.5) * 40 : // x
                  i % 3 === 1 ? Math.random() * 8 + 1 :      // y
                  (Math.random() - 0.5) * 40                 // z
                ))}
                itemSize={3}
                args={[new Float32Array(Array.from({ length: 600 }, (_, i) => 
                  i % 3 === 0 ? (Math.random() - 0.5) * 40 : // x
                  i % 3 === 1 ? Math.random() * 8 + 1 :      // y
                  (Math.random() - 0.5) * 40                 // z
                )), 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              color={0x444466}
              size={0.1}
              transparent
              opacity={0.3}
              sizeAttenuation
            />
          </points>
          
          {/* Central Hydra */}
          <Hydra3D position={[0, 2, 0]} scale={1} />
          
          {/* Player Avatars */}
          {players.map((player, index) => (
            <PlayerAvatar
              key={player.id}
              player={player}
              position={playerPositions[index]}
              isAttacking={attacks.some(a => a.playerId === player.id)}
            />
          ))}
          
          {/* Attack Effects */}
          {attacks.map((attack) => {
            const playerIndex = players.findIndex(p => p.id === attack.playerId);
            if (playerIndex === -1) return null;
            
            return (
              <AttackEffect
                key={attack.id}
                type={attack.type}
                startPosition={playerPositions[playerIndex]}
                targetPosition={[0, 2, 0]}
                onComplete={() => clearAttack(attack.id)}
              />
            );
          })}
          
          {/* Particle Effects */}
          {particles.map((particle) => (
            <ParticleSystem
              key={particle.id}
              type={particle.type}
              position={particle.position}
              count={particle.type === 'explosion' ? 200 : 50}
              intensity={1}
              duration={2}
              autoStart={true}
            />
          ))}
          
          {/* Enhanced Camera Controls with cinematic movement */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={6}
            maxDistance={25}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            target={[
              Math.sin(Date.now() * 0.0005) * 0.5,
              2,
              Math.cos(Date.now() * 0.0005) * 0.5
            ]}
            autoRotate={attacks.length > 0}
            autoRotateSpeed={attacks.length * 0.5}
          />
        </Suspense>
      </Canvas>
      
      {/* Epic Health Bar Overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/70 backdrop-blur-md border border-red-500/50 rounded-xl p-6 min-w-[350px] shadow-2xl shadow-red-500/20">
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold text-red-400 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent animate-pulse">
              ⚔️ HYDRA BOSS ⚔️
            </h3>
          </div>
          
          {/* Epic health bar with glow effects */}
          <div className="relative w-full h-6 bg-gray-900 rounded-full overflow-hidden border-2 border-red-500/70 shadow-lg shadow-red-500/30">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500 transition-all duration-500 ease-out shadow-inner health-bar"
              style={{ width: `${(hydraHealth / maxHydraHealth) * 100}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            
            {/* Health bar glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0 blur-sm -z-10" />
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <span className="text-red-300 font-bold text-lg">{hydraHealth}</span>
            <span className="text-yellow-400 font-semibold">
              {((hydraHealth / maxHydraHealth) * 100).toFixed(1)}%
            </span>
            <span className="text-gray-300 font-bold text-lg">{maxHydraHealth}</span>
          </div>
          
          {/* Damage indicator */}
          {hydraHealth < maxHydraHealth && (
            <div className="text-center mt-2">
              <span className="text-orange-400 text-sm font-semibold animate-bounce">
                💥 {maxHydraHealth - hydraHealth} DMG DEALT
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Game Phase Indicator */}
      {gamePhase !== 'battle' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              {gamePhase === 'waiting' ? 'Waiting for Players...' : 
               gamePhase === 'victory' ? 'VICTORY!' : 
               gamePhase === 'defeat' ? 'DEFEAT!' : 'Get Ready!'}
            </h2>
            {gamePhase === 'waiting' && (
              <p className="text-gray-300">Players are joining the battle...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
