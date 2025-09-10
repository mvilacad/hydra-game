import type { Server } from "socket.io";
import { gameService } from "./GameService";
import { gameStorage } from "../storage/gameStorage";

// Tipos para o sistema autoritativo
export type AuthoritativeGamePhase = 
  | 'LOBBY'
  | 'PREPARING' // Contagem regressiva para a pergunta
  | 'QUESTION'  // Pergunta ativa
  | 'REVEAL'    // Mostrando resposta correta/incorreta  
  | 'SCOREBOARD'// Exibindo pontuações da rodada
  | 'ENDED';    // Fim de jogo (victory/defeat)

export interface AuthoritativeGameState {
  phase: AuthoritativeGamePhase;
  question?: {
    id: string | number;
    question: string;
    options: string[];
    type: "sword" | "arrow" | "magic" | "fire";
    timeLimit: number;
    position: number;
  };
  players: {
    id: string | number;
    name: string;
    character: "warrior" | "mage" | "archer" | "paladin";
    score: number;
    playerId: string;
    isConnected: boolean;
  }[];
  hydraHealth: number;
  maxHydraHealth: number;
  phaseStartsAt: string; // ISO timestamp UTC
  phaseEndsAt: string;   // ISO timestamp UTC
  currentQuestionIndex?: number;
}

/**
 * Representa um game loop individual para uma partida
 * Cada instância gerencia o estado autoritativo de uma partida
 */
class GameLoop {
  private gameId: number;
  private io: Server;
  private timer: NodeJS.Timeout | null = null;
  private currentState: AuthoritativeGameState;
  private tickInterval = 250; // 250ms para precisão

  constructor(gameId: number, io: Server, initialState: AuthoritativeGameState) {
    this.gameId = gameId;
    this.io = io;
    this.currentState = initialState;
  }

  /**
   * Inicia o game loop
   */
  start(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log(`🎮 Starting game loop for game ${this.gameId}`);
    
    // Inicia com fase de preparação
    this.transitionToPhase('PREPARING', 3000); // 3 segundos de preparação

    this.timer = setInterval(() => {
      this.runTick();
    }, this.tickInterval);
  }

  /**
   * Para o game loop
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log(`🛑 Stopped game loop for game ${this.gameId}`);
  }

  /**
   * Executa um tick do game loop - verifica se precisa fazer transições
   */
  private runTick(): void {
    const now = Date.now();
    const phaseEndsAt = new Date(this.currentState.phaseEndsAt).getTime();

    // Verifica se a fase atual expirou
    if (now >= phaseEndsAt) {
      this.handlePhaseTimeout();
    }
  }

  /**
   * Lida com timeout da fase atual
   */
  private async handlePhaseTimeout(): Promise<void> {
    switch (this.currentState.phase) {
      case 'PREPARING':
        await this.startQuestion();
        break;
      
      case 'QUESTION':
        await this.endQuestion();
        break;
      
      case 'REVEAL':
        await this.showScoreboard();
        break;
      
      case 'SCOREBOARD':
        await this.nextQuestionOrEnd();
        break;
    }
  }

  /**
   * Inicia uma pergunta
   */
  private async startQuestion(): Promise<void> {
    try {
      // Pega a próxima pergunta do GameService
      const question = await gameService.nextQuestion(this.gameId);
      
      if (!question) {
        // Não há mais perguntas - jogo termina
        await this.endGame('defeat');
        return;
      }

      // Atualiza estado para pergunta ativa
      this.transitionToPhase('QUESTION', question.timeLimit * 1000, question);
      
    } catch (error) {
      console.error('Error starting question:', error);
      await this.endGame('defeat');
    }
  }

  /**
   * Termina uma pergunta
   */
  private async endQuestion(): Promise<void> {
    // Transição para mostrar resultados
    this.transitionToPhase('REVEAL', 3000); // 3 segundos para mostrar resultado
  }

  /**
   * Mostra scoreboard
   */
  private async showScoreboard(): Promise<void> {
    // Atualiza estado do jogo
    await this.updateGameState();
    
    // Transição para scoreboard
    this.transitionToPhase('SCOREBOARD', 5000); // 5 segundos de scoreboard
  }

  /**
   * Avança para próxima pergunta ou termina o jogo
   */
  private async nextQuestionOrEnd(): Promise<void> {
    try {
      const gameState = await gameService.getGameState(this.gameId);
      
      if (!gameState) {
        await this.endGame('defeat');
        return;
      }

      // Verifica condições de fim de jogo
      if (gameState.game.hydraHealth <= 0) {
        await this.endGame('victory');
        return;
      }

      // Verifica se há mais perguntas
      const questions = await gameStorage.getGameQuestions(this.gameId);
      
      const currentIndex = gameState.game.currentQuestionIndex ?? 0;
      
      if (currentIndex >= questions.length - 1) {
        // Não há mais perguntas
        await this.endGame('defeat');
        return;
      }

      // Continua para próxima pergunta
      this.transitionToPhase('PREPARING', 3000);
      
    } catch (error) {
      console.error('Error in nextQuestionOrEnd:', error);
      await this.endGame('defeat');
    }
  }

  /**
   * Termina o jogo
   */
  private async endGame(result: 'victory' | 'defeat'): Promise<void> {
    try {
      await gameService.endGame(this.gameId, result);
      
      this.currentState.phase = 'ENDED';
      this.currentState.phaseStartsAt = new Date().toISOString();
      this.currentState.phaseEndsAt = new Date(Date.now() + 10000).toISOString(); // 10s para mostrar resultado
      
      await this.broadcastGameState();
      
      // Para o loop após o jogo terminar
      setTimeout(() => {
        this.stop();
      }, 10000);
      
    } catch (error) {
      console.error('Error ending game:', error);
    }
  }

  /**
   * Faz transição para uma nova fase
   */
  private transitionToPhase(
    newPhase: AuthoritativeGamePhase, 
    duration: number,
    question?: any
  ): void {
    const now = new Date();
    const endsAt = new Date(now.getTime() + duration);

    this.currentState.phase = newPhase;
    this.currentState.phaseStartsAt = now.toISOString();
    this.currentState.phaseEndsAt = endsAt.toISOString();
    
    if (question) {
      this.currentState.question = {
        id: question.id,
        question: (question.questionData as any).question,
        options: (question.questionData as any).options,
        type: (question.questionData as any).type,
        timeLimit: question.timeLimit,
        position: question.position,
      };
    }

    console.log(`🔄 Game ${this.gameId} transitioned to ${newPhase} (${duration}ms)`);
    
    // Broadcast novo estado
    this.broadcastGameState();
  }

  /**
   * Atualiza o estado do jogo com dados do banco
   */
  private async updateGameState(): Promise<void> {
    try {
      const gameState = await gameService.getGameState(this.gameId);
      
      if (gameState) {
        this.currentState.players = gameState.players.map((p) => ({
          id: p.id,
          name: p.name,
          character: p.character,
          score: p.score,
          playerId: p.playerId,
          isConnected: p.isConnected,
        }));
        
        this.currentState.hydraHealth = gameState.game.hydraHealth;
        this.currentState.maxHydraHealth = gameState.game.maxHydraHealth;
        this.currentState.currentQuestionIndex = gameState.game.currentQuestionIndex ?? 0;
      }
    } catch (error) {
      console.error('Error updating game state:', error);
    }
  }

  /**
   * Faz broadcast do estado atual para todos os clientes
   */
  private async broadcastGameState(): Promise<void> {
    await this.updateGameState();
    
    const roomName = `game-${this.gameId}`;
    
    this.io.to(roomName).emit("game_state_update", this.currentState);
    
    console.log(`📡 Broadcasted state for game ${this.gameId}: ${this.currentState.phase}`);
  }

  /**
   * Obtém o estado atual
   */
  getState(): AuthoritativeGameState {
    return { ...this.currentState };
  }
}

/**
 * Serviço que gerencia múltiplos game loops
 * Singleton que mantém controle de todas as partidas ativas
 */
class GameLoopService {
  private gameLoops = new Map<number, GameLoop>();

  /**
   * Inicia um game loop para uma partida
   */
  async startGame(gameId: number, io: Server): Promise<boolean> {
    try {
      // Para qualquer loop existente
      this.stopGame(gameId);

      // Pega estado inicial do jogo
      const gameState = await gameService.getGameState(gameId);
      
      if (!gameState) {
        console.error(`Cannot start game loop: Game ${gameId} not found`);
        return false;
      }

      // Estado inicial autoritativo
      const initialState: AuthoritativeGameState = {
        phase: 'LOBBY',
        players: gameState.players.map((p) => ({
          id: p.id,
          name: p.name,
          character: p.character,
          score: p.score,
          playerId: p.playerId,
          isConnected: p.isConnected,
        })),
        hydraHealth: gameState.game.hydraHealth,
        maxHydraHealth: gameState.game.maxHydraHealth,
        phaseStartsAt: new Date().toISOString(),
        phaseEndsAt: new Date(Date.now() + 1000).toISOString(), // 1s placeholder
        currentQuestionIndex: gameState.game.currentQuestionIndex ?? 0,
      };

      // Cria e inicia novo game loop
      const gameLoop = new GameLoop(gameId, io, initialState);
      this.gameLoops.set(gameId, gameLoop);
      
      gameLoop.start();
      
      console.log(`✅ Game loop started for game ${gameId}`);
      return true;
      
    } catch (error) {
      console.error(`Error starting game loop for game ${gameId}:`, error);
      return false;
    }
  }

  /**
   * Para um game loop
   */
  stopGame(gameId: number): void {
    const gameLoop = this.gameLoops.get(gameId);
    
    if (gameLoop) {
      gameLoop.stop();
      this.gameLoops.delete(gameId);
      console.log(`⏹️ Game loop stopped for game ${gameId}`);
    }
  }

  /**
   * Para todos os game loops
   */
  stopAllGames(): void {
    console.log(`⏹️ Stopping all ${this.gameLoops.size} game loops`);
    
    Array.from(this.gameLoops.values()).forEach(gameLoop => {
      gameLoop.stop();
    });
    
    this.gameLoops.clear();
  }

  /**
   * Obtém estado de um game loop
   */
  getGameState(gameId: number): AuthoritativeGameState | null {
    const gameLoop = this.gameLoops.get(gameId);
    return gameLoop ? gameLoop.getState() : null;
  }

  /**
   * Verifica se um jogo está rodando
   */
  isGameRunning(gameId: number): boolean {
    return this.gameLoops.has(gameId);
  }

  /**
   * Obtém estatísticas do serviço
   */
  getStats() {
    return {
      activeGames: this.gameLoops.size,
      gameIds: Array.from(this.gameLoops.keys()),
    };
  }
}

// Export singleton instance
export const gameLoopService = new GameLoopService();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down game loops...');
  gameLoopService.stopAllGames();
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down game loops...');
  gameLoopService.stopAllGames();
});