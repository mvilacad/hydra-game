import {
	type Attack,
	attacks,
	type Game,
	type GameEvent,
	type GameQuestion,
	type GameStats,
	gameEvents,
	gameQuestions,
	gameStats,
	games,
	type InsertAttack,
	type InsertGame,
	type InsertGameEvent,
	type InsertGameQuestion,
	type InsertGameStats,
	type InsertPlayer,
	type InsertPlayerAnswer,
	type Player,
	type PlayerAnswer,
	playerAnswers,
	players,
} from "@shared/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { createRoomCode } from "../utils/roomCodes";
import { db } from "./database";

export interface GameStorageInterface {
	// Game management
	createGame(config: Partial<InsertGame>): Promise<Game>;
	getGameByCode(code: string): Promise<Game | null>;
	getGameById(id: number): Promise<Game | null>;
	updateGame(id: number, updates: Partial<Game>): Promise<Game | null>;
	deleteGame(id: number): Promise<boolean>;

	// Player management
	addPlayerToGame(
		gameId: number,
		playerData: Omit<InsertPlayer, "gameId">,
	): Promise<Player>;
	getPlayersByGame(gameId: number): Promise<Player[]>;
	updatePlayer(
		playerId: number,
		updates: Partial<Player>,
	): Promise<Player | null>;
	removePlayer(playerId: number): Promise<boolean>;
	getPlayerByGameAndPlayerId(
		gameId: number,
		playerId: string,
	): Promise<Player | null>;

	// Questions management
	addQuestionsToGame(
		gameId: number,
		questions: Omit<InsertGameQuestion, "gameId">[],
	): Promise<GameQuestion[]>;
	getGameQuestions(gameId: number): Promise<GameQuestion[]>;

	// Answers and attacks tracking
	savePlayerAnswer(answer: InsertPlayerAnswer): Promise<PlayerAnswer>;
	saveAttack(attack: InsertAttack): Promise<Attack>;

	// Events logging
	logGameEvent(event: InsertGameEvent): Promise<GameEvent>;
	getGameEvents(gameId: number): Promise<GameEvent[]>;

	// Statistics
	generateGameStats(gameId: number): Promise<GameStats>;
	getGameStats(gameId: number): Promise<GameStats | null>;
}

export class PostgreSQLGameStorage implements GameStorageInterface {
	async createGame(config: Partial<InsertGame> = {}): Promise<Game> {
		// Generate unique room code
		let roomCode: string;
		let attempts = 0;
		const maxAttempts = 10;

		do {
			roomCode = createRoomCode();
			attempts++;

			const existing = await this.getGameByCode(roomCode);
			if (!existing) break;

			if (attempts >= maxAttempts) {
				throw new Error("Failed to generate unique room code");
			}
		} while (true);

		const gameData: InsertGame = {
			code: roomCode,
			status: "waiting",
			hydraHealth: 1000,
			maxHydraHealth: 1000,
			currentQuestionIndex: 0,
			questionsData: null,
			configuration: {
				defaultQuestionTime: 30,
				maxPlayers: 20,
				autoStart: true,
			},
			...config,
		};

		const [game] = await db.insert(games).values(gameData).returning();

		// Log game creation event
		await this.logGameEvent({
			gameId: game.id,
			eventType: "game_created",
			eventData: { roomCode },
		});

		return game;
	}

	async getGameByCode(code: string): Promise<Game | null> {
		const [game] = await db
			.select()
			.from(games)
			.where(and(eq(games.code, code), isNull(games.deletedAt)))
			.limit(1);

		return game || null;
	}

	async getGameById(id: number): Promise<Game | null> {
		const [game] = await db
			.select()
			.from(games)
			.where(and(eq(games.id, id), isNull(games.deletedAt)))
			.limit(1);

		return game || null;
	}

	async updateGame(id: number, updates: Partial<Game>): Promise<Game | null> {
		const updateData = {
			...updates,
			updatedAt: new Date(),
		};

		const [game] = await db
			.update(games)
			.set(updateData)
			.where(and(eq(games.id, id), isNull(games.deletedAt)))
			.returning();

		return game || null;
	}

	async deleteGame(id: number): Promise<boolean> {
		const [deleted] = await db
			.update(games)
			.set({ deletedAt: new Date() })
			.where(eq(games.id, id))
			.returning({ id: games.id });

		return !!deleted;
	}

	async addPlayerToGame(
		gameId: number,
		playerData: Omit<InsertPlayer, "gameId">,
	): Promise<Player> {
		const [player] = await db
			.insert(players)
			.values({ ...playerData, gameId })
			.returning();

		// Log player joined event
		await this.logGameEvent({
			gameId,
			playerId: player.id,
			eventType: "player_joined",
			eventData: {
				playerName: player.name,
				character: player.character,
			},
		});

		return player;
	}

	async getPlayersByGame(gameId: number): Promise<Player[]> {
		return await db
			.select()
			.from(players)
			.where(and(eq(players.gameId, gameId), isNull(players.deletedAt)))
			.orderBy(players.createdAt);
	}

	async updatePlayer(
		playerId: number,
		updates: Partial<Player>,
	): Promise<Player | null> {
		const updateData = {
			...updates,
			updatedAt: new Date(),
		};

		const [player] = await db
			.update(players)
			.set(updateData)
			.where(and(eq(players.id, playerId), isNull(players.deletedAt)))
			.returning();

		return player || null;
	}

	async removePlayer(playerId: number): Promise<boolean> {
		const [player] = await db
			.select({ gameId: players.gameId, name: players.name })
			.from(players)
			.where(eq(players.id, playerId))
			.limit(1);

		if (!player) return false;

		const [deleted] = await db
			.update(players)
			.set({ deletedAt: new Date(), isConnected: false })
			.where(eq(players.id, playerId))
			.returning({ id: players.id });

		if (deleted) {
			// Log player left event
			await this.logGameEvent({
				gameId: player.gameId,
				playerId,
				eventType: "player_left",
				eventData: { playerName: player.name },
			});
		}

		return !!deleted;
	}

	async getPlayerByGameAndPlayerId(
		gameId: number,
		playerId: string,
	): Promise<Player | null> {
		const [player] = await db
			.select()
			.from(players)
			.where(
				and(
					eq(players.gameId, gameId),
					eq(players.playerId, playerId),
					isNull(players.deletedAt),
				),
			)
			.limit(1);

		return player || null;
	}

	async addQuestionsToGame(
		gameId: number,
		questions: Omit<InsertGameQuestion, "gameId">[],
	): Promise<GameQuestion[]> {
		if (questions.length === 0) return [];

		const questionsData = questions.map((q, index) => ({
			...q,
			gameId,
			position: index + 1,
		}));

		return await db.insert(gameQuestions).values(questionsData).returning();
	}

	async getGameQuestions(gameId: number): Promise<GameQuestion[]> {
		return await db
			.select()
			.from(gameQuestions)
			.where(eq(gameQuestions.gameId, gameId))
			.orderBy(gameQuestions.position);
	}

	async savePlayerAnswer(answer: InsertPlayerAnswer): Promise<PlayerAnswer> {
		const [savedAnswer] = await db
			.insert(playerAnswers)
			.values(answer)
			.returning();

		// Log answer submission event
		await this.logGameEvent({
			gameId: answer.gameId,
			playerId: answer.playerId,
			eventType: "answer_submitted",
			eventData: {
				questionId: answer.questionId,
				isCorrect: answer.isCorrect,
				timeSpent: answer.timeSpent,
				points: answer.points,
			},
		});

		return savedAnswer;
	}

	async saveAttack(attack: InsertAttack): Promise<Attack> {
		const [savedAttack] = await db.insert(attacks).values(attack).returning();

		// Log attack event
		await this.logGameEvent({
			gameId: attack.gameId,
			playerId: attack.playerId,
			eventType: "attack_performed",
			eventData: {
				attackType: attack.attackType,
				damage: attack.damage,
				isSuccessful: attack.isSuccessful,
			},
		});

		return savedAttack;
	}

	async logGameEvent(event: InsertGameEvent): Promise<GameEvent> {
		const [savedEvent] = await db.insert(gameEvents).values(event).returning();
		return savedEvent;
	}

	async getGameEvents(gameId: number): Promise<GameEvent[]> {
		return await db
			.select()
			.from(gameEvents)
			.where(eq(gameEvents.gameId, gameId))
			.orderBy(gameEvents.createdAt);
	}

	async generateGameStats(gameId: number): Promise<GameStats> {
		// Get game info
		const game = await this.getGameById(gameId);
		if (!game) throw new Error("Game not found");

		// Get all players for this game
		const gamePlayers = await this.getPlayersByGame(gameId);

		// Get all answers for statistics
		const answers = await db
			.select()
			.from(playerAnswers)
			.where(eq(playerAnswers.gameId, gameId));

		// Calculate statistics
		const totalPlayers = gamePlayers.length;
		const questionsCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(gameQuestions)
			.where(eq(gameQuestions.gameId, gameId))
			.then((result) => result[0]?.count || 0);

		const totalAnswers = answers.length;
		const correctAnswers = answers.filter((a) => a.isCorrect).length;

		const scores = gamePlayers.map((p) => p.score);
		const averageScore =
			scores.length > 0
				? Math.round(
						scores.reduce((sum, score) => sum + score, 0) / scores.length,
					)
				: 0;
		const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

		const winner = gamePlayers.find((p) => p.score === highestScore);
		const teamWon = game.status === "victory";

		// Calculate duration if game is finished
		let duration = null;
		if (game.finishedAt && game.createdAt) {
			duration = Math.round(
				(game.finishedAt.getTime() - game.createdAt.getTime()) / 1000,
			);
		}

		const statsData: InsertGameStats = {
			gameId,
			totalPlayers,
			questionsCount,
			duration,
			winnerId: winner?.id || null,
			teamWon,
			finalHydraHealth: game.hydraHealth,
			averageScore,
			highestScore,
			totalAnswers,
			correctAnswers,
		};

		// Save or update stats
		const existingStats = await this.getGameStats(gameId);
		if (existingStats) {
			const [updatedStats] = await db
				.update(gameStats)
				.set({ ...statsData, updatedAt: new Date() })
				.where(eq(gameStats.gameId, gameId))
				.returning();
			return updatedStats;
		} else {
			const [newStats] = await db
				.insert(gameStats)
				.values(statsData)
				.returning();
			return newStats;
		}
	}

	async getGameStats(gameId: number): Promise<GameStats | null> {
		const [stats] = await db
			.select()
			.from(gameStats)
			.where(eq(gameStats.gameId, gameId))
			.limit(1);

		return stats || null;
	}
}

// Export singleton instance
export const gameStorage = new PostgreSQLGameStorage();
