
import type { Game, Player } from "@shared/schema";
import type { Attack, AuthoritativeGameState, AuthoritativeGamePhase } from "@shared/types";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { useEffect, useState } from "react";

// Combined type for the game phase, incorporating stages from all previous stores
export type GamePhase =
	| "lobby" // From useRoom, waiting for players
	| "ready" // From useGame, ready to start
	| "playing" // From useGame/useBattle, game in progress
	| "battle" // Specific sub-phase of "playing"
	| "victory" // From useBattle, game won
	| "defeat" // From useBattle, game lost
	| "ended"; // From useGame, game finished

// Configuration for creating a room, from useRoom
export interface RoomConfig {
	questionSet?: string;
	maxQuestions?: number;
	randomOrder?: boolean;
	timeLimit?: number;
	individualTimeLimits?: Record<string, number>;
	maxPlayers?: number;
	autoStart?: boolean;
}

// Result of joining a room, from useRoom
export interface JoinRoomResult {
	success: boolean;
	game?: Game;
	players?: Player[];
	error?: string;
	isCreator?: boolean;
}

// The unified state interface for the new Game Store
interface GameStoreState {
	// State Properties
	phase: GamePhase;
	setPhase: (phase: GamePhase) => void;
	game: Game | null;
	currentRoom: Game | null;
	roomCode: string | null;
	players: Player[];
	playerId: string | null;
	setPlayerId: (playerId: string) => void;
	isCreator: boolean;
	isLoading: boolean;
	error: string | null;
	config: RoomConfig;

	// Battle-specific state
	hydraHealth: number;
	maxHydraHealth: number;
	currentQuestion: any; // Consider defining a proper type for Question
	attacks: Attack[];
	lastAttack: Attack | null;

	// Server-authoritative timestamps
	phaseStartsAt: string | null;
	phaseEndsAt: string | null;

	// Actions
	// Room actions from useRoom
	createRoom: (config?: RoomConfig) => Promise<JoinRoomResult>;
	joinRoom: (roomCode: string) => Promise<JoinRoomResult>;
	leaveRoom: () => void;
	updateConfig: (config: Partial<RoomConfig>) => void;

	// Player management from useRoom and useBattle
	setPlayers: (players: Player[]) => void;
	addPlayer: (player: Player) => void;
	removePlayer: (playerId: string) => void;
	updatePlayer: (playerId: string, updates: Partial<Player>) => void;

	// Game lifecycle actions from useGame and useBattle
	startGame: () => void;
	restartGame: () => void;
	endGame: (result: "victory" | "defeat") => void;
	setGame: (game: Game) => void;

	// Battle actions from useBattle
	damageHydra: (damage: number) => void;
	setHydraHealth: (health: number) => void;
	setCurrentQuestion: (question: any) => void;
	addAttack: (attack: Attack) => void;
	clearAllAttacks: () => void;

	// Server-authoritative actions
	handleGameStateUpdate: (state: AuthoritativeGameState) => void;
	setPhaseTimestamps: (startsAt: string, endsAt: string) => void;

	// Utility actions
	setError: (error: string | null) => void;
	reset: () => void;
}

const INITIAL_CONFIG: RoomConfig = {
	questionSet: "default",
	maxQuestions: 10,
	randomOrder: false,
	timeLimit: 30,
	maxPlayers: 20,
	autoStart: false,
};

const API_BASE = "/api";

export const useGameStore = create<GameStoreState>()(
	devtools(
		subscribeWithSelector(
			persist(
				(set, get) => ({
					// Initial State
					phase: "lobby",
					setPhase: (phase) => set({ phase }),
					game: null,
					currentRoom: null,
					roomCode: null,
					players: [],
					playerId: null,
					setPlayerId: (playerId: string) => set({ playerId }),
					isCreator: true,
					isLoading: false,
					error: null,
					config: INITIAL_CONFIG,
					hydraHealth: 1000,
					maxHydraHealth: 1000,
					currentQuestion: null,
					attacks: [],
					lastAttack: null,
					phaseStartsAt: null,
					phaseEndsAt: null,

					// Actions
					createRoom: async (config = {}) => {
						set({ isLoading: true, error: null });
						const finalConfig = { ...get().config, ...config };
						try {
							const response = await fetch(`${API_BASE}/games`, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify(finalConfig),
							});
							if (!response.ok) throw new Error("Failed to create room");
							const data = await response.json();
							if (!data.success) throw new Error(data.error || "Failed to create room");

							set({
								game: data.game,
								currentRoom: data.game,
								roomCode: data.game.code,
								isCreator: true,
								isLoading: false,
								config: finalConfig,
								phase: "lobby",
								players: [],
							});
							return { success: true, game: data.game, players: [], isCreator: true };
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : "Unknown error";
							set({ isLoading: false, error: errorMessage });
							return { success: false, error: errorMessage };
						}
					},

					joinRoom: async (roomCode) => {
						set({ isLoading: true, error: null });
						try {
							const response = await fetch(`${API_BASE}/games/join`, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ roomCode }),
							});
							if (!response.ok) throw new Error("Failed to join room");
							const data = await response.json();
							if (!data.success) throw new Error(data.error || "Failed to join room");

							set({
								game: data.game,
								currentRoom: data.game,
								roomCode: data.game.code,
								isCreator: true,
								isLoading: false,
								players: data.players || [],
								phase: "lobby",
							});
							return { success: true, game: data.game, players: data.players, isCreator: true };
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : "Unknown error";
							set({ isLoading: false, error: errorMessage });
							return { success: false, error: errorMessage };
						}
					},

					leaveRoom: () => {
						set({ game: null, currentRoom: null, roomCode: null, players: [], isCreator: true, phase: "lobby" });
					},

					updateConfig: (newConfig) => {
						set((state) => ({ config: { ...state.config, ...newConfig } }));
					},

					setPlayers: (players) => set({ players }),

					addPlayer: (player) => {
						set((state) => ({
							players: [...state.players.filter((p) => p.id !== player.id), player],
						}));
					},

					removePlayer: (playerId) => {
						set((state) => ({
							players: state.players.filter((p) => p.id !== playerId),
						}));
					},

					updatePlayer: (playerId, updates) => {
						set((state) => ({
							players: state.players.map((p) => (p.id === playerId ? { ...p, ...updates } : p)),
						}));
					},

					startGame: () => {
						set((state) => {
							if (state.phase === "lobby" || state.phase === "ready") {
								return { phase: "playing", attacks: [], lastAttack: null };
							}
							return {};
						});
					},

					restartGame: () => {
						set((state) => ({
							phase: "ready",
							hydraHealth: state.maxHydraHealth,
							currentQuestion: null,
							attacks: [],
						}));
					},

					endGame: (result) => {
						set({ phase: result });
					},

					setGame: (game) => {
						set({
							game,
							currentRoom: game,
							roomCode: game.code,
							hydraHealth: game.hydraHealth,
							maxHydraHealth: game.maxHydraHealth,
							phase: game.status === "battle" ? "playing" : game.status,
						});
					},

					damageHydra: (damage) => {
						set((state) => {
							const newHealth = Math.max(0, state.hydraHealth - damage);
							if (newHealth <= 0) {
								get().endGame("victory");
							}
							return { hydraHealth: newHealth };
						});
					},

					setHydraHealth: (health) => {
						set((state) => {
							const newHealth = Math.max(0, health);
							if (newHealth <= 0 && state.phase === "playing") {
								get().endGame("victory");
							}
							return { hydraHealth: newHealth };
						});
					},

					setCurrentQuestion: (question) => set({ currentQuestion: question }),

					addAttack: (attack) => {
						set((state) => ({
							attacks: [...state.attacks, attack],
							lastAttack: attack,
						}));
					},

					clearAllAttacks: () => set({ attacks: [], lastAttack: null }),

					// Server-authoritative actions
					handleGameStateUpdate: (authState) => {
						set((state) => {
							// Mapear fase autoritativa para fase legacy quando necessário
							let legacyPhase: GamePhase = state.phase;
							
							switch (authState.phase) {
								case 'LOBBY':
									legacyPhase = 'lobby';
									break;
								case 'PREPARING':
								case 'QUESTION':
								case 'REVEAL':
								case 'SCOREBOARD':
									legacyPhase = 'playing';
									break;
								case 'ENDED':
									// Determinar se é victory ou defeat baseado na hydra health
									legacyPhase = authState.hydraHealth <= 0 ? 'victory' : 'defeat';
									break;
							}

							return {
								phase: legacyPhase,
								players: authState.players,
								hydraHealth: authState.hydraHealth,
								maxHydraHealth: authState.maxHydraHealth,
								currentQuestion: authState.question || null,
								phaseStartsAt: authState.phaseStartsAt,
								phaseEndsAt: authState.phaseEndsAt,
							};
						});
					},

					setPhaseTimestamps: (startsAt, endsAt) => {
						set({ phaseStartsAt: startsAt, phaseEndsAt: endsAt });
					},

					setError: (error) => set({ error }),

					reset: () => {
						set({
							phase: "lobby",
							game: null,
							currentRoom: null,
							roomCode: null,
							players: [],
							isCreator: true,
							isLoading: false,
							error: null,
							config: INITIAL_CONFIG,
							hydraHealth: 1000,
							maxHydraHealth: 1000,
							currentQuestion: null,
							attacks: [],
							lastAttack: null,
							phaseStartsAt: null,
							phaseEndsAt: null,
						});
					},
				}),
				{
					name: "game-storage",
					partialize: (state) => ({
						game: state.game,
						currentRoom: state.currentRoom,
						roomCode: state.roomCode,
						isCreator: state.isCreator,
						config: state.config,
						players: state.players,
						playerId: state.playerId,
						phaseStartsAt: state.phaseStartsAt,
						phaseEndsAt: state.phaseEndsAt,
					}),
				},
			),
		),
	),
);

// Selectors for easy access to state slices
export const useGamePhase = () => useGameStore((state) => state.phase);
export const useGameData = () => useGameStore((state) => state.game);
export const useCurrentRoom = () => useGameStore((state) => state.currentRoom);
export const useRoomCode = () => useGameStore((state) => state.roomCode);
export const usePlayers = () => useGameStore((state) => state.players);
export const usePlayerId = () => useGameStore((state) => state.playerId);
export const useIsGameCreator = () => true;
export const useGameLoading = () => useGameStore((state) => state.isLoading);
export const useGameError = () => useGameStore((state) => state.error);
export const useGameConfig = () => useGameStore((state) => state.config);
export const useHydraHealth = () => useGameStore((state) => ({ current: state.hydraHealth, max: state.maxHydraHealth }));
export const useCurrentQuestion = () => useGameStore((state) => state.currentQuestion);
export const useAttacks = () => useGameStore((state) => state.attacks);

// Server-authoritative selectors
export const usePhaseTimestamps = () => useGameStore((state) => ({ 
	phaseStartsAt: state.phaseStartsAt, 
	phaseEndsAt: state.phaseEndsAt 
}));

// Calculated time remaining based on server timestamps
export const useTimeRemaining = () => {
	const { phaseEndsAt } = usePhaseTimestamps();
	const [timeRemaining, setTimeRemaining] = useState(0);
	
	useEffect(() => {
		if (!phaseEndsAt) {
			setTimeRemaining(0);
			return;
		}

		const updateTimer = () => {
			const now = Date.now();
			const endsAt = new Date(phaseEndsAt).getTime();
			const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
			setTimeRemaining(remaining);
		};

		// Update immediately
		updateTimer();

		// Update every second
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [phaseEndsAt]);

	return timeRemaining;
};
