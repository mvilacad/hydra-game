import { cn } from "@/lib/utils";

interface GameLayoutProps {
	children: React.ReactNode;
	variant?: "mobile" | "hub";
	className?: string;
}

export const GameLayout: React.FC<GameLayoutProps> = ({
	children,
	variant = "mobile",
	className,
}) => {
	const baseClasses = "min-h-screen game-background";

	const variantClasses = {
		mobile: "overflow-auto",
		hub: "overflow-hidden relative",
	};

	return (
		<div className={cn(baseClasses, variantClasses[variant], className)}>
			{children}
		</div>
	);
};
