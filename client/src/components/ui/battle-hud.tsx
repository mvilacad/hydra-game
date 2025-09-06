import { type GameState, Player } from "@shared/types";
import {
	Activity,
	AlertTriangle,
	Clock,
	Heart,
	Shield,
	Sword,
	Target,
	TrendingUp,
	Users,
	Wifi,
	WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

interface BattleHUDProps {
	gameState: GameState;
	isConnected: boolean;
	className?: string;
}

export function BattleHUD({
	gameState,
	isConnected,
	className,
}: BattleHUDProps) {
	const {
		phase,
		players,
		hydraHealth,
		maxHydraHealth,
		currentQuestion,
		questionTimeLeft,
	} = gameState;

	const healthPercent = (hydraHealth / maxHydraHealth) * 100;
	const totalDamageDealt = maxHydraHealth - hydraHealth;
	const activePlayers = players.filter((p) => p.isConnected).length;
	const averageScore =
		players.length > 0
			? players.reduce((sum, p) => sum + p.score, 0) / players.length
			: 0;

	const getPhaseInfo = (phase: string) => {
		switch (phase) {
			case "waiting":
				return {
					label: "Aguardando",
					color: "text-yellow-400",
					bgColor: "bg-yellow-400/10",
					borderColor: "border-yellow-400/20",
					icon: <Clock className="w-5 h-5" />,
				};
			case "battle":
				return {
					label: "Em Batalha",
					color: "text-red-400",
					bgColor: "bg-red-400/10",
					borderColor: "border-red-400/20",
					icon: <Sword className="w-5 h-5" />,
				};
			case "victory":
				return {
					label: "Vitória!",
					color: "text-green-400",
					bgColor: "bg-green-400/10",
					borderColor: "border-green-400/20",
					icon: <Target className="w-5 h-5" />,
				};
			case "defeat":
				return {
					label: "Derrota",
					color: "text-gray-400",
					bgColor: "bg-gray-400/10",
					borderColor: "border-gray-400/20",
					icon: <AlertTriangle className="w-5 h-5" />,
				};
			default:
				return {
					label: phase,
					color: "text-gray-400",
					bgColor: "bg-gray-400/10",
					borderColor: "border-gray-400/20",
					icon: <Activity className="w-5 h-5" />,
				};
		}
	};

	const phaseInfo = getPhaseInfo(phase);

	return (
		<div className={cn("flex gap-4", className)}>
			{/* Main Battle Status */}
			<Card className="bg-gray-900/95 border-gray-700/50 backdrop-blur-sm">
				<CardContent className="p-4">
					<div className="flex items-center gap-3 mb-4">
						<div
							className={cn(
								"p-2 rounded-lg border",
								phaseInfo.bgColor,
								phaseInfo.borderColor,
							)}
						>
							<div className={phaseInfo.color}>{phaseInfo.icon}</div>
						</div>
						<div>
							<h3 className="font-bold text-white text-lg">
								Status da Batalha
							</h3>
							<p className={cn("font-medium", phaseInfo.color)}>
								{phaseInfo.label}
							</p>
						</div>
					</div>

					{/* Hydra Health Bar */}
					<div className="mb-4">
						<div className="flex justify-between items-center mb-2">
							<span className="text-sm font-medium text-red-400 flex items-center gap-1">
								<Heart className="w-4 h-4" />
								Vida da Hidra
							</span>
							<span className="text-sm text-white font-mono">
								{hydraHealth.toLocaleString()} /{" "}
								{maxHydraHealth.toLocaleString()}
							</span>
						</div>
						<div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
							<div
								className={cn(
									"h-full transition-all duration-500 relative",
									healthPercent > 60
										? "bg-gradient-to-r from-red-500 to-red-600"
										: healthPercent > 30
											? "bg-gradient-to-r from-orange-500 to-red-500"
											: "bg-gradient-to-r from-yellow-500 to-orange-500",
								)}
								style={{ width: `${healthPercent}%` }}
							>
								<div className="absolute inset-0 bg-white/20 animate-pulse" />
							</div>
						</div>
						<div className="flex justify-between text-xs text-gray-400 mt-1">
							<span>{healthPercent.toFixed(1)}% restante</span>
							<span>{totalDamageDealt.toLocaleString()} dano causado</span>
						</div>
					</div>

					{/* Quick Stats Grid */}
					<div className="grid grid-cols-2 gap-3">
						<div className="bg-gray-800/30 p-3 rounded border border-gray-700/30">
							<div className="flex items-center gap-2 mb-1">
								<Users className="w-4 h-4 text-blue-400" />
								<span className="text-xs text-gray-400">Heróis Ativos</span>
							</div>
							<div className="text-lg font-bold text-white">
								{activePlayers}
							</div>
							<div className="text-xs text-gray-500">
								{players.length} total
							</div>
						</div>

						<div className="bg-gray-800/30 p-3 rounded border border-gray-700/30">
							<div className="flex items-center gap-2 mb-1">
								<TrendingUp className="w-4 h-4 text-green-400" />
								<span className="text-xs text-gray-400">Score Médio</span>
							</div>
							<div className="text-lg font-bold text-white">
								{averageScore.toFixed(0)}
							</div>
							<div className="text-xs text-gray-500">pontos</div>
						</div>
					</div>

					{/* Connection Status */}
					<div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700/30">
						{isConnected ? (
							<>
								<Wifi className="w-4 h-4 text-green-400" />
								<span className="text-sm text-green-400">Conectado</span>
								<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto" />
							</>
						) : (
							<>
								<WifiOff className="w-4 h-4 text-red-400" />
								<span className="text-sm text-red-400">Desconectado</span>
								<div className="w-2 h-2 bg-red-400 rounded-full ml-auto" />
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Question Timer (when in battle) */}
			{phase === "battle" && currentQuestion && (
				<Card className="bg-gray-900/95 border-blue-500/30 backdrop-blur-sm">
					<CardContent className="p-4">
						<div className="flex items-center gap-3 mb-3">
							<div className="p-2 rounded-lg bg-blue-400/10 border border-blue-400/20">
								<Clock className="w-5 h-5 text-blue-400" />
							</div>
							<div>
								<h3 className="font-bold text-white">Pergunta Ativa</h3>
								<p className="text-sm text-blue-400">
									Rodada {currentQuestion.round || 1}
								</p>
							</div>
						</div>

						{/* Circular Timer */}
						<div className="relative w-16 h-16 mx-auto mb-3">
							<svg
								className="w-16 h-16 transform -rotate-90"
								viewBox="0 0 64 64"
							>
								<circle
									cx="32"
									cy="32"
									r="28"
									stroke="currentColor"
									strokeWidth="4"
									fill="none"
									className="text-gray-700"
								/>
								<circle
									cx="32"
									cy="32"
									r="28"
									stroke="currentColor"
									strokeWidth="4"
									fill="none"
									strokeDasharray={`${2 * Math.PI * 28}`}
									strokeDashoffset={`${2 * Math.PI * 28 * (1 - questionTimeLeft / 30)}`}
									className="text-blue-400 transition-all duration-1000"
									strokeLinecap="round"
								/>
							</svg>
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="text-xl font-bold text-white">
									{questionTimeLeft}
								</span>
							</div>
						</div>

						<div className="text-center">
							<div className="text-xs text-gray-400 mb-1">Tipo de Ataque</div>
							<div className="text-sm font-medium text-blue-400 capitalize">
								{currentQuestion.type}
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
