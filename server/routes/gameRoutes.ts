import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
	gameService,
	questionService,
	roomService,
	statsService,
} from "../services";
import {
	formatRoomCode,
	isValidRoomCode,
	normalizeRoomCode,
} from "../utils/roomCodes";

const router = Router();

// Validation schemas
const createGameSchema = z.object({
	questionSet: z.string().optional().default("default"),
	maxQuestions: z.number().min(1).max(50).optional(),
	randomOrder: z.boolean().optional().default(false),
	timeLimit: z.number().min(5).max(120).optional(),
	individualTimeLimits: z.record(z.string(), z.number()).optional(),
	maxPlayers: z.number().min(1).max(50).optional().default(20),
	autoStart: z.boolean().optional().default(true),
});

const joinGameSchema = z.object({
	roomCode: z.string().min(6).max(6),
});

const customQuestionsSchema = z.object({
	questions: z.array(
		z.object({
			id: z.string(),
			question: z.string().min(1),
			options: z.array(z.string()).min(2),
			correct: z.string(),
			type: z.enum(["sword", "arrow", "magic", "fire"]),
			difficulty: z.enum(["easy", "medium", "hard"]).optional(),
			category: z.string().optional(),
			explanation: z.string().optional(),
		}),
	),
	timeLimit: z.number().min(5).max(120).optional(),
	individualTimeLimits: z.record(z.string(), z.number()).optional(),
	randomOrder: z.boolean().optional().default(false),
	maxQuestions: z.number().min(1).optional(),
});

/**
 * POST /api/games
 * Create a new game room
 */
router.post("/", async (req: Request, res: Response) => {
	try {
		const config = createGameSchema.parse(req.body);

		// Create room with configuration
		const game = await roomService.createRoom({
			maxPlayers: config.maxPlayers,
			defaultQuestionTime: config.timeLimit,
			autoStart: config.autoStart,
		});

		// Load questions for the game
		await questionService.loadQuestionsForGame(game.id, config.questionSet, {
			maxQuestions: config.maxQuestions,
			randomOrder: config.randomOrder,
			timeLimit: config.timeLimit,
			individualTimeLimits: config.individualTimeLimits,
		});

		res.status(201).json({
			success: true,
			game: {
				id: game.id,
				code: game.code,
				formattedCode: formatRoomCode(game.code),
				status: game.status,
				createdAt: game.createdAt,
				configuration: game.configuration,
			},
		});
	} catch (error) {
		console.error("Error creating game:", error);

		if (error instanceof z.ZodError) {
			return res.status(400).json({
				success: false,
				error: "Invalid request data",
				details: error.errors,
			});
		}

		res.status(500).json({
			success: false,
			error: "Failed to create game",
		});
	}
});

/**
 * POST /api/games/join
 * Join an existing game by room code
 */
router.post("/join", async (req: Request, res: Response) => {
	try {
		const { roomCode } = joinGameSchema.parse(req.body);

		const result = await roomService.joinOrCreateRoom(roomCode);

		if (!result.success) {
			return res.status(400).json({
				success: false,
				error: result.error,
			});
		}

		// Get game state with players
		const gameState = await gameService.getGameState(result.game!.id);

		res.json({
			success: true,
			game: {
				id: result.game!.id,
				code: result.game!.code,
				formattedCode: formatRoomCode(result.game!.code),
				status: result.game!.status,
				hydraHealth: result.game!.hydraHealth,
				maxHydraHealth: result.game!.maxHydraHealth,
				currentQuestionIndex: result.game!.currentQuestionIndex,
				configuration: result.game!.configuration,
				createdAt: result.game!.createdAt,
			},
			players: gameState?.players || [],
			isCreator: result.isCreator,
		});
	} catch (error) {
		console.error("Error joining game:", error);

		if (error instanceof z.ZodError) {
			return res.status(400).json({
				success: false,
				error: "Invalid request data",
				details: error.errors,
			});
		}

		res.status(500).json({
			success: false,
			error: "Failed to join game",
		});
	}
});

/**
 * GET /api/games/:code
 * Get game information by room code
 */
router.get("/:code", async (req: Request, res: Response) => {
	try {
		const { code } = req.params;

		if (!isValidRoomCode(normalizeRoomCode(code))) {
			return res.status(400).json({
				success: false,
				error: "Invalid room code format",
			});
		}

		const game = await roomService.getRoomInfo(code);

		if (!game) {
			return res.status(404).json({
				success: false,
				error: "Game not found",
			});
		}

		const gameState = await gameService.getGameState(game.id);

		res.json({
			success: true,
			game: {
				id: game.id,
				code: game.code,
				formattedCode: formatRoomCode(game.code),
				status: game.status,
				hydraHealth: game.hydraHealth,
				maxHydraHealth: game.maxHydraHealth,
				currentQuestionIndex: game.currentQuestionIndex,
				configuration: game.configuration,
				createdAt: game.createdAt,
				finishedAt: game.finishedAt,
			},
			players: gameState?.players || [],
			currentQuestion: gameState?.currentQuestion,
		});
	} catch (error) {
		console.error("Error getting game:", error);

		res.status(500).json({
			success: false,
			error: "Failed to get game information",
		});
	}
});

/**
 * POST /api/games/:id/questions
 * Upload custom questions for a game
 */
router.post("/:id/questions", async (req: Request, res: Response) => {
	try {
		const gameId = parseInt(req.params.id);

		if (isNaN(gameId)) {
			return res.status(400).json({
				success: false,
				error: "Invalid game ID",
			});
		}

		const config = customQuestionsSchema.parse(req.body);

		// Check if game exists and is in waiting state
		const game = await roomService.getRoomById(gameId);

		if (!game) {
			return res.status(404).json({
				success: false,
				error: "Game not found",
			});
		}

		if (game.status !== "waiting") {
			return res.status(400).json({
				success: false,
				error: "Cannot modify questions after game has started",
			});
		}

		// Load custom questions
		const questions = await questionService.loadCustomQuestions(gameId, config);

		res.json({
			success: true,
			message: `Loaded ${questions.length} custom questions`,
			questions: questions.map((q) => ({
				id: q.id,
				position: q.position,
				timeLimit: q.timeLimit,
				question: (q.questionData as any)?.question,
			})),
		});
	} catch (error) {
		console.error("Error uploading questions:", error);

		if (error instanceof z.ZodError) {
			return res.status(400).json({
				success: false,
				error: "Invalid question data",
				details: error.errors,
			});
		}

		res.status(500).json({
			success: false,
			error: "Failed to upload questions",
		});
	}
});

/**
 * GET /api/games/:id/stats
 * Get comprehensive statistics for a game
 */
router.get("/:id/stats", async (req: Request, res: Response) => {
	try {
		const gameId = parseInt(req.params.id);

		if (isNaN(gameId)) {
			return res.status(400).json({
				success: false,
				error: "Invalid game ID",
			});
		}

		const stats = await statsService.getDetailedGameStats(gameId);

		if (!stats) {
			return res.status(404).json({
				success: false,
				error: "Game not found",
			});
		}

		res.json({
			success: true,
			stats,
		});
	} catch (error) {
		console.error("Error getting game stats:", error);

		res.status(500).json({
			success: false,
			error: "Failed to get game statistics",
		});
	}
});

/**
 * GET /api/games/:id/export
 * Export game data in various formats
 */
router.get("/:id/export", async (req: Request, res: Response) => {
	try {
		const gameId = parseInt(req.params.id);
		const format = (req.query.format as string) || "json";

		if (isNaN(gameId)) {
			return res.status(400).json({
				success: false,
				error: "Invalid game ID",
			});
		}

		if (!["json", "csv"].includes(format)) {
			return res.status(400).json({
				success: false,
				error: "Invalid export format. Use 'json' or 'csv'",
			});
		}

		const exportData = await statsService.exportGameData(gameId, format as any);

		if (!exportData) {
			return res.status(404).json({
				success: false,
				error: "Game not found",
			});
		}

		if (format === "csv") {
			res.setHeader("Content-Type", "text/csv");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="game-${gameId}-export.csv"`,
			);
			res.send(exportData);
		} else {
			res.json(exportData);
		}
	} catch (error) {
		console.error("Error exporting game data:", error);

		res.status(500).json({
			success: false,
			error: "Failed to export game data",
		});
	}
});

/**
 * DELETE /api/games/:id
 * Close/delete a game
 */
router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const gameId = parseInt(req.params.id);

		if (isNaN(gameId)) {
			return res.status(400).json({
				success: false,
				error: "Invalid game ID",
			});
		}

		const success = await roomService.closeRoom(gameId);

		if (!success) {
			return res.status(404).json({
				success: false,
				error: "Game not found",
			});
		}

		res.json({
			success: true,
			message: "Game closed successfully",
		});
	} catch (error) {
		console.error("Error closing game:", error);

		res.status(500).json({
			success: false,
			error: "Failed to close game",
		});
	}
});

export { router as gameRoutes };
