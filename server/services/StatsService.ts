import type {
	GameEvent,
	GameStats,
	Player,
	PlayerAnswer,
} from "@shared/schema";
import { playerAnswers } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import {
	getActivityTrends,
	getGameAnalytics as getAdvancedGameAnalytics,
	getLeaderboard,
	getPlayerPerformanceAnalytics
} from "../storage/analyticsQueries";
import { db } from "../storage/database";
import { gameStorage } from "../storage/gameStorage";

export interface DetailedGameStats extends GameStats {
	events: GameEvent[];
	topPlayers: Player[];
	questionStats: QuestionStats[];
	timelineStats: TimelineStats[];
}

export interface QuestionStats {
	questionId: number;
	questionData: any;
	totalAnswers: number;
	correctAnswers: number;
	averageTime: number;
	difficultyRating: number; // 0-1 based on success rate
}

export interface TimelineStats {
	timestamp: Date;
	eventType: string;
	playerCount: number;
	hydraHealth: number;
	cumulativeScore: number;
}

export interface PlayerPerformance {
	player: Player;
	answers: PlayerAnswer[];
	accuracy: number;
	averageResponseTime: number;
	pointsPerQuestion: number;
	rank: number;
}

export interface GameAnalytics {
	totalGames: number;
	totalPlayers: number;
	averageGameDuration: number;
	popularCharacters: Record<string, number>;
	peakHours: Record<number, number>;
	successRate: number;
}

/**
 * Service for collecting and analyzing game statistics
 * Provides detailed analytics and reporting capabilities
 */
export class StatsService {
	/**
	 * Generate comprehensive statistics for a game
	 */
	async getDetailedGameStats(
		gameId: number,
	): Promise<DetailedGameStats | null> {
		// Get basic stats (this will generate them if they don't exist)
		const basicStats = await gameStorage.generateGameStats(gameId);
		if (!basicStats) return null;

		// Get events for timeline
		const events = await gameStorage.getGameEvents(gameId);

		// Get players for top performers
		const players = await gameStorage.getPlayersByGame(gameId);
		const topPlayers = players.sort((a, b) => b.score - a.score).slice(0, 10);

		// Get question statistics
		const questionStats = await this.getQuestionStats(gameId);

		// Get timeline statistics
		const timelineStats = await this.getTimelineStats(gameId);

		return {
			...basicStats,
			events,
			topPlayers,
			questionStats,
			timelineStats,
		};
	}

	/**
	 * Get performance statistics for a specific player
	 */
	async getPlayerPerformance(
		gameId: number,
		playerId: string,
	): Promise<PlayerPerformance | null> {
		const player = await gameStorage.getPlayerByGameAndPlayerId(
			gameId,
			playerId,
		);
		if (!player) return null;

		// Get player answers from database
		const answers = await db
			.select()
			.from(playerAnswers)
			.where(
				and(
					eq(playerAnswers.gameId, gameId),
					eq(playerAnswers.playerId, player.id),
				),
			)
			.orderBy(playerAnswers.createdAt);

		// Calculate performance metrics
		const totalAnswers = answers.length;
		const correctAnswers = answers.filter((a) => a.isCorrect).length;
		const accuracy =
			totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

		const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);
		const averageResponseTime = totalAnswers > 0 ? totalTime / totalAnswers : 0;

		const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);
		const pointsPerQuestion = totalAnswers > 0 ? totalPoints / totalAnswers : 0;

		// Get rank among all players in this game
		const allPlayers = await gameStorage.getPlayersByGame(gameId);
		const sortedPlayers = allPlayers.sort((a, b) => b.score - a.score);
		const rank = sortedPlayers.findIndex((p) => p.id === player.id) + 1;

		const performance: PlayerPerformance = {
			player,
			answers,
			accuracy: Math.round(accuracy * 100) / 100,
			averageResponseTime: Math.round((averageResponseTime / 1000) * 100) / 100, // Convert to seconds
			pointsPerQuestion: Math.round(pointsPerQuestion * 100) / 100,
			rank,
		};

		return performance;
	}

	/**
	 * Get analytics across multiple games
	 */
	async getGameAnalytics(
		dateFrom?: Date,
		dateTo?: Date,
	): Promise<GameAnalytics> {
		try {
			const analytics = await getAdvancedGameAnalytics(dateFrom, dateTo);

			// Convert to expected format
			return {
				totalGames: analytics.totalGames,
				totalPlayers: analytics.totalPlayers,
				averageGameDuration: analytics.averageGameDuration,
				popularCharacters: analytics.characterPopularity as any,
				peakHours: analytics.hourlyActivity,
				successRate: analytics.successfulGamesRate,
			};
		} catch (error) {
			console.error("Error getting game analytics:", error);

			// Return empty analytics on error
			return {
				totalGames: 0,
				totalPlayers: 0,
				averageGameDuration: 0,
				popularCharacters: {
					warrior: 0,
					mage: 0,
					archer: 0,
					paladin: 0,
				},
				peakHours: {},
				successRate: 0,
			};
		}
	}

	/**
	 * Export game data for external analysis
	 */
	async exportGameData(
		gameId: number,
		format: "json" | "csv" = "json",
	): Promise<any> {
		const detailedStats = await this.getDetailedGameStats(gameId);
		if (!detailedStats) return null;

		if (format === "json") {
			return detailedStats;
		}

		if (format === "csv") {
			// Convert to CSV format
			// TODO: Implement CSV export
			return this.convertToCSV(detailedStats);
		}

		return detailedStats;
	}

	/**
	 * Get real-time statistics for active games
	 */
	async getRealtimeStats(gameId: number): Promise<{
		currentPlayers: number;
		hydraHealth: number;
		currentQuestionIndex: number;
		averageScore: number;
		gamePhase: string;
	} | null> {
		const gameState = await gameStorage.getGameById(gameId);
		if (!gameState) return null;

		const players = await gameStorage.getPlayersByGame(gameId);
		const activePlayers = players.filter((p) => p.isConnected);

		const averageScore =
			players.length > 0
				? Math.round(
						players.reduce((sum, p) => sum + p.score, 0) / players.length,
					)
				: 0;

		return {
			currentPlayers: activePlayers.length,
			hydraHealth: gameState.hydraHealth,
			currentQuestionIndex: gameState.currentQuestionIndex || 0,
			averageScore,
			gamePhase: gameState.status,
		};
	}

	/**
	 * Track specific game events for analytics
	 */
	async trackEvent(
		gameId: number,
		eventType: string,
		eventData: any,
		playerId?: string,
	): Promise<void> {
		await gameStorage.logGameEvent({
			gameId,
			playerId: playerId
				? (await gameStorage.getPlayerByGameAndPlayerId(gameId, playerId))?.id
				: undefined,
			eventType: eventType as any, // Cast to enum type
			eventData,
		});
	}

	/**
	 * Private helper methods for detailed statistics
	 */
	private async getQuestionStats(gameId: number): Promise<QuestionStats[]> {
		const questions = await gameStorage.getGameQuestions(gameId);
		const questionStats: QuestionStats[] = [];

		// TODO: Implement proper question statistics
		// This would require querying player_answers table grouped by question

		for (const question of questions) {
			const stats: QuestionStats = {
				questionId: question.id,
				questionData: question.questionData,
				totalAnswers: 0,
				correctAnswers: 0,
				averageTime: 0,
				difficultyRating: 0,
			};
			questionStats.push(stats);
		}

		return questionStats;
	}

	private async getTimelineStats(gameId: number): Promise<TimelineStats[]> {
		const events = await gameStorage.getGameEvents(gameId);
		const timelineStats: TimelineStats[] = [];

		// TODO: Implement proper timeline statistics
		// This would require correlating events with game state changes

		return timelineStats;
	}

	private convertToCSV(data: DetailedGameStats): string {
		// TODO: Implement CSV conversion
		// For now, return a simple representation
		const headers = ["timestamp", "event_type", "player_id", "data"];
		const rows = data.events.map((event) => [
			event.createdAt.toISOString(),
			event.eventType,
			event.playerId || "",
			JSON.stringify(event.eventData),
		]);

		return [headers, ...rows].map((row) => row.join(",")).join("\n");
	}

	/**
	 * Get leaderboard for top players
	 */
	async getLeaderboard(dateFrom?: Date, dateTo?: Date, limit: number = 10) {
		try {
			return await getLeaderboard(dateFrom, dateTo, limit);
		} catch (error) {
			console.error("Error getting leaderboard:", error);
			return [];
		}
	}

	/**
	 * Get activity trends over time
	 */
	async getActivityTrends(
		dateFrom: Date,
		dateTo: Date,
		interval: "hour" | "day" | "week" | "month" = "day",
	) {
		try {
			return await getActivityTrends(dateFrom, dateTo, interval);
		} catch (error) {
			console.error("Error getting activity trends:", error);
			return [];
		}
	}

	/**
	 * Get comprehensive player performance across all games
	 */
	async getPlayerPerformanceAcrossGames(
		playerId?: string,
		dateFrom?: Date,
		dateTo?: Date,
	) {
		try {
			return await getPlayerPerformanceAnalytics(playerId, dateFrom, dateTo);
		} catch (error) {
			console.error("Error getting player performance analytics:", error);
			return [];
		}
	}

	/**
	 * Generate insights from game data
	 */
	async generateInsights(dateFrom?: Date, dateTo?: Date): Promise<string[]> {
		try {
			const insights: string[] = [];
			const analytics = await getAdvancedGameAnalytics(dateFrom, dateTo);

			// Generate insights based on data
			if (analytics.totalGames > 0) {
				insights.push(
					`Analyzed ${analytics.totalGames} games with ${analytics.totalPlayers} total players`,
				);

				if (analytics.overallAccuracy > 80) {
					insights.push(
						`High player accuracy: ${analytics.overallAccuracy.toFixed(1)}% correct answers`,
					);
				} else if (analytics.overallAccuracy < 50) {
					insights.push(
						`Low player accuracy: ${analytics.overallAccuracy.toFixed(1)}% - consider easier questions`,
					);
				}

				if (analytics.averageGameDuration < 5) {
					insights.push(
						`Games are quite short: ${analytics.averageGameDuration.toFixed(1)} minutes on average`,
					);
				} else if (analytics.averageGameDuration > 20) {
					insights.push(
						`Games are long: ${analytics.averageGameDuration.toFixed(1)} minutes on average`,
					);
				}

				// Character popularity insights
				const sortedCharacters = Object.entries(
					analytics.characterPopularity,
				).sort(([, a], [, b]) => b - a);
				if (sortedCharacters.length > 0) {
					const [mostPopular, count] = sortedCharacters[0];
					const percentage = ((count / analytics.totalPlayers) * 100).toFixed(
						1,
					);
					insights.push(
						`Most popular character: ${mostPopular} (${percentage}% of players)`,
					);
				}

				// Peak hours insight
				const sortedHours = Object.entries(analytics.hourlyActivity).sort(
					([, a], [, b]) => b - a,
				);
				if (sortedHours.length > 0) {
					const [peakHour] = sortedHours[0];
					insights.push(`Peak activity hour: ${peakHour}:00`);
				}

				// Success rate insight
				if (analytics.successfulGamesRate > 70) {
					insights.push(
						`High success rate: ${analytics.successfulGamesRate.toFixed(1)}% of games are won`,
					);
				} else if (analytics.successfulGamesRate < 30) {
					insights.push(
						`Low success rate: ${analytics.successfulGamesRate.toFixed(1)}% - game might be too difficult`,
					);
				}
			} else {
				insights.push("No games found in the specified period");
			}

			return insights;
		} catch (error) {
			console.error("Error generating insights:", error);
			return ["Unable to generate insights due to data analysis error"];
		}
	}

	/**
	 * Generate summary report for multiple games
	 */
	async generateSummaryReport(gameIds: number[]): Promise<{
		totalGames: number;
		totalPlayers: number;
		averageDuration: number;
		winRate: number;
		topPerformers: any[];
		insights: string[];
	}> {
		try {
			if (gameIds.length === 0) {
				return {
					totalGames: 0,
					totalPlayers: 0,
					averageDuration: 0,
					winRate: 0,
					topPerformers: [],
					insights: ["No games provided for analysis"],
				};
			}

			let totalPlayers = 0;
			let totalDuration = 0;
			let gamesWon = 0;
			const allPlayers = new Map();

			// Analyze each game
			for (const gameId of gameIds) {
				const gameStats = await this.generateGameStats(gameId);
				const gameData = await gameStorage.getGameById(gameId);

				if (gameData) {
					totalPlayers += gameStats.totalPlayers;

					if (gameStats.duration) {
						totalDuration += gameStats.duration;
					}

					if (gameStats.teamWon) {
						gamesWon++;
					}

					// Collect player data
					const players = await gameStorage.getPlayersByGame(gameId);
					players.forEach((player) => {
						if (allPlayers.has(player.playerId)) {
							const existing = allPlayers.get(player.playerId);
							existing.totalScore += player.score;
							existing.gamesPlayed += 1;
						} else {
							allPlayers.set(player.playerId, {
								name: player.name,
								character: player.character,
								totalScore: player.score,
								gamesPlayed: 1,
							});
						}
					});
				}
			}

			// Calculate averages
			const averageDuration =
				gameIds.length > 0 ? totalDuration / gameIds.length / 60 : 0; // Convert to minutes
			const winRate =
				gameIds.length > 0 ? (gamesWon / gameIds.length) * 100 : 0;
			const averagePlayersPerGame =
				gameIds.length > 0 ? totalPlayers / gameIds.length : 0;

			// Get top performers
			const topPerformers = Array.from(allPlayers.values())
				.sort((a, b) => b.totalScore - a.totalScore)
				.slice(0, 5)
				.map((player) => ({
					name: player.name,
					character: player.character,
					totalScore: player.totalScore,
					averageScore: Math.round(player.totalScore / player.gamesPlayed),
					gamesPlayed: player.gamesPlayed,
				}));

			// Generate insights
			const insights = await this.generateInsights();

			return {
				totalGames: gameIds.length,
				totalPlayers,
				averageDuration: Math.round(averageDuration * 100) / 100,
				winRate: Math.round(winRate * 100) / 100,
				topPerformers,
				insights,
			};
		} catch (error) {
			console.error("Error generating summary report:", error);
			return {
				totalGames: gameIds.length,
				totalPlayers: 0,
				averageDuration: 0,
				winRate: 0,
				topPerformers: [],
				insights: ["Error generating summary report"],
			};
		}
	}
}

// Export singleton instance
export const statsService = new StatsService();
