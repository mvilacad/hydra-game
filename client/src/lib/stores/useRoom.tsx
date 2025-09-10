import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Game, Player } from "@shared/schema";

export interface RoomConfig {
	questionSet?: string;
	maxQuestions?: number;
	randomOrder?: boolean;
	timeLimit?: number;
	individualTimeLimits?: Record<string, number>;
	maxPlayers?: number;
	autoStart?: boolean;
}

export interface JoinRoomResult {
	success: boolean;
	game?: Game;
	players?: Player[];
	error?: string;
	isCreator?: boolean;
}

interface RoomState {
	// Current room state
	currentRoom: Game | null;
	roomCode: string | null;
	isCreator: boolean;
	isLoading: boolean;
	error: string | null;
	
	// Room configuration
	config: RoomConfig;
	
	// Players in current room
	players: Player[];
	
	// Actions
	createRoom: (config?: RoomConfig) => Promise<JoinRoomResult>;
	joinRoom: (roomCode: string) => Promise<JoinRoomResult>;
	leaveRoom: () => void;
	updateConfig: (config: Partial<RoomConfig>) => void;
	setPlayers: (players: Player[]) => void;
	addPlayer: (player: Player) => void;
	removePlayer: (playerId: string) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
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

export const useRoom = create<RoomState>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial state
				currentRoom: null,
				roomCode: null,
				isCreator: false,
				isLoading: false,
				error: null,
				config: INITIAL_CONFIG,
				players: [],

				// Create a new room
				createRoom: async (config = {}) => {
					set({ isLoading: true, error: null });
					
					try {
						const finalConfig = { ...INITIAL_CONFIG, ...config };
						
						const response = await fetch(`${API_BASE}/games`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(finalConfig),
						});

						if (!response.ok) {
							const errorData = await response.json();
							throw new Error(errorData.error || "Failed to create room");
						}

						const data = await response.json();
						
						if (!data.success) {
							throw new Error(data.error || "Failed to create room");
						}

						const result: JoinRoomResult = {
							success: true,
							game: data.game,
							players: [],
							isCreator: true,
						};

						set({
							currentRoom: data.game,
							roomCode: data.game.code,
							isCreator: true,
							isLoading: false,
							config: finalConfig,
							players: [],
							error: null,
						});

						return result;
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : "Failed to create room";
						set({ 
							isLoading: false, 
							error: errorMessage,
							currentRoom: null,
							roomCode: null,
							isCreator: false,
						});
						
						return {
							success: false,
							error: errorMessage,
						};
					}
				},

				// Join an existing room
				joinRoom: async (roomCode) => {
					set({ isLoading: true, error: null });
					
					try {
						const response = await fetch(`${API_BASE}/games/join`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ roomCode }),
						});

						if (!response.ok) {
							const errorData = await response.json();
							throw new Error(errorData.error || "Failed to join room");
						}

						const data = await response.json();
						
						if (!data.success) {
							throw new Error(data.error || "Failed to join room");
						}

						const result: JoinRoomResult = {
							success: true,
							game: data.game,
							players: data.players || [],
							isCreator: data.isCreator || false,
						};

						set({
							currentRoom: data.game,
							roomCode: data.game.code,
							isCreator: data.isCreator || false,
							isLoading: false,
							players: data.players || [],
							error: null,
						});

						return result;
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : "Failed to join room";
						set({ 
							isLoading: false, 
							error: errorMessage,
							currentRoom: null,
							roomCode: null,
							isCreator: false,
						});
						
						return {
							success: false,
							error: errorMessage,
						};
					}
				},

				// Leave current room
				leaveRoom: () => {
					set({
						currentRoom: null,
						roomCode: null,
						isCreator: false,
						players: [],
						error: null,
						config: INITIAL_CONFIG,
					});
				},

				// Update room configuration
				updateConfig: (newConfig) => {
					set((state) => ({
						config: { ...state.config, ...newConfig },
					}));
				},

				// Player management
				setPlayers: (players) => {
					set({ players });
				},

				addPlayer: (player) => {
					set((state) => ({
						players: [...state.players.filter(p => p.id !== player.id), player],
					}));
				},

				removePlayer: (playerId) => {
					set((state) => ({
						players: state.players.filter(p => p.id !== playerId),
					}));
				},

				// Error management
				setError: (error) => {
					set({ error });
				},

				clearError: () => {
					set({ error: null });
				},

				// Reset to initial state
				reset: () => {
					set({
						currentRoom: null,
						roomCode: null,
						isCreator: false,
						isLoading: false,
						error: null,
						config: INITIAL_CONFIG,
						players: [],
					});
				},
			}),
			{
				name: "room-storage",
				partialize: (state) => ({
					// Only persist essential data
					roomCode: state.roomCode,
					isCreator: state.isCreator,
					config: state.config,
				}),
			}
		),
		{
			name: "room-store",
		}
	)
);

// Selectors for common use cases
export const useRoomCode = () => useRoom((state) => state.roomCode);
export const useIsCreator = () => (true);
export const useRoomPlayers = () => useRoom((state) => state.players);
export const useRoomConfig = () => useRoom((state) => state.config);
export const useRoomError = () => useRoom((state) => state.error);
export const useRoomLoading = () => useRoom((state) => state.isLoading);