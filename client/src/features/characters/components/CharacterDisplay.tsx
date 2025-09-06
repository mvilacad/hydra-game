import { cn } from "@/lib/utils";
import { useCharacterTheme } from "../hooks/useCharacterTheme";
import type { CharacterType } from "../types/characterTypes";
import { CharacterIcon } from "./CharacterIcon";

interface CharacterDisplayProps {
	character: CharacterType;
	playerName?: string;
	showName?: boolean;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

export const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
	character,
	playerName,
	showName = true,
	size = "lg",
	className,
}) => {
	const theme = useCharacterTheme(character);

	return (
		<div className={cn("text-center", className)}>
			<CharacterIcon
				character={character}
				size={size}
				className="mx-auto mb-4"
			/>

			{showName && (
				<div
					className={cn(
						"inline-flex items-center gap-3 px-6 py-3 rounded-full",
						`bg-gradient-to-r ${theme.primary}`,
						"shadow-lg",
					)}
				>
					{playerName && (
						<>
							<span className="text-white font-bold text-lg capitalize">
								{playerName}
							</span>
							<span className="text-white/80">•</span>
						</>
					)}
					<span className={cn("font-semibold capitalize", theme.accent)}>
						{theme.name}
					</span>
				</div>
			)}
		</div>
	);
};
