import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSystemProps {
  count?: number;
  position?: [number, number, number];
  type?: 'hit' | 'glow' | 'smoke' | 'sparks' | 'magic' | 'explosion';
  intensity?: number;
  duration?: number;
  autoStart?: boolean;
}

export function ParticleSystem({ 
  count = 100, 
  position = [0, 0, 0], 
  type = 'hit',
  intensity = 1,
  duration = 2,
  autoStart = true
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array>(new Float32Array(count * 3));
  const lifetimesRef = useRef<Float32Array>(new Float32Array(count));
  const startTimeRef = useRef(0);

  // Particle configuration based on type
  const particleConfig = useMemo(() => {
    switch (type) {
      case 'hit':
        return {
          color: 0xFF6600,
          size: 0.15,
          speed: 8,
          spread: 3,
          gravity: -3,
          emissive: true,
          glowIntensity: 0.8
        };
      case 'glow':
        return {
          color: 0x00FFFF,
          size: 0.2,
          speed: 1.5,
          spread: 1.5,
          gravity: 0.2,
          emissive: true,
          glowIntensity: 1.2
        };
      case 'smoke':
        return {
          color: 0x444444,
          size: 0.25,
          speed: 2.5,
          spread: 2,
          gravity: 1.5,
          emissive: false,
          glowIntensity: 0
        };
      case 'sparks':
        return {
          color: 0xFFFF00,
          size: 0.08,
          speed: 12,
          spread: 4,
          gravity: -6,
          emissive: true,
          glowIntensity: 1.5
        };
      case 'magic':
        return {
          color: 0x9932CC,
          size: 0.18,
          speed: 4,
          spread: 2.5,
          gravity: 0.8,
          emissive: true,
          glowIntensity: 1.8
        };
      case 'explosion':
        return {
          color: 0xFF4500,
          size: 0.4,
          speed: 15,
          spread: 5,
          gravity: -4,
          emissive: true,
          glowIntensity: 2.0
        };
      default:
        return {
          color: 0xFFFFFF,
          size: 0.12,
          speed: 4,
          spread: 2.5,
          gravity: -1.5,
          emissive: false,
          glowIntensity: 0.5
        };
    }
  }, [type]);

  // Initialize particles
  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Starting positions with slight randomization
      positions[i3] = position[0] + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = position[1] + (Math.random() - 0.5) * 0.5;
      positions[i3 + 2] = position[2] + (Math.random() - 0.5) * 0.5;
      
      // Random velocities
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = particleConfig.speed * (0.5 + Math.random() * 0.5);
      
      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed * particleConfig.spread;
      velocities[i3 + 1] = Math.cos(phi) * speed;
      velocities[i3 + 2] = Math.sin(phi) * Math.sin(theta) * speed * particleConfig.spread;
      
      // Random lifetime
      lifetimes[i] = duration * (0.5 + Math.random() * 0.5);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    velocitiesRef.current = velocities;
    lifetimesRef.current = lifetimes;
    
    const material = new THREE.PointsMaterial({
      color: particleConfig.color,
      size: particleConfig.size * intensity,
      transparent: true,
      blending: particleConfig.emissive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexColors: false,
      sizeAttenuation: true,
      alphaTest: 0.001,
      depthWrite: !particleConfig.emissive
    });
    
    return { geometry, material };
  }, [count, particleConfig, intensity, duration, position]);

  // Animation
  useFrame((state, delta) => {
    if (!pointsRef.current || !velocitiesRef.current || !lifetimesRef.current) return;
    
    if (autoStart && startTimeRef.current === 0) {
      startTimeRef.current = state.clock.elapsedTime;
    }
    
    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const lifetime = lifetimesRef.current[i];
      
      if (elapsed < lifetime) {
        // Update position based on velocity and gravity
        positions[i3] += velocitiesRef.current[i3] * delta;
        positions[i3 + 1] += velocitiesRef.current[i3 + 1] * delta + particleConfig.gravity * delta * elapsed;
        positions[i3 + 2] += velocitiesRef.current[i3 + 2] * delta;
        
        // Fade out over time
        const age = elapsed / lifetime;
        const alpha = 1 - age;
        
        // Update material opacity based on age
        if (pointsRef.current.material && 'opacity' in pointsRef.current.material) {
          (pointsRef.current.material as THREE.PointsMaterial).opacity = alpha * intensity;
        }
      } else {
        // Hide expired particles
        positions[i3] = position[0];
        positions[i3 + 1] = position[1] - 1000; // Move far below
        positions[i3 + 2] = position[2];
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
}
