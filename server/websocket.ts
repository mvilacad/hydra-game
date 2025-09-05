import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface Player {
  id: string;
  name: string;
  character: string;
  score: number;
  isConnected: boolean;
  socketId?: string;
}

interface GameState {
  phase: 'waiting' | 'battle' | 'victory' | 'defeat';
  players: Map<string, Player>;
  hydraHealth: number;
  maxHydraHealth: number;
  currentQuestion: any;
  questionStartTime: number;
}

const gameState: GameState = {
  phase: 'waiting',
  players: new Map(),
  hydraHealth: 1000,
  maxHydraHealth: 1000,
  currentQuestion: null,
  questionStartTime: 0
};

// Sample questions pool
const questionPool = [
  {
    id: "q1",
    question: "Qual é a capital da França?",
    options: ["Londres", "Berlim", "Paris", "Madrid"],
    correct: "Paris",
    type: "sword"
  },
  {
    id: "q2",
    question: "Qual planeta é conhecido como o Planeta Vermelho?",
    options: ["Vênus", "Marte", "Júpiter", "Saturno"],
    correct: "Marte",
    type: "arrow"
  },
  {
    id: "q3",
    question: "Quanto é 15 + 27?",
    options: ["40", "42", "45", "47"],
    correct: "42",
    type: "magic"
  },
  {
    id: "q4",
    question: "Quem pintou a Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
    correct: "Da Vinci",
    type: "fire"
  },
  {
    id: "q5",
    question: "Qual é o maior oceano da Terra?",
    options: ["Atlântico", "Índico", "Ártico", "Pacífico"],
    correct: "Pacífico",
    type: "sword"
  },
  {
    id: "q6",
    question: "Qual é o símbolo químico do ouro?",
    options: ["Go", "Gd", "Au", "Ag"],
    correct: "Au",
    type: "magic"
  },
  {
    id: "q7",
    question: "Quantos continentes existem?",
    options: ["5", "6", "7", "8"],
    correct: "7",
    type: "arrow"
  },
  {
    id: "q8",
    question: "Em que ano terminou a Segunda Guerra Mundial?",
    options: ["1943", "1944", "1945", "1946"],
    correct: "1945",
    type: "fire"
  }
];

let currentQuestionIndex = 0;
let questionTimer: NodeJS.Timeout | null = null;
let battleTimer: NodeJS.Timeout | null = null;

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io/"
  });

  console.log('WebSocket server initialized');

  // Broadcast game state to all clients
  function broadcastGameState() {
    const playerArray = Array.from(gameState.players.values());
    
    io.emit('game_state_update', {
      phase: gameState.phase,
      players: playerArray,
      hydraHealth: gameState.hydraHealth,
      maxHydraHealth: gameState.maxHydraHealth,
      currentQuestion: gameState.currentQuestion
    });
  }

  // Start a new question
  function startQuestion() {
    if (currentQuestionIndex >= questionPool.length) {
      // No more questions, end game
      gameState.phase = gameState.hydraHealth > 0 ? 'defeat' : 'victory';
      broadcastGameState();
      return;
    }

    const question = questionPool[currentQuestionIndex];
    gameState.currentQuestion = question;
    gameState.questionStartTime = Date.now();
    currentQuestionIndex++;

    console.log(`Starting question ${currentQuestionIndex}: ${question.question}`);

    io.emit('question_start', question);
    broadcastGameState();

    // Auto-advance after 30 seconds
    questionTimer = setTimeout(() => {
      endQuestion();
    }, 30000);
  }

  // End current question
  function endQuestion() {
    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }

    gameState.currentQuestion = null;
    io.emit('question_end');

    // Check win/lose conditions
    if (gameState.hydraHealth <= 0) {
      gameState.phase = 'victory';
      io.emit('game_phase_change', { phase: 'victory' });
      broadcastGameState();
      return;
    }

    if (currentQuestionIndex >= questionPool.length) {
      gameState.phase = 'defeat';
      io.emit('game_phase_change', { phase: 'defeat' });
      broadcastGameState();
      return;
    }

    // Start next question after brief pause
    setTimeout(() => {
      if (gameState.players.size > 0) {
        startQuestion();
      }
    }, 3000);
  }

  // Start battle when players are ready
  function startBattle() {
    if (gameState.players.size === 0) return;

    gameState.phase = 'battle';
    currentQuestionIndex = 0;
    gameState.hydraHealth = gameState.maxHydraHealth;

    console.log('Starting battle with', gameState.players.size, 'players');
    
    io.emit('game_phase_change', { phase: 'battle' });
    broadcastGameState();

    // Start first question after brief delay
    setTimeout(() => {
      startQuestion();
    }, 2000);
  }

  // Reset game
  function resetGame() {
    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }
    if (battleTimer) {
      clearTimeout(battleTimer);
      battleTimer = null;
    }

    gameState.phase = 'waiting';
    gameState.hydraHealth = gameState.maxHydraHealth;
    gameState.currentQuestion = null;
    currentQuestionIndex = 0;

    // Reset all player scores
    gameState.players.forEach(player => {
      player.score = 0;
    });

    console.log('Game reset');
    
    io.emit('game_reset');
    broadcastGameState();
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send current game state to new client
    socket.emit('game_state_update', {
      phase: gameState.phase,
      players: Array.from(gameState.players.values()),
      hydraHealth: gameState.hydraHealth,
      maxHydraHealth: gameState.maxHydraHealth,
      currentQuestion: gameState.currentQuestion
    });

    // Handle player joining
    socket.on('player_join', (data) => {
      const { name, character } = data;
      
      if (!name || !character) {
        socket.emit('error', { message: 'Nome e personagem são obrigatórios' });
        return;
      }

      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const player: Player = {
        id: playerId,
        name: name.trim(),
        character,
        score: 0,
        isConnected: true,
        socketId: socket.id
      };

      gameState.players.set(playerId, player);
      
      console.log(`Player joined: ${player.name} (${player.character})`);
      
      socket.emit('player_joined', { playerId, player });
      io.emit('player_list_update', { 
        type: 'player_joined', 
        player 
      });
      
      broadcastGameState();

      // Start battle if this is the first player and we're waiting
      if (gameState.phase === 'waiting' && gameState.players.size === 1) {
        setTimeout(() => {
          startBattle();
        }, 2000);
      }
    });

    // Handle answer submission
    socket.on('answer_submit', (data) => {
      const { playerId, answer, isCorrect, timeSpent } = data;
      
      const player = gameState.players.get(playerId);
      if (!player || !gameState.currentQuestion) {
        return;
      }

      console.log(`${player.name} answered: ${answer} (${isCorrect ? 'correct' : 'wrong'})`);

      if (isCorrect) {
        // Award points based on speed
        const timeBonus = Math.max(0, 30 - timeSpent);
        const points = 100 + Math.floor(timeBonus * 2);
        player.score += points;

        // Damage hydra
        const damage = 100;
        gameState.hydraHealth = Math.max(0, gameState.hydraHealth - damage);

        // Broadcast attack
        io.emit('player_attack', {
          playerId,
          attackType: gameState.currentQuestion.type,
          damage,
          isCorrect: true,
          points
        });

        console.log(`Hydra took ${damage} damage! Health: ${gameState.hydraHealth}/${gameState.maxHydraHealth}`);
      } else {
        // Wrong answer feedback
        io.emit('player_attack', {
          playerId,
          attackType: 'miss',
          damage: 0,
          isCorrect: false,
          points: 0
        });
      }

      broadcastGameState();
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Find and remove player by socket ID
      let disconnectedPlayer: Player | null = null;
      const playersArray = Array.from(gameState.players.entries());
      for (const [playerId, player] of playersArray) {
        if (player.socketId === socket.id) {
          disconnectedPlayer = player;
          gameState.players.delete(playerId);
          break;
        }
      }

      if (disconnectedPlayer) {
        console.log(`Player left: ${disconnectedPlayer.name}`);
        io.emit('player_list_update', { 
          type: 'player_left', 
          playerId: disconnectedPlayer.id 
        });
        broadcastGameState();

        // Reset game if no players left
        if (gameState.players.size === 0) {
          resetGame();
        }
      }
    });

    // Handle manual game reset (for testing)
    socket.on('reset_game', () => {
      console.log('Manual game reset requested');
      resetGame();
    });

    // Handle admin commands
    socket.on('admin_command', (data) => {
      const { command } = data;
      
      switch (command) {
        case 'start_battle':
          if (gameState.phase === 'waiting') {
            startBattle();
          }
          break;
          
        case 'reset_game':
          resetGame();
          break;
          
        case 'damage_hydra':
          gameState.hydraHealth = Math.max(0, gameState.hydraHealth - 200);
          broadcastGameState();
          break;
          
        case 'heal_hydra':
          gameState.hydraHealth = gameState.maxHydraHealth;
          broadcastGameState();
          break;
      }
    });
  });

  console.log('WebSocket handlers registered');
}
