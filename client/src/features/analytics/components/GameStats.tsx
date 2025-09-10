import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { gameApi } from "@/lib/services";
import type { GameStats as GameStatsType } from "@shared/schema";

interface GameStatsProps {
	gameId: number;
	onClose?: () => void;
}

interface DetailedStats extends GameStatsType {
	playerStats?: Array<{
		playerId: number;
		name: string;
		character: string;
		score: number;
		correctAnswers: number;
		totalAnswers: number;
		averageResponseTime: number;
		totalDamage: number;
	}>;
	questionStats?: Array<{
		questionId: number;
		question: string;
		correctAnswers: number;
		totalAnswers: number;
		averageResponseTime: number;
		difficulty: string;
	}>;
	timelineEvents?: Array<{
		timestamp: string;
		eventType: string;
		playerName?: string;
		description: string;
	}>;
}

export function GameStats({ gameId, onClose }: GameStatsProps) {
	const [stats, setStats] = useState<DetailedStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [exporting, setExporting] = useState(false);

	useEffect(() => {
		loadStats();
	}, [gameId]);

	const loadStats = async () => {
		setLoading(true);
		setError(null);
		
		try {
			const response = await gameApi.getGameStats(gameId);
			
			if (response.success && response.stats) {
				setStats(response.stats as DetailedStats);
			} else {
				setError("Não foi possível carregar as estatísticas");
			}
		} catch (error) {
			console.error("Failed to load stats:", error);
			setError(error instanceof Error ? error.message : "Erro ao carregar estatísticas");
		} finally {
			setLoading(false);
		}
	};

	const handleExport = async (format: "json" | "csv") => {
		setExporting(true);
		
		try {
			const data = await gameApi.exportGameData(gameId, format);
			
			// Create download
			const blob = new Blob([format === "csv" ? data : JSON.stringify(data, null, 2)], {
				type: format === "csv" ? "text/csv" : "application/json",
			});
			
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `game-${gameId}-stats.${format}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Failed to export data:", error);
			setError("Erro ao exportar dados");
		} finally {
			setExporting(false);
		}
	};

	if (loading) {
		return <LoadingScreen title="Carregando Estatísticas..." />;
	}

	if (error) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<Card>
					<CardContent className="p-8 text-center">
						<div className="text-red-400 mb-4">❌ Erro</div>
						<p className="text-gray-300 mb-4">{error}</p>
						<div className="flex gap-3 justify-center">
							<Button onClick={loadStats} variant="outline">
								Tentar Novamente
							</Button>
							{onClose && (
								<Button onClick={onClose}>
									Fechar
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!stats) {
		return null;
	}

	const winRate = (stats.totalAnswers && stats.totalAnswers > 0 && stats.correctAnswers) 
		? (stats.correctAnswers / stats.totalAnswers) * 100 : 0;
	const avgScore = stats.averageScore || 0;

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			{/* Header */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-3">
							📊 Estatísticas da Partida
							<Badge variant={stats.teamWon ? "default" : "destructive"}>
								{stats.teamWon ? "Vitória" : "Derrota"}
							</Badge>
						</CardTitle>
						<div className="flex gap-2">
							<Button
								onClick={() => handleExport("json")}
								disabled={exporting}
								variant="outline"
								size="sm"
							>
								{exporting ? "Exportando..." : "JSON"}
							</Button>
							<Button
								onClick={() => handleExport("csv")}
								disabled={exporting}
								variant="outline"
								size="sm"
							>
								{exporting ? "Exportando..." : "CSV"}
							</Button>
							{onClose && (
								<Button onClick={onClose} variant="outline" size="sm">
									Fechar
								</Button>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{/* Overview Stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
						<div className="text-center">
							<div className="text-2xl font-bold text-white">{stats.totalPlayers}</div>
							<div className="text-sm text-gray-400">Jogadores</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-white">{stats.questionsCount}</div>
							<div className="text-sm text-gray-400">Perguntas</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-white">{Math.round(winRate)}%</div>
							<div className="text-sm text-gray-400">Taxa de Acerto</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-white">
								{stats.duration ? Math.round(stats.duration / 60) : 0}min
							</div>
							<div className="text-sm text-gray-400">Duração</div>
						</div>
					</div>

					{/* Hydra Health */}
					<div className="mb-4">
						<div className="flex justify-between text-sm mb-2">
							<span>Vida da Hidra</span>
							<span>{stats.finalHydraHealth}/1000</span>
						</div>
						<Progress value={(stats.finalHydraHealth / 1000) * 100} className="h-2" />
					</div>
				</CardContent>
			</Card>

			{/* Detailed Stats Tabs */}
			<Tabs defaultValue="players" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="players">👥 Jogadores</TabsTrigger>
					<TabsTrigger value="questions">❓ Perguntas</TabsTrigger>
					<TabsTrigger value="timeline">⏱️ Timeline</TabsTrigger>
				</TabsList>

				{/* Players Tab */}
				<TabsContent value="players" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Performance dos Jogadores</CardTitle>
						</CardHeader>
						<CardContent>
							{stats.playerStats && stats.playerStats.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Jogador</TableHead>
											<TableHead>Classe</TableHead>
											<TableHead>Pontos</TableHead>
											<TableHead>Acertos</TableHead>
											<TableHead>Taxa</TableHead>
											<TableHead>Tempo Médio</TableHead>
											<TableHead>Dano Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{stats.playerStats
											.sort((a, b) => b.score - a.score)
											.map((player, index) => (
												<TableRow key={player.playerId}>
													<TableCell className="font-medium">
														<div className="flex items-center gap-2">
															{index === 0 && <span className="text-yellow-500">👑</span>}
															{player.name}
														</div>
													</TableCell>
													<TableCell>
														<Badge variant="outline" className="capitalize">
															{player.character}
														</Badge>
													</TableCell>
													<TableCell className="font-bold">{player.score}</TableCell>
													<TableCell>
														{player.correctAnswers}/{player.totalAnswers}
													</TableCell>
													<TableCell>
														{player.totalAnswers > 0
															? Math.round((player.correctAnswers / player.totalAnswers) * 100)
															: 0}%
													</TableCell>
													<TableCell>
														{Math.round(player.averageResponseTime / 1000)}s
													</TableCell>
													<TableCell>{player.totalDamage}</TableCell>
												</TableRow>
											))}
									</TableBody>
								</Table>
							) : (
								<div className="text-center py-8 text-gray-400">
									Dados dos jogadores não disponíveis
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Questions Tab */}
				<TabsContent value="questions" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Análise das Perguntas</CardTitle>
						</CardHeader>
						<CardContent>
							{stats.questionStats && stats.questionStats.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Pergunta</TableHead>
											<TableHead>Dificuldade</TableHead>
											<TableHead>Acertos</TableHead>
											<TableHead>Taxa</TableHead>
											<TableHead>Tempo Médio</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{stats.questionStats.map((question) => (
											<TableRow key={question.questionId}>
												<TableCell className="max-w-xs truncate">
													{question.question}
												</TableCell>
												<TableCell>
													<Badge 
														variant={
															question.difficulty === "easy" ? "default" :
															question.difficulty === "medium" ? "secondary" : "destructive"
														}
													>
														{question.difficulty || "N/A"}
													</Badge>
												</TableCell>
												<TableCell>
													{question.correctAnswers}/{question.totalAnswers}
												</TableCell>
												<TableCell>
													{question.totalAnswers > 0
														? Math.round((question.correctAnswers / question.totalAnswers) * 100)
														: 0}%
												</TableCell>
												<TableCell>
													{Math.round(question.averageResponseTime / 1000)}s
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<div className="text-center py-8 text-gray-400">
									Dados das perguntas não disponíveis
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Timeline Tab */}
				<TabsContent value="timeline" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Timeline da Partida</CardTitle>
						</CardHeader>
						<CardContent>
							{stats.timelineEvents && stats.timelineEvents.length > 0 ? (
								<div className="space-y-3 max-h-96 overflow-y-auto">
									{stats.timelineEvents.map((event, index) => (
										<div key={index} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
											<div className="text-xs text-gray-400 min-w-[60px]">
												{new Date(event.timestamp).toLocaleTimeString()}
											</div>
											<div className="flex-1">
												<div className="text-sm font-medium text-white">
													{event.description}
												</div>
												{event.playerName && (
													<div className="text-xs text-gray-400">
														Jogador: {event.playerName}
													</div>
												)}
											</div>
											<Badge variant="outline" className="text-xs">
												{event.eventType}
											</Badge>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8 text-gray-400">
									Timeline não disponível
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}