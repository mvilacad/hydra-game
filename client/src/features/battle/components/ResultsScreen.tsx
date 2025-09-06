import { Card, CardContent } from "@/components/ui/card";
import { CharacterIcon, useCharacterTheme } from "@/features/characters";
import { cn } from "@/lib/utils";
import type { CharacterType } from "@/features/characters";

import type { Player } from "@shared/types";

interface ResultsScreenProps {
	character: CharacterType;
	players: Player[];
	currentPlayerId: string;
	hydraHealth: number;
	maxHydraHealth: number;
	className?: string;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
	character,
	players,
	currentPlayerId,
	hydraHealth,
	maxHydraHealth,
	className,
}) => {
	const theme = useCharacterTheme(character);
	const currentPlayerData = players.find((p) => p.id === currentPlayerId);
	const sortedPlayers = players.sort((a, b) => b.score - a.score);
	const isTopPlayer = sortedPlayers[0]?.id === currentPlayerId;
	const playerRank =
		sortedPlayers.findIndex((p) => p.id === currentPlayerId) + 1;

	return (
		<div
			className={cn(
				"h-screen relative overflow-hidden flex items-center justify-center p-4",
				theme.bgPattern,
				className,
			)}
		>
			{/* Background Effects */}
			<div className="absolute inset-0 opacity-20">
				<div
					className={cn(
						"absolute top-20 left-20 w-48 h-48 rounded-full blur-3xl",
						`bg-gradient-to-br ${theme.primary}`,
					)}
				/>
				<div
					className={cn(
						"absolute bottom-20 right-20 w-64 h-64 rounded-full blur-3xl",
						`bg-gradient-to-tl ${theme.primary}`,
					)}
				/>
			</div>

			<Card
				className={cn(
					"w-full max-w-md backdrop-blur-xl border-2 relative z-10",
					`bg-gradient-to-br ${theme.secondary}`,
					theme.border,
					theme.glow,
					"shadow-2xl",
				)}
			>
				<CardContent className="p-8 text-center">
					{/* Character Success/Status */}
					<div className="mb-6">
						<CharacterIcon
							character={character}
							size="lg"
							className="mx-auto mb-4"
						/>

						<h2
							className={cn(
								"text-3xl font-bold mb-2",
								isTopPlayer ? "text-yellow-400" : "text-white",
							)}
						>
							{isTopPlayer ? "🏆 LIDERANDO!" : "⚔️ BATALHA CONTINUA!"}
						</h2>

						<p className="text-xl text-gray-300">
							{isTopPlayer
								? "Você está dominando a batalha!"
								: "Aguardando próxima pergunta..."}
						</p>
					</div>

					{/* Player Stats */}
					<div
						className={cn(
							"p-4 rounded-xl mb-6",
							`bg-gradient-to-r ${theme.primary}`,
							"bg-opacity-20 backdrop-blur-sm",
						)}
					>
						<div className="flex items-center justify-between text-white">
							<div>
								<div className="text-sm opacity-80">Seu Score</div>
								<div className="text-2xl font-bold">
									{currentPlayerData?.score || 0}
								</div>
							</div>
							<div className="text-right">
								<div className="text-sm opacity-80">Posição</div>
								<div className="text-2xl font-bold">#{playerRank}</div>
							</div>
						</div>
					</div>

					{/* Mini Ranking - Top 3 */}
					<div className="mb-6">
						<h3 className="text-white font-bold mb-3 text-lg">🏆 Top Heróis</h3>
						<div className="space-y-2">
							{sortedPlayers.slice(0, 3).map((player, index) => (
								<div
									key={player.id}
									className={cn(
										"flex items-center gap-3 p-3 rounded-lg",
										player.id === currentPlayerId
											? `bg-gradient-to-r ${theme.primary} shadow-lg`
											: "bg-black/20 backdrop-blur-sm",
									)}
								>
									<div
										className={cn(
											"w-8 h-8 rounded-full flex items-center justify-center font-bold",
											index === 0
												? "bg-yellow-500 text-black"
												: index === 1
													? "bg-gray-400 text-black"
													: "bg-amber-600 text-white",
										)}
									>
										{index + 1}
									</div>
									<div className="flex-1 text-left">
										<div className="text-white font-semibold">
											{player.name}
										</div>
										<div className={cn("text-xs capitalize", theme.accent)}>
											{player.character}
										</div>
									</div>
									<div className="text-white font-bold">{player.score}</div>
								</div>
							))}
						</div>
					</div>

					{/* Hydra Health */}
					<div className="p-4 bg-red-900/30 border border-red-500/40 rounded-xl backdrop-blur-sm">
						<div className="flex items-center justify-between mb-2">
							<span className="text-red-400 font-semibold">
								🐉 Vida da Hidra
							</span>
							<span className="text-white font-bold">
								{hydraHealth} / {maxHydraHealth}
							</span>
						</div>

						<div className="w-full h-3 bg-black/30 rounded-full overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700 ease-out"
								style={{ width: `${(hydraHealth / maxHydraHealth) * 100}%` }}
							/>
						</div>

						<div className="mt-2 text-center">
							<span
								className={cn(
									"text-sm font-semibold",
									hydraHealth <= maxHydraHealth * 0.3
										? "text-red-400"
										: hydraHealth <= maxHydraHealth * 0.6
											? "text-yellow-400"
											: "text-green-400",
								)}
							>
								{hydraHealth <= maxHydraHealth * 0.3
									? "🔥 CRÍTICA!"
									: hydraHealth <= maxHydraHealth * 0.6
										? "⚠️ FERIDA"
										: "💪 FORTE"}
							</span>
						</div>
					</div>

					{/* Battle Status */}
					<div className="mt-6">
						<div
							className={cn(
								"inline-flex items-center gap-2 px-4 py-2 rounded-full",
								`bg-gradient-to-r ${theme.primary}`,
								"animate-pulse",
							)}
						>
							<div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
							<span className="text-white font-semibold text-sm">
								Preparando próximo ataque...
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
