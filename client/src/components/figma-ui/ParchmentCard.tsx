import React from "react";
import { cn } from "@/lib/utils";

interface ParchmentCardProps {
	children: React.ReactNode;
	className?: string;
	variant?: "question" | "result";
}

export function ParchmentCard({
	children,
	className,
	variant = "question",
}: ParchmentCardProps) {
	const baseClasses =
		"relative p-6 rounded-lg shadow-lg";

	const variantClasses = {
		question:
			"bg-gradient-to-b from-amber-50 to-amber-100 text-gray-900 border-2 border-amber-200",
		result:
			"bg-gradient-to-b from-amber-50 to-amber-100 text-gray-900 border-2 border-amber-200",
	};

	return (
		<div className={cn(baseClasses, variantClasses[variant], className)}>
			{/* Parchment decorative corners */}
			<div className="absolute top-0 left-0 w-4 h-4 bg-amber-200 rounded-br-lg opacity-50" />
			<div className="absolute top-0 right-0 w-4 h-4 bg-amber-200 rounded-bl-lg opacity-50" />
			<div className="absolute bottom-0 left-0 w-4 h-4 bg-amber-200 rounded-tr-lg opacity-50" />
			<div className="absolute bottom-0 right-0 w-4 h-4 bg-amber-200 rounded-tl-lg opacity-50" />
			
			{/* Content */}
			<div className="relative z-10">{children}</div>
		</div>
	);
}