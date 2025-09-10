import { Router } from "express";
import { gameRoutes } from "./gameRoutes";
import { questionRoutes } from "./questionRoutes";

const router = Router();

// Mount route modules
router.use("/games", gameRoutes);
router.use("/questions", questionRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
	res.json({
		success: true,
		message: "API is running",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
});

// API info endpoint
router.get("/", (req, res) => {
	res.json({
		success: true,
		message: "Hydra Game API",
		version: "1.0.0",
		endpoints: {
			games: {
				"POST /games": "Create a new game",
				"POST /games/join": "Join a game by room code",
				"GET /games/:code": "Get game information by room code",
				"POST /games/:id/questions": "Upload custom questions",
				"GET /games/:id/stats": "Get game statistics",
				"GET /games/:id/export": "Export game data",
				"DELETE /games/:id": "Close a game",
			},
			questions: {
				"GET /questions/sets": "Get all question sets",
				"GET /questions/sets/:setName": "Get specific question set",
				"POST /questions/import/json": "Import questions from JSON",
				"POST /questions/import/csv": "Import questions from CSV",
				"POST /questions/sets": "Create custom question set",
				"DELETE /questions/sets/:setName": "Delete custom question set",
				"GET /questions/template/csv": "Get CSV import template",
				"GET /questions/template/json": "Get JSON import template",
			},
		},
		documentation: "https://github.com/your-repo/hydra-game#api-documentation",
	});
});

export { router as apiRoutes };