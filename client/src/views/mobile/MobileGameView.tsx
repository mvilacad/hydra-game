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
import { RoomJoin } from "@/features/room-management";
import { useBattle } from "@/lib/stores/useBattle";
import { useGame } from "@/lib/stores/useGame";
import { useRoom, useRoomCode } from "@/lib/stores/useRoom";
import { useWebSocket } from "@/lib/stores/useWebSocket";
import type { Player } from "@shared/types";
import { useEffect, useState } from "react";
import { EndedScreen } from "./components/EndedScreen";
import { WaitingScreen } from "./components/WaitingScreen";
import {
	CharacterSelectionScreen,
	GameplayScreen,
	LobbyScreen,
	MenuScreen,
} from "./screens";

export const MobileGameView: React.FC = () => {
	const [currentPlayer, setCurrentPlayer] = useState<{
		name: string;
		character: string;
		id?: string;
	} | null>(null);
	const [currentQuestion, setCurrentQuestion] = useState<any>(null);
	const [timeLeft, setTimeLeft] = useState(30);
	const [showRoomJoin, setShowRoomJoin] = useState(true);
	const [initialRoomCode, setInitialRoomCode] = useState("");

	// New Figma flow states
	const [gameFlow, setGameFlow] = useState<
		"menu" | "character-selection" | "room-join" | "lobby" | "gameplay"
	>("menu");

	const [useFigmaDesign, setUseFigmaDesign] = useState(true);

	const {
		isConnected,
		connect,
		disconnect,
		sendMessage,
		joinRoom: joinRoomWS,
	} = useWebSocket();

	const {
		players,
		gamePhase: battlePhase,
		hydraHealth,
		maxHydraHealth,
		currentQuestion: battleCurrentQuestion,
	} = useBattle();


	// Room management
	const roomCode = useRoomCode();
	const { joinRoom: joinRoomAPI, currentRoom } = useRoom();
	const { setGameContext } = useGame();

	const { battleState, transitionToPhase, startPreparationPhase, resetBattle } =
		useBattlePhases();

	const { submitAnswer } = useAnswerSubmission({
		onSubmissionComplete: () => {
			transitionToPhase("results", 1000, () => {
				setTimeout(() => transitionToPhase("waiting"), 2000);
			});
		},
	});

	// Check URL params for room code
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const roomParam = urlParams.get("room");

		if (roomParam) {
			setInitialRoomCode(roomParam);
			setShowRoomJoin(false);
			// Auto-join room
			handleRoomJoined(roomParam, false);
		}
	}, []);

	// Initialize WebSocket connection
	useEffect(() => {
		if (roomCode) {
			connect(roomCode);
		} else {
			connect();
		}
		return () => disconnect();
	}, [connect, disconnect, roomCode]);

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

		console.log("Battle phase changed to", battlePhase);
		console.log("Internal battle state phase is", battleState.phase);
		if (
			battlePhase === "battle" &&
			currentPlayer &&
			battleState.phase === "waiting"
		) {
			if (useFigmaDesign) {
				setGameFlow("gameplay");
			} else {
				startPreparationPhase();
			}
		} else if (battlePhase === "waiting" && battleState.phase === "results") {
			if (useFigmaDesign) {
				setGameFlow("lobby");
			} else {
				transitionToPhase("waiting");
			}
		} else if (battlePhase === "victory" || battlePhase === "defeat") {
			if (!useFigmaDesign) {
				transitionToPhase("ended");
			}
		}
	}, [
		battlePhase,
		currentPlayer,
		battleState.phase,
		startPreparationPhase,
		transitionToPhase,
		useFigmaDesign,
	]);

	// Room event handlers
	const handleRoomJoined = async (code: string, isCreator: boolean) => {
		if (!code) {
			// Handle room creation scenario for mobile
			if (useFigmaDesign) {
				setGameFlow("character-selection");
			} else {
				setShowRoomJoin(true);
			}
			return;
		}

		try {
			const result = await joinRoomAPI(code);
			if (result.success && result.game) {
				setGameContext(result.game);

				if (useFigmaDesign) {
					setGameFlow("lobby");
				} else {
					setShowRoomJoin(false);
				}

				// Join WebSocket room
				if (joinRoomWS) {
					joinRoomWS(code);
				}

				// Send player data if we have it
				if (currentPlayer) {
					const playerId = `${currentPlayer.name}_${Date.now()}`;
					const playerWithId = { ...currentPlayer, playerId };

					sendMessage({
						type: "player_join",
						data: playerWithId,
					});
				}
			}
		} catch (error) {
			console.error("Failed to join room:", error);
			if (useFigmaDesign) {
				setGameFlow("room-join");
			} else {
				setShowRoomJoin(true);
			}
		}
	};

	// New Figma flow handlers
	const handleStartGame = () => {
		setGameFlow("character-selection");
	};

	const handleCharacterConfirm = (data: {
		characterId: string;
		playerName: string;
	}) => {
		setCurrentPlayer({
			name: data.playerName,
			character: data.characterId,
		});
		setGameFlow("room-join");
	};

	const handleBackToCharacterSelection = () => {
		setGameFlow("character-selection");
	};

	const handleBackToMenu = () => {
		setGameFlow("menu");
		setCurrentPlayer(null);
	};

	// Event handlers
	const handlePlayerReady = (playerData: {
		name: string;
		character: string;
	}) => {
		setCurrentPlayer(playerData);
		transitionToPhase("waiting");

		// Generate unique player ID
		const playerId = `${playerData.name}_${Date.now()}`;
		const playerWithId = { ...playerData, playerId };

		sendMessage({
			type: "player_join",
			data: playerWithId,
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

	// New Figma design flow
	if (useFigmaDesign) {
		switch (gameFlow) {
			case "menu":
				return <MenuScreen onStartGame={handleStartGame} />;

			case "character-selection":
				return (
					<CharacterSelectionScreen
						onConfirm={handleCharacterConfirm}
						onBack={handleBackToMenu}
					/>
				);

			case "room-join":
				return (
					<GameLayout variant="mobile">
						<div className="flex items-center justify-center h-full">
							<RoomJoin
								onRoomJoined={handleRoomJoined}
								initialRoomCode={initialRoomCode}
							/>
						</div>
					</GameLayout>
				);

			case "lobby":
				if (!currentPlayer || !roomCode) {
					return <LoadingScreen title="Carregando..." />;
				}
				return (
					<LobbyScreen
						playerName={currentPlayer.name}
						characterId={currentPlayer.character}
						roomCode={roomCode}
						playersCount={players.length}
						maxPlayers={20}
					/>
				);

			case "gameplay":
				if (!currentQuestion || !currentPlayer) {
					return <LoadingScreen title="Carregando pergunta..." />;
				}

				return (
					<GameplayScreen
						question={{
							id: currentQuestion.id,
							text: currentQuestion.question,
							options:
								currentQuestion.options?.map((opt: string, idx: number) => ({
									id: idx.toString(),
									text: opt,
									isCorrect: idx === currentQuestion.correct,
								})) || [],
							round: 1,
							totalRounds: 10,
						}}
						timeLeft={timeLeft}
						hydraHealth={hydraHealth}
						maxHydraHealth={maxHydraHealth}
						playerName={currentPlayer.name}
						playerScore={
							players.find((p) => p.id === currentPlayer.id)?.score || 0
						}
						characterId={currentPlayer.character}
						onAnswerSelect={handleAnswerSubmit}
						selectedAnswer={undefined}
						showResults={battleState.phase === "results"}
						gamePhase={battlePhase === "battle" ? "question" : "waiting"}
					/>
				);
		}
	}

	// Show room join interface if not in a room (legacy flow)
	if (showRoomJoin || !roomCode) {
		return (
			<GameLayout variant="mobile">
				<div className="flex items-center justify-center h-full">
					<RoomJoin
						onRoomJoined={handleRoomJoined}
						initialRoomCode={initialRoomCode}
					/>
				</div>
			</GameLayout>
		);
	}

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
