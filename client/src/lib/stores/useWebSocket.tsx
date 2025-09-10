import type { WebSocketMessage } from "@shared/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
	ConnectionStatus,
	WebSocketEventHandlers,
	WebSocketStore,
} from "./types/websocketTypes";
import { useGameStore } from "./useGameStore";
import {
	createConnection,
	validateConnection,
} from "./utils/websocketConnection";
import { WebSocketEventHandlers as EventHandlers } from "./utils/websocketEventHandlers";

const INITIAL_STATE = {
	socket: null,
	isConnected: false,
	connectionStatus: "disconnected" as ConnectionStatus,
	lastMessage: null,
	error: null,
	reconnectAttempts: 0,
	maxReconnectAttempts: 5,
} as const;

export const useWebSocket = create<WebSocketStore>()(
	devtools(
		(set, get) => {
			let eventHandlers: EventHandlers | null = null;

			const handleConnect = () => {
				set({
					isConnected: true,
					connectionStatus: "connected",
					error: null,
					reconnectAttempts: 0,
				});
			};

			const handleDisconnect = (reason: string) => {
				set({
					isConnected: false,
					connectionStatus: "disconnected",
					error: reason.includes("error") ? reason : null,
				});
			};

			const handleConnectError = (error: Error) => {
				set({
					connectionStatus: "error",
					error: error.message,
					isConnected: false,
				});
			};

			const handleReconnect = (attemptNumber: number) => {
				set({
					connectionStatus: "connected",
					isConnected: true,
					reconnectAttempts: attemptNumber,
					error: null,
				});
			};

			const handleReconnectError = (error: Error) => {
				set((state) => ({
					connectionStatus: "reconnecting",
					reconnectAttempts: state.reconnectAttempts + 1,
					error: error.message,
				}));
			};

			const handleMaxReconnectAttempts = () => {
				set({
					connectionStatus: "error",
					error: "Maximum reconnection attempts reached",
					isConnected: false,
				});
			};

			const eventHandlerConfig: Partial<WebSocketEventHandlers> = {
				onConnect: handleConnect,
				onDisconnect: handleDisconnect,
				onConnectError: handleConnectError,
				onReconnect: handleReconnect,
				onReconnectError: handleReconnectError,
				onMaxReconnectAttempts: handleMaxReconnectAttempts,
			};

			return {
				...INITIAL_STATE,

				connect: (roomCode?: string) => {
					const { socket: currentSocket } = get();

					// Prevent duplicate connections
					if (validateConnection(currentSocket)) {
						console.log("WebSocket already connected");
						// If room code provided, join the room
						if (roomCode && currentSocket) {
							currentSocket.emit("join_room", { roomCode });
						}
						return;
					}

					set({ connectionStatus: "connecting", error: null });

					try {
						const newSocket = createConnection({}, eventHandlerConfig);

						// Setup game event handlers
						eventHandlers = new EventHandlers(newSocket);

						// Setup room event handlers
						newSocket.on("room_joined", (data) => {
							console.log("Room joined:", data);
							// Update room store with joined room data
							const gameStore = useGameStore.getState();
							if (data.room) {
								gameStore.setPlayers(data.players || []);
							}
						});

						newSocket.on("room_state_update", (data) => {
							console.log("Room state update:", data);
							const gameStore = useGameStore.getState();
							gameStore.setPlayers(data.players || []);
						});

						newSocket.on("room_error", (data) => {
							console.error("Room error:", data.error);
							const gameStore = useGameStore.getState();
							gameStore.setError(data.error);
						});

						set({ socket: newSocket });

						// Auto-join room if code provided
						if (roomCode) {
							newSocket.emit("join_room", { roomCode });
						}
					} catch (error) {
						console.error("Failed to create WebSocket connection:", error);
						set({
							connectionStatus: "error",
							error:
								error instanceof Error ? error.message : "Connection failed",
						});
					}
				},

				disconnect: () => {
					const { socket } = get();

					if (socket) {
						eventHandlers?.cleanup();
						eventHandlers = null;

						socket.disconnect();
						set({
							socket: null,
							isConnected: false,
							connectionStatus: "disconnected",
							error: null,
						});
					}
				},

				reconnect: () => {
					const { disconnect, connect } = get();

					set({ connectionStatus: "reconnecting" });

					disconnect();

					// Wait before reconnecting
					setTimeout(() => {
						connect();
					}, 1000);
				},

				sendMessage: <T extends WebSocketMessage>(message: T): boolean => {
					const { socket } = get();

					if (!validateConnection(socket)) {
						console.warn(
							"Cannot send message: WebSocket not connected",
							message,
						);
						set({ error: "Not connected to server" });
						return false;
					}

					try {
						socket.emit(message.type as any, message.data);
						console.log("WebSocket message sent:", message);

						set({
							lastMessage: message,
							error: null,
						});

						return true;
					} catch (error) {
						const errorMessage =
							error instanceof Error ? error.message : "Failed to send message";
						console.error("Error sending WebSocket message:", error);

						set({ error: errorMessage });
						return false;
					}
				},

				clearError: () => {
					set({ error: null });
				},

				// Room-specific methods
				joinRoom: (roomCode: string, playerData?: any) => {
					const { socket } = get();

					if (!validateConnection(socket)) {
						console.warn("Cannot join room: WebSocket not connected");
						set({ error: "Not connected to server" });
						return false;
					}

					try {
						socket.emit("join_room", { roomCode, playerData });
						console.log("Joining room:", roomCode);
						return true;
					} catch (error) {
						const errorMessage =
							error instanceof Error ? error.message : "Failed to join room";
						console.error("Error joining room:", error);
						set({ error: errorMessage });
						return false;
					}
				},

				leaveRoom: () => {
					const { socket } = get();

					if (!validateConnection(socket)) {
						console.warn("Cannot leave room: WebSocket not connected");
						return false;
					}

					try {
						socket.emit("leave_room");
						console.log("Leaving room");
						return true;
					} catch (error) {
						const errorMessage =
							error instanceof Error ? error.message : "Failed to leave room";
						console.error("Error leaving room:", error);
						set({ error: errorMessage });
						return false;
					}
				},
			};
		},
		{
			name: "websocket-store",
			partialize: (state: WebSocketStore) => ({
				// Only persist non-volatile state
				connectionStatus: state.connectionStatus,
				error: state.error,
				reconnectAttempts: state.reconnectAttempts,
			}),
		},
	),
);
