import type { Attack, Player } from "@shared/types";
import {
	Award,
	Clock,
	Flame,
	Shield,
	Sword,
	Target,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface DamageMeterProps {
	players: Player[];
	attacks?: Attack[];
	className?: string;
}

interface PlayerStats {
	player: Player;
	totalDamage: number;
	dps: number;
	hits: number;
	accuracy: number;
	lastAttack?: Attack;
	criticalHits: number;
}

export function DamageMeter({
	players,
	attacks = [],
	className,
}: DamageMeterProps) {
	const [sortBy, setSortBy] = useState<"damage" | "dps" | "accuracy">("damage");

	// Calculate comprehensive player stats
	const playerStats = useMemo(() => {
		const stats: PlayerStats[] = players.map((player) => {
			const playerAttacks = attacks.filter(
				(attack) => attack.playerId === player.id,
			);
			const totalDamage = playerAttacks.reduce(
				(sum, attack) => sum + attack.damage,
				0,
			);

			// Calculate time span for DPS
			const firstAttack = playerAttacks[0]?.timestamp;
			const lastAttack = playerAttacks[playerAttacks.length - 1]?.timestamp;
			const timeSpan =
				firstAttack && lastAttack ? (lastAttack - firstAttack) / 1000 : 1;
			const dps = timeSpan > 0 ? totalDamage / timeSpan : totalDamage;

			// Calculate accuracy (assuming some attacks miss)
			const hits = playerAttacks.filter((attack) => attack.damage > 0).length;
			const accuracy =
				playerAttacks.length > 0 ? (hits / playerAttacks.length) * 100 : 0;

			// Critical hits (high damage attacks)
			const avgDamage = hits > 0 ? totalDamage / hits : 0;
			const criticalHits = playerAttacks.filter(
				(attack) => attack.damage > avgDamage * 1.5,
			).length;

			return {
				player,
				totalDamage,
				dps,
				hits,
				accuracy,
				lastAttack: playerAttacks[playerAttacks.length - 1],
				criticalHits,
			};
		});

		// Sort by selected metric
		return stats.sort((a, b) => {
			switch (sortBy) {
				case "dps":
					return b.dps - a.dps;
				case "accuracy":
					return b.accuracy - a.accuracy;
				default:
					return b.totalDamage - a.totalDamage;
			}
		});
	}, [players, attacks, sortBy]);

	const getCharacterIcon = (character: string) => {
		switch (character) {
			case "warrior":
				return <Sword className="w-4 h-4" />;
			case "mage":
				return <Zap className="w-4 h-4" />;
			case "archer":
				return <Target className="w-4 h-4" />;
			case "paladin":
				return <Shield className="w-4 h-4" />;
			default:
				return <Flame className="w-4 h-4" />;
		}
	};

	const getCharacterColor = (character: string) => {
		switch (character) {
			case "warrior":
				return "text-orange-400 bg-orange-400/10 border-orange-400/20";
			case "mage":
				return "text-blue-400 bg-blue-400/10 border-blue-400/20";
			case "archer":
				return "text-green-400 bg-green-400/10 border-green-400/20";
			case "paladin":
				return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
			default:
				return "text-gray-400 bg-gray-400/10 border-gray-400/20";
		}
	};

	const getRankBadge = (rank: number) => {
		if (rank === 1) return <Award className="w-4 h-4 text-yellow-400" />;
		if (rank === 2) return <Award className="w-4 h-4 text-gray-300" />;
		if (rank === 3) return <Award className="w-4 h-4 text-amber-600" />;
		return (
			<span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-400">
				#{rank}
			</span>
		);
	};

	if (players.length === 0) {
		return (
			<Card className={cn("bg-gray-900/95 border-gray-700/50", className)}>
				<CardHeader className="pb-3">
					<CardTitle className="text-lg flex items-center gap-2 text-red-400">
						<TrendingUp className="w-5 h-5" />
						Damage Meter
					</CardTitle>
				</CardHeader>
				<CardContent className="text-center py-8 text-gray-400">
					Aguardando heróis entrarem na batalha...
				</CardContent>
			</Card>
		);
	}

	return (
		<Card
			className={cn(
				"bg-gray-900/95 border-gray-700/50 backdrop-blur-sm",
				className,
			)}
		>
			<CardHeader className="pb-3">
				<CardTitle className="text-lg flex items-center gap-2 text-red-400">
					<TrendingUp className="w-5 h-5" />
					Damage Meter
				</CardTitle>

				{/* Sort Options */}
				<div className="flex gap-1 mt-2">
					{[
						{ key: "damage", label: "DMG", icon: Sword },
						{ key: "dps", label: "DPS", icon: TrendingUp },
						{ key: "accuracy", label: "ACC", icon: Target },
					].map(({ key, label, icon: Icon }) => (
						<button
							key={key}
							onClick={() => setSortBy(key as any)}
							className={cn(
								"px-2 py-1 text-xs font-medium rounded border transition-colors flex items-center gap-1",
								sortBy === key
									? "bg-red-500/20 border-red-500/40 text-red-400"
									: "bg-gray-800/50 border-gray-600/50 text-gray-400 hover:bg-gray-700/50",
							)}
						>
							<Icon className="w-3 h-3" />
							{label}
						</button>
					))}
				</div>
			</CardHeader>

			<CardContent className="space-y-1 max-h-80 overflow-y-auto">
				{playerStats.map((stat, index) => {
					const rank = index + 1;
					const isTop3 = rank <= 3;
					const maxDamage = playerStats[0]?.totalDamage || 1;
					const damagePercent = (stat.totalDamage / maxDamage) * 100;

					return (
						<div
							key={stat.player.id}
							className={cn(
								"relative p-3 rounded-lg border transition-all duration-200 overflow-hidden",
								"bg-gray-800/40 border-gray-700/30",
								isTop3 &&
									"bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-yellow-400/20",
								!stat.player.isConnected && "opacity-60",
							)}
						>
							{/* Background damage bar */}
							<div
								className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent transition-all duration-1000"
								style={{ width: `${damagePercent}%` }}
							/>

							<div className="relative flex items-center gap-3">
								{/* Rank */}
								<div className="flex-shrink-0">{getRankBadge(rank)}</div>

								{/* Character Icon */}
								<div
									className={cn(
										"flex-shrink-0 p-1.5 rounded border",
										getCharacterColor(stat.player.character),
									)}
								>
									{getCharacterIcon(stat.player.character)}
								</div>

								{/* Player Info */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<h4
											className={cn(
												"font-semibold text-sm truncate",
												rank === 1 ? "text-yellow-400" : "text-white",
											)}
										>
											{stat.player.name}
										</h4>
										<div
											className={cn(
												"w-1.5 h-1.5 rounded-full",
												stat.player.isConnected ? "bg-green-400" : "bg-red-400",
											)}
										/>
									</div>

									<div className="flex items-center gap-3 text-xs text-gray-400">
										<span className="capitalize">{stat.player.character}</span>
										<span>{stat.hits} hits</span>
										{stat.criticalHits > 0 && (
											<span className="text-yellow-400">
												{stat.criticalHits} crits
											</span>
										)}
									</div>
								</div>

								{/* Stats */}
								<div className="flex-shrink-0 text-right">
									<div
										className={cn(
											"font-bold text-sm",
											rank === 1 ? "text-yellow-400" : "text-white",
										)}
									>
										{sortBy === "damage" &&
											`${stat.totalDamage.toLocaleString()}`}
										{sortBy === "dps" && `${stat.dps.toFixed(1)}`}
										{sortBy === "accuracy" && `${stat.accuracy.toFixed(0)}%`}
									</div>

									<div className="text-xs text-gray-400">
										{sortBy === "damage" && "damage"}
										{sortBy === "dps" && "dps"}
										{sortBy === "accuracy" && "accuracy"}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
