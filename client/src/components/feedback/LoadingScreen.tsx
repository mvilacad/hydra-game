import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
	title?: string;
	message?: string;
	icon?: React.ReactNode;
	className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
	title = "Carregando...",
	message,
	icon,
	className,
}) => {
	return (
		<div
			className={cn(
				"min-h-screen flex items-center justify-center p-4",
				className,
			)}
		>
			<Card className="w-full max-w-md">
				<CardContent className="p-6 text-center">
					<div className="mb-4">
						{icon || (
							<Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-400" />
						)}
					</div>
					<h2 className="text-2xl font-bold mb-2 text-white">{title}</h2>
					{message && <p className="text-gray-300">{message}</p>}
				</CardContent>
			</Card>
		</div>
	);
};
