import type { Socket } from "socket.io-client";
import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "../types/websocketTypes";
import { useBattle } from "../useBattle";
import { useRoom } from "../useRoom";

export class WebSocketEventHandlers {
	private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
	private battleStore = useBattle.getState();
	private roomStore = useRoom.getState();

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
			// Sync players to both stores
			data.players.forEach((player) => {
				this.battleStore.addPlayer(player);
			});
			this.roomStore.setPlayers(data.players);
		}

		if (data.phase) {
			this.battleStore.setGamePhase(data.phase);
		}

		if (typeof data.hydraHealth === "number") {
			this.battleStore.setHydraHealth(data.hydraHealth);
		}

		if (data.currentQuestion) {
			this.battleStore.setCurrentQuestion(data.currentQuestion);
		}
	}

	private handlePlayerJoined(
		data: Parameters<ServerToClientEvents["player_joined"]>[0],
	): void {
		console.log("Player joined:", data.player);
		if (data.player) {
			// Sync to both stores
			this.battleStore.addPlayer(data.player);
			this.roomStore.addPlayer(data.player);
		}
	}

	private handlePlayerListUpdate(
		data: Parameters<ServerToClientEvents["player_list_update"]>[0],
	): void {
		if (data.type === "player_joined" && data.player) {
			// Sync to both stores
			this.battleStore.addPlayer(data.player);
			this.roomStore.addPlayer(data.player);
		} else if (data.type === "player_left" && data.playerId) {
			// Remove from both stores
			this.battleStore.removePlayer(data.playerId);
			this.roomStore.removePlayer(data.playerId);
		}
	}

	private handlePlayerAttack(
		data: Parameters<ServerToClientEvents["player_attack"]>[0],
	): void {
		console.log("Player attack:", data);
		const { playerId, attackType, damage, isCorrect, points } = data;

		// Update player score if correct
		if (isCorrect && points) {
			const player = this.battleStore.players.find((p) => p.id === playerId);
			if (player) {
				this.battleStore.updatePlayer(playerId, {
					score: player.score + points,
				});
			}
		}

		// Add attack effect if successful
		if (isCorrect && attackType !== "miss") {
			this.battleStore.addAttack({
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
		this.battleStore.setCurrentQuestion(question);
		this.battleStore.setGamePhase("battle");
	}

	private handleQuestionEnd(
		data: Parameters<ServerToClientEvents["question_end"]>[0],
	): void {
		console.log("Question ended:", data);
		this.battleStore.setCurrentQuestion(null);
	}

	private handleGamePhaseChange(
		data: Parameters<ServerToClientEvents["game_phase_change"]>[0],
	): void {
		console.log("Game phase changed:", data.phase);
		this.battleStore.setGamePhase(data.phase);
	}

	private handleGameReset(): void {
		console.log("Game reset");
		this.battleStore.resetHydra();
		this.battleStore.clearAllAttacks();
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
