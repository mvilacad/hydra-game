import type {
	Attack,
	Game,
	GameQuestion,
	Player,
	PlayerAnswer,
} from "@shared/schema";
import { gameStorage } from "../storage/gameStorage";

export interface PlayerJoinData {
	name: string;
	character: "warrior" | "mage" | "archer" | "paladin";
	playerId: string; // UUID-like identifier from frontend
	socketId?: string;
}

export interface AnswerSubmissionData {
	playerId: string;
	questionId: number;
	answer: string;
	isCorrect: boolean;
	timeSpent: number; // milliseconds
}

export interface AttackData {
	playerId: string;
	attackType: "sword" | "arrow" | "magic" | "fire" | "miss";
	damage: number;
	isSuccessful: boolean;
}

/**
 * Service for managing game logic and state
 * Handles game flow, player actions, and game state updates
 */
export class GameService {
	/**
	 * Add a player to a game
	 */
	async addPlayerToGame(
		gameId: number,
		playerData: PlayerJoinData,
	): Promise<Player | null> {
		// Check if game exists and is joinable
		const game = await gameStorage.getGameById(gameId);
		if (!game || game.status === "finished" || game.deletedAt) {
			throw new Error("Game not found or not joinable");
		}

		// Check if player already exists in this game
		const existingPlayer = await gameStorage.getPlayerByGameAndPlayerId(
			gameId,
			playerData.playerId,
		);
		if (existingPlayer) {
			// Update existing player connection status
			return await gameStorage.updatePlayer(existingPlayer.id, {
				isConnected: true,
				socketId: playerData.socketId,
			});
		}

		// Check player limit
		const config = (game.configuration as any) || {};
		if (config.maxPlayers) {
			const currentPlayers = await gameStorage.getPlayersByGame(gameId);
			if (currentPlayers.length >= config.maxPlayers) {
				throw new Error("Game is full");
			}
		}

		// Add new player
		const player = await gameStorage.addPlayerToGame(gameId, {
			name: playerData.name,
			character: playerData.character,
			playerId: playerData.playerId,
			socketId: playerData.socketId,
			isConnected: true,
			score: 0,
		});

		// Check if we should auto-start the game
		if (config.autoStart && game.status === "waiting") {
			await this.checkAutoStart(gameId);
		}

		return player;
	}

	/**
	 * Remove a player from a game
	 */
	async removePlayerFromGame(
		gameId: number,
		playerId: string,
	): Promise<boolean> {
		const player = await gameStorage.getPlayerByGameAndPlayerId(
			gameId,
			playerId,
		);
		if (!player) return false;

		await gameStorage.removePlayer(player.id);

		// Check if game should end due to no players
		const remainingPlayers = await gameStorage.getPlayersByGame(gameId);
		const connectedPlayers = remainingPlayers.filter((p) => p.isConnected);

		if (connectedPlayers.length === 0) {
			await this.endGame(gameId, "No players remaining");
		}

		return true;
	}

	/**
	 * Update player connection status
	 */
	async updatePlayerConnection(
		gameId: number,
		playerId: string,
		isConnected: boolean,
		socketId?: string,
	): Promise<Player | null> {
		const player = await gameStorage.getPlayerByGameAndPlayerId(
			gameId,
			playerId,
		);
		if (!player) return null;

		return await gameStorage.updatePlayer(player.id, {
			isConnected,
			socketId: isConnected ? socketId : null,
		});
	}

	/**
	 * Start a game
	 */
	async startGame(gameId: number): Promise<Game | null> {
		const game = await gameStorage.getGameById(gameId);
		if (!game || game.status !== "waiting") return null;

		// Check if we have players
		const players = await gameStorage.getPlayersByGame(gameId);
		const connectedPlayers = players.filter((p) => p.isConnected);

		if (connectedPlayers.length === 0) {
			throw new Error("Cannot start game without players");
		}

		// Reset game state for new battle
		const updatedGame = await gameStorage.updateGame(gameId, {
			status: "battle",
			currentQuestionIndex: 0,
			hydraHealth: game.maxHydraHealth,
		});

		await gameStorage.logGameEvent({
			gameId,
			eventType: "game_created", // Using existing enum
			eventData: {
				action: "game_started",
				playerCount: connectedPlayers.length,
			},
		});

		return updatedGame;
	}

	/**
	 * Submit an answer for a player
	 */
	async submitAnswer(
		gameId: number,
		answerData: AnswerSubmissionData,
	): Promise<{ answer: PlayerAnswer; attack?: Attack } | null> {
		// Get player
		const player = await gameStorage.getPlayerByGameAndPlayerId(
			gameId,
			answerData.playerId,
		);
		if (!player) {
			throw new Error("Player not found");
		}

		// Calculate points based on correctness and speed
		let points = 0;
		if (answerData.isCorrect) {
			const basePoints = 100;
			const timeBonus = Math.max(0, 30000 - answerData.timeSpent) / 1000; // Convert to seconds
			points = basePoints + Math.floor(timeBonus * 2);
		}

		// Save answer
		const answer = await gameStorage.savePlayerAnswer({
			playerId: player.id,
			gameId,
			questionId: answerData.questionId,
			answer: answerData.answer,
			isCorrect: answerData.isCorrect,
			timeSpent: answerData.timeSpent,
			points,
		});

		// Update player score
		await gameStorage.updatePlayer(player.id, {
			score: player.score + points,
		});

		// Create attack if answer was correct
		let attack: Attack | undefined;
		if (answerData.isCorrect) {
			const attackType = this.getAttackTypeForCharacter(player.character);
			const damage = this.calculateDamage(player.character);

			attack = await gameStorage.saveAttack({
				playerId: player.id,
				gameId,
				attackType,
				damage,
				isSuccessful: true,
			});

			// Update hydra health
			const game = await gameStorage.getGameById(gameId);
			if (game) {
				const newHealth = Math.max(0, game.hydraHealth - damage);
				await gameStorage.updateGame(gameId, {
					hydraHealth: newHealth,
				});

				// Check win condition
				if (newHealth <= 0) {
					await this.endGame(gameId, "victory");
				}
			}
		}

		return { answer, attack };
	}

	/**
	 * Get current game state
	 */
	async getGameState(gameId: number): Promise<{
		game: Game;
		players: Player[];
		currentQuestion?: GameQuestion;
	} | null> {
		const game = await gameStorage.getGameById(gameId);
		if (!game) return null;

		const players = await gameStorage.getPlayersByGame(gameId);

		// Get current question if in battle
		let currentQuestion: GameQuestion | undefined;
		if (game.status === "battle" && game.currentQuestionIndex !== null) {
			const questions = await gameStorage.getGameQuestions(gameId);
			currentQuestion = questions[game.currentQuestionIndex] || undefined;
		}

		return {
			game,
			players,
			currentQuestion,
		};
	}

	/**
	 * Move to next question
	 */
	async nextQuestion(gameId: number): Promise<GameQuestion | null> {
		const game = await gameStorage.getGameById(gameId);
		if (!game || game.status !== "battle") return null;

		const questions = await gameStorage.getGameQuestions(gameId);
		const nextIndex = (game.currentQuestionIndex || 0) + 1;

		if (nextIndex >= questions.length) {
			// No more questions - game ends in defeat
			await this.endGame(gameId, "defeat");
			return null;
		}

		await gameStorage.updateGame(gameId, {
			currentQuestionIndex: nextIndex,
		});

		await gameStorage.logGameEvent({
			gameId,
			eventType: "question_started",
			eventData: {
				questionIndex: nextIndex,
				questionId: questions[nextIndex].id,
			},
		});

		return questions[nextIndex];
	}

	/**
	 * End the game
	 */
	async endGame(
		gameId: number,
		result: "victory" | "defeat" | string,
	): Promise<Game | null> {
		const status =
			result === "victory"
				? "victory"
				: result === "defeat"
					? "defeat"
					: "finished";

		const game = await gameStorage.updateGame(gameId, {
			status: status as any,
			finishedAt: new Date(),
		});

		// Generate final statistics
		await gameStorage.generateGameStats(gameId);

		await gameStorage.logGameEvent({
			gameId,
			eventType: "game_finished",
			eventData: { result },
		});

		return game;
	}

	/**
	 * Reset game to waiting state
	 */
	async resetGame(gameId: number): Promise<Game | null> {
		const game = await gameStorage.getGameById(gameId);
		if (!game) return null;

		// Reset game state
		const resetGame = await gameStorage.updateGame(gameId, {
			status: "waiting",
			currentQuestionIndex: 0,
			hydraHealth: game.maxHydraHealth,
			finishedAt: null,
		});

		// Reset all player scores
		const players = await gameStorage.getPlayersByGame(gameId);
		for (const player of players) {
			await gameStorage.updatePlayer(player.id, { score: 0 });
		}

		await gameStorage.logGameEvent({
			gameId,
			eventType: "game_reset",
			eventData: {},
		});

		return resetGame;
	}

	/**
	 * Update game state
	 */
	async updateGameState(
		gameId: number,
		updates: { hydraHealth?: number; status?: string },
	): Promise<Game | null> {
		return await gameStorage.updateGame(gameId, updates as any);
	}

	/**
	 * Get game questions - usado pelo GameLoopService
	 */
	async getGameQuestions(gameId: number): Promise<GameQuestion[]> {
		return await gameStorage.getGameQuestions(gameId);
	}

	/**
	 * Private helper methods
	 */
	private async checkAutoStart(gameId: number): Promise<void> {
		const game = await gameStorage.getGameById(gameId);
		const config = (game?.configuration as any) || {};

		if (!config.autoStart || game?.status !== "waiting") return;

		const players = await gameStorage.getPlayersByGame(gameId);
		const minPlayers = config.minPlayersToStart || 1;

		if (players.filter((p) => p.isConnected).length >= minPlayers) {
			await this.startGame(gameId);
		}
	}

	private getAttackTypeForCharacter(
		character: string,
	): "sword" | "arrow" | "magic" | "fire" {
		switch (character) {
			case "warrior":
				return "sword";
			case "archer":
				return "arrow";
			case "mage":
				return "magic";
			case "paladin":
				return "fire";
			default:
				return "sword";
		}
	}

	private calculateDamage(character: string): number {
		// Base damage varies by character
		const baseDamage = {
			warrior: 120,
			archer: 100,
			mage: 140,
			paladin: 110,
		};

		return baseDamage[character as keyof typeof baseDamage] || 100;
	}
}

// Export singleton instance
export const gameService = new GameService();
