// Components
export { PreparationScreen } from "./components/PreparationScreen";
export { ResultsScreen } from "./components/ResultsScreen";
export { useAnswerSubmission } from "./hooks/useAnswerSubmission";
// Hooks
// export { useBattlePhases } from "./hooks/useBattlePhases"; // REMOVED: Now using server-authoritative timing

// Types
export type {
	AnswerSubmission,
	BattlePhase,
	BattlePhaseTransition,
	BattleState,
	BattleTimer,
	PreparationTimer,
} from "./types/battleTypes";
