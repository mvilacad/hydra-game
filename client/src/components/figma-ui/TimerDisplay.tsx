import React from "react";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
	timeLeft: number;
	className?: string;
	variant?: "default" | "danger";
}

export function TimerDisplay({
	timeLeft,
	className,
	variant = "default",
}: TimerDisplayProps) {
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const isDanger = variant === "danger" || timeLeft <= 10;

	return (
		<div className={cn("flex flex-col items-center", className)}>
			{/* Label */}
			<div className="text-sm font-medium text-gray-300 mb-1">Tempo</div>
			
			{/* Timer */}
			<div
				className={cn(
					"px-6 py-3 rounded-lg border backdrop-blur-sm font-mono text-2xl font-bold transition-all duration-300",
					isDanger
						? "bg-red-900/80 border-red-600/50 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
						: "bg-gray-900/80 border-gray-700/50 text-white shadow-lg"
				)}
			>
				{formatTime(timeLeft)}
			</div>
		</div>
	);
}