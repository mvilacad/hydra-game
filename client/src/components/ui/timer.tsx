import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePhaseTimestamps } from "@/lib/stores/useGameStore";

interface TimerProps {
	duration?: number; // LEGACY: in seconds (will be ignored if server timestamps available)
	onComplete?: () => void;
	className?: string;
	showProgress?: boolean;
	useServerTime?: boolean; // Use server-authoritative timestamps
}

export function Timer({
	duration = 30,
	onComplete,
	className,
	showProgress = true,
	useServerTime = true,
}: TimerProps) {
	const { phaseEndsAt } = usePhaseTimestamps();
	const [timeLeft, setTimeLeft] = useState(duration);
	const [totalDuration, setTotalDuration] = useState(duration);
	const [isActive, setIsActive] = useState(true);

	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;

		if (useServerTime && phaseEndsAt) {
			// Server-authoritative timing
			interval = setInterval(() => {
				const now = Date.now();
				const endsAt = new Date(phaseEndsAt).getTime();
				const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
				
				setTimeLeft(remaining);
				
				if (remaining <= 0) {
					setIsActive(false);
					onComplete?.();
				}
			}, 100); // Update more frequently for smooth display
			
		} else if (isActive && timeLeft > 0) {
			// Legacy local timing
			interval = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						setIsActive(false);
						onComplete?.();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isActive, timeLeft, onComplete, useServerTime, phaseEndsAt]);

	// Update total duration when server time is available
	useEffect(() => {
		if (useServerTime && phaseEndsAt) {
			const now = Date.now();
			const endsAt = new Date(phaseEndsAt).getTime();
			const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
			
			// Estimate total duration (we don't have start time, so use current + remaining)
			setTotalDuration(remaining + 1);
			setTimeLeft(remaining);
		}
	}, [phaseEndsAt, useServerTime]);

	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

	const getTimerColor = () => {
		if (timeLeft <= 10) return "text-red-400";
		if (timeLeft <= 30) return "text-yellow-400";
		return "text-green-400";
	};

	const getProgressColor = () => {
		if (timeLeft <= 10) return "bg-red-500";
		if (timeLeft <= 30) return "bg-yellow-500";
		return "bg-green-500";
	};

	return (
		<div className={cn("flex flex-col items-center space-y-2", className)}>
			{/* Digital display */}
			<div
				className={cn(
					"font-mono text-4xl font-bold",
					"bg-black/50 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-2",
					"shadow-lg shadow-black/50",
					getTimerColor(),
				)}
			>
				{minutes.toString().padStart(2, "0")}:
				{seconds.toString().padStart(2, "0")}
			</div>

			{/* Progress bar */}
			{showProgress && (
				<div className="w-full max-w-xs">
					<div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600/50">
						<div
							className={cn(
								"absolute top-0 left-0 h-full transition-all duration-1000 ease-linear",
								getProgressColor(),
							)}
							style={{ width: `${progressPercent}%` }}
						/>
						<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
					</div>

					{/* Time labels */}
					<div className="flex justify-between text-xs text-gray-400 mt-1">
						<span>0:00</span>
						<span>
							{Math.floor(totalDuration / 60)}:
							{(totalDuration % 60).toString().padStart(2, "0")}
						</span>
					</div>
				</div>
			)}

			{/* Warning effects */}
			{timeLeft <= 10 && (
				<div className="absolute inset-0 pointer-events-none">
					<div className="w-full h-full border-4 border-red-500/50 rounded-lg animate-pulse" />
				</div>
			)}
		</div>
	);
}
