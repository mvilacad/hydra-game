import React from "react";
import { cn } from "@/lib/utils";

interface HealthBarProps {
	currentHealth: number;
	maxHealth: number;
	label?: string;
	className?: string;
	showValues?: boolean;
}

export function HealthBar({
	currentHealth,
	maxHealth,
	label = "Backlog",
	className,
	showValues = true,
}: HealthBarProps) {
	const percentage = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
	
	// Color based on health percentage
	const getHealthColor = () => {
		if (percentage > 60) return "from-red-500 to-red-600";
		if (percentage > 30) return "from-orange-500 to-red-500";
		return "from-yellow-500 to-orange-500";
	};

	return (
		<div className={cn("flex flex-col", className)}>
			{/* Label */}
			<div className="text-sm font-medium text-gray-300 mb-2">{label}</div>
			
			{/* Health bar container */}
			<div className="relative w-full h-6 bg-gray-800 rounded-full border border-gray-700 overflow-hidden">
				{/* Health bar fill */}
				<div
					className={cn(
						"h-full bg-gradient-to-r transition-all duration-500 ease-out",
						getHealthColor()
					)}
					style={{ width: `${percentage}%` }}
				/>
				
				{/* Shine effect */}
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
			</div>
			
			{/* Values */}
			{showValues && (
				<div className="flex justify-between text-xs text-gray-400 mt-1">
					<span>{currentHealth.toLocaleString()}</span>
					<span>{maxHealth.toLocaleString()}</span>
				</div>
			)}
		</div>
	);
}