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
  const agesRef = useRef<Float32Array>(new Float32Array(count));
  const startTimeRef = useRef(0);

  // Enhanced particle configuration with better visual effects
  const particleConfig = useMemo(() => {
    const configs = {
      hit: {
        color: new THREE.Color(0xFF6600),
        size: 0.2,
        speed: 12,
        spread: 4,
        gravity: -8,
        blending: THREE.AdditiveBlending,
        fadeRate: 0.96
      },
      glow: {
        color: new THREE.Color(0x00FFFF),
        size: 0.25,
        speed: 3,
        spread: 2,
        gravity: 1,
        blending: THREE.AdditiveBlending,
        fadeRate: 0.98
      },
      smoke: {
        color: new THREE.Color(0x666666),
        size: 0.4,
        speed: 2,
        spread: 3,
        gravity: 2,
        blending: THREE.NormalBlending,
        fadeRate: 0.97
      },
      sparks: {
        color: new THREE.Color(0xFFFF44),
        size: 0.12,
        speed: 18,
        spread: 6,
        gravity: -12,
        blending: THREE.AdditiveBlending,
        fadeRate: 0.94
      },
      magic: {
        color: new THREE.Color(0xAA44CC),
        size: 0.28,
        speed: 6,
        spread: 3,
        gravity: 1,
        blending: THREE.AdditiveBlending,
        fadeRate: 0.965
      },
      explosion: {
        color: new THREE.Color(0xFF4400),
        size: 0.5,
        speed: 20,
        spread: 8,
        gravity: -6,
        blending: THREE.AdditiveBlending,
        fadeRate: 0.92
      }
    };
    return configs[type] || configs.hit;
  }, [type]);

  // Highly optimized particle initialization
  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const ages = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Initial positions with burst pattern
      const spawnRadius = 0.3;
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnHeight = (Math.random() - 0.5) * 0.6;
      
      positions[i3] = position[0] + Math.cos(spawnAngle) * spawnRadius * Math.random();
      positions[i3 + 1] = position[1] + spawnHeight;
      positions[i3 + 2] = position[2] + Math.sin(spawnAngle) * spawnRadius * Math.random();
      
      // Enhanced velocity patterns
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speedVar = 0.4 + Math.random() * 0.8;
      const speed = particleConfig.speed * speedVar;
      
      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed * particleConfig.spread;
      velocities[i3 + 1] = Math.cos(phi) * speed + (Math.random() - 0.5) * speed * 0.5;
      velocities[i3 + 2] = Math.sin(phi) * Math.sin(theta) * speed * particleConfig.spread;
      
      // Varied lifetimes and ages
      lifetimes[i] = duration * (0.6 + Math.random() * 0.8);
      ages[i] = 0;
      
      // Color variation
      const colorVar = 0.8 + Math.random() * 0.4;
      colors[i3] = particleConfig.color.r * colorVar;
      colors[i3 + 1] = particleConfig.color.g * colorVar;
      colors[i3 + 2] = particleConfig.color.b * colorVar;
      
      // Size variation
      sizes[i] = particleConfig.size * (0.6 + Math.random() * 0.8) * intensity;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Store references for animation
    velocitiesRef.current = velocities;
    lifetimesRef.current = lifetimes;
    agesRef.current = ages;
    
    const material = new THREE.PointsMaterial({
      vertexColors: true,
      transparent: true,
      blending: particleConfig.blending,
      sizeAttenuation: true,
      alphaTest: 0.001,
      depthWrite: false
    });
    
    return { geometry, material };
  }, [count, particleConfig, intensity, duration, position]);

  // Optimized animation with better performance
  useFrame((state, delta) => {
    if (!pointsRef.current || !velocitiesRef.current || !lifetimesRef.current || !agesRef.current) return;
    
    if (autoStart && startTimeRef.current === 0) {
      startTimeRef.current = state.clock.elapsedTime;
    }
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
    const sizes = pointsRef.current.geometry.attributes.size.array as Float32Array;
    let needsUpdate = false;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const lifetime = lifetimesRef.current[i];
      
      // Update particle age
      agesRef.current[i] += delta;
      const age = agesRef.current[i];
      
      if (age < lifetime) {
        needsUpdate = true;
        
        // Physics simulation
        const gravityEffect = particleConfig.gravity * age * age * 0.5;
        positions[i3] += velocitiesRef.current[i3] * delta;
        positions[i3 + 1] += velocitiesRef.current[i3 + 1] * delta + gravityEffect * delta;
        positions[i3 + 2] += velocitiesRef.current[i3 + 2] * delta;
        
        // Apply air resistance for more realistic motion
        velocitiesRef.current[i3] *= particleConfig.fadeRate;
        velocitiesRef.current[i3 + 1] *= particleConfig.fadeRate;
        velocitiesRef.current[i3 + 2] *= particleConfig.fadeRate;
        
        // Enhanced fade and size effects
        const ageRatio = age / lifetime;
        const fadeAlpha = Math.pow(1 - ageRatio, 1.5);
        
        // Dynamic color based on age
        const colorIntensity = fadeAlpha * intensity;
        colors[i3] = particleConfig.color.r * colorIntensity;
        colors[i3 + 1] = particleConfig.color.g * colorIntensity;
        colors[i3 + 2] = particleConfig.color.b * colorIntensity;
        
        // Size changes over time
        const baseSizeMultiplier = type === 'explosion' ? (1 + ageRatio * 2) : (1 - ageRatio * 0.5);
        sizes[i] = particleConfig.size * baseSizeMultiplier * fadeAlpha * intensity;
        
      } else {
        // Reset expired particles efficiently
        if (positions[i3 + 1] > -500) {
          positions[i3] = position[0];
          positions[i3 + 1] = -1000;
          positions[i3 + 2] = position[2];
          colors[i3] = colors[i3 + 1] = colors[i3 + 2] = 0;
          sizes[i] = 0;
          needsUpdate = true;
        }
      }
    }
    
    if (needsUpdate) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.geometry.attributes.color.needsUpdate = true;
      pointsRef.current.geometry.attributes.size.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
}