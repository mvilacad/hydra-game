import React from "react";
import { cn } from "@/lib/utils";

interface QuestionOption {
	id: string;
	text: string;
	isCorrect?: boolean;
}

interface QuestionOptionsProps {
	options: QuestionOption[];
	onSelect: (optionId: string) => void;
	selectedOption?: string;
	showCorrect?: boolean;
	disabled?: boolean;
	className?: string;
}

export function QuestionOptions({
	options,
	onSelect,
	selectedOption,
	showCorrect = false,
	disabled = false,
	className,
}: QuestionOptionsProps) {
	const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

	const getOptionStyle = (option: QuestionOption, index: number) => {
		const isSelected = selectedOption === option.id;
		const isCorrect = showCorrect && option.isCorrect;
		const isWrong = showCorrect && isSelected && !option.isCorrect;

		if (isCorrect) {
			return "bg-green-600/20 border-green-500 text-green-100";
		}
		if (isWrong) {
			return "bg-red-600/20 border-red-500 text-red-100";
		}
		if (isSelected) {
			return "bg-blue-600/20 border-blue-500 text-blue-100";
		}
		return "bg-gray-800/60 border-gray-600 text-gray-100 hover:bg-gray-700/60 hover:border-gray-500";
	};

	return (
		<div className={cn("space-y-3", className)}>
			{options.map((option, index) => (
				<button
					key={option.id}
					onClick={() => !disabled && onSelect(option.id)}
					disabled={disabled}
					className={cn(
						"w-full p-4 rounded-lg border-2 transition-all duration-200 text-left",
						"flex items-center gap-4 backdrop-blur-sm",
						"disabled:cursor-not-allowed disabled:opacity-70",
						!disabled && "hover:scale-[1.02] active:scale-[0.98]",
						getOptionStyle(option, index)
					)}
				>
					{/* Option letter */}
					<div
						className={cn(
							"flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
							selectedOption === option.id
								? "bg-current text-gray-900"
								: "bg-gray-700 text-gray-200"
						)}
					>
						{getOptionLetter(index)}
					</div>
					
					{/* Option text */}
					<span className="flex-1 font-medium">{option.text}</span>
					
					{/* Correct/Wrong indicator */}
					{showCorrect && option.isCorrect && (
						<div className="text-green-400 text-xl">✓</div>
					)}
					{showCorrect && selectedOption === option.id && !option.isCorrect && (
						<div className="text-red-400 text-xl">✗</div>
					)}
				</button>
			))}
		</div>
	);
}