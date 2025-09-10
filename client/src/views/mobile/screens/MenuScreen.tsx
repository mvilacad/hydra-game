import React from "react";
import { FigmaButton } from "@/components/figma-ui";

interface MenuScreenProps {
	onStartGame: () => void;
}

export function MenuScreen({ onStartGame }: MenuScreenProps) {
	return (
		<div className="figma-game-background flex flex-col items-center justify-between h-screen p-6">
			{/* Hydra 3D Scene Area - placeholder for now */}
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center">
					{/* Hydra placeholder - this would be the actual 3D model */}
					<div className="w-64 h-64 mx-auto mb-8 bg-gradient-to-b from-purple-600/20 to-purple-900/40 rounded-lg flex items-center justify-center border border-purple-500/30">
						<div className="text-center">
							<div className="text-6xl mb-2">🐉</div>
							<div className="text-purple-300 text-sm">Hydra 3D Model</div>
						</div>
					</div>
					
					{/* Game Title */}
					<h1 className="figma-title text-4xl mb-2 text-white text-center">
						HYDRA GAME
					</h1>
					<p className="figma-subtitle text-gray-300 text-center mb-8">
						Batalhe contra a lendária Hydra
					</p>
				</div>
			</div>

			{/* Main Action Button */}
			<div className="w-full max-w-xs mb-8">
				<FigmaButton
					size="large"
					onClick={onStartGame}
					className="w-full"
				>
					Jogar
				</FigmaButton>
			</div>

			{/* Heroes at bottom - placeholder for character models */}
			<div className="flex justify-center gap-4 pb-safe">
				{["🧙‍♂️", "⚔️", "🏹", "🛡️"].map((character, index) => (
					<div
						key={index}
						className="w-12 h-12 bg-gradient-to-b from-amber-600/30 to-amber-900/50 rounded-lg flex items-center justify-center border border-amber-500/30"
					>
						<span className="text-2xl">{character}</span>
					</div>
				))}
			</div>
		</div>
	);
}