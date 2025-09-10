import React from "react";
import { cn } from "@/lib/utils";

interface Avatar {
	id: string;
	name: string;
	image: string;
}

interface AvatarSelectionProps {
	avatars: Avatar[];
	selectedAvatar?: string;
	onSelect: (avatarId: string) => void;
	className?: string;
}

export function AvatarSelection({
	avatars,
	selectedAvatar,
	onSelect,
	className,
}: AvatarSelectionProps) {
	return (
		<div className={cn("flex justify-center gap-4", className)}>
			{avatars.map((avatar) => (
				<button
					key={avatar.id}
					onClick={() => onSelect(avatar.id)}
					className={cn(
						"relative w-16 h-16 rounded-full border-4 transition-all duration-200 overflow-hidden",
						"hover:scale-110 active:scale-95",
						selectedAvatar === avatar.id
							? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
							: "border-gray-600 hover:border-gray-400"
					)}
				>
					<img
						src={avatar.image}
						alt={avatar.name}
						className="w-full h-full object-cover"
					/>
					
					{/* Selection indicator */}
					{selectedAvatar === avatar.id && (
						<div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
							<div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
								<div className="w-2 h-2 bg-white rounded-full" />
							</div>
						</div>
					)}
				</button>
			))}
		</div>
	);
}