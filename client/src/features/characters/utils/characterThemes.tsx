import { Shield, Sword, Target, Zap } from "lucide-react";
import React from "react";
import type {
	CharacterConfig,
	CharacterTheme,
	CharacterType,
} from "../types/characterTypes";

const CHARACTER_CONFIGS: CharacterConfig = {
	warrior: {
		displayName: "Guerreiro",
		primary: "from-orange-600 to-red-600",
		secondary: "from-orange-900/80 to-red-900/80",
		accent: "text-orange-400",
		border: "border-orange-500/40",
		glow: "shadow-orange-500/30",
		iconType: "sword",
		bgPattern:
			"bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent",
	},
	mage: {
		displayName: "Mago",
		primary: "from-blue-600 to-purple-600",
		secondary: "from-blue-900/80 to-purple-900/80",
		accent: "text-blue-400",
		border: "border-blue-500/40",
		glow: "shadow-blue-500/30",
		iconType: "zap",
		bgPattern:
			"bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-purple-500/10 to-transparent",
	},
	archer: {
		displayName: "Arqueiro",
		primary: "from-green-600 to-emerald-600",
		secondary: "from-green-900/80 to-emerald-900/80",
		accent: "text-green-400",
		border: "border-green-500/40",
		glow: "shadow-green-500/30",
		iconType: "target",
		bgPattern:
			"bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent",
	},
	paladin: {
		displayName: "Paladino",
		primary: "from-yellow-600 to-amber-600",
		secondary: "from-yellow-900/80 to-amber-900/80",
		accent: "text-yellow-400",
		border: "border-yellow-500/40",
		glow: "shadow-yellow-500/30",
		iconType: "shield",
		bgPattern:
			"bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent",
	},
};

const ICON_MAP = {
	sword: Sword,
	zap: Zap,
	target: Target,
	shield: Shield,
};

export const getCharacterTheme = (
	characterType: CharacterType,
): CharacterTheme => {
	const config = CHARACTER_CONFIGS[characterType];

	if (!config) {
		return getDefaultTheme();
	}

	const IconComponent = ICON_MAP[config.iconType];

	return {
		name: config.displayName,
		primary: config.primary,
		secondary: config.secondary,
		accent: config.accent,
		border: config.border,
		glow: config.glow,
		bgPattern: config.bgPattern,
		icon: React.createElement(IconComponent, {
			className: "w-20 h-20 text-white",
		}),
	};
};

export const getDefaultTheme = (): CharacterTheme => {
	const IconComponent = ICON_MAP.sword;

	return {
		name: "Herói",
		primary: "from-red-600 to-red-700",
		secondary: "from-red-900/80 to-red-900/80",
		accent: "text-red-400",
		border: "border-red-500/40",
		glow: "shadow-red-500/30",
		bgPattern:
			"bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent",
		icon: React.createElement(IconComponent, {
			className: "w-20 h-20 text-white",
		}),
	};
};

export const getAllCharacters = (): CharacterType[] => {
	return Object.keys(CHARACTER_CONFIGS) as CharacterType[];
};

export const getCharacterDisplayName = (
	characterType: CharacterType,
): string => {
	return CHARACTER_CONFIGS[characterType]?.displayName || "Herói";
};
