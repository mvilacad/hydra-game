import { Card, CardContent } from "@/components/ui/card";
import { CharacterDisplay } from "@/features/characters";
import { cn } from "@/lib/utils";
import type { CharacterType } from "@/features/characters";

interface PreparationScreenProps {
	character: CharacterType;
	playerName: string;
	countdown: number;
	className?: string;
}

export const PreparationScreen: React.FC<PreparationScreenProps> = ({
	character,
	playerName,
	countdown,
	className,
}) => {
	return (
		<div
			className={cn(
				"min-h-screen relative overflow-hidden flex items-center justify-center p-4",
				className,
			)}
		>
			<Card className="w-full max-w-md backdrop-blur-xl border-2 relative z-10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-600/40 shadow-2xl">
				<CardContent className="p-10 text-center">
					<CharacterDisplay
						character={character}
						playerName={playerName}
						size="xl"
						className="mb-8"
					/>

					<h2 className="text-4xl font-bold mb-4 text-white">Prepare-se!</h2>

					<p className="text-xl text-gray-300 mb-8">
						A batalha épica está começando...
					</p>

					{/* Epic Countdown */}
					<div className="relative mb-8">
						<div className="w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center relative border-blue-500/40 bg-gradient-to-br from-gray-800/80 to-gray-700/80 shadow-blue-500/30 shadow-2xl">
							<span className="text-5xl font-bold animate-pulse text-blue-400">
								{countdown}
							</span>
							{/* Rotating border effect */}
							<div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-blue-600 to-purple-600 animate-spin opacity-50" />
						</div>
					</div>

					{/* Battle preparation text */}
					<div className="mt-6 text-center">
						<p className="text-sm font-semibold text-blue-400">
							⚔️ Preparando arsenal de combate...
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
