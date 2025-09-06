export type BattlePhase =
	| "setup"
	| "waiting"
	| "preparing"
	| "question"
	| "results"
	| "ended";

export interface BattleTimer {
	timeLeft: number;
	isActive: boolean;
}

export interface PreparationTimer {
	count: number;
	isActive: boolean;
}

export interface BattleState {
	phase: BattlePhase;
	questionTimer: BattleTimer;
	preparationTimer: PreparationTimer;
	isTransitioning: boolean;
}

export interface AnswerSubmission {
	questionId: string;
	playerId: string;
	answer: string;
	isCorrect: boolean;
	timeSpent: number;
}

export interface BattlePhaseTransition {
	from: BattlePhase;
	to: BattlePhase;
	duration?: number;
	callback?: () => void;
}
