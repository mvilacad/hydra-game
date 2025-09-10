import React from "react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
	children: React.ReactNode;
	className?: string;
	variant?: "default" | "dark" | "transparent";
}

export function StatusCard({
	children,
	className,
	variant = "default",
}: StatusCardProps) {
	const baseClasses =
		"relative rounded-lg border backdrop-blur-sm";

	const variantClasses = {
		default:
			"bg-gray-900/80 border-gray-700/50 text-white shadow-lg",
		dark:
			"bg-black/60 border-gray-800/50 text-white shadow-xl",
		transparent:
			"bg-white/10 border-white/20 text-white shadow-lg",
	};

	return (
		<div className={cn(baseClasses, variantClasses[variant], className)}>
			{children}
		</div>
	);
}