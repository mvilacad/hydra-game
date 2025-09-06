import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
	duration: number; // in seconds
	onComplete?: () => void;
	className?: string;
	showProgress?: boolean;
}

export function Timer({
	duration,
	onComplete,
	className,
	showProgress = true,
}: TimerProps) {
	const [timeLeft, setTimeLeft] = useState(duration);
	const [isActive, setIsActive] = useState(true);

	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;

		if (isActive && timeLeft > 0) {
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
	}, [isActive, timeLeft, onComplete]);

	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const progressPercent = ((duration - timeLeft) / duration) * 100;

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
							{Math.floor(duration / 60)}:
							{(duration % 60).toString().padStart(2, "0")}
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
