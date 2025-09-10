import type { Socket, Server } from "socket.io";
import {
	gameService,
	roomService,
	questionService,
	statsService,
} from "../../services";
import { isValidRoomCode, normalizeRoomCode } from "../../utils/roomCodes";

export interface GameHandlersInterface {
	handleJoinRoom(socket: Socket, data: any): Promise<void>;
	handlePlayerJoin(socket: Socket, data: any): Promise<void>;
	handleAnswerSubmit(socket: Socket, data: any): Promise<void>;
	handleAdminCommand(socket: Socket, data: any): Promise<void>;
	handleResetGame(socket: Socket): Promise<void>;
	handleDisconnect(socket: Socket): Promise<void>;
	broadcastGameState(gameId: number, io: Server): Promise<void>;
}

/**
 * Game-related WebSocket event handlers
 * Handles game logic, player actions, and room management
 */
export class GameHandlers implements GameHandlersInterface {
	/**
	 * Handle hub or player joining a room
	 */
	async handleJoinRoom(
		socket: Socket,
		data: { roomCode?: string; isHub?: boolean },
	): Promise<void> {
		try {
			console.log(`Socket ${socket.id} attempting to join room:`, data);

			// Validate room code if provided
			if (data.roomCode) {
				const normalizedCode = normalizeRoomCode(data.roomCode);
				if (!isValidRoomCode(normalizedCode)) {
					socket.emit("error", { message: "Invalid room code format" });
					return;
				}
				data.roomCode = normalizedCode;
			}

			// Join or create room
			const result = await roomService.joinOrCreateRoom(data.roomCode);

			if (!result.success) {
				socket.emit("error", { message: result.error });
				return;
			}

			const game = result.game!;
			const roomName = `game-${game.id}`;

			// Store game info in socket
			socket.data.gameId = game.id;
			socket.data.roomCode = game.code;
			socket.data.isHub = data.isHub || false;
			socket.data.isCreator = result.isCreator;

			// Join socket room
			await socket.join(roomName);

			// Get current game state
			const gameState = await gameService.getGameState(game.id);

			// Emit room joined confirmation
			socket.emit("room_joined", {
				gameId: game.id,
				roomCode: game.code,
				isCreator: result.isCreator,
				game: {
					id: game.id,
					code: game.code,
					status: game.status,
					hydraHealth: game.hydraHealth,
					maxHydraHealth: game.maxHydraHealth,
					currentQuestionIndex: game.currentQuestionIndex,
					configuration: game.configuration,
				},
				players: gameState?.players || [],
				currentQuestion: gameState?.currentQuestion,
			});

			// Broadcast to room that someone joined (for monitoring)
			socket.to(roomName).emit("room_update", {
				type: data.isHub ? "hub_joined" : "viewer_joined",
				gameId: game.id,
			});

			console.log(
				`Socket ${socket.id} joined room ${game.code} (Game ${game.id}) as ${data.isHub ? "hub" : "viewer"}`,
			);
		} catch (error) {
			console.error("Error joining room:", error);
			socket.emit("error", { message: "Failed to join room" });
		}
	}

	/**
	 * Handle player joining the game (mobile players)
	 */
	async handlePlayerJoin(
		socket: Socket,
		data: { name: string; character: string; playerId: string },
	): Promise<void> {
		try {
			if (!socket.data.gameId) {
				socket.emit("error", { message: "Not connected to a game room" });
				return;
			}

			if (!data.name || !data.character || !data.playerId) {
				socket.emit("error", {
					message: "Name, character, and player ID are required",
				});
				return;
			}

			// Add player to game
			const player = await gameService.addPlayerToGame(socket.data.gameId, {
				name: data.name.trim(),
				character: data.character,
				playerId: data.playerId,
				socketId: socket.id,
			});

			if (!player) {
				socket.emit("error", { message: "Failed to join game" });
				return;
			}

			// Store player info in socket
			socket.data.playerId = data.playerId;
			socket.data.playerName = data.name;
			socket.data.character = data.character;

			const roomName = `game-${socket.data.gameId}`;

			// Emit success to player
			socket.emit("player_joined", {
				playerId: player.playerId,
				player: {
					id: player.id,
					name: player.name,
					character: player.character,
					score: player.score,
					playerId: player.playerId,
				},
			});

			// Broadcast to all clients in room
			socket.to(roomName).emit("player_list_update", {
				type: "player_joined",
				player: {
					id: player.id,
					name: player.name,
					character: player.character,
					score: player.score,
					playerId: player.playerId,
					isConnected: player.isConnected,
				},
			});

			// Broadcast updated game state
			await this.broadcastGameState(socket.data.gameId, socket.server);

			console.log(
				`Player ${data.name} (${data.character}) joined game ${socket.data.gameId}`,
			);
		} catch (error) {
			console.error("Error handling player join:", error);
			socket.emit("error", {
				message: error instanceof Error ? error.message : "Failed to join game",
			});
		}
	}

	/**
	 * Handle answer submission from players
	 */
	async handleAnswerSubmit(
		socket: Socket,
		data: {
			playerId: string;
			questionId: number;
			answer: string;
			isCorrect: boolean;
			timeSpent: number;
		},
	): Promise<void> {
		try {
			if (!socket.data.gameId || !socket.data.playerId) {
				socket.emit("error", {
					message: "Not connected to a game or not a player",
				});
				return;
			}

			// Verify player ID matches socket
			if (data.playerId !== socket.data.playerId) {
				socket.emit("error", { message: "Player ID mismatch" });
				return;
			}

			// Submit answer
			const result = await gameService.submitAnswer(socket.data.gameId, data);

			if (!result) {
				socket.emit("error", { message: "Failed to submit answer" });
				return;
			}

			const roomName = `game-${socket.data.gameId}`;

			// Broadcast attack if answer was correct
			if (result.attack) {
				socket.to(roomName).emit("player_attack", {
					playerId: data.playerId,
					attackType: result.attack.attackType,
					damage: result.attack.damage,
					isCorrect: data.isCorrect,
					points: result.answer.points,
				});
			} else if (!data.isCorrect) {
				// Broadcast miss for wrong answers
				socket.to(roomName).emit("player_attack", {
					playerId: data.playerId,
					attackType: "miss",
					damage: 0,
					isCorrect: false,
					points: 0,
				});
			}

			// Broadcast updated game state
			await this.broadcastGameState(socket.data.gameId, socket.server);

			// Track event for statistics
			await statsService.trackEvent(
				socket.data.gameId,
				"answer_submitted",
				{
					questionId: data.questionId,
					isCorrect: data.isCorrect,
					timeSpent: data.timeSpent,
					points: result.answer.points,
				},
				data.playerId,
			);

			console.log(
				`Player ${socket.data.playerName} answered: ${data.answer} (${data.isCorrect ? "correct" : "wrong"})`,
			);
		} catch (error) {
			console.error("Error handling answer submit:", error);
			socket.emit("error", { message: "Failed to submit answer" });
		}
	}

	/**
	 * Handle admin commands (only for game creators or hubs)
	 */
	async handleAdminCommand(
		socket: Socket,
		data: { command: string; payload?: any },
	): Promise<void> {
		try {
			if (!socket.data.gameId) {
				socket.emit("error", { message: "Not connected to a game room" });
				return;
			}

			// Only allow admin commands from creators or hubs
			if (!socket.data.isCreator && !socket.data.isHub) {
				socket.emit("error", { message: "Admin privileges required" });
				return;
			}

			const roomName = `game-${socket.data.gameId}`;

			switch (data.command) {
				case "start_game": {
					const startedGame = await gameService.startGame(socket.data.gameId);
					if (startedGame) {
						socket.to(roomName).emit("game_phase_change", { phase: "battle" });
						await this.broadcastGameState(socket.data.gameId, socket.server);

						// Start first question after brief delay
						setTimeout(async () => {
							await this.startNextQuestion(socket.data.gameId, socket.server);
						}, 2000);
					}
					break;
				}

				case "reset_game":
					await gameService.resetGame(socket.data.gameId);
					socket.to(roomName).emit("game_reset");
					await this.broadcastGameState(socket.data.gameId, socket.server);
					break;

				case "next_question":
					await this.startNextQuestion(socket.data.gameId, socket.server);
					break;

				case "end_question":
					socket.to(roomName).emit("question_end", {});
					break;

				case "damage_hydra": {
					// Debug command for testing
					const game = await roomService.getRoomById(socket.data.gameId);
					if (game) {
						const newHealth = Math.max(
							0,
							game.hydraHealth - (data.payload?.damage || 200),
						);
						await gameService.updateGameState(socket.data.gameId, {
							hydraHealth: newHealth,
						});
						await this.broadcastGameState(socket.data.gameId, socket.server);
					}
					break;
				}

				case "heal_hydra": {
					// Debug command for testing
					const healGame = await roomService.getRoomById(socket.data.gameId);
					if (healGame) {
						await gameService.updateGameState(socket.data.gameId, {
							hydraHealth: healGame.maxHydraHealth,
						});
						await this.broadcastGameState(socket.data.gameId, socket.server);
					}
					break;
				}

				default:
					socket.emit("error", {
						message: `Unknown admin command: ${data.command}`,
					});
			}

			console.log(`Admin command executed: ${data.command} by ${socket.id}`);
		} catch (error) {
			console.error("Error handling admin command:", error);
			socket.emit("error", { message: "Failed to execute admin command" });
		}
	}

	/**
	 * Handle game reset
	 */
	async handleResetGame(socket: Socket): Promise<void> {
		try {
			if (!socket.data.gameId) {
				socket.emit("error", { message: "Not connected to a game room" });
				return;
			}

			await gameService.resetGame(socket.data.gameId);

			const roomName = `game-${socket.data.gameId}`;
			socket.to(roomName).emit("game_reset");
			await this.broadcastGameState(socket.data.gameId, socket.server);

			console.log(`Game ${socket.data.gameId} reset by ${socket.id}`);
		} catch (error) {
			console.error("Error resetting game:", error);
			socket.emit("error", { message: "Failed to reset game" });
		}
	}

	/**
	 * Handle socket disconnection
	 */
	async handleDisconnect(socket: Socket): Promise<void> {
		try {
			if (socket.data.gameId && socket.data.playerId) {
				// Update player connection status
				await gameService.updatePlayerConnection(
					socket.data.gameId,
					socket.data.playerId,
					false,
				);

				const roomName = `game-${socket.data.gameId}`;

				// Notify room of player disconnection
				socket.to(roomName).emit("player_list_update", {
					type: "player_disconnected",
					playerId: socket.data.playerId,
				});

				// Broadcast updated game state
				await this.broadcastGameState(socket.data.gameId, socket.server);

				console.log(
					`Player ${socket.data.playerName} disconnected from game ${socket.data.gameId}`,
				);
			} else if (socket.data.gameId) {
				console.log(
					`${socket.data.isHub ? "Hub" : "Viewer"} disconnected from game ${socket.data.gameId}`,
				);
			}
		} catch (error) {
			console.error("Error handling disconnect:", error);
		}
	}

	/**
	 * Broadcast game state to all clients in room
	 */
	async broadcastGameState(gameId: number, io: Server): Promise<void> {
		try {
			const gameState = await gameService.getGameState(gameId);
			if (!gameState) return;

			const roomName = `game-${gameId}`;

			// Get real-time stats
			const realtimeStats = await statsService.getRealtimeStats(gameId);

			// Broadcast to all clients in room
			io.to(roomName).emit("game_state_update", {
				phase: gameState.game.status,
				players: gameState.players.map((p) => ({
					id: p.id,
					name: p.name,
					character: p.character,
					score: p.score,
					playerId: p.playerId,
					isConnected: p.isConnected,
				})),
				hydraHealth: gameState.game.hydraHealth,
				maxHydraHealth: gameState.game.maxHydraHealth,
				currentQuestion: gameState.currentQuestion,
				realtimeStats,
			});
		} catch (error) {
			console.error("Error broadcasting game state:", error);
		}
	}

	/**
	 * Start the next question in the game
	 */
	private async startNextQuestion(gameId: number, io: Server): Promise<void> {
		try {
			const question = await gameService.nextQuestion(gameId);
			if (!question) return; // Game ended

			const roomName = `game-${gameId}`;

			// Emit question start to all clients
			io.to(roomName).emit("question_start", {
				id: question.id,
				question: (question.questionData as any).question,
				options: (question.questionData as any).options,
				type: (question.questionData as any).type,
				timeLimit: question.timeLimit,
				position: question.position,
			});

			// Auto-advance after time limit
			setTimeout(async () => {
				io.to(roomName).emit("question_end", {});

				// Check if game continues
				setTimeout(async () => {
					const gameState = await gameService.getGameState(gameId);
					if (gameState?.game.status === "battle") {
						await this.startNextQuestion(gameId, io);
					}
				}, 3000);
			}, question.timeLimit * 1000);
		} catch (error) {
			console.error("Error starting next question:", error);
		}
	}
}

// Export singleton instance
export const gameHandlers = new GameHandlers();
