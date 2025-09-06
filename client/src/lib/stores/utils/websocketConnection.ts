import { io, type Socket } from "socket.io-client";
import type {
	ClientToServerEvents,
	ConnectionStatus,
	ServerToClientEvents,
	WebSocketEventHandlers,
} from "../types/websocketTypes";

interface WebSocketConnectionConfig {
	url?: string;
	autoConnect?: boolean;
	reconnection?: boolean;
	reconnectionDelay?: number;
	reconnectionDelayMax?: number;
	reconnectionAttempts?: number;
	timeout?: number;
}

const DEFAULT_CONFIG: Required<WebSocketConnectionConfig> = {
	url: "",
	autoConnect: true,
	reconnection: true,
	reconnectionDelay: 2000,
	reconnectionDelayMax: 10000,
	reconnectionAttempts: 5,
	timeout: 20000,
};

export const createConnection = (
	config: WebSocketConnectionConfig = {},
	handlers: Partial<WebSocketEventHandlers> = {},
): Socket<ServerToClientEvents, ClientToServerEvents> => {
	const finalConfig = { ...DEFAULT_CONFIG, ...config };

	const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
		finalConfig.url,
		{
			autoConnect: finalConfig.autoConnect,
			reconnection: finalConfig.reconnection,
			reconnectionDelay: finalConfig.reconnectionDelay,
			reconnectionDelayMax: finalConfig.reconnectionDelayMax,
			reconnectionAttempts: finalConfig.reconnectionAttempts,
			timeout: finalConfig.timeout,
			forceNew: true,
		},
	);

	// Setup event handlers with proper typing
	socket.on("connect", () => {
		console.log(`Socket.IO connected: ${socket.id}`);
		handlers.onConnect?.();
	});

	socket.on("connect_error", (error: Error) => {
		console.error("Socket.IO connection error:", error);
		handlers.onConnectError?.(error);
	});

	socket.on("disconnect", (reason: Socket.DisconnectReason) => {
		console.log(`Socket.IO disconnected: ${reason}`);
		handlers.onDisconnect?.(reason);
	});

	socket.io.on("reconnect", (attemptNumber: number) => {
		console.log(`Socket.IO reconnected after ${attemptNumber} attempts`);
		handlers.onReconnect?.(attemptNumber);
	});

	socket.io.on("reconnect_error", (error: Error) => {
		console.error("Socket.IO reconnection error:", error);
		handlers.onReconnectError?.(error);
	});

	socket.io.on("reconnect_failed", () => {
		console.error("Socket.IO max reconnection attempts reached");
		handlers.onMaxReconnectAttempts?.();
	});

	return socket;
};

export const validateConnection = (socket: Socket | null): socket is Socket => {
	return !!socket?.connected;
};

export const getConnectionStatus = (
	socket: Socket | null,
): ConnectionStatus => {
	if (!socket) return "disconnected";
	if (socket.connected) return "connected";
	if (socket.disconnected) return "disconnected";
	return "connecting";
};
