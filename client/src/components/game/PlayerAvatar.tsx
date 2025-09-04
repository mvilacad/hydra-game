import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { Player } from '@shared/types';

interface PlayerAvatarProps {
  player: Player;
  position: [number, number, number];
  isAttacking?: boolean;
}

export function PlayerAvatar({ player, position, isAttacking = false }: PlayerAvatarProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Character class colors
  const characterColors = {
    warrior: 0xFF6B35,    // Orange-red
    mage: 0x9B59B6,       // Purple
    archer: 0x2ECC71,     // Green
    paladin: 0xF1C40F     // Gold
  };

  // Create avatar geometry based on character class
  const avatarGeometry = useMemo(() => {
    const group = new THREE.Group();
    const color = characterColors[player.character] || 0x888888;
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color,
      shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 6);
    const headMaterial = new THREE.MeshPhongMaterial({ 
      color: new THREE.Color(color).multiplyScalar(1.2)
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    group.add(head);
    
    // Character-specific accessories
    switch (player.character) {
      case 'warrior':
        // Sword
        const swordGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.05);
        const swordMaterial = new THREE.MeshPhongMaterial({ color: 0xC0C0C0 });
        const sword = new THREE.Mesh(swordGeometry, swordMaterial);
        sword.position.set(0.5, 0.8, 0);
        sword.rotation.z = Math.PI / 6;
        group.add(sword);
        break;
        
      case 'mage':
        // Staff
        const staffGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
        const staffMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const staff = new THREE.Mesh(staffGeometry, staffMaterial);
        staff.position.set(-0.4, 0.8, 0);
        group.add(staff);
        
        // Orb on staff
        const orbGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const orbMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x9932CC,
          emissive: 0x4B0082,
          emissiveIntensity: 0.3
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(-0.4, 1.4, 0);
        group.add(orb);
        break;
        
      case 'archer':
        // Bow
        const bowGeometry = new THREE.TorusGeometry(0.3, 0.02, 4, 8, Math.PI);
        const bowMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const bow = new THREE.Mesh(bowGeometry, bowMaterial);
        bow.position.set(-0.5, 1, 0);
        bow.rotation.z = Math.PI / 2;
        group.add(bow);
        break;
        
      case 'paladin':
        // Shield
        const shieldGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8);
        const shieldMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFFD700,
          shininess: 100
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.set(-0.5, 0.8, 0);
        shield.rotation.z = Math.PI / 2;
        group.add(shield);
        break;
    }
    
    return group;
  }, [player.character]);

  // Attack glow animation
  const { glowIntensity } = useSpring({
    glowIntensity: isAttacking ? 1 : 0,
    config: { duration: 300 },
  });

  // Idle animation
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle bobbing
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      
      // Face towards hydra (center)
      meshRef.current.lookAt(0, meshRef.current.position.y, 0);
      
      // Slight sway
      meshRef.current.rotation.y += Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.01;
    }
  });

  return (
    <group position={position}>
      <group ref={meshRef}>
        <primitive object={avatarGeometry} />
        
        {/* Attack glow effect */}
        <animated.mesh
          scale={[1.5, 1.5, 1.5]}
          visible={glowIntensity.to(v => v > 0.1)}
        >
          <sphereGeometry args={[0.8, 16, 12]} />
          <meshBasicMaterial 
            color={characterColors[player.character] || 0x888888}
            transparent 
            opacity={0.3}
          />
        </animated.mesh>
      </group>
      
      {/* Player name label */}
      <group position={[0, 2.5, 0]}>
        <mesh>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial 
            color={0x000000} 
            transparent 
            opacity={0.7}
          />
        </mesh>
        {/* Note: In a real implementation, you'd use troika-three-text or similar for 3D text */}
      </group>
    </group>
  );
}
