import type { Player } from "@shared/types";
import { useEffect, useState } from "react";
import { ConnectionStatus } from "@/components/feedback/ConnectionStatus";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { GameLayout } from "@/components/layout/GameLayout";
import {
	PreparationScreen,
	ResultsScreen,
	useAnswerSubmission,
	useBattlePhases,
} from "@/features/battle";
import type { CharacterType } from "@/features/characters";
import { PlayerSetup } from "@/features/player-setup";
import { Question } from "@/features/questions";
import { useBattle } from "@/lib/stores/useBattle";
import { useWebSocket } from "@/lib/stores/useWebSocket";
import { EndedScreen } from "./components/EndedScreen";
import { WaitingScreen } from "./components/WaitingScreen";

export const MobileGameView: React.FC = () => {
	const [currentPlayer, setCurrentPlayer] = useState<{
		name: string;
		character: string;
		id?: string;
	} | null>(null);
	const [currentQuestion, setCurrentQuestion] = useState<any>(null);
	const [timeLeft, setTimeLeft] = useState(30);

	const { isConnected, connect, disconnect, sendMessage } = useWebSocket();
	const {
		players,
		gamePhase: battlePhase,
		hydraHealth,
		maxHydraHealth,
		currentQuestion: battleCurrentQuestion,
	} = useBattle();

	const { battleState, transitionToPhase, startPreparationPhase, resetBattle } =
		useBattlePhases();
	const { submitAnswer } = useAnswerSubmission({
		onSubmissionComplete: () => {
			transitionToPhase("results", 1000, () => {
				setTimeout(() => transitionToPhase("waiting"), 2000);
			});
		},
	});

	// Initialize WebSocket connection
	useEffect(() => {
		connect();
		return () => disconnect();
	}, [connect, disconnect]);

	// Sync player data with battle store
	useEffect(() => {
		if (currentPlayer && !currentPlayer.id && players.length > 0) {
			const matchingPlayer = players.find(
				(p) =>
					p.name === currentPlayer.name &&
					p.character === currentPlayer.character,
			);

			if (matchingPlayer?.id) {
				setCurrentPlayer((prev) =>
					prev ? { ...prev, id: matchingPlayer.id } : null,
				);
			}
		}
	}, [currentPlayer, players]);

	// Handle question lifecycle
	useEffect(() => {
		if (battleCurrentQuestion && currentPlayer) {
			if (!currentQuestion || currentQuestion.id !== battleCurrentQuestion.id) {
				setCurrentQuestion(battleCurrentQuestion);
				setTimeLeft(30);
			}
		} else if (!battleCurrentQuestion && currentQuestion) {
			setCurrentQuestion(null);
			if (battleState.phase === "question" || battleState.phase === "results") {
				transitionToPhase("waiting");
			}
		}
	}, [
		battleCurrentQuestion,
		currentPlayer,
		currentQuestion,
		battleState.phase,
		transitionToPhase,
	]);

	// Handle battle phase transitions
	useEffect(() => {
		if (
			battlePhase === "battle" &&
			currentPlayer &&
			battleState.phase === "waiting"
		) {
			startPreparationPhase();
		} else if (battlePhase === "waiting" && battleState.phase === "results") {
			transitionToPhase("waiting");
		} else if (battlePhase === "victory" || battlePhase === "defeat") {
			transitionToPhase("ended");
		}
	}, [
		battlePhase,
		currentPlayer,
		battleState.phase,
		startPreparationPhase,
		transitionToPhase,
	]);

	// Event handlers
	const handlePlayerReady = (playerData: {
		name: string;
		character: string;
	}) => {
		setCurrentPlayer(playerData);
		transitionToPhase("waiting");

		sendMessage({
			type: "player_join",
			data: playerData,
		});
	};

	const handleAnswerSubmit = (answer: string) => {
		if (!currentQuestion || !currentPlayer?.id) return;

		submitAnswer(
			currentQuestion.id,
			currentPlayer.id,
			answer,
			currentQuestion.correct,
			30 - timeLeft,
		);
	};

	// Render phase-specific content
	const renderCurrentPhase = () => {
		switch (battleState.phase) {
			case "setup":
				return <PlayerSetup onReady={handlePlayerReady} />;

			case "waiting":
				if (!currentPlayer) return <LoadingScreen title="Iniciando..." />;
				return (
					<WaitingScreen
						playerName={currentPlayer.name}
						connectionStatus={<ConnectionStatus isConnected={isConnected} />}
					/>
				);

			case "preparing":
				if (!currentPlayer) return <LoadingScreen title="Preparando..." />;
				return (
					<PreparationScreen
						character={currentPlayer.character as CharacterType}
						playerName={currentPlayer.name}
						countdown={battleState.preparationTimer.count}
					/>
				);

			case "question":
				if (!currentQuestion) {
					return (
						<LoadingScreen
							title="Carregando Pergunta..."
							message="Aguarde um momento..."
						/>
					);
				}

				return (
					<Question
						question={currentQuestion}
						onAnswer={handleAnswerSubmit}
						timeLeft={timeLeft}
						character={currentPlayer?.character as CharacterType}
					/>
				);

			case "results":
				if (!currentPlayer) return <LoadingScreen title="Processando..." />;
				return (
					<ResultsScreen
						character={currentPlayer.character as CharacterType}
						players={players as Player[]}
						currentPlayerId={currentPlayer.id || ""}
						hydraHealth={hydraHealth}
						maxHydraHealth={maxHydraHealth}
					/>
				);

			case "ended":
				return (
					<EndedScreen
						isVictory={hydraHealth <= 0}
						players={players as Player[]}
						onRestart={() => {
							resetBattle();
							transitionToPhase("setup");
						}}
					/>
				);

			default:
				return <LoadingScreen title="Carregando..." />;
		}
	};

	return <GameLayout variant="mobile">{renderCurrentPhase()}</GameLayout>;
};
