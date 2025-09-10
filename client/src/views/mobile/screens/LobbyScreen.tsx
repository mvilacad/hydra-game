import React from "react";
import { StatusCard } from "@/components/figma-ui";

interface LobbyScreenProps {
	playerName: string;
	characterId: string;
	roomCode?: string;
	playersCount?: number;
	maxPlayers?: number;
}

export function LobbyScreen({
	playerName,
	characterId,
	roomCode,
	playersCount = 1,
	maxPlayers = 20,
}: LobbyScreenProps) {
	const getCharacterEmoji = (id: string) => {
		switch (id) {
			case "warrior": return "⚔️";
			case "mage": return "🧙‍♂️";
			case "archer": return "🏹";
			case "paladin": return "🛡️";
			default: return "❓";
		}
	};

	const getCharacterName = (id: string) => {
		switch (id) {
			case "warrior": return "Guerreiro";
			case "mage": return "Mago";
			case "archer": return "Arqueiro";
			case "paladin": return "Paladino";
			default: return "Desconhecido";
		}
	};

	return (
		<div className="figma-game-background flex flex-col items-center justify-center h-screen p-6">
			{/* Main character display */}
			<div className="flex-1 flex flex-col items-center justify-center">
				{/* Character avatar */}
				<div className="w-48 h-48 mb-8 bg-gradient-to-b from-amber-600/20 to-amber-900/40 rounded-lg flex items-center justify-center border border-amber-500/30">
					<div className="text-center">
						<div className="text-8xl mb-2">
							{getCharacterEmoji(characterId)}
						</div>
						<div className="text-amber-300 text-sm font-medium">
							{getCharacterName(characterId)}
						</div>
					</div>
				</div>

				{/* Player name */}
				<StatusCard className="px-6 py-4 mb-6" variant="dark">
					<div className="text-center">
						<h2 className="figma-subtitle text-white mb-1">
							{playerName}
						</h2>
						<p className="text-gray-400 text-sm">
							{getCharacterName(characterId)}
						</p>
					</div>
				</StatusCard>

				{/* Room info */}
				{roomCode && (
					<StatusCard className="px-6 py-3 mb-6" variant="transparent">
						<div className="text-center">
							<p className="text-gray-300 text-sm">Sala</p>
							<p className="text-white font-mono font-bold text-lg">
								{roomCode}
							</p>
						</div>
					</StatusCard>
				)}

				{/* Players count */}
				<StatusCard className="px-6 py-3 mb-8" variant="default">
					<div className="text-center">
						<p className="text-gray-300 text-sm">Jogadores</p>
						<p className="text-white font-bold">
							{playersCount} / {maxPlayers}
						</p>
					</div>
				</StatusCard>
			</div>

			{/* Status indicator */}
			<div className="pb-safe">
				<StatusCard className="px-8 py-4" variant="dark">
					<div className="flex items-center justify-center gap-3">
						<div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
						<span className="figma-status-waiting">
							AGUARDANDO...
						</span>
					</div>
				</StatusCard>
			</div>
		</div>
	);
}