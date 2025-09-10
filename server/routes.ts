import type { Express } from "express";
import { createServer, type Server } from "http";
import { apiRoutes } from "./routes/index";
import { setupWebSocket } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
	// Register API routes
	app.use("/api", apiRoutes);

	// Legacy health endpoint (keep for backward compatibility)
	app.get("/health", (req, res) => {
		res.json({ 
			status: "ok", 
			message: "Hydra Game Server",
			timestamp: new Date().toISOString() 
		});
	});

	// Create HTTP server
	const httpServer = createServer(app);

	// Setup WebSocket server with new modular system
	setupWebSocket(httpServer);

	return httpServer;
}
