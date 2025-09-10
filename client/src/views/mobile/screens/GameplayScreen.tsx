import React, { useState, useEffect } from "react";
import { 
	ParchmentCard, 
	QuestionOptions, 
	TimerDisplay, 
	HealthBar,
	StatusCard 
} from "@/components/figma-ui";

interface GameplayScreenProps {
	question: {
		id: string;
		text: string;
		options: Array<{
			id: string;
			text: string;
			isCorrect?: boolean;
		}>;
		round?: number;
		totalRounds?: number;
	};
	timeLeft: number;
	hydraHealth: number;
	maxHydraHealth: number;
	playerName: string;
	playerScore: number;
	characterId: string;
	onAnswerSelect: (optionId: string) => void;
	selectedAnswer?: string;
	showResults?: boolean;
	gamePhase: "waiting" | "question" | "results";
}

export function GameplayScreen({
	question,
	timeLeft,
	hydraHealth,
	maxHydraHealth,
	playerName,
	playerScore,
	characterId,
	onAnswerSelect,
	selectedAnswer,
	showResults = false,
	gamePhase,
}: GameplayScreenProps) {
	const [currentPhase, setCurrentPhase] = useState(gamePhase);

	useEffect(() => {
		setCurrentPhase(gamePhase);
	}, [gamePhase]);

	const getCharacterEmoji = (id: string) => {
		switch (id) {
			case "warrior": return "⚔️";
			case "mage": return "🧙‍♂️";
			case "archer": return "🏹";
			case "paladin": return "🛡️";
			default: return "❓";
		}
	};

	// Round start phase
	if (currentPhase === "waiting") {
		return (
			<div className="figma-game-background flex flex-col h-screen p-4">
				{/* Header with Hydra health and timer */}
				<div className="flex items-center justify-between mb-4">
					<div className="w-16 h-16 bg-purple-900/50 rounded-lg flex items-center justify-center border border-purple-500/30">
						<span className="text-2xl">🐉</span>
					</div>
					<div className="flex-1 mx-4">
						<HealthBar
							currentHealth={hydraHealth}
							maxHealth={maxHydraHealth}
							label="Backlog"
							showValues={false}
						/>
					</div>
				</div>

				<TimerDisplay timeLeft={timeLeft} className="mb-4" />

				<div className="flex items-center justify-center mb-4">
					<StatusCard className="px-4 py-2" variant="dark">
						<span className="text-sm text-gray-300">
							Pergunta {question.round || 1}/{question.totalRounds || 10}
						</span>
					</StatusCard>
				</div>

				{/* Main content - Round start */}
				<div className="flex-1 flex items-center justify-center mb-6">
					<ParchmentCard className="w-full max-w-sm">
						<div className="text-center py-8">
							<p className="text-gray-600 text-sm mb-2">Iniciando</p>
							<h1 className="text-purple-600 text-4xl font-bold mb-4">
								RODADA
							</h1>
						</div>
					</ParchmentCard>
				</div>

				{/* Player info at bottom */}
				<div className="flex items-center gap-3 pb-safe">
					<div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600">
						<span className="text-2xl">{getCharacterEmoji(characterId)}</span>
					</div>
					<div className="flex-1">
						<StatusCard className="px-4 py-2" variant="dark">
							<div className="flex items-center justify-between">
								<span className="text-white font-medium">{playerName}</span>
								<div className="flex items-center gap-2">
									<span className="text-xs text-gray-400">⚔️</span>
									<span className="text-red-400 font-bold">{playerScore}</span>
								</div>
							</div>
						</StatusCard>
					</div>
				</div>
			</div>
		);
	}

	// Question phase
	return (
		<div className="figma-game-background flex flex-col h-screen p-4">
			{/* Header with Hydra health and timer */}
			<div className="flex items-center justify-between mb-4">
				<div className="w-16 h-16 bg-purple-900/50 rounded-lg flex items-center justify-center border border-purple-500/30">
					<span className="text-2xl">🐉</span>
				</div>
				<div className="flex-1 mx-4">
					<HealthBar
						currentHealth={hydraHealth}
						maxHealth={maxHydraHealth}
						label="Backlog"
						showValues={false}
					/>
				</div>
			</div>

			<TimerDisplay 
				timeLeft={timeLeft} 
				className="mb-4"
				variant={timeLeft <= 10 ? "danger" : "default"}
			/>

			<div className="flex items-center justify-center mb-4">
				<StatusCard className="px-4 py-2" variant="dark">
					<span className="text-sm text-gray-300">
						Pergunta {question.round || 1}/{question.totalRounds || 10}
					</span>
				</StatusCard>
			</div>

			{/* Question content */}
			<div className="flex-1 overflow-y-auto mb-6">
				<ParchmentCard className="mb-6">
					<div className="py-4">
						<p className="text-gray-800 text-lg font-medium leading-relaxed">
							{question.text}
						</p>
					</div>
				</ParchmentCard>

				{/* Options */}
				<QuestionOptions
					options={question.options}
					onSelect={onAnswerSelect}
					selectedOption={selectedAnswer}
					showCorrect={showResults}
					disabled={showResults || timeLeft <= 0}
				/>

				{/* Results feedback */}
				{showResults && selectedAnswer && (
					<div className="mt-6">
						{question.options.find(opt => opt.id === selectedAnswer)?.isCorrect ? (
							<StatusCard className="p-4 bg-green-600/20 border-green-500" variant="transparent">
								<div className="text-center">
									<p className="text-green-100 font-bold text-lg mb-2">
										RESPOSTA CORRETA!
									</p>
									<div className="flex items-center justify-center gap-2">
										<span className="text-xs">⚔️</span>
										<span className="text-green-400 font-bold text-xl">+1000</span>
									</div>
								</div>
							</StatusCard>
						) : (
							<StatusCard className="p-4 bg-red-600/20 border-red-500" variant="transparent">
								<div className="text-center">
									<p className="text-red-100 font-bold text-lg mb-2">
										RESPOSTA INCORRETA!
									</p>
									<div className="flex items-center justify-center gap-2">
										<span className="text-red-400 font-bold text-xl">0</span>
									</div>
								</div>
							</StatusCard>
						)}
					</div>
				)}
			</div>

			{/* Player info at bottom */}
			<div className="flex items-center gap-3 pb-safe">
				<div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600">
					<span className="text-2xl">{getCharacterEmoji(characterId)}</span>
				</div>
				<div className="flex-1">
					<StatusCard className="px-4 py-2" variant="dark">
						<div className="flex items-center justify-between">
							<span className="text-white font-medium">{playerName}</span>
							<div className="flex items-center gap-2">
								<span className="text-xs text-gray-400">⚔️</span>
								<span className="text-red-400 font-bold">{playerScore}</span>
							</div>
						</div>
					</StatusCard>
				</div>
			</div>
		</div>
	);
}