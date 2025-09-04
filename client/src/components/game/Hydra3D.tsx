import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { useBattle } from '@/lib/stores/useBattle';

interface Hydra3DProps {
  position?: [number, number, number];
  scale?: number;
}

export function Hydra3D({ position = [0, 0, 0], scale = 1 }: Hydra3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const headRefs = useRef<THREE.Mesh[]>([]);
  const bodyRef = useRef<THREE.Mesh>(null);
  const { hydraHealth, maxHydraHealth, lastAttack } = useBattle();

  // Health percentage for damage visualization
  const healthPercent = hydraHealth / maxHydraHealth;

  // Create Hydra geometry
  const hydraGeometry = useMemo(() => {
    const group = new THREE.Group();
    
    // Main body - larger cylinder with more detail
    const bodyGeometry = new THREE.CylinderGeometry(1.5, 2, 4, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: new THREE.Color().lerpColors(
        new THREE.Color(0x8B0000), // Dark red when damaged
        new THREE.Color(0x228B22), // Forest green when healthy
        healthPercent
      ),
      shininess: 60,
      emissive: new THREE.Color().lerpColors(
        new THREE.Color(0x330000), // Dark red glow when damaged
        new THREE.Color(0x002200), // Dark green glow when healthy
        healthPercent
      ),
      emissiveIntensity: 0.3,
      bumpScale: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Add scales/armor details
    for (let i = 0; i < 12; i++) {
      const scaleGeometry = new THREE.SphereGeometry(0.2, 6, 4);
      const scaleMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color().lerpColors(
          new THREE.Color(0x654321),
          new THREE.Color(0x228B22),
          healthPercent
        ),
        shininess: 80
      });
      const scale = new THREE.Mesh(scaleGeometry, scaleMaterial);
      const angle = (i / 12) * Math.PI * 2;
      scale.position.set(
        Math.cos(angle) * 1.8,
        -1 + (i % 3) * 0.8,
        Math.sin(angle) * 1.8
      );
      scale.castShadow = true;
      group.add(scale);
    }
    
    // Three heads on long necks
    const headPositions = [
      [-2, 3, 1],
      [0, 4, 0],
      [2, 3, -1]
    ];
    
    headPositions.forEach((pos, index) => {
      // Neck
      const neckGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 6);
      const neckMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().lerpColors(
          new THREE.Color(0x654321), // Brown when damaged
          new THREE.Color(0x006400), // Dark green when healthy
          healthPercent
        )
      });
      const neck = new THREE.Mesh(neckGeometry, neckMaterial);
      neck.position.set(pos[0], pos[1] - 1, pos[2]);
      neck.rotation.z = (Math.random() - 0.5) * 0.3;
      group.add(neck);
      
      // Head
      const headGeometry = new THREE.SphereGeometry(0.8, 8, 6);
      const headMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().lerpColors(
          new THREE.Color(0x8B0000), // Dark red when damaged
          new THREE.Color(0x32CD32), // Lime green when healthy
          healthPercent
        ),
        shininess: 50
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(pos[0], pos[1], pos[2]);
      
      // Eyes
      const eyeGeometry = new THREE.SphereGeometry(0.1, 4, 3);
      const eyeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFF0000,
        emissive: 0x330000,
        emissiveIntensity: 0.5
      });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.2, 0.2, 0.6);
      head.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.2, 0.2, 0.6);
      head.add(rightEye);
      
      group.add(head);
      headRefs.current[index] = head;
    });
    
    return group;
  }, [healthPercent]);

  // Damage flash animation
  const { damageFlash } = useSpring({
    damageFlash: lastAttack ? 1 : 0,
    config: { duration: 200 },
  });

  // Idle animation
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle bobbing motion
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      
      // Subtle rotation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      
      // Animate heads independently
      headRefs.current.forEach((head, index) => {
        if (head) {
          head.rotation.x = Math.sin(state.clock.elapsedTime * 0.7 + index) * 0.2;
          head.rotation.y = Math.sin(state.clock.elapsedTime * 0.4 + index * 2) * 0.3;
        }
      });
    }
  });

  // Death animation
  useEffect(() => {
    if (hydraHealth <= 0 && meshRef.current) {
      // Collapse animation using native Three.js
      const targetScale = new THREE.Vector3(1.2, 0.1, 1.2);
      const initialRotation = new THREE.Vector3(
        meshRef.current.rotation.x,
        meshRef.current.rotation.y,
        meshRef.current.rotation.z
      );
      const targetRotation = Math.PI / 4;
      
      const startTime = Date.now();
      const duration = 2000; // 2 seconds
      
      const animate = () => {
        if (!meshRef.current) return;
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
        
        meshRef.current.scale.lerp(targetScale, easeProgress);
        meshRef.current.rotation.z = THREE.MathUtils.lerp(initialRotation.z, targetRotation, easeProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
  }, [hydraHealth]);

  return (
    <animated.group
      ref={meshRef}
      position={position}
      scale={scale}
    >
      <primitive object={hydraGeometry} />
      
      {/* Damage flash overlay */}
      <animated.mesh
        scale={[2.5, 2.5, 2.5]}
        visible={damageFlash.to(v => v > 0.5)}
      >
        <sphereGeometry args={[2, 16, 12]} />
        <meshBasicMaterial 
          color={0xFF6600} 
          transparent 
          opacity={0.3}
        />
      </animated.mesh>
    </animated.group>
  );
}
