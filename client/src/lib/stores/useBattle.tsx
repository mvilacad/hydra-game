import type { Attack, Player } from "@shared/types";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type BattlePhase = "waiting" | "battle" | "victory" | "defeat";

interface BattleState {
	// Game state
	gamePhase: BattlePhase;
	players: Player[];
	hydraHealth: number;
	maxHydraHealth: number;

	// Current question
	currentQuestion: any;
	questionTimeLeft: number;

	// Attack system
	attacks: Attack[];
	lastAttack: Attack | null;

	// Actions
	setGamePhase: (phase: BattlePhase) => void;
	addPlayer: (player: Player) => void;
	removePlayer: (playerId: string) => void;
	updatePlayer: (playerId: string, updates: Partial<Player>) => void;

	// Hydra actions
	damageHydra: (damage: number) => void;
	setHydraHealth: (health: number) => void;
	resetHydra: () => void;

	// Question actions
	setCurrentQuestion: (question: any) => void;
	setQuestionTimeLeft: (time: number) => void;

	// Attack actions
	addAttack: (attack: Attack) => void;
	clearAttack: (attackId: string) => void;
	clearAllAttacks: () => void;
}

export const useBattle = create<BattleState>()(
	subscribeWithSelector((set, get) => ({
		// Initial state
		gamePhase: "waiting",
		players: [],
		hydraHealth: 1000,
		maxHydraHealth: 1000,

		currentQuestion: null,
		questionTimeLeft: 30,

		attacks: [],
		lastAttack: null,

		// Game phase actions
		setGamePhase: (phase) => set({ gamePhase: phase }),

		// Player actions
		addPlayer: (player) =>
			set((state) => ({
				players: [...state.players.filter((p) => p.id !== player.id), player],
			})),

		removePlayer: (playerId) =>
			set((state) => ({
				players: state.players.filter((p) => p.id !== playerId),
			})),

		updatePlayer: (playerId, updates) =>
			set((state) => ({
				players: state.players.map((p) =>
					p.id === playerId ? { ...p, ...updates } : p,
				),
			})),

		// Hydra actions
		damageHydra: (damage) =>
			set((state) => {
				const newHealth = Math.max(0, state.hydraHealth - damage);
				const newPhase = newHealth <= 0 ? "victory" : state.gamePhase;

				return {
					hydraHealth: newHealth,
					gamePhase: newPhase,
				};
			}),

		setHydraHealth: (health) =>
			set((state) => {
				const newPhase = health <= 0 ? "victory" : state.gamePhase;
				return {
					hydraHealth: Math.max(0, health),
					gamePhase: newPhase,
				};
			}),

		resetHydra: () =>
			set((state) => ({
				hydraHealth: state.maxHydraHealth,
				gamePhase: "waiting",
			})),

		// Question actions
		setCurrentQuestion: (question) => set({ currentQuestion: question }),
		setQuestionTimeLeft: (time) => set({ questionTimeLeft: time }),

		// Attack actions
		addAttack: (attack) =>
			set((state) => ({
				attacks: [...state.attacks, attack],
				lastAttack: attack,
			})),

		clearAttack: (attackId) =>
			set((state) => ({
				attacks: state.attacks.filter((a) => a.id !== attackId),
			})),

		clearAllAttacks: () => set({ attacks: [], lastAttack: null }),
	})),
);

// Auto-reset when health reaches 0
useBattle.subscribe(
	(state) => state.hydraHealth,
	(hydraHealth) => {
		if (hydraHealth <= 0) {
			// Victory condition met
			setTimeout(() => {
				// Could auto-restart here if desired
			}, 5000);
		}
	},
);
