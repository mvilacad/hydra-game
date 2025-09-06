import { Shield, Sword, Target, User, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PlayerSetupProps {
	onReady: (playerData: { name: string; character: string }) => void;
}

const characters = [
	{
		id: "warrior",
		name: "Guerreiro",
		description: "Mestre do combate corpo a corpo",
		icon: Sword,
		color: "text-orange-400 border-orange-400/30 bg-orange-400/10",
	},
	{
		id: "mage",
		name: "Mago",
		description: "Mestre da magia arcana",
		icon: Zap,
		color: "text-blue-400 border-blue-400/30 bg-blue-400/10",
	},
	{
		id: "archer",
		name: "Arqueiro",
		description: "Atirador especialista e ranger",
		icon: Target,
		color: "text-green-400 border-green-400/30 bg-green-400/10",
	},
	{
		id: "paladin",
		name: "Paladino",
		description: "Guerreiro sagrado e protetor",
		icon: Shield,
		color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
	},
];

export default function PlayerSetup({ onReady }: PlayerSetupProps) {
	const [name, setName] = useState("");
	const [selectedCharacter, setSelectedCharacter] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim() || !selectedCharacter) return;

		setIsLoading(true);

		// Simulate brief loading for better UX
		await new Promise((resolve) => setTimeout(resolve, 500));

		onReady({
			name: name.trim(),
			character: selectedCharacter,
		});
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-red-900/10 to-gray-900">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl flex items-center justify-center gap-2">
						<User className="w-8 h-8 text-red-400" />
						Entrar na Batalha
					</CardTitle>
					<p className="text-gray-300">Escolha seu herói e entre na batalha</p>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Name Input */}
						<div className="space-y-2">
							<Label htmlFor="name" className="text-white">
								Nome do Herói
							</Label>
							<Input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Digite o nome do seu herói"
								className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
								maxLength={20}
								required
							/>
						</div>

						{/* Character Selection */}
						<div className="space-y-3">
							<Label className="text-white">Escolha Sua Classe</Label>
							<div className="grid grid-cols-2 gap-3">
								{characters.map((character) => {
									const Icon = character.icon;
									const isSelected = selectedCharacter === character.id;

									return (
										<button
											key={character.id}
											type="button"
											onClick={() => setSelectedCharacter(character.id)}
											className={cn(
												"p-4 rounded-lg border-2 transition-all duration-200 text-left",
												"hover:scale-105",
												isSelected
													? character.color
													: "border-gray-600 bg-gray-800/50 hover:border-gray-500",
											)}
										>
											<div className="flex items-center gap-3 mb-2">
												<Icon
													className={cn(
														"w-6 h-6",
														isSelected
															? character.color.split(" ")[0]
															: "text-gray-400",
													)}
												/>
												<span
													className={cn(
														"font-semibold",
														isSelected ? "text-white" : "text-gray-300",
													)}
												>
													{character.name}
												</span>
											</div>
											<p
												className={cn(
													"text-xs",
													isSelected ? "text-gray-200" : "text-gray-400",
												)}
											>
												{character.description}
											</p>
										</button>
									);
								})}
							</div>
						</div>

						{/* Submit Button */}
						<Button
							type="submit"
							className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
							disabled={!name.trim() || !selectedCharacter || isLoading}
						>
							{isLoading ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									Entrando na Batalha...
								</div>
							) : (
								"Pronto para a Batalha!"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
