import { cn } from "@/lib/utils";
import { useCharacterTheme } from "../hooks/useCharacterTheme";
import type { CharacterType } from "../types/characterTypes";

interface CharacterIconProps {
	character: CharacterType;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

const SIZE_MAP = {
	sm: { container: "w-12 h-12", icon: "w-6 h-6" },
	md: { container: "w-16 h-16", icon: "w-8 h-8" },
	lg: { container: "w-20 h-20", icon: "w-10 h-10" },
	xl: { container: "w-32 h-32", icon: "w-16 h-16" },
};

export const CharacterIcon: React.FC<CharacterIconProps> = ({
	character,
	size = "md",
	className,
}) => {
	const theme = useCharacterTheme(character);
	const sizeClasses = SIZE_MAP[size];

	return (
		<div
			className={cn(
				sizeClasses.container,
				"rounded-2xl flex items-center justify-center relative",
				`bg-gradient-to-br ${theme.primary}`,
				theme.glow,
				"shadow-2xl",
				className,
			)}
		>
			<div className={sizeClasses.icon}>{theme.icon}</div>
			<div
				className={cn(
					"absolute inset-0 rounded-2xl opacity-20 animate-pulse",
					`bg-gradient-to-br ${theme.primary}`,
				)}
			/>
		</div>
	);
};
