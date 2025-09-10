import { create } from "zustand";
import { subscribeWithSelector, devtools, persist } from "zustand/middleware";
import type { Game } from "@shared/schema";

export type GamePhase = "ready" | "playing" | "ended";

interface GameState {
	phase: GamePhase;
	
	// Room context (NEW)
	gameId: number | null;
	roomCode: string | null;
	isInRoom: boolean;
	
	// Game data
	currentGame: Game | null;
	hydraHealth: number;
	maxHydraHealth: number;
	currentQuestionIndex: number;

	// Actions
	start: () => void;
	restart: () => void;
	end: () => void;
	
	// Room actions (NEW)
	setGameContext: (game: Game) => void;
	clearGameContext: () => void;
	updateHydraHealth: (health: number) => void;
	setCurrentQuestion: (index: number) => void;
}

export const useGame = create<GameState>()(
	devtools(
		persist(
			subscribeWithSelector((set) => ({
				// Initial state
				phase: "ready",
				gameId: null,
				roomCode: null,
				isInRoom: false,
				currentGame: null,
				hydraHealth: 1000,
				maxHydraHealth: 1000,
				currentQuestionIndex: 0,

				start: () => {
					set((state) => {
						// Only transition from ready to playing
						if (state.phase === "ready") {
							return { phase: "playing" };
						}
						return {};
					});
				},

				restart: () => {
					set((state) => ({ 
						phase: "ready",
						hydraHealth: state.maxHydraHealth,
						currentQuestionIndex: 0,
					}));
				},

				end: () => {
					set((state) => {
						// Only transition from playing to ended
						if (state.phase === "playing") {
							return { phase: "ended" };
						}
						return {};
					});
				},

				// NEW: Room context methods
				setGameContext: (game: Game) => {
					set({
						gameId: game.id,
						roomCode: game.code,
						isInRoom: true,
						currentGame: game,
						hydraHealth: game.hydraHealth,
						maxHydraHealth: game.maxHydraHealth,
						currentQuestionIndex: game.currentQuestionIndex || 0,
						// Update phase based on game status
						phase: game.status === "battle" ? "playing" : 
							   game.status === "victory" || game.status === "defeat" ? "ended" : "ready"
					});
				},

				clearGameContext: () => {
					set({
						gameId: null,
						roomCode: null,
						isInRoom: false,
						currentGame: null,
						phase: "ready",
						hydraHealth: 1000,
						maxHydraHealth: 1000,
						currentQuestionIndex: 0,
					});
				},

				updateHydraHealth: (health: number) => {
					set((state) => ({
						hydraHealth: Math.max(0, health),
						// Auto-end game if health reaches 0
						phase: health <= 0 ? "ended" : state.phase,
					}));
				},

				setCurrentQuestion: (index: number) => {
					set({
						currentQuestionIndex: index,
					});
				},
			})),
			{
				name: "game-storage",
				partialize: (state) => ({
					// Only persist essential data
					gameId: state.gameId,
					roomCode: state.roomCode,
					isInRoom: state.isInRoom,
				}),
			}
		),
		{
			name: "game-store",
		}
	)
);

// Selectors for common use cases
export const useGameId = () => useGame((state) => state.gameId);
export const useRoomCodeFromGame = () => useGame((state) => state.roomCode);
export const useIsInRoom = () => useGame((state) => state.isInRoom);
export const useHydraHealth = () => useGame((state) => ({ 
	current: state.hydraHealth, 
	max: state.maxHydraHealth 
}));
export const useCurrentQuestionIndex = () => useGame((state) => state.currentQuestionIndex);
