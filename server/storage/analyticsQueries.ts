import { gameEvents, games, playerAnswers, players } from "@shared/schema";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "./database";

/**
 * Advanced analytics queries for game statistics
 * Provides comprehensive data analysis capabilities
 */

export interface PlayerPerformanceData {
	playerId: string;
	playerName: string;
	character: string;
	totalGames: number;
	totalAnswers: number;
	correctAnswers: number;
	accuracy: number;
	averageResponseTime: number;
	totalPoints: number;
	averagePointsPerGame: number;
	gamesWon: number;
	winRate: number;
	favoriteCharacter: string;
}

export interface QuestionAnalytics {
	questionId: number;
	questionText: string;
	type: string;
	category: string;
	difficulty: string;
	timesAsked: number;
	correctAnswers: number;
	incorrectAnswers: number;
	successRate: number;
	averageResponseTime: number;
	averagePoints: number;
	difficultyRating: number;
}

export interface GameAnalyticsData {
	totalGames: number;
	totalPlayers: number;
	totalAnswers: number;
	overallAccuracy: number;
	averageGameDuration: number;
	averagePlayersPerGame: number;
	characterPopularity: Record<string, number>;
	hourlyActivity: Record<string, number>;
	dailyActivity: Record<string, number>;
	successfulGamesRate: number;
	topPerformers: PlayerPerformanceData[];
	questionDifficulty: Record<string, number>;
}

/**
 * Get detailed player performance analytics
 */
export async function getPlayerPerformanceAnalytics(
	playerId?: string,
	dateFrom?: Date,
	dateTo?: Date,
): Promise<PlayerPerformanceData[]> {
	const whereConditions = [];

	if (playerId) {
		whereConditions.push(eq(players.playerId, playerId));
	}

	if (dateFrom) {
		whereConditions.push(gte(players.createdAt, dateFrom));
	}

	if (dateTo) {
		whereConditions.push(lte(players.createdAt, dateTo));
	}

	// Query player performance data with complex aggregations
	const playerPerformance = await db
		.select({
			playerId: players.playerId,
			playerName: players.name,
			character: players.character,
			totalGames: sql<number>`count(distinct ${players.gameId})`,
			totalAnswers: sql<number>`count(${playerAnswers.id})`,
			correctAnswers: sql<number>`sum(case when ${playerAnswers.isCorrect} then 1 else 0 end)`,
			totalPoints: sql<number>`sum(${playerAnswers.points})`,
			averageResponseTime: sql<number>`avg(${playerAnswers.timeSpent})`,
			maxScore: sql<number>`max(${players.score})`,
		})
		.from(players)
		.leftJoin(playerAnswers, eq(players.id, playerAnswers.playerId))
		.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
		.groupBy(players.id, players.playerId, players.name, players.character);

	// Calculate derived metrics
	const performanceData: PlayerPerformanceData[] = playerPerformance.map(
		(p) => {
			const accuracy =
				p.totalAnswers > 0 ? (p.correctAnswers / p.totalAnswers) * 100 : 0;
			const averagePointsPerGame =
				p.totalGames > 0 ? p.totalPoints / p.totalGames : 0;

			return {
				playerId: p.playerId,
				playerName: p.playerName,
				character: p.character,
				totalGames: p.totalGames,
				totalAnswers: p.totalAnswers,
				correctAnswers: p.correctAnswers,
				accuracy: Math.round(accuracy * 100) / 100,
				averageResponseTime:
					Math.round((p.averageResponseTime / 1000) * 100) / 100, // Convert to seconds
				totalPoints: p.totalPoints,
				averagePointsPerGame: Math.round(averagePointsPerGame * 100) / 100,
				gamesWon: 0, // TODO: Calculate from game results
				winRate: 0, // TODO: Calculate from game results
				favoriteCharacter: p.character, // TODO: Calculate most used character
			};
		},
	);

	return performanceData;
}

/**
 * Get comprehensive question analytics
 */
export async function getQuestionAnalytics(
	dateFrom?: Date,
	dateTo?: Date,
): Promise<QuestionAnalytics[]> {
	const whereConditions = [];

	if (dateFrom) {
		whereConditions.push(gte(playerAnswers.createdAt, dateFrom));
	}

	if (dateTo) {
		whereConditions.push(lte(playerAnswers.createdAt, dateTo));
	}

	// This is a complex query that would need to join with question data
	// For now, we'll return a simplified version
	// TODO: Implement full question analytics with actual question data

	return [];
}

/**
 * Get comprehensive game analytics
 */
export async function getGameAnalytics(
	dateFrom?: Date,
	dateTo?: Date,
): Promise<GameAnalyticsData> {
	const whereConditions = [];

	if (dateFrom) {
		whereConditions.push(gte(games.createdAt, dateFrom));
	}

	if (dateTo) {
		whereConditions.push(lte(games.createdAt, dateTo));
	}

	// Get basic game statistics
	const [basicStats] = await db
		.select({
			totalGames: sql<number>`count(distinct ${games.id})`,
			totalPlayers: sql<number>`count(distinct ${players.id})`,
			totalAnswers: sql<number>`count(${playerAnswers.id})`,
			correctAnswers: sql<number>`sum(case when ${playerAnswers.isCorrect} then 1 else 0 end)`,
			averageDuration: sql<number>`avg(extract(epoch from (${games.finishedAt} - ${games.createdAt})))`,
		})
		.from(games)
		.leftJoin(players, eq(games.id, players.gameId))
		.leftJoin(playerAnswers, eq(players.id, playerAnswers.playerId))
		.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

	// Get character popularity
	const characterStats = await db
		.select({
			character: players.character,
			count: sql<number>`count(*)`,
		})
		.from(players)
		.innerJoin(games, eq(players.gameId, games.id))
		.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
		.groupBy(players.character);

	// Get hourly activity
	const hourlyStats = await db
		.select({
			hour: sql<string>`extract(hour from ${games.createdAt})`,
			count: sql<number>`count(*)`,
		})
		.from(games)
		.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
		.groupBy(sql`extract(hour from ${games.createdAt})`);

	// Get daily activity (day of week)
	const dailyStats = await db
		.select({
			dayOfWeek: sql<string>`extract(dow from ${games.createdAt})`,
			count: sql<number>`count(*)`,
		})
		.from(games)
		.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
		.groupBy(sql`extract(dow from ${games.createdAt})`);

	// Get successful games rate
	const [successStats] = await db
		.select({
			totalGames: sql<number>`count(*)`,
			successfulGames: sql<number>`sum(case when ${games.status} = 'victory' then 1 else 0 end)`,
		})
		.from(games)
		.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

	// Calculate metrics
	const overallAccuracy =
		basicStats.totalAnswers > 0
			? (basicStats.correctAnswers / basicStats.totalAnswers) * 100
			: 0;

	const averagePlayersPerGame =
		basicStats.totalGames > 0
			? basicStats.totalPlayers / basicStats.totalGames
			: 0;

	const successfulGamesRate =
		successStats.totalGames > 0
			? (successStats.successfulGames / successStats.totalGames) * 100
			: 0;

	// Build character popularity object
	const characterPopularity: Record<string, number> = {};
	characterStats.forEach((stat) => {
		characterPopularity[stat.character] = stat.count;
	});

	// Build hourly activity object
	const hourlyActivity: Record<string, number> = {};
	hourlyStats.forEach((stat) => {
		hourlyActivity[stat.hour] = stat.count;
	});

	// Build daily activity object (0 = Sunday, 1 = Monday, etc.)
	const dayNames = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const dailyActivity: Record<string, number> = {};
	dailyStats.forEach((stat) => {
		const dayName = dayNames[parseInt(stat.dayOfWeek)];
		dailyActivity[dayName] = stat.count;
	});

	// Get top performers
	const topPerformers = await getPlayerPerformanceAnalytics(
		undefined,
		dateFrom,
		dateTo,
	);
	topPerformers.sort((a, b) => b.totalPoints - a.totalPoints);

	return {
		totalGames: basicStats.totalGames,
		totalPlayers: basicStats.totalPlayers,
		totalAnswers: basicStats.totalAnswers,
		overallAccuracy: Math.round(overallAccuracy * 100) / 100,
		averageGameDuration:
			Math.round(((basicStats.averageDuration || 0) / 60) * 100) / 100, // Convert to minutes
		averagePlayersPerGame: Math.round(averagePlayersPerGame * 100) / 100,
		characterPopularity,
		hourlyActivity,
		dailyActivity,
		successfulGamesRate: Math.round(successfulGamesRate * 100) / 100,
		topPerformers: topPerformers.slice(0, 10), // Top 10 performers
		questionDifficulty: {}, // TODO: Implement question difficulty analysis
	};
}

/**
 * Get game timeline for a specific game
 */
export async function getGameTimeline(gameId: number) {
	const timeline = await db
		.select({
			timestamp: gameEvents.createdAt,
			eventType: gameEvents.eventType,
			eventData: gameEvents.eventData,
			playerId: gameEvents.playerId,
		})
		.from(gameEvents)
		.where(eq(gameEvents.gameId, gameId))
		.orderBy(asc(gameEvents.createdAt));

	return timeline;
}

/**
 * Get leaderboard for a specific time period
 */
export async function getLeaderboard(
	dateFrom?: Date,
	dateTo?: Date,
	limit: number = 10,
) {
	const whereConditions = [];

	if (dateFrom) {
		whereConditions.push(gte(games.createdAt, dateFrom));
	}

	if (dateTo) {
		whereConditions.push(lte(games.createdAt, dateTo));
	}

	const leaderboard = await db
		.select({
			playerName: players.name,
			character: players.character,
			totalPoints: sql<number>`sum(${players.score})`,
			gamesPlayed: sql<number>`count(distinct ${players.gameId})`,
			averageScore: sql<number>`avg(${players.score})`,
		})
		.from(players)
		.innerJoin(games, eq(players.gameId, games.id))
		.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
		.groupBy(players.name, players.character)
		.orderBy(desc(sql`sum(${players.score})`))
		.limit(limit);

	return leaderboard;
}

/**
 * Get activity trends over time
 */
export async function getActivityTrends(
	dateFrom: Date,
	dateTo: Date,
	interval: "hour" | "day" | "week" | "month" = "day",
) {
	const dateFormat = {
		hour: "YYYY-MM-DD HH24:00:00",
		day: "YYYY-MM-DD",
		week: "YYYY-WW",
		month: "YYYY-MM",
	}[interval];

	const trends = await db
		.select({
			period: sql<string>`to_char(${games.createdAt}, '${dateFormat}')`,
			gamesStarted: sql<number>`count(*)`,
			playersJoined: sql<number>`sum((
				select count(*) 
				from ${players} 
				where ${players.gameId} = ${games.id}
			))`,
		})
		.from(games)
		.where(and(gte(games.createdAt, dateFrom), lte(games.createdAt, dateTo)))
		.groupBy(sql`to_char(${games.createdAt}, '${dateFormat}')`)
		.orderBy(sql`to_char(${games.createdAt}, '${dateFormat}')`);

	return trends;
}
