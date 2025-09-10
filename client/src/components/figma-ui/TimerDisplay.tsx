import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePhaseTimestamps } from "@/lib/stores/useGameStore";

interface TimerDisplayProps {
	timeLeft?: number; // LEGACY: will be overridden by server time if available
	className?: string;
	variant?: "default" | "danger";
	useServerTime?: boolean; // Use server-authoritative timestamps
}

export function TimerDisplay({
	timeLeft = 0,
	className,
	variant = "default",
	useServerTime = true,
}: TimerDisplayProps) {
	const { phaseEndsAt } = usePhaseTimestamps();
	const [currentTimeLeft, setCurrentTimeLeft] = useState(timeLeft);

	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;

		if (useServerTime && phaseEndsAt) {
			// Server-authoritative timing
			interval = setInterval(() => {
				const now = Date.now();
				const endsAt = new Date(phaseEndsAt).getTime();
				const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
				setCurrentTimeLeft(remaining);
			}, 100); // Update frequently for smooth display
		} else {
			// Use provided timeLeft
			setCurrentTimeLeft(timeLeft);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [phaseEndsAt, useServerTime, timeLeft]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const isDanger = variant === "danger" || currentTimeLeft <= 10;

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
				{formatTime(currentTimeLeft)}
			</div>
		</div>
	);
}