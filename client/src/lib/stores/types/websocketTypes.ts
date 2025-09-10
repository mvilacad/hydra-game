import type {
  AnswerSubmitMessage,
  GamePhaseChangeMessage,
  GameStateUpdateMessage,
  PlayerAttackMessage,
  PlayerJoinMessage,
  QuestionEndMessage,
  QuestionStartMessage,
  WebSocketMessage
} from '@shared/types';
import type { Socket } from 'socket.io-client';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  lastMessage: WebSocketMessage | null;
  error: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface WebSocketActions {
  connect: (roomCode?: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  sendMessage: <T extends WebSocketMessage>(message: T) => boolean;
  clearError: () => void;
  // Room-specific actions
  joinRoom: (roomCode: string, playerData?: any) => boolean;
  leaveRoom: () => boolean;
}

export interface WebSocketStore extends WebSocketState, WebSocketActions {}

// Event handler types
export interface WebSocketEventHandlers {
  onConnect: () => void;
  onDisconnect: (reason: string) => void;
  onConnectError: (error: Error) => void;
  onReconnect: (attemptNumber: number) => void;
  onReconnectError: (error: Error) => void;
  onMaxReconnectAttempts: () => void;
}

// Server event types - what we receive from server
export interface ServerToClientEvents {
  // Game state events
  game_state_update: (data: GameStateUpdateMessage['data']) => void;
  game_phase_change: (data: GamePhaseChangeMessage['data']) => void;
  game_reset: () => void;
  
  // Player events
  player_joined: (data: { player: any }) => void;
  player_list_update: (data: { type: 'player_joined' | 'player_left'; player?: any; playerId?: string }) => void;
  player_attack: (data: PlayerAttackMessage['data']) => void;
  
  // Question events
  question_start: (question: QuestionStartMessage['data']) => void;
  question_end: (data: QuestionEndMessage['data']) => void;
  
  // Room events (NEW)
  room_joined: (data: { 
    room: any; 
    players: any[]; 
    isCreator: boolean;
    currentQuestion?: any;
  }) => void;
  room_state_update: (data: {
    room: any;
    players: any[];
    currentQuestion?: any;
  }) => void;
  room_error: (data: { error: string }) => void;
}

// Client event types - what we send to server
export interface ClientToServerEvents {
  // Player actions
  player_join: (data: PlayerJoinMessage['data']) => void;
  answer_submit: (data: AnswerSubmitMessage['data']) => void;
  
  // Admin/Creator actions
  admin_command: (data: { command: string; [key: string]: any }) => void;
  
  // Room actions (NEW)
  join_room: (data: { roomCode: string; playerData?: any }) => void;
  leave_room: () => void;
}