import React from "react";
import { cn } from "@/lib/utils";

interface FigmaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary";
	size?: "default" | "large";
	children: React.ReactNode;
}

export function FigmaButton({
	variant = "primary",
	size = "default",
	className,
	children,
	...props
}: FigmaButtonProps) {
	const baseClasses =
		"relative font-bold rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

	const variantClasses = {
		primary:
			"bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_6px_0_#991b1b,0_8px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_0_#991b1b,0_6px_20px_rgba(0,0,0,0.4)] active:shadow-[0_2px_0_#991b1b,0_4px_15px_rgba(0,0,0,0.4)]",
		secondary:
			"bg-gradient-to-b from-red-700 to-red-800 text-white shadow-[0_6px_0_#7f1d1d,0_8px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_0_#7f1d1d,0_6px_20px_rgba(0,0,0,0.4)] active:shadow-[0_2px_0_#7f1d1d,0_4px_15px_rgba(0,0,0,0.4)]",
	};

	const sizeClasses = {
		default: "px-8 py-3 text-base min-w-[120px]",
		large: "px-12 py-4 text-lg min-w-[160px]",
	};

	return (
		<button
			className={cn(
				baseClasses,
				variantClasses[variant],
				sizeClasses[size],
				className
			)}
			{...props}
		>
			{children}
		</button>
	);
}