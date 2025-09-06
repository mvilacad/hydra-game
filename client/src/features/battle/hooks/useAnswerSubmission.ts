import { useCallback } from "react";
import { useAudio } from "@/lib/stores/useAudio";
import { useWebSocket } from "@/lib/stores/useWebSocket";
import type { AnswerSubmission } from "../types/battleTypes";

interface UseAnswerSubmissionProps {
	onSubmissionComplete?: (isCorrect: boolean) => void;
}

export const useAnswerSubmission = ({
	onSubmissionComplete,
}: UseAnswerSubmissionProps = {}) => {
	const { sendMessage } = useWebSocket();
	const { playSuccess, playHit } = useAudio();

	const submitAnswer = useCallback(
		(
			questionId: string,
			playerId: string,
			answer: string,
			correctAnswer: string,
			timeSpent: number,
		) => {
			const isCorrect = answer === correctAnswer;

			const submission: AnswerSubmission = {
				questionId,
				playerId,
				answer,
				isCorrect,
				timeSpent,
			};

			console.log("Submitting answer:", submission);

			// Send to server
			sendMessage({
				type: "answer_submit",
				data: submission,
			});

			// Play feedback sound
			if (isCorrect) {
				playSuccess();
			} else {
				playHit();
			}

			// Notify completion
			onSubmissionComplete?.(isCorrect);

			return isCorrect;
		},
		[sendMessage, playSuccess, playHit, onSubmissionComplete],
	);

	return {
		submitAnswer,
	};
};
