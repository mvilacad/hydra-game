import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameStats } from "@/features/analytics";
import {
	useRoom,
	useRoomCode,
	useIsCreator,
	useRoomPlayers,
} from "@/lib/stores/useRoom";
import { gameApi } from "@/lib/services";
import type { Player } from "@shared/schema";

interface RoomInfoProps {
	onStartGame?: () => void;
	onLeaveRoom?: () => void;
	onResetGame?: () => void;
	gamePhase?: "waiting" | "battle" | "victory" | "defeat" | "finished";
}

export function RoomInfo({
	onStartGame,
	onLeaveRoom,
	onResetGame,
	gamePhase = "waiting",
}: RoomInfoProps) {
	const roomCode = useRoomCode();
	const isCreator = useIsCreator();
	const players = useRoomPlayers();
	const { currentRoom, leaveRoom } = useRoom();
	const [qrCodeValue, setQrCodeValue] = useState("");
	const [showStats, setShowStats] = useState(false);

	useEffect(() => {
		if (roomCode) {
			// Generate QR code for room joining
			const baseUrl = window.location.origin;
			const roomUrl = `${baseUrl}?view=mobile&room=${roomCode}`;
			setQrCodeValue(roomUrl);
		}
	}, [roomCode]);

	const handleLeaveRoom = () => {
		leaveRoom();
		onLeaveRoom?.();
	};

	const canStartGame =
		isCreator && players.length > 0 && gamePhase === "waiting";
	const canResetGame =
		isCreator &&
		(gamePhase === "victory" ||
			gamePhase === "defeat" ||
			gamePhase === "finished");
	const canViewStats =
		gamePhase === "victory" ||
		gamePhase === "defeat" ||
		gamePhase === "finished";

	if (!roomCode || !currentRoom) {
		return null;
	}

	// Show stats if requested
	if (showStats && currentRoom.id) {
		return (
			<GameStats gameId={currentRoom.id} onClose={() => setShowStats(false)} />
		);
	}

	return (
		<div className="w-full max-w-4xl mx-auto p-6 space-y-6">
			{/* Room Header */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							🏠 Sala: {gameApi.formatRoomCode(roomCode)}
							{isCreator ? (
								<Badge variant="default">Criador</Badge>
							) : (
								<Badge variant="outline">Jogador</Badge>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Badge
								variant={
									gamePhase === "waiting"
										? "secondary"
										: gamePhase === "battle"
											? "destructive"
											: gamePhase === "victory"
												? "default"
												: "outline"
								}
							>
								{gamePhase === "waiting" && "Aguardando"}
								{gamePhase === "battle" && "Em Batalha"}
								{gamePhase === "victory" && "Vitória"}
								{gamePhase === "defeat" && "Derrota"}
								{gamePhase === "finished" && "Finalizada"}
							</Badge>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Game Info */}
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="text-gray-400">Status da Hidra</p>
							<p className="font-medium">
								{currentRoom.hydraHealth}/{currentRoom.maxHydraHealth} HP
							</p>
						</div>
						<div>
							<p className="text-gray-400">Pergunta Atual</p>
							<p className="font-medium">
								{((currentRoom.currentQuestionIndex ?? 0) + 1).toString()}
							</p>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3">
						{canStartGame && (
							<Button onClick={onStartGame} className="flex-1">
								🚀 Iniciar Batalha
							</Button>
						)}

						{canResetGame && (
							<Button
								onClick={onResetGame}
								variant="outline"
								className="flex-1"
							>
								🔄 Nova Batalha
							</Button>
						)}

						{canViewStats && (
							<Button
								onClick={() => setShowStats(true)}
								variant="outline"
								size="sm"
							>
								📊 Stats
							</Button>
						)}

						<Button onClick={handleLeaveRoom} variant="destructive" size="sm">
							🚪 Sair
						</Button>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* QR Code for Mobile Players */}
				{gamePhase === "waiting" && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">📱 Convide Jogadores</CardTitle>
						</CardHeader>
						<CardContent className="text-center space-y-4">
							{qrCodeValue && (
								<div className="flex justify-center">
									<div className="bg-white p-4 rounded-lg">
										{/* QR Code component would go here */}
										<div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
											QR Code
										</div>
									</div>
								</div>
							)}
							<div>
								<p className="text-lg font-mono font-bold mb-2">
									{gameApi.formatRoomCode(roomCode)}
								</p>
								<p className="text-sm text-gray-400">
									Escaneie o QR code ou digite o código no celular
								</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Players List */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							👥 Jogadores ({players.length})
							{currentRoom.configuration && (
								<Badge variant="outline">
									Max: {(currentRoom.configuration as any)?.maxPlayers || 20}
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{players.length === 0 ? (
							<div className="text-center py-8 text-gray-400">
								<p>Nenhum jogador conectado</p>
								<p className="text-sm">
									Compartilhe o código para convidar jogadores
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{players.map((player: Player) => (
									<div
										key={player.id}
										className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
									>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
												{player.character.charAt(0).toUpperCase()}
											</div>
											<div>
												<p className="font-medium">{player.name}</p>
												<p className="text-xs text-gray-400 capitalize">
													{player.character}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant="outline">{player.score} pts</Badge>
											{player.isConnected ? (
												<div className="w-2 h-2 bg-green-500 rounded-full"></div>
											) : (
												<div className="w-2 h-2 bg-gray-500 rounded-full"></div>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
