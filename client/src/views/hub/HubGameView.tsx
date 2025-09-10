import { useEffect, useState } from "react";
import { BattleHUD } from "@/components/ui/battle-hud";
import { CombatLog } from "@/components/ui/combat-log";
import { DamageMeter } from "@/components/ui/damage-meter";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";
import { BattleScene } from "@/features/game-3d";
import { RoomJoin, RoomInfo, RoomSetup } from "@/features/room-management";
import { FigmaButton, StatusCard, ParchmentCard } from "@/components/figma-ui";
import { useBattle } from "@/lib/stores/useBattle";
import { useWebSocket } from "@/lib/stores/useWebSocket";
import { useRoom, useRoomCode, useIsCreator } from "@/lib/stores/useRoom";
import { useGame } from "@/lib/stores/useGame";

export default function HubDisplay() {
	const [showRoomJoin, setShowRoomJoin] = useState(true);
	const [showRoomSetup, setShowRoomSetup] = useState(false);
	const [initialRoomCode, setInitialRoomCode] = useState("");

	const { connect, isConnected, sendMessage } = useWebSocket();
	const gameState = useBattle();
	const { players, gamePhase, attacks, currentQuestion } = gameState;
	
	// Room management
	const roomCode = useRoomCode();
	const isCreator = useIsCreator();
	const { currentRoom, joinRoom: joinRoomAPI } = useRoom();
	const { setGameContext, phase: gamePhase2 } = useGame();

	// Check URL params for room code
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const roomParam = urlParams.get("room");
		
		if (roomParam) {
			setInitialRoomCode(roomParam);
			// Auto-join if room code is provided
			handleRoomJoined(roomParam, false);
		}
	}, []);

	// Connect to WebSocket when room is available
	useEffect(() => {
		if (roomCode) {
			connect(roomCode);
		} else {
			connect();
		}
	}, [connect, roomCode]);

	// Room event handlers
	const handleRoomJoined = async (code: string, creator: boolean) => {
		if (code) {
			try {
				const result = await joinRoomAPI(code);
				if (result.success && result.game) {
					setGameContext(result.game);
					setShowRoomJoin(false);
					setShowRoomSetup(false);
				}
			} catch (error) {
				console.error("Failed to join room:", error);
			}
		} else if (creator) {
			// Show room setup for creating new room
			setShowRoomJoin(false);
			setShowRoomSetup(true);
		}
	};

	const handleRoomCreated = async (roomCode: string) => {
		// Join the newly created room
		try {
			const result = await joinRoomAPI(roomCode);
			if (result.success && result.game) {
				setGameContext(result.game);
				setShowRoomSetup(false);
			}
		} catch (error) {
			console.error("Failed to join created room:", error);
		}
	};

	const handleBackToJoin = () => {
		setShowRoomSetup(false);
		setShowRoomJoin(true);
	};

	const handleLeaveRoom = () => {
		setShowRoomJoin(true);
		setShowRoomSetup(false);
		// Clear URL params
		const url = new URL(window.location.href);
		url.searchParams.delete("room");
		window.history.replaceState({}, "", url.toString());
	};

	// Handle manual battle start
	const handleStartBattle = () => {
		if (isCreator && players.length > 0 && gamePhase === "waiting") {
			sendMessage({
				type: "admin_command",
				data: { command: "start_battle" },
			});
		}
	};

	const handleResetGame = () => {
		if (isCreator) {
			sendMessage({
				type: "admin_command",
				data: { command: "reset_game" },
			});
		}
	};

	// Show room setup interface for creating new room
	if (showRoomSetup) {
		return (
			<div className="w-full h-screen figma-game-background flex items-center justify-center">
				<RoomSetup
					onRoomCreated={handleRoomCreated}
					onCancel={handleBackToJoin}
				/>
			</div>
		);
	}

	// Show room join interface if not in a room
	if (showRoomJoin || !roomCode) {
		return (
			<div className="w-full h-screen figma-game-background flex items-center justify-center">
				<RoomJoin
					onRoomJoined={handleRoomJoined}
					initialRoomCode={initialRoomCode}
				/>
			</div>
		);
	}

	return (
		<div className="w-full h-screen figma-game-background overflow-hidden relative">
			{/* Main battle scene */}
			<BattleScene className="absolute inset-0" />

			{/* Professional MMO-style UI Overlay */}
			<div className="absolute inset-0 pointer-events-none p-2 sm:p-4">
				{/* Top HUD - Battle Status & Question Timer */}
				<div className="absolute top-0 left-0 pointer-events-auto">
					<BattleHUD gameState={{
						...gameState,
						phase: gamePhase as any
					}} isConnected={isConnected} />
				</div>

				{/* Right side - Damage Meter (MMO Style) */}
				<div className="absolute top-0 right-0 w-64 sm:w-80 pointer-events-auto">
					<DamageMeter players={players} attacks={attacks} />
				</div>

				{/* Bottom Left - Combat Log */}
				<div className="absolute bottom-0 left-0 w-72 sm:w-96 pointer-events-auto">
					<CombatLog attacks={attacks} players={players} />
				</div>

				{/* Center - Room Info & Battle Controls */}
				{gamePhase === "waiting" && (
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto max-w-4xl w-full">
						<RoomInfo
							onStartGame={handleStartBattle}
							onLeaveRoom={handleLeaveRoom}
							onResetGame={handleResetGame}
							gamePhase={gamePhase}
						/>
					</div>
				)}

				{gamePhase === "victory" && (
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
						<StatusCard className="p-8 text-center max-w-md" variant="dark">
							<div className="badge-purple mb-4 inline-block">🎉 Vitória</div>
							<h3 className="title-large mb-6">VITÓRIA!</h3>
							<p className="subtitle-red mb-6">A Hidra foi derrotada!</p>
							{players.length > 0 && (
								<div className="text-lg sm:text-2xl text-gray-300 mb-4">
									MVP:{" "}
									<span className="font-bold text-white">
										{players.sort((a, b) => b.score - a.score)[0]?.name}
									</span>
								</div>
							)}
							<FigmaButton
								onClick={handleResetGame}
								className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
							>
								Nova Batalha
							</FigmaButton>
						</StatusCard>
					</div>
				)}

				{gamePhase === "defeat" && (
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
						<StatusCard className="p-8 text-center max-w-md" variant="dark">
							<div className="badge-purple mb-4 inline-block">💀 Derrota</div>
							<h3 className="title-large mb-6">DERROTA</h3>
							<p className="subtitle-red mb-6">A Hidra dominou os heróis...</p>
							<div className="text-lg text-gray-300 mb-4">
								Mais sorte na próxima!
							</div>
							<FigmaButton
								onClick={handleResetGame}
								variant="secondary"
							>
								Tentar Novamente
							</FigmaButton>
						</StatusCard>
					</div>
				)}

				{/* Current Question Display - Figma Style */}
				{gamePhase === "battle" && currentQuestion && (
					<div className="absolute bottom-4 right-4 left-1/2 transform -translate-x-1/2 pointer-events-auto max-w-3xl">
						<StatusCard className="p-6" variant="dark">
							<div className="flex items-center gap-3 mb-4">
								<div className="badge-purple">❓ Questão</div>
								<h4 className="text-xl font-semibold text-white">
									Rodada {currentQuestion.round || 1}
								</h4>
							</div>

							<ParchmentCard className="mb-6">
								<p className="text-gray-800 text-xl leading-relaxed">
									{currentQuestion.question}
								</p>
							</ParchmentCard>

							<div className="grid grid-cols-2 gap-3">
								{currentQuestion.options?.map(
									(option: string, index: number) => (
										<StatusCard
											key={index}
											className="p-4 hover:bg-white/10 transition-colors cursor-pointer"
											variant="transparent"
										>
											<span className="text-gray-200 font-medium">
												{String.fromCharCode(65 + index)}. {option}
											</span>
										</StatusCard>
									),
								)}
							</div>
						</StatusCard>
					</div>
				)}

				{/* Room Info Overlay - Always visible in corner */}
				{roomCode && (
					<div className="absolute top-4 right-4 pointer-events-auto">
						<StatusCard className="p-3 bg-black/60 backdrop-blur-sm" variant="dark">
							<div className="flex items-center gap-2 text-sm">
								<span className="text-gray-400">Sala:</span>
								<span className="font-mono font-bold text-white">
									{roomCode.replace(/(.{3})/, "$1-")}
								</span>
								{isCreator && <span className="text-xs text-blue-400">★</span>}
							</div>
						</StatusCard>
					</div>
				)}
			</div>
		</div>
	);
}
