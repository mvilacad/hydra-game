import type { Game, Player, GameStats } from "@shared/schema";

export interface CreateGameRequest {
	questionSet?: string;
	maxQuestions?: number;
	randomOrder?: boolean;
	timeLimit?: number;
	individualTimeLimits?: Record<string, number>;
	maxPlayers?: number;
	autoStart?: boolean;
}

export interface JoinGameRequest {
	roomCode: string;
}

export interface GameResponse {
	success: boolean;
	game?: Game & {
		formattedCode?: string;
	};
	players?: Player[];
	isCreator?: boolean;
	currentQuestion?: any;
	error?: string;
	details?: any[];
}

export interface StatsResponse {
	success: boolean;
	stats?: GameStats & {
		playerStats?: any[];
		questionStats?: any[];
		timelineEvents?: any[];
	};
	error?: string;
}

const API_BASE = "/api";

class GameApiService {
	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${API_BASE}${endpoint}`;
		
		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			...options,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async createGame(config: CreateGameRequest): Promise<GameResponse> {
		return this.request<GameResponse>("/games", {
			method: "POST",
			body: JSON.stringify(config),
		});
	}

	async joinGame(roomCode: string): Promise<GameResponse> {
		return this.request<GameResponse>("/games/join", {
			method: "POST",
			body: JSON.stringify({ roomCode }),
		});
	}

	async getGame(roomCode: string): Promise<GameResponse> {
		return this.request<GameResponse>(`/games/${roomCode}`);
	}

	async uploadCustomQuestions(
		gameId: number,
		questionsData: {
			questions: Array<{
				id: string;
				question: string;
				options: string[];
				correct: string;
				type: "sword" | "arrow" | "magic" | "fire";
				difficulty?: "easy" | "medium" | "hard";
				category?: string;
				explanation?: string;
			}>;
			timeLimit?: number;
			individualTimeLimits?: Record<string, number>;
			randomOrder?: boolean;
			maxQuestions?: number;
		}
	): Promise<{
		success: boolean;
		message?: string;
		questions?: Array<{ id: number; position: number; timeLimit: number; question: string }>;
		error?: string;
		details?: any[];
	}> {
		return this.request(`/games/${gameId}/questions`, {
			method: "POST",
			body: JSON.stringify(questionsData),
		});
	}

	async getGameStats(gameId: number): Promise<StatsResponse> {
		return this.request<StatsResponse>(`/games/${gameId}/stats`);
	}

	async exportGameData(
		gameId: number,
		format: "json" | "csv" = "json"
	): Promise<any> {
		const url = `${API_BASE}/games/${gameId}/export?format=${format}`;
		
		const response = await fetch(url);
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || `Failed to export game data`);
		}

		if (format === "csv") {
			return response.text();
		}
		
		return response.json();
	}

	async closeGame(gameId: number): Promise<{
		success: boolean;
		message?: string;
		error?: string;
	}> {
		return this.request(`/games/${gameId}`, {
			method: "DELETE",
		});
	}

	// Utility methods
	formatRoomCode(code: string): string {
		return code.toUpperCase().replace(/(.{3})/, "$1-");
	}

	parseRoomCode(code: string): string {
		return code.replace(/[-\s]/g, "").toUpperCase();
	}

	validateRoomCode(code: string): boolean {
		const cleanCode = this.parseRoomCode(code);
		return /^[A-Z0-9]{6}$/.test(cleanCode);
	}
}

export const gameApi = new GameApiService();