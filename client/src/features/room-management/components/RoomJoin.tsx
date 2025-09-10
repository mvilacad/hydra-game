import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRoom } from "@/lib/stores/useRoom";
import { gameApi } from "@/lib/services";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";

interface RoomJoinProps {
	onRoomJoined?: (roomCode: string, isCreator: boolean) => void;
	onCancel?: () => void;
	initialRoomCode?: string;
}

export function RoomJoin({ onRoomJoined, onCancel, initialRoomCode = "" }: RoomJoinProps) {
	const [roomCode, setRoomCode] = useState(initialRoomCode);
	const [roomCodeError, setRoomCodeError] = useState<string | null>(null);

	const { joinRoom, isLoading, error } = useRoom();

	const handleRoomCodeChange = (value: string) => {
		// Format room code as user types (XXX-XXX)
		const cleanCode = gameApi.parseRoomCode(value);
		const formattedCode = gameApi.formatRoomCode(cleanCode);
		
		setRoomCode(formattedCode);
		setRoomCodeError(null);
	};

	const handleJoinRoom = async () => {
		const cleanCode = gameApi.parseRoomCode(roomCode);
		
		// Validate room code format
		if (!gameApi.validateRoomCode(cleanCode)) {
			setRoomCodeError("Código inválido. Use o formato ABC-123 ou ABC123");
			return;
		}

		try {
			const result = await joinRoom(cleanCode);
			
			if (result.success && result.game) {
				onRoomJoined?.(result.game.code, result.isCreator || false);
			}
		} catch (error) {
			console.error("Failed to join room:", error);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleJoinRoom();
		}
	};

	if (isLoading) {
		return <LoadingScreen title="Entrando na Sala..." message="Conectando à batalha..." />;
	}

	return (
		<div className="w-full max-w-md mx-auto p-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						🚪 Entrar em Sala
						<Badge variant="outline">Jogador</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{(error || roomCodeError) && (
						<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-red-400 text-sm">{error || roomCodeError}</p>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="roomCode">Código da Sala</Label>
						<Input
							id="roomCode"
							placeholder="ABC-123"
							value={roomCode}
							onChange={(e) => handleRoomCodeChange(e.target.value)}
							onKeyPress={handleKeyPress}
							maxLength={7} // XXX-XXX format
							className="text-center text-lg font-mono uppercase"
							autoFocus
						/>
						<p className="text-xs text-gray-400 text-center">
							Digite o código de 6 caracteres compartilhado pelo host
						</p>
					</div>

					<div className="flex gap-3 pt-4">
						{onCancel && (
							<Button variant="outline" onClick={onCancel} className="flex-1">
								Cancelar
							</Button>
						)}
						<Button 
							onClick={handleJoinRoom} 
							disabled={isLoading || !roomCode.trim()}
							className="flex-1"
						>
							{isLoading ? "Entrando..." : "Entrar"}
						</Button>
					</div>

					<div className="pt-4 border-t border-gray-700">
						<p className="text-xs text-gray-400 text-center mb-3">
							Não tem um código?
						</p>
						<Button 
							variant="outline" 
							onClick={() => onRoomJoined?.("", true)}
							className="w-full"
						>
							Criar Nova Sala
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}