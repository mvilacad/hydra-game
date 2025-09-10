import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { gameHandlers } from "./handlers/gameHandlers";
import { testConnection } from "../storage/database";

/**
 * Setup WebSocket server with room-based isolation
 * Handles game rooms, player connections, and real-time events
 */
export function setupWebSocket(httpServer: HTTPServer) {
	const io = new SocketIOServer(httpServer, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
		},
		path: "/socket.io/",
	});

	console.log("✅ WebSocket server initialized");

	// Test database connection on WebSocket startup
	testConnection().catch(console.error);

	// Global connection handler
	io.on("connection", (socket) => {
		console.log(`🔌 Client connected: ${socket.id}`);

		// Initialize socket data
		socket.data = {
			gameId: null,
			roomCode: null,
			playerId: null,
			playerName: null,
			character: null,
			isHub: false,
			isCreator: false,
		};

		// Send connection confirmation
		socket.emit("connected", {
			socketId: socket.id,
			timestamp: new Date().toISOString(),
		});

		// === ROOM MANAGEMENT EVENTS ===

		/**
		 * Join or create a game room
		 * Used by both hub displays and mobile clients for room discovery
		 */
		socket.on("join_room", async (data) => {
			await gameHandlers.handleJoinRoom(socket, data);
		});

		// === PLAYER EVENTS ===

		/**
		 * Player joins the actual game (after joining room)
		 * Only used by mobile players who want to participate
		 */
		socket.on("player_join", async (data) => {
			await gameHandlers.handlePlayerJoin(socket, data);
		});

		/**
		 * Player submits an answer to the current question
		 */
		socket.on("answer_submit", async (data) => {
			await gameHandlers.handleAnswerSubmit(socket, data);
		});

		// === ADMIN/HUB EVENTS ===

		/**
		 * Admin commands (start game, reset, etc.)
		 * Only available to room creators and hub displays
		 */
		socket.on("admin_command", async (data) => {
			await gameHandlers.handleAdminCommand(socket, data);
		});

		/**
		 * Legacy reset game event
		 * @deprecated Use admin_command with command: "reset_game" instead
		 */
		socket.on("reset_game", async () => {
			await gameHandlers.handleResetGame(socket);
		});

		// === CONNECTION EVENTS ===

		/**
		 * Handle client disconnection
		 * Updates player status and notifies room
		 */
		socket.on("disconnect", async (reason) => {
			console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
			await gameHandlers.handleDisconnect(socket);
		});

		// === UTILITY EVENTS ===

		/**
		 * Ping/pong for connection health check
		 */
		socket.on("ping", () => {
			socket.emit("pong", {
				timestamp: new Date().toISOString(),
			});
		});

		/**
		 * Request current game state
		 * Useful for reconnecting clients
		 */
		socket.on("request_game_state", async () => {
			if (socket.data.gameId) {
				await gameHandlers.broadcastGameState(socket.data.gameId, io);
			} else {
				socket.emit("error", { message: "Not connected to a game room" });
			}
		});

		// === ERROR HANDLING ===

		/**
		 * Handle socket errors
		 */
		socket.on("error", (error) => {
			console.error(`Socket error (${socket.id}):`, error);
		});

		/**
		 * Handle connection errors
		 */
		socket.on("connect_error", (error) => {
			console.error(`Connection error (${socket.id}):`, error);
		});
	});

	// === GLOBAL SERVER EVENTS ===

	/**
	 * Broadcast server-wide announcements
	 */
	function broadcastAnnouncement(message: string, type: "info" | "warning" | "error" = "info") {
		io.emit("server_announcement", {
			message,
			type,
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Get server statistics
	 */
	function getServerStats() {
		const sockets = io.sockets.sockets;
		const connectedClients = sockets.size;
		
		// Count clients by type
		let hubCount = 0;
		let playerCount = 0;
		let viewerCount = 0;
		const activeGames = new Set();

		sockets.forEach((socket) => {
			if (socket.data.gameId) {
				activeGames.add(socket.data.gameId);
			}
			
			if (socket.data.isHub) {
				hubCount++;
			} else if (socket.data.playerId) {
				playerCount++;
			} else {
				viewerCount++;
			}
		});

		return {
			connectedClients,
			activeGames: activeGames.size,
			hubCount,
			playerCount,
			viewerCount,
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
		};
	}

	// Expose utility functions for external use
	io.broadcastAnnouncement = broadcastAnnouncement;
	io.getServerStats = getServerStats;

	// Periodic server stats logging
	setInterval(() => {
		const stats = getServerStats();
		if (stats.connectedClients > 0) {
			console.log(`📊 Server Stats: ${stats.connectedClients} clients, ${stats.activeGames} games, ${stats.playerCount} players`);
		}
	}, 60000); // Every minute

	console.log("🎮 WebSocket handlers registered");
	console.log("🚀 Game server ready for connections");

	return io;
}

// Extend SocketIOServer interface for utility functions
declare module "socket.io" {
	interface Server {
		broadcastAnnouncement: (message: string, type?: "info" | "warning" | "error") => void;
		getServerStats: () => any;
	}
}