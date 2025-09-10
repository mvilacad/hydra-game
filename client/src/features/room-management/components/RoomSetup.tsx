import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoom, type RoomConfig } from "@/lib/stores/useRoom";
import { questionsApi } from "@/lib/services";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";

interface RoomSetupProps {
	onRoomCreated?: (roomCode: string) => void;
	onCancel?: () => void;
}

export function RoomSetup({ onRoomCreated, onCancel }: RoomSetupProps) {
	const [config, setConfig] = useState<RoomConfig>({
		questionSet: "default",
		maxQuestions: 10,
		randomOrder: false,
		timeLimit: 30,
		maxPlayers: 20,
		autoStart: false,
	});

	const [questionSets, setQuestionSets] = useState<Array<{ name: string; description: string; questionCount: number }>>([]);
	const [loadingQuestionSets, setLoadingQuestionSets] = useState(false);

	const { createRoom, isLoading, error } = useRoom();

	// Load available question sets on mount
	React.useEffect(() => {
		loadQuestionSets();
	}, []);

	const loadQuestionSets = async () => {
		setLoadingQuestionSets(true);
		try {
			const response = await questionsApi.getQuestionSets();
			if (response.success && response.questionSets && Array.isArray(response.questionSets)) {
				setQuestionSets(response.questionSets);
			} else {
				console.warn("Question sets response is not an array:", response);
				setQuestionSets([]);
			}
		} catch (error) {
			console.error("Failed to load question sets:", error);
			setQuestionSets([]);
		} finally {
			setLoadingQuestionSets(false);
		}
	};

	const handleCreateRoom = async () => {
		try {
			const result = await createRoom(config);
			
			if (result.success && result.game) {
				onRoomCreated?.(result.game.code);
			}
		} catch (error) {
			console.error("Failed to create room:", error);
		}
	};

	const updateConfig = (updates: Partial<RoomConfig>) => {
		setConfig(prev => ({ ...prev, ...updates }));
	};

	if (isLoading) {
		return <LoadingScreen title="Criando Sala..." message="Configurando sua batalha épica..." />;
	}

	return (
		<div className="w-full max-w-2xl mx-auto p-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						🏠 Configurar Nova Sala
						<Badge variant="outline">Criador</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{error && (
						<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-red-400 text-sm">{error}</p>
						</div>
					)}

					{/* Question Set Selection */}
					<div className="space-y-2">
						<Label htmlFor="questionSet">Conjunto de Perguntas</Label>
						{loadingQuestionSets ? (
							<div className="h-10 bg-gray-700 animate-pulse rounded-md" />
						) : (
							<Select 
								value={config.questionSet} 
								onValueChange={(value) => updateConfig({ questionSet: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecione um conjunto de perguntas" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="default">Padrão (Geral)</SelectItem>
									{Array.isArray(questionSets) && questionSets.map((set) => (
										<SelectItem key={set.name} value={set.name}>
											{set.description} ({set.questionCount} perguntas)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>

					{/* Max Questions */}
					<div className="space-y-2">
						<Label>Máximo de Perguntas: {config.maxQuestions}</Label>
						<Slider
							value={[config.maxQuestions || 10]}
							onValueChange={([value]) => updateConfig({ maxQuestions: value })}
							min={1}
							max={50}
							step={1}
							className="w-full"
						/>
					</div>

					{/* Time Limit */}
					<div className="space-y-2">
						<Label>Tempo por Pergunta: {config.timeLimit}s</Label>
						<Slider
							value={[config.timeLimit || 30]}
							onValueChange={([value]) => updateConfig({ timeLimit: value })}
							min={5}
							max={120}
							step={5}
							className="w-full"
						/>
					</div>

					{/* Max Players */}
					<div className="space-y-2">
						<Label>Máximo de Jogadores: {config.maxPlayers}</Label>
						<Slider
							value={[config.maxPlayers || 20]}
							onValueChange={([value]) => updateConfig({ maxPlayers: value })}
							min={1}
							max={50}
							step={1}
							className="w-full"
						/>
					</div>

					{/* Advanced Options */}
					<div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
						<h4 className="text-sm font-medium text-gray-300">Opções Avançadas</h4>
						
						<div className="flex items-center justify-between">
							<div>
								<Label htmlFor="randomOrder">Ordem Aleatória</Label>
								<p className="text-xs text-gray-400">Embaralhar perguntas</p>
							</div>
							<Switch
								id="randomOrder"
								checked={config.randomOrder}
								onCheckedChange={(checked) => updateConfig({ randomOrder: checked })}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<Label htmlFor="autoStart">Início Automático</Label>
								<p className="text-xs text-gray-400">Iniciar quando jogadores entrarem</p>
							</div>
							<Switch
								id="autoStart"
								checked={config.autoStart}
								onCheckedChange={(checked) => updateConfig({ autoStart: checked })}
							/>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4">
						{onCancel && (
							<Button variant="outline" onClick={onCancel} className="flex-1">
								Cancelar
							</Button>
						)}
						<Button 
							onClick={handleCreateRoom} 
							disabled={isLoading}
							className="flex-1"
						>
							{isLoading ? "Criando..." : "Criar Sala"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}