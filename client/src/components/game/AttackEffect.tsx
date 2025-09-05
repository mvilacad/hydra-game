import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';

interface AttackEffectProps {
  type: 'sword' | 'arrow' | 'magic' | 'fire';
  startPosition: [number, number, number];
  targetPosition: [number, number, number];
  onComplete?: () => void;
}

export function AttackEffect({ type, startPosition, targetPosition, onComplete }: AttackEffectProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Enhanced attack configuration
  const attackConfig = useMemo(() => {
    switch (type) {
      case 'sword':
        return {
          duration: 800,
          color: 0xC0C0C0,
          emissive: 0x888888,
          scale: [0.2, 2, 0.1] as [number, number, number],
          geometry: 'box'
        };
      case 'arrow':
        return {
          duration: 1200,
          color: 0x8B4513,
          emissive: 0x444422,
          scale: [0.1, 1.5, 0.1] as [number, number, number],
          geometry: 'cone'
        };
      case 'magic':
        return {
          duration: 1500,
          color: 0x9932CC,
          emissive: 0x6B0199,
          scale: [0.6, 0.6, 0.6] as [number, number, number],
          geometry: 'sphere'
        };
      case 'fire':
        return {
          duration: 1000,
          color: 0xFF4500,
          emissive: 0xFF6600,
          scale: [0.8, 0.8, 0.8] as [number, number, number],
          geometry: 'sphere'
        };
      default:
        return {
          duration: 1000,
          color: 0xFFFFFF,
          emissive: 0x444444,
          scale: [0.5, 0.5, 0.5] as [number, number, number],
          geometry: 'sphere'
        };
    }
  }, [type]);

  // Enhanced geometry creation
  const attackGeometry = useMemo(() => {
    const group = new THREE.Group();
    
    let geometry: THREE.BufferGeometry;
    switch (attackConfig.geometry) {
      case 'box':
        geometry = new THREE.BoxGeometry(...attackConfig.scale);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(attackConfig.scale[0], attackConfig.scale[1], 8);
        break;
      case 'sphere':
      default:
        geometry = new THREE.SphereGeometry(attackConfig.scale[0], 16, 12);
        break;
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: attackConfig.color,
      emissive: attackConfig.emissive,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: type === 'sword' ? 0.9 : 0.1,
      transparent: ['magic', 'fire'].includes(type),
      opacity: ['magic', 'fire'].includes(type) ? 0.8 : 1.0
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    if (type === 'sword') mesh.rotation.z = Math.PI / 4;
    if (type === 'arrow') mesh.rotation.z = -Math.PI / 2;
    
    mesh.castShadow = true;
    group.add(mesh);
    
    return group;
  }, [type, attackConfig]);

  // Enhanced spring animation
  const { position, scale } = useSpring({
    from: { 
      position: startPosition, 
      scale: [0.1, 0.1, 0.1] as [number, number, number]
    },
    to: { 
      position: targetPosition, 
      scale: [1, 1, 1] as [number, number, number]
    },
    config: { tension: 120, friction: 20 },
    onRest: onComplete
  });

  // Optimized animation loop for effects only
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Type-specific effect animations
    const children = meshRef.current.children;
    children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        switch (type) {
          case 'magic':
            child.rotation.x += 0.02;
            child.rotation.y += 0.03;
            break;
          case 'fire':
            child.rotation.x += 0.04;
            child.scale.setScalar(1 + Math.sin(time * 18) * 0.1);
            break;
          case 'arrow':
            // Arrow points towards target naturally via spring
            break;
          case 'sword':
            child.rotation.z += 0.1;
            break;
        }
      }
    });
  });

  return (
    <group>
      <animated.group 
        ref={meshRef} 
        // @ts-ignore - React Spring type issue
        position={position}
        // @ts-ignore - React Spring type issue
        scale={scale}
      >
        <primitive object={attackGeometry} />
        
        {/* Enhanced glow effects */}
        {(type === 'magic' || type === 'fire') && (
          <mesh scale={[2, 2, 2]}>
            <sphereGeometry args={[attackConfig.scale[0] * 0.8, 12, 8]} />
            <meshBasicMaterial
              color={attackConfig.emissive}
              transparent
              opacity={0.3}
            />
          </mesh>
        )}
        
        {/* Spark effects for sword */}
        {type === 'sword' && (
          <mesh scale={[1.5, 0.2, 1.5]}>
            <sphereGeometry args={[0.3, 8, 6]} />
            <meshBasicMaterial
              color={0xFFFF88}
              transparent
              opacity={0.4}
            />
          </mesh>
        )}
      </animated.group>
      
      {/* Impact anticipation effect */}
      <mesh position={targetPosition} scale={[0.3, 0.3, 0.3]}>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshBasicMaterial
          color={attackConfig.color}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}