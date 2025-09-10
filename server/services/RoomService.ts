import type { Game, InsertGame } from "@shared/schema";
import { gameStorage } from "../storage/gameStorage";
import { isValidRoomCode, normalizeRoomCode } from "../utils/roomCodes";

export interface RoomConfig {
	questionsData?: any[];
	maxPlayers?: number;
	defaultQuestionTime?: number;
	autoStart?: boolean;
	customSettings?: Record<string, any>;
}

export interface JoinRoomResult {
	success: boolean;
	game?: Game;
	error?: string;
	isCreator?: boolean;
}

/**
 * Service for managing game rooms/lobbies
 * Handles room creation, joining, and basic room management
 */
export class RoomService {
	/**
	 * Creates a new game room with given configuration
	 */
	async createRoom(config: RoomConfig = {}): Promise<Game> {
		const gameConfig: Partial<InsertGame> = {
			status: "waiting",
			hydraHealth: 1000,
			maxHydraHealth: 1000,
			currentQuestionIndex: 0,
			questionsData: config.questionsData || null,
			configuration: {
				maxPlayers: config.maxPlayers || 20,
				defaultQuestionTime: config.defaultQuestionTime || 30,
				autoStart: config.autoStart || false,
				...config.customSettings,
			},
		};

		const game = await gameStorage.createGame(gameConfig);

		console.log(`🏠 Room created: ${game.code} (ID: ${game.id})`);
		return game;
	}

	/**
	 * Join an existing room by code or create a new one if not found
	 */
	async joinOrCreateRoom(
		roomCode?: string,
		config: RoomConfig = {},
	): Promise<JoinRoomResult> {
		// If no room code provided, create a new room
		if (!roomCode) {
			const game = await this.createRoom(config);
			return {
				success: true,
				game,
				isCreator: true,
			};
		}

		// Validate and normalize room code
		const normalizedCode = normalizeRoomCode(roomCode);

		if (!isValidRoomCode(normalizedCode)) {
			return {
				success: false,
				error:
					"Invalid room code format. Code must be 6 alphanumeric characters.",
			};
		}

		// Try to find existing room
		const existingGame = await gameStorage.getGameByCode(normalizedCode);
		if (existingGame) {
			// Check if room is still joinable
			if (existingGame.status === "finished" || existingGame.deletedAt) {
				return {
					success: false,
					error: "This room has ended and is no longer available.",
				};
			}

			// Check player limit if configured
			const config = existingGame.configuration as any;
			if (config?.maxPlayers) {
				const currentPlayers = await gameStorage.getPlayersByGame(
					existingGame.id,
				);
				if (currentPlayers.length >= config.maxPlayers) {
					return {
						success: false,
						error: "This room is full. Maximum players reached.",
					};
				}
			}

			console.log(
				`🚪 Joined existing room: ${existingGame.code} (ID: ${existingGame.id})`,
			);
			return {
				success: true,
				game: existingGame,
				isCreator: false,
			};
		}

		// Room not found - for hub, this should be an error
		// But we could optionally create a new room
		return {
			success: false,
			error: "Room not found. Please check the room code or create a new room.",
		};
	}

	/**
	 * Get room information by code
	 */
	async getRoomInfo(roomCode: string): Promise<Game | null> {
		const normalizedCode = normalizeRoomCode(roomCode);
		if (!isValidRoomCode(normalizedCode)) {
			return null;
		}

		return await gameStorage.getGameByCode(normalizedCode);
	}

	/**
	 * Get room information by ID
	 */
	async getRoomById(gameId: number): Promise<Game | null> {
		return await gameStorage.getGameById(gameId);
	}

	/**
	 * Update room configuration
	 */
	async updateRoomConfig(
		gameId: number,
		config: RoomConfig,
	): Promise<Game | null> {
		const currentGame = await gameStorage.getGameById(gameId);
		if (!currentGame) return null;

		// Merge configuration
		const currentConfig = (currentGame.configuration as any) || {};
		const newConfiguration = {
			...currentConfig,
			maxPlayers: config.maxPlayers || currentConfig.maxPlayers,
			defaultQuestionTime:
				config.defaultQuestionTime || currentConfig.defaultQuestionTime,
			autoStart:
				config.autoStart !== undefined
					? config.autoStart
					: currentConfig.autoStart,
			...config.customSettings,
		};

		const updates: Partial<Game> = {
			configuration: newConfiguration,
		};

		// Update questions if provided
		if (config.questionsData) {
			updates.questionsData = config.questionsData;
		}

		return await gameStorage.updateGame(gameId, updates);
	}

	/**
	 * Close a room (soft delete)
	 */
	async closeRoom(gameId: number): Promise<boolean> {
		const game = await gameStorage.getGameById(gameId);
		if (!game) return false;

		// Update status and mark as finished
		await gameStorage.updateGame(gameId, {
			status: "finished",
			finishedAt: new Date(),
		});

		// Soft delete the game
		await gameStorage.deleteGame(gameId);

		console.log(`🔒 Room closed: ${game.code} (ID: ${gameId})`);
		return true;
	}

	/**
	 * Get active rooms count (for monitoring)
	 */
	async getActiveRoomsCount(): Promise<number> {
		// This would need a specific query in the storage layer
		// For now, we'll implement a simple version
		// TODO: Implement proper active rooms counting in storage
		return 0;
	}

	/**
	 * Check if a room code is available
	 */
	async isRoomCodeAvailable(roomCode: string): Promise<boolean> {
		const normalizedCode = normalizeRoomCode(roomCode);
		if (!isValidRoomCode(normalizedCode)) {
			return false;
		}

		const existingGame = await gameStorage.getGameByCode(normalizedCode);
		return !existingGame;
	}
}

// Export singleton instance
export const roomService = new RoomService();
