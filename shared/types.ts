export interface Player {
  id: string;
  name: string;
  character: 'warrior' | 'mage' | 'archer' | 'paladin';
  score: number;
  isConnected: boolean;
  socketId?: string;
  joinedAt?: string;
}

export interface Attack {
  id: string;
  playerId: string;
  type: 'sword' | 'arrow' | 'magic' | 'fire';
  damage: number;
  timestamp: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct: string;
  type: 'sword' | 'arrow' | 'magic' | 'fire';
  round?: number;
}

export interface GameState {
  phase: 'waiting' | 'battle' | 'victory' | 'defeat';
  players: Player[];
  hydraHealth: number;
  maxHydraHealth: number;
  currentQuestion: Question | null;
  questionTimeLeft: number;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

// WebSocket message types
export interface PlayerJoinMessage extends WebSocketMessage {
  type: 'player_join';
  data: {
    name: string;
    character: string;
  };
}

export interface AnswerSubmitMessage extends WebSocketMessage {
  type: 'answer_submit';
  data: {
    playerId: string;
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeSpent: number;
  };
}

export interface PlayerAttackMessage extends WebSocketMessage {
  type: 'player_attack';
  data: {
    playerId: string;
    attackType: 'sword' | 'arrow' | 'magic' | 'fire' | 'miss';
    damage: number;
    isCorrect: boolean;
    points: number;
  };
}

export interface GameStateUpdateMessage extends WebSocketMessage {
  type: 'game_state_update';
  data: GameState;
}

export interface QuestionStartMessage extends WebSocketMessage {
  type: 'question_start';
  data: Question;
}

export interface QuestionEndMessage extends WebSocketMessage {
  type: 'question_end';
  data: {};
}

export interface GamePhaseChangeMessage extends WebSocketMessage {
  type: 'game_phase_change';
  data: {
    phase: 'waiting' | 'battle' | 'victory' | 'defeat';
  };
}
