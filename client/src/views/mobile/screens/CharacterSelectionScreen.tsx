import React, { useState } from "react";
import { FigmaButton, AvatarSelection } from "@/components/figma-ui";
import { Input } from "@/components/ui/input";

interface Character {
	id: string;
	name: string;
	title: string;
	image: string;
}

interface CharacterSelectionScreenProps {
	onConfirm: (data: { characterId: string; playerName: string }) => void;
	onBack: () => void;
}

const CHARACTERS: Character[] = [
	{
		id: "warrior",
		name: "Guerreiro",
		title: "O Cavaleiro das Sombras",
		image: "/avatars/warrior.png", // These would be actual character images
	},
	{
		id: "mage",
		name: "Mago",
		title: "O Mestre dos Elementos",
		image: "/avatars/mage.png",
	},
	{
		id: "archer",
		name: "Arqueiro",
		title: "O Caçador Silencioso",
		image: "/avatars/archer.png",
	},
	{
		id: "paladin",
		name: "Paladino",
		title: "O Protetor Divino",
		image: "/avatars/paladin.png",
	},
];

export function CharacterSelectionScreen({
	onConfirm,
	onBack,
}: CharacterSelectionScreenProps) {
	const [selectedCharacter, setSelectedCharacter] = useState<string>("");
	const [playerName, setPlayerName] = useState<string>("");

	const selectedCharacterData = CHARACTERS.find(c => c.id === selectedCharacter);

	const handleConfirm = () => {
		if (selectedCharacter && playerName.trim()) {
			onConfirm({
				characterId: selectedCharacter,
				playerName: playerName.trim(),
			});
		}
	};

	const isFormValid = selectedCharacter && playerName.trim().length >= 2;

	return (
		<div className="figma-game-background flex flex-col h-screen p-6">
			{/* Header with player info */}
			<div className="text-center mb-6">
				<div className="figma-dark-card p-4 rounded-lg mb-4">
					<h2 className="figma-subtitle text-white mb-1">
						{playerName || "Jogador"}
					</h2>
					<p className="text-gray-400 text-sm">
						{selectedCharacterData?.title || "Escolha seu personagem"}
					</p>
				</div>
			</div>

			{/* Main character display */}
			<div className="flex-1 flex flex-col items-center justify-center">
				{/* Large character avatar */}
				<div className="w-48 h-48 mb-8 bg-gradient-to-b from-amber-600/20 to-amber-900/40 rounded-lg flex items-center justify-center border border-amber-500/30">
					{selectedCharacterData ? (
						<div className="text-center">
							<div className="text-8xl mb-2">
								{selectedCharacterData.id === "warrior" && "⚔️"}
								{selectedCharacterData.id === "mage" && "🧙‍♂️"}
								{selectedCharacterData.id === "archer" && "🏹"}
								{selectedCharacterData.id === "paladin" && "🛡️"}
							</div>
							<div className="text-amber-300 text-sm font-medium">
								{selectedCharacterData.name}
							</div>
						</div>
					) : (
						<div className="text-center">
							<div className="text-6xl mb-2 opacity-50">❓</div>
							<div className="text-gray-500 text-sm">
								Selecione um personagem
							</div>
						</div>
					)}
				</div>

				{/* Character selection */}
				<div className="mb-8">
					<AvatarSelection
						avatars={CHARACTERS.map(char => ({
							id: char.id,
							name: char.name,
							image: char.image,
						}))}
						selectedAvatar={selectedCharacter}
						onSelect={setSelectedCharacter}
					/>
				</div>

				{/* Name input */}
				<div className="w-full max-w-sm mb-8">
					<div className="figma-dark-card p-4 rounded-lg">
						<label className="block text-white text-sm font-medium mb-2">
							Digite seu nome
						</label>
						<Input
							value={playerName}
							onChange={(e) => setPlayerName(e.target.value)}
							placeholder="Nome do jogador"
							className="figma-input"
							maxLength={20}
						/>
					</div>
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex gap-3 pb-safe">
				<FigmaButton
					variant="secondary"
					onClick={onBack}
					className="flex-1"
				>
					Voltar
				</FigmaButton>
				<FigmaButton
					onClick={handleConfirm}
					disabled={!isFormValid}
					className="flex-1"
				>
					Confirmar
				</FigmaButton>
			</div>
		</div>
	);
}