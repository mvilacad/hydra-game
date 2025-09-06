import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Clock,
	CheckCircle,
	XCircle,
	Sword,
	Zap,
	Target,
	Shield,
	Flame,
	Sparkles,
} from "lucide-react";

interface QuestionProps {
	question: {
		id: string;
		question: string;
		options: string[];
		correct: string;
		type: "sword" | "arrow" | "magic" | "fire";
	} | null;
	onAnswer: (answer: string) => void;
	timeLeft: number;
	character?: string;
}

export default function Question({
	question,
	onAnswer,
	timeLeft,
	character = "warrior",
}: QuestionProps) {
	const [selectedAnswer, setSelectedAnswer] = useState<string>("");
	const [hasAnswered, setHasAnswered] = useState(false);
	const [showFeedback, setShowFeedback] = useState(false);
	const [currentTimeLeft, setCurrentTimeLeft] = useState(timeLeft);

	// Reset state when question changes
	useEffect(() => {
		if (question?.id) {
			setSelectedAnswer("");
			setHasAnswered(false);
			setShowFeedback(false);
			setCurrentTimeLeft(30);
		}
	}, [question?.id]);

	// Timer countdown
	useEffect(() => {
		if (!hasAnswered && currentTimeLeft > 0) {
			const timer = setTimeout(() => {
				setCurrentTimeLeft((prev) => prev - 1);
			}, 1000);
			return () => clearTimeout(timer);
		} else if (!hasAnswered && currentTimeLeft <= 0) {
			// Auto submit when time runs out
			handleAnswerSelect("");
		}
	}, [currentTimeLeft, hasAnswered]);

	// Don't render if no question
	if (!question) {
		return null;
	}

	const handleAnswerSelect = (answer: string) => {
		if (hasAnswered) return;

		setSelectedAnswer(answer);
		setHasAnswered(true);
		setShowFeedback(true);

		// Show feedback briefly before submitting
		setTimeout(() => {
			onAnswer(answer);
		}, 1000);
	};

	const getCharacterTheme = (character: string) => {
		switch (character) {
			case "warrior":
				return {
					name: "Guerreiro",
					primary: "from-orange-600 to-red-600",
					secondary: "from-orange-900/80 to-red-900/80",
					accent: "text-orange-400",
					border: "border-orange-500/40",
					glow: "shadow-orange-500/30",
					icon: Sword,
					bgPattern:
						"bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent",
				};
			case "mage":
				return {
					name: "Mago",
					primary: "from-blue-600 to-purple-600",
					secondary: "from-blue-900/80 to-purple-900/80",
					accent: "text-blue-400",
					border: "border-blue-500/40",
					glow: "shadow-blue-500/30",
					icon: Zap,
					bgPattern:
						"bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-purple-500/5 to-transparent",
				};
			case "archer":
				return {
					name: "Arqueiro",
					primary: "from-green-600 to-emerald-600",
					secondary: "from-green-900/80 to-emerald-900/80",
					accent: "text-green-400",
					border: "border-green-500/40",
					glow: "shadow-green-500/30",
					icon: Target,
					bgPattern:
						"bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent",
				};
			case "paladin":
				return {
					name: "Paladino",
					primary: "from-yellow-600 to-amber-600",
					secondary: "from-yellow-900/80 to-amber-900/80",
					accent: "text-yellow-400",
					border: "border-yellow-500/40",
					glow: "shadow-yellow-500/30",
					icon: Shield,
					bgPattern:
						"bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent",
				};
			default:
				return {
					name: "Herói",
					primary: "from-gray-600 to-gray-700",
					secondary: "from-gray-800/80 to-gray-900/80",
					accent: "text-gray-400",
					border: "border-gray-500/40",
					glow: "shadow-gray-500/30",
					icon: Sword,
					bgPattern:
						"bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-500/10 via-transparent to-transparent",
				};
		}
	};

	const getAttackTypeInfo = (type: string) => {
		switch (type) {
			case "sword":
				return { name: "Golpe Devastador", icon: Sword, effect: "Dano Físico" };
			case "arrow":
				return {
					name: "Tiro Certeiro",
					icon: Target,
					effect: "Dano Perfurante",
				};
			case "magic":
				return {
					name: "Feitiço Arcano",
					icon: Sparkles,
					effect: "Dano Mágico",
				};
			case "fire":
				return {
					name: "Chamas Ardentes",
					icon: Flame,
					effect: "Dano Elemental",
				};
			default:
				return { name: "Ataque Especial", icon: Zap, effect: "Dano Crítico" };
		}
	};

	const theme = getCharacterTheme(character);
	const attackInfo = getAttackTypeInfo(question.type);
	const isCorrect = selectedAnswer === question.correct;
	const CharacterIcon = theme.icon;
	const AttackIcon = attackInfo.icon;

	return (
		<div
			className={cn(
				"h-screen flex flex-col relative overflow-hidden",
				theme.bgPattern,
			)}
		>
			{/* Background Effects - Subtle */}
			<div className="absolute inset-0 opacity-10">
				<div
					className={cn(
						"absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-2xl",
						`bg-gradient-to-br ${theme.primary}`,
					)}
				/>
				<div
					className={cn(
						"absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full blur-2xl",
						`bg-gradient-to-tl ${theme.primary}`,
					)}
				/>
			</div>

			{/* Top: Timer and Character Info */}
			<div className="relative z-10 p-3">
				<div
					className={cn(
						"flex items-center justify-between p-4 rounded-xl",
						`bg-gradient-to-r ${theme.secondary}`,
						theme.border,
						"backdrop-blur-sm border",
					)}
				>
					<div className="flex items-center gap-3">
						<div
							className={cn(
								"w-12 h-12 rounded-lg flex items-center justify-center",
								`bg-gradient-to-br ${theme.primary}`,
							)}
						>
							<CharacterIcon className="w-6 h-6 text-white" />
						</div>
						<div>
							<div className="text-white font-bold text-lg">{theme.name}</div>
							<div className={cn("text-sm", theme.accent)}>
								{attackInfo.name}
							</div>
						</div>
					</div>

					<div
						className={cn(
							"px-4 py-2 rounded-lg",
							`bg-gradient-to-r ${theme.primary}`,
							currentTimeLeft <= 10 ? "animate-pulse" : "",
						)}
					>
						<div
							className={cn(
								"text-white font-mono text-2xl font-bold",
								currentTimeLeft <= 5 ? "text-red-200" : "",
							)}
						>
							{currentTimeLeft}s
						</div>
					</div>
				</div>
			</div>

			{/* Middle: Question */}
			<div className="flex-1 px-3 pb-2">
				<div
					className={cn(
						"h-full flex flex-col p-4 rounded-xl",
						`bg-gradient-to-br ${theme.secondary}`,
						theme.border,
						"backdrop-blur-sm border",
					)}
				>
					<div className="text-center mb-4">
						<h2 className="text-white text-xl font-bold leading-tight">
							{question.question}
						</h2>
					</div>

					{/* Answer Options - Compact */}
					<div className="flex-1 space-y-3">
						{question.options.map((option, index) => {
							const letter = String.fromCharCode(65 + index);
							const isSelected = selectedAnswer === option;
							const isCorrectAnswer = option === question.correct;

							let buttonClass =
								"w-full p-4 text-left border-2 rounded-lg transition-all duration-200 flex items-center gap-3 ";

							if (!hasAnswered) {
								buttonClass += isSelected
									? `${theme.border} bg-gradient-to-r ${theme.primary} text-white shadow-lg`
									: "border-gray-600 bg-black/20 text-white hover:border-gray-400";
							} else if (showFeedback) {
								if (isCorrectAnswer) {
									buttonClass +=
										"border-green-500 bg-gradient-to-r from-green-600/80 to-green-500/80 text-white";
								} else if (isSelected && !isCorrectAnswer) {
									buttonClass +=
										"border-red-500 bg-gradient-to-r from-red-600/80 to-red-500/80 text-white";
								} else {
									buttonClass += "border-gray-700 bg-black/10 text-gray-500";
								}
							}

							return (
								<Button
									key={index}
									onClick={() => handleAnswerSelect(option)}
									disabled={hasAnswered}
									className={buttonClass}
									variant="ghost"
								>
									<div
										className={cn(
											"w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold",
											isSelected || (hasAnswered && isCorrectAnswer)
												? "border-white bg-white/20"
												: "border-current",
										)}
									>
										{letter}
									</div>
									<span className="font-medium flex-1">{option}</span>

									{/* Result Icons */}
									{hasAnswered && showFeedback && (
										<>
											{isCorrectAnswer && (
												<CheckCircle className="w-5 h-5 text-green-400" />
											)}
											{isSelected && !isCorrectAnswer && (
												<XCircle className="w-5 h-5 text-red-400" />
											)}
										</>
									)}
								</Button>
							);
						})}
					</div>

					{/* Feedback Message - Compact */}
					{showFeedback && (
						<div className="mt-4 text-center">
							<div
								className={cn(
									"inline-flex items-center gap-3 px-4 py-2 rounded-lg font-bold",
									isCorrect
										? "bg-green-600/90 text-white border border-green-400"
										: "bg-red-600/90 text-white border border-red-400",
								)}
							>
								{isCorrect ? (
									<>
										<CheckCircle className="w-5 h-5" />
										<span>🎯 Acertou!</span>
									</>
								) : (
									<>
										<XCircle className="w-5 h-5" />
										<span>💥 Errou!</span>
									</>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
