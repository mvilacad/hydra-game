import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
	isConnected: boolean;
	className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
	isConnected,
	className,
}) => {
	return (
		<div className={cn("flex items-center justify-center gap-2", className)}>
			{isConnected ? (
				<>
					<Wifi className="w-4 h-4 text-green-400" />
					<span className="text-green-400 text-sm">Conectado</span>
				</>
			) : (
				<>
					<WifiOff className="w-4 h-4 text-red-400" />
					<span className="text-red-400 text-sm">Desconectado</span>
				</>
			)}
		</div>
	);
};
