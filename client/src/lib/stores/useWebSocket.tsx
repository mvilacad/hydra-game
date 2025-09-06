import { io, type Socket } from "socket.io-client";
import { create } from "zustand";
import { useBattle } from "./useBattle";

interface WebSocketState {
	socket: Socket | null;
	isConnected: boolean;
	connectionStatus: "connecting" | "connected" | "disconnected" | "error";
	lastMessage: any;

	// Actions
	connect: () => void;
	disconnect: () => void;
	sendMessage: (message: any) => void;
	reconnect: () => void;
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
	socket: null,
	isConnected: false,
	connectionStatus: "disconnected",
	lastMessage: null,

	connect: () => {
		const { socket } = get();

		// Don't create multiple connections
		if (socket && socket.connected) {
			return;
		}

		set({ connectionStatus: "connecting" });

		try {
			// Create Socket.IO connection
			const newSocket = io({
				autoConnect: true,
				reconnection: true,
				reconnectionDelay: 2000,
				reconnectionDelayMax: 10000,
				reconnectionAttempts: 5,
				timeout: 20000,
				forceNew: true,
			});

			// Connection events
			newSocket.on("connect", () => {
				console.log("Socket.IO connected:", newSocket.id);
				set({
					socket: newSocket,
					isConnected: true,
					connectionStatus: "connected",
				});
			});

			newSocket.on("connect_error", (error) => {
				console.error("Socket.IO connection error:", error);
				set({ connectionStatus: "error" });
			});

			newSocket.on("disconnect", (reason) => {
				console.log("Socket.IO disconnected:", reason);
				set({
					isConnected: false,
					connectionStatus: "disconnected",
				});
			});

			// Game event handlers
			const battleStore = useBattle.getState();

			newSocket.on("game_state_update", (data) => {
				console.log("Game state updated:", data);
				if (data.players) {
					data.players.forEach((player: any) => battleStore.addPlayer(player));
				}
				if (data.phase) {
					battleStore.setGamePhase(data.phase);
				}
				if (typeof data.hydraHealth === "number") {
					battleStore.setHydraHealth(data.hydraHealth);
				}
				if (data.currentQuestion) {
					battleStore.setCurrentQuestion(data.currentQuestion);
				}
			});

			newSocket.on("player_joined", (data) => {
				console.log("Player joined:", data.player);
				if (data.player) {
					battleStore.addPlayer(data.player);
				}
			});

			newSocket.on("player_list_update", (data) => {
				if (data.type === "player_joined" && data.player) {
					battleStore.addPlayer(data.player);
				} else if (data.type === "player_left" && data.playerId) {
					battleStore.removePlayer(data.playerId);
				}
			});

			newSocket.on("player_attack", (data) => {
				console.log("Player attack:", data);
				const { playerId, attackType, damage, isCorrect, points } = data;

				// Update player score if correct
				if (isCorrect && points) {
					const player = battleStore.players.find((p) => p.id === playerId);
					if (player) {
						battleStore.updatePlayer(playerId, {
							score: player.score + points,
						});
					}
				}

				// Add attack effect if successful
				if (isCorrect && attackType !== "miss") {
					battleStore.addAttack({
						id: `${playerId}-${Date.now()}`,
						playerId,
						type: attackType,
						damage: damage || 100,
						timestamp: Date.now(),
					});
				}
			});

			newSocket.on("question_start", (question) => {
				console.log("Question started:", question);
				battleStore.setCurrentQuestion(question);
				battleStore.setGamePhase("battle");
			});

			newSocket.on("question_end", () => {
				console.log("Question ended");
				battleStore.setCurrentQuestion(null);
			});

			newSocket.on("game_phase_change", (data) => {
				console.log("Game phase changed:", data.phase);
				battleStore.setGamePhase(data.phase);
			});

			newSocket.on("game_reset", () => {
				console.log("Game reset");
				battleStore.resetHydra();
				battleStore.clearAllAttacks();
			});

			set({ socket: newSocket });
		} catch (error) {
			console.error("Error creating Socket.IO connection:", error);
			set({ connectionStatus: "error" });
		}
	},

	disconnect: () => {
		const { socket } = get();
		if (socket) {
			socket.disconnect();
			set({
				socket: null,
				isConnected: false,
				connectionStatus: "disconnected",
			});
		}
	},

	sendMessage: (message) => {
		const { socket, isConnected } = get();
		if (socket && isConnected) {
			try {
				socket.emit(message.type, message.data);
				console.log("Socket.IO message sent:", message);
			} catch (error) {
				console.error("Error sending Socket.IO message:", error);
			}
		} else {
			console.warn("Cannot send message: Socket.IO not connected");
		}
	},

	reconnect: () => {
		const { disconnect, connect } = get();
		disconnect();
		setTimeout(connect, 1000);
	},
}));
