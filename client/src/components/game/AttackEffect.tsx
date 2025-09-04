import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBattle } from '@/lib/stores/useBattle';

interface AttackEffectProps {
  type: 'sword' | 'arrow' | 'magic' | 'fire';
  startPosition: [number, number, number];
  targetPosition: [number, number, number];
  onComplete?: () => void;
}

export function AttackEffect({ type, startPosition, targetPosition, onComplete }: AttackEffectProps) {
  const meshRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const durationRef = useRef(1.5); // seconds
  const [trail, setTrail] = useState<THREE.Vector3[]>([]);
  const trailRef = useRef<THREE.Line>(null);

  // Create attack geometry based on type
  const attackGeometry = (() => {
    const group = new THREE.Group();
    
    switch (type) {
      case 'sword':
        const swordGeometry = new THREE.BoxGeometry(0.1, 2, 0.1);
        const swordMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xC0C0C0,
          shininess: 100,
          emissive: 0x444444
        });
        const sword = new THREE.Mesh(swordGeometry, swordMaterial);
        sword.rotation.z = Math.PI / 4;
        group.add(sword);
        break;
        
      case 'arrow':
        const arrowGeometry = new THREE.ConeGeometry(0.05, 1.5, 8);
        const arrowMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x8B4513,
          emissive: 0x222222
        });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.rotation.z = -Math.PI / 2;
        group.add(arrow);
        break;
        
      case 'magic':
        const magicGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const magicMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x9932CC,
          emissive: 0x4B0082,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.8
        });
        const magic = new THREE.Mesh(magicGeometry, magicMaterial);
        group.add(magic);
        
        // Add magical aura
        const auraGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        const auraMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xDDA0DD,
          transparent: true,
          opacity: 0.3
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        group.add(aura);
        break;
        
      case 'fire':
        const fireGeometry = new THREE.SphereGeometry(0.4, 6, 6);
        const fireMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFF4500,
          emissive: 0xFF6600,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.9
        });
        const fire = new THREE.Mesh(fireGeometry, fireMaterial);
        group.add(fire);
        break;
    }
    
    return group;
  })();

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    progressRef.current += delta / durationRef.current;
    
    if (progressRef.current >= 1) {
      progressRef.current = 1;
      onComplete?.();
      return;
    }
    
    // Interpolate position with easing
    const progress = progressRef.current;
    const easedProgress = 1 - Math.pow(1 - progress, 2); // ease out quad
    const currentPos = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...startPosition),
      new THREE.Vector3(...targetPosition),
      easedProgress
    );
    
    meshRef.current.position.copy(currentPos);
    
    // Update trail for magical effects
    if (type === 'magic' || type === 'fire') {
      setTrail(prevTrail => {
        const newTrail = [...prevTrail, currentPos.clone()];
        return newTrail.slice(-10); // Keep last 10 positions
      });
    }
    
    // Enhanced rotation effects
    meshRef.current.rotation.y += delta * 15;
    
    // Type-specific animations
    switch (type) {
      case 'magic':
        meshRef.current.rotation.x += delta * 12;
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 15) * 0.3);
        break;
      case 'fire':
        meshRef.current.rotation.z += delta * 20;
        const fireScale = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.4;
        meshRef.current.scale.setScalar(fireScale);
        break;
      case 'arrow':
        // Arrow should point toward target
        const direction = new THREE.Vector3().subVectors(
          new THREE.Vector3(...targetPosition),
          currentPos
        ).normalize();
        meshRef.current.lookAt(currentPos.clone().add(direction));
        break;
      case 'sword':
        meshRef.current.rotation.z += delta * 25;
        break;
    }
  });

  return (
    <group>
      {/* Main attack object */}
      <group ref={meshRef} position={startPosition}>
        <primitive object={attackGeometry} />
        
        {/* Glow effect */}
        {(type === 'magic' || type === 'fire') && (
          <mesh scale={[2, 2, 2]}>
            <sphereGeometry args={[0.5, 8, 6]} />
            <meshBasicMaterial
              color={type === 'magic' ? 0x9932CC : 0xFF4500}
              transparent
              opacity={0.2}
            />
          </mesh>
        )}
      </group>
      
      {/* Magical trail effect */}
      {(type === 'magic' || type === 'fire') && trail.length > 1 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={trail.length}
              array={new Float32Array(trail.flatMap(pos => [pos.x, pos.y, pos.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={type === 'magic' ? 0x9932CC : 0xFF6600}
            transparent
            opacity={0.6}
          />
        </line>
      )}
    </group>
  );
}
