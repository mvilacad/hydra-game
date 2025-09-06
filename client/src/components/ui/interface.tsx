import { RotateCw, Trophy, Volume2, VolumeX } from "lucide-react";
import { useEffect } from "react";
import { useAudio } from "@/lib/stores/useAudio";
import { useGame } from "@/lib/stores/useGame";
import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";

export function Interface() {
	const restart = useGame((state) => state.restart);
	const phase = useGame((state) => state.phase);
	const { isMuted, toggleMute } = useAudio();

	// Handle clicks on the interface in the ready phase to start the game
	useEffect(() => {
		if (phase === "ready") {
			const handleClick = () => {
				const activeElement = document.activeElement;
				if (activeElement && "blur" in activeElement) {
					(activeElement as HTMLElement).blur();
				}
				const event = new KeyboardEvent("keydown", { code: "Space" });
				window.dispatchEvent(event);
			};

			window.addEventListener("click", handleClick);
			return () => window.removeEventListener("click", handleClick);
		}
	}, [phase]);

	return (
		<>
			{/* Top-right corner UI controls */}
			<div className="fixed top-4 right-4 flex gap-2 z-10">
				<Button
					variant="outline"
					size="icon"
					onClick={toggleMute}
					title={isMuted ? "Reativar Som" : "Silenciar"}
				>
					{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
				</Button>

				<Button
					variant="outline"
					size="icon"
					onClick={restart}
					title="Reiniciar Jogo"
				>
					<RotateCw size={18} />
				</Button>
			</div>

			{/* Game completion overlay */}
			{phase === "ended" && (
				<div className="fixed inset-0 flex items-center justify-center z-20 bg-black/30">
					<Card className="w-full max-w-md mx-4 shadow-lg">
						<CardHeader>
							<CardTitle className="flex items-center justify-center gap-2">
								<Trophy className="text-yellow-500" />
								Nível Concluído!
							</CardTitle>
						</CardHeader>

						<CardContent>
							<p className="text-center text-muted-foreground">
								Parabéns! Você navegou com sucesso pelo curso.
							</p>
						</CardContent>

						<CardFooter className="flex justify-center">
							<Button onClick={restart} className="w-full">
								Jogar Novamente
							</Button>
						</CardFooter>
					</Card>
				</div>
			)}

			{/* Instructions panel */}
			<div className="fixed bottom-4 left-4 z-10">
				<Card className="w-auto max-w-xs bg-background/80 backdrop-blur-sm">
					<CardContent className="p-4">
						<h3 className="font-medium mb-2">Controles:</h3>
						<ul className="text-sm space-y-1 text-muted-foreground">
							<li>WASD ou Setas: Mover a bola</li>
							<li>Espaço: Pular</li>
							<li>R: Reiniciar jogo</li>
							<li>M: Alternar som</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
