
import type { Game, Player } from "@shared/schema";
import type { Attack } from "@shared/types";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";

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
	isCreator: boolean;
	isLoading: boolean;
	error: string | null;
	config: RoomConfig;

	// Battle-specific state
	hydraHealth: number;
	maxHydraHealth: number;
	currentQuestion: any; // Consider defining a proper type for Question
	questionTimeLeft: number;
	attacks: Attack[];
	lastAttack: Attack | null;

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
	setQuestionTimeLeft: (time: number) => void;
	addAttack: (attack: Attack) => void;
	clearAllAttacks: () => void;

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
					game: null,
					currentRoom: null,
					roomCode: null,
					players: [],
					isCreator: false,
					isLoading: false,
					error: null,
					config: INITIAL_CONFIG,
					hydraHealth: 1000,
					maxHydraHealth: 1000,
					currentQuestion: null,
					questionTimeLeft: 30,
					attacks: [],
					lastAttack: null,

					// Actions
					setPhase: (phase) => set({ phase }),
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
								isCreator: data.isCreator || false,
								isLoading: false,
								players: data.players || [],
								phase: "lobby",
							});
							return { success: true, game: data.game, players: data.players, isCreator: data.isCreator };
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : "Unknown error";
							set({ isLoading: false, error: errorMessage });
							return { success: false, error: errorMessage };
						}
					},

					leaveRoom: () => {
						set({ game: null, currentRoom: null, roomCode: null, players: [], isCreator: false, phase: "lobby" });
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

					setCurrentQuestion: (question) => set({ currentQuestion: question, questionTimeLeft: get().config.timeLimit || 30 }),

					setQuestionTimeLeft: (time) => set({ questionTimeLeft: time }),

					addAttack: (attack) => {
						set((state) => ({
							attacks: [...state.attacks, attack],
							lastAttack: attack,
						}));
					},

					clearAllAttacks: () => set({ attacks: [], lastAttack: null }),
					setError: (error) => set({ error }),

					reset: () => {
						set({
							phase: "lobby",
							game: null,
							currentRoom: null,
							roomCode: null,
							players: [],
							isCreator: false,
							isLoading: false,
							error: null,
							config: INITIAL_CONFIG,
							hydraHealth: 1000,
							maxHydraHealth: 1000,
							currentQuestion: null,
							attacks: [],
							lastAttack: null,
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
export const useIsGameCreator = () => useGameStore((state) => state.isCreator);
export const useGameLoading = () => useGameStore((state) => state.isLoading);
export const useGameError = () => useGameStore((state) => state.error);
export const useGameConfig = () => useGameStore((state) => state.config);
export const useHydraHealth = () => useGameStore((state) => ({ current: state.hydraHealth, max: state.maxHydraHealth }));
export const useCurrentQuestion = () => useGameStore((state) => state.currentQuestion);
export const useAttacks = () => useGameStore((state) => state.attacks);
