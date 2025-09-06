import * as THREE from "three";

export interface ParticleConfig {
	count: number;
	color: number;
	size: number;
	speed: number;
	spread: number;
	gravity: number;
	lifetime: number;
}

export const particleConfigs: Record<string, ParticleConfig> = {
	hit: {
		count: 50,
		color: 0xff6600,
		size: 0.1,
		speed: 5,
		spread: 2,
		gravity: -2,
		lifetime: 1.5,
	},

	glow: {
		count: 30,
		color: 0x00ffff,
		size: 0.15,
		speed: 1,
		spread: 1,
		gravity: 0,
		lifetime: 3,
	},

	smoke: {
		count: 40,
		color: 0x666666,
		size: 0.2,
		speed: 2,
		spread: 1.5,
		gravity: 1,
		lifetime: 4,
	},

	sparks: {
		count: 80,
		color: 0xffff00,
		size: 0.05,
		speed: 8,
		spread: 3,
		gravity: -5,
		lifetime: 1,
	},

	magic: {
		count: 60,
		color: 0x9932cc,
		size: 0.12,
		speed: 3,
		spread: 2,
		gravity: 0.5,
		lifetime: 2.5,
	},

	explosion: {
		count: 200,
		color: 0xff4500,
		size: 0.3,
		speed: 10,
		spread: 4,
		gravity: -3,
		lifetime: 2,
	},
};

export function createParticleGeometry(
	config: ParticleConfig,
	position: THREE.Vector3,
): {
	geometry: THREE.BufferGeometry;
	velocities: Float32Array;
	lifetimes: Float32Array;
} {
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array(config.count * 3);
	const velocities = new Float32Array(config.count * 3);
	const lifetimes = new Float32Array(config.count);

	for (let i = 0; i < config.count; i++) {
		const i3 = i * 3;

		// Starting positions with slight randomization
		positions[i3] = position.x + (Math.random() - 0.5) * 0.5;
		positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
		positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.5;

		// Random velocities in spherical distribution
		const theta = Math.random() * Math.PI * 2;
		const phi = Math.random() * Math.PI;
		const speed = config.speed * (0.5 + Math.random() * 0.5);

		velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed * config.spread;
		velocities[i3 + 1] = Math.cos(phi) * speed;
		velocities[i3 + 2] =
			Math.sin(phi) * Math.sin(theta) * speed * config.spread;

		// Random lifetime variation
		lifetimes[i] = config.lifetime * (0.5 + Math.random() * 0.5);
	}

	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

	return { geometry, velocities, lifetimes };
}

export function updateParticles(
	positions: Float32Array,
	velocities: Float32Array,
	lifetimes: Float32Array,
	config: ParticleConfig,
	elapsed: number,
	delta: number,
	count: number,
): number {
	let aliveCount = 0;

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		const lifetime = lifetimes[i];

		if (elapsed < lifetime) {
			// Update position based on velocity and gravity
			positions[i3] += velocities[i3] * delta;
			positions[i3 + 1] +=
				velocities[i3 + 1] * delta + config.gravity * delta * elapsed;
			positions[i3 + 2] += velocities[i3 + 2] * delta;

			aliveCount++;
		} else {
			// Move dead particles out of view
			positions[i3 + 1] = -1000;
		}
	}

	return aliveCount;
}

export function createParticleMaterial(
	config: ParticleConfig,
): THREE.PointsMaterial {
	return new THREE.PointsMaterial({
		color: config.color,
		size: config.size,
		transparent: true,
		blending: THREE.AdditiveBlending,
		vertexColors: false,
		sizeAttenuation: true,
		alphaTest: 0.001,
	});
}
