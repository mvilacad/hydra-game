import type { Socket } from "socket.io-client";
import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "../types/websocketTypes";
import { useGameStore } from "../useGameStore";

export class WebSocketEventHandlers {
	private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
	private gameStore = useGameStore.getState();

	constructor(socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
		this.socket = socket;
		this.setupEventHandlers();
	}

	private setupEventHandlers(): void {
		this.socket.on("game_state_update", this.handleGameStateUpdate.bind(this));
		this.socket.on("player_joined", this.handlePlayerJoined.bind(this));
		this.socket.on(
			"player_list_update",
			this.handlePlayerListUpdate.bind(this),
		);
		this.socket.on("player_attack", this.handlePlayerAttack.bind(this));
		this.socket.on("question_start", this.handleQuestionStart.bind(this));
		this.socket.on("question_end", this.handleQuestionEnd.bind(this));
		this.socket.on("game_phase_change", this.handleGamePhaseChange.bind(this));
		this.socket.on("game_reset", this.handleGameReset.bind(this));
	}

	private handleGameStateUpdate(
		data: Parameters<ServerToClientEvents["game_state_update"]>[0],
	): void {
		console.log("Game state updated:", data);

		if (data.players) {
			this.gameStore.setPlayers(data.players);
		}

		if (data.phase) {
			this.gameStore.setPhase(data.phase);
		}

		if (typeof data.hydraHealth === "number") {
			this.gameStore.setHydraHealth(data.hydraHealth);
		}

		if (data.currentQuestion) {
			this.gameStore.setCurrentQuestion(data.currentQuestion);
		}
	}

	private handlePlayerJoined(
		data: Parameters<ServerToClientEvents["player_joined"]>[0],
	): void {
		console.log("Player joined:", data.player);
		if (data.player) {
			this.gameStore.addPlayer(data.player);
		}
	}

	private handlePlayerListUpdate(
		data: Parameters<ServerToClientEvents["player_list_update"]>[0],
	): void {
		if (data.type === "player_joined" && data.player) {
			this.gameStore.addPlayer(data.player);
		} else if (data.type === "player_left" && data.playerId) {
			this.gameStore.removePlayer(data.playerId);
		}
	}

	private handlePlayerAttack(
		data: Parameters<ServerToClientEvents["player_attack"]>[0],
	): void {
		console.log("Player attack:", data);
		const { playerId, attackType, damage, isCorrect, points } = data;

		// Update player score if correct
		if (isCorrect && points) {
			const player = this.gameStore.players.find((p) => p.id === playerId);
			if (player) {
				this.gameStore.updatePlayer(playerId, {
					score: player.score + points,
				});
			}
		}

		// Add attack effect if successful
		if (isCorrect && attackType !== "miss") {
			this.gameStore.addAttack({
				id: `${playerId}-${Date.now()}`,
				playerId,
				type: attackType,
				damage: damage || 100,
				timestamp: Date.now(),
			});
		}
	}

	private handleQuestionStart(
		question: Parameters<ServerToClientEvents["question_start"]>[0],
	): void {
		console.log("Question started:", question);
		this.gameStore.setCurrentQuestion(question);
		this.gameStore.setPhase("battle");
	}

	private handleQuestionEnd(
		data: Parameters<ServerToClientEvents["question_end"]>[0],
	): void {
		console.log("Question ended:", data);
		this.gameStore.setCurrentQuestion(null);
	}

	private handleGamePhaseChange(
		data: Parameters<ServerToClientEvents["game_phase_change"]>[0],
	): void {
		console.log("Game phase changed:", data.phase);
		this.gameStore.setPhase(data.phase);
	}

	private handleGameReset(): void {
		console.log("Game reset");
		this.gameStore.reset();
	}

	public cleanup(): void {
		this.socket.off("game_state_update");
		this.socket.off("player_joined");
		this.socket.off("player_list_update");
		this.socket.off("player_attack");
		this.socket.off("question_start");
		this.socket.off("question_end");
		this.socket.off("game_phase_change");
		this.socket.off("game_reset");
	}
}
