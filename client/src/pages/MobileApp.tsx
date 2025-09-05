import { useState, useEffect } from 'react';
import { useWebSocket } from '@/lib/stores/useWebSocket';
import { useBattle } from '@/lib/stores/useBattle';
import { useAudio } from '@/lib/stores/useAudio';
import PlayerSetup from './PlayerSetup';
import Question from './Question';
import { Card, CardContent } from '@/components/ui/card';
import { Timer } from '@/components/ui/timer';
import { Ranking } from '@/components/ui/ranking';
import { Loader2, Wifi, WifiOff, Zap, Shield, Sword, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileApp() {
  const [gamePhase, setGamePhase] = useState<'setup' | 'waiting' | 'preparing' | 'question' | 'results' | 'ended'>('setup');
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [preparationTimer, setPreparationTimer] = useState(3);

  // Debug current player state
  useEffect(() => {
    console.log('Current player updated:', currentPlayer);
  }, [currentPlayer]);

  const {
    isConnected,
    connect,
    disconnect,
    sendMessage
  } = useWebSocket();

  const {
    players,
    gamePhase: battlePhase,
    hydraHealth,
    maxHydraHealth,
    currentQuestion: battleCurrentQuestion
  } = useBattle();

  const { playSuccess, playHit } = useAudio();

  // Connect to WebSocket on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Listen for player updates to get player ID
  useEffect(() => {
    if (currentPlayer && !currentPlayer.id && players.length > 0) {
      // Find our player in the players list by matching name and character
      const matchingPlayer = players.find(p =>
        p.name === currentPlayer.name &&
        p.character === currentPlayer.character
      );

      if (matchingPlayer && matchingPlayer.id) {
        console.log('Found matching player with ID:', matchingPlayer.id);
        setCurrentPlayer({
          ...currentPlayer,
          id: matchingPlayer.id
        });
      }
    }
  }, [currentPlayer, players]);

  // Listen for new questions from battle store
  useEffect(() => {
    if (battleCurrentQuestion && currentPlayer) {
      // If we have a new question (different from current one)
      if (!currentQuestion || currentQuestion.id !== battleCurrentQuestion.id) {
        setCurrentQuestion(battleCurrentQuestion);
        setTimeLeft(30);
      }
    } else if (!battleCurrentQuestion && currentQuestion) {
      // Question ended, reset to waiting
      setCurrentQuestion(null);
      if (gamePhase === 'question' || gamePhase === 'results') {
        setGamePhase('waiting');
      }
    }
  }, [battleCurrentQuestion, currentPlayer, currentQuestion, gamePhase]);

  // Listen for battle phase changes
  useEffect(() => {
    if (battlePhase === 'battle' && currentPlayer && gamePhase === 'waiting') {
      // Start preparation phase first
      setGamePhase('preparing');
      setPreparationTimer(3);
      
      // Use recursive setTimeout for more reliable countdown
      const startCountdown = (count: number) => {
        if (count > 0) {
          setTimeout(() => {
            setPreparationTimer(count - 1);
            startCountdown(count - 1);
          }, 1000);
        } else {
          // Always go to question phase after countdown
          setTimeout(() => {
            setGamePhase('question');
          }, 500);
        }
      };
      
      startCountdown(3);
      
    } else if (battlePhase === 'waiting' && gamePhase === 'results') {
      setGamePhase('waiting');
    } else if (battlePhase === 'victory' || battlePhase === 'defeat') {
      setGamePhase('ended');
    }
  }, [battlePhase, currentPlayer, gamePhase, battleCurrentQuestion]);

  // Handle player setup completion
  const handlePlayerReady = (playerData: { name: string; character: string }) => {
    console.log('Player ready:', playerData);
    setCurrentPlayer(playerData);
    setGamePhase('waiting');

    sendMessage({
      type: 'player_join',
      data: playerData
    });
  };

  // Handle answer submission
  const handleAnswerSubmit = (answer: string) => {
    if (!currentQuestion || !currentPlayer) {
      console.log('Cannot submit answer - missing data:', { currentQuestion, currentPlayer });
      return;
    }

    const isCorrect = answer === currentQuestion.correct;
    const submitData = {
      playerId: currentPlayer.id,
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      timeSpent: 30 - timeLeft
    };

    console.log('Submitting answer:', submitData);

    sendMessage({
      type: 'answer_submit',
      data: submitData
    });

    // Play feedback sound
    if (isCorrect) {
      playSuccess();
    } else {
      playHit();
    }

    setGamePhase('results');

    // Auto-return to waiting after a delay to be ready for next question
    setTimeout(() => {
      if (gamePhase === 'results') {
        setGamePhase('waiting');
      }
    }, 3000);
  };

  // Character theme helper function
  const getCharacterTheme = (character: string) => {
    switch (character) {
      case 'warrior':
        return {
          name: 'Guerreiro',
          primary: 'from-orange-600 to-red-600',
          secondary: 'from-orange-900/80 to-red-900/80',
          accent: 'text-orange-400',
          border: 'border-orange-500/40',
          glow: 'shadow-orange-500/30',
          icon: <Sword className="w-20 h-20 text-white" />,
          bgPattern: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent'
        };
      case 'mage':
        return {
          name: 'Mago',
          primary: 'from-blue-600 to-purple-600',
          secondary: 'from-blue-900/80 to-purple-900/80',
          accent: 'text-blue-400',
          border: 'border-blue-500/40',
          glow: 'shadow-blue-500/30',
          icon: <Zap className="w-20 h-20 text-white" />,
          bgPattern: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-purple-500/10 to-transparent'
        };
      case 'archer':
        return {
          name: 'Arqueiro',
          primary: 'from-green-600 to-emerald-600',
          secondary: 'from-green-900/80 to-emerald-900/80',
          accent: 'text-green-400',
          border: 'border-green-500/40',
          glow: 'shadow-green-500/30',
          icon: <Target className="w-20 h-20 text-white" />,
          bgPattern: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent'
        };
      case 'paladin':
        return {
          name: 'Paladino',
          primary: 'from-yellow-600 to-amber-600',
          secondary: 'from-yellow-900/80 to-amber-900/80',
          accent: 'text-yellow-400',
          border: 'border-yellow-500/40',
          glow: 'shadow-yellow-500/30',
          icon: <Shield className="w-20 h-20 text-white" />,
          bgPattern: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent'
        };
      default:
        return {
          name: 'Herói',
          primary: 'from-red-600 to-red-700',
          secondary: 'from-red-900/80 to-red-900/80',
          accent: 'text-red-400',
          border: 'border-red-500/40',
          glow: 'shadow-red-500/30',
          icon: <Sword className="w-20 h-20 text-white" />,
          bgPattern: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent'
        };
    }
  };

  // Render based on current phase
  const renderContent = () => {
    switch (gamePhase) {
      case 'setup':
        return <PlayerSetup onReady={handlePlayerReady} />;

      case 'waiting':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-red-400" />
                <h2 className="text-2xl font-bold mb-2">Pronto para a Batalha!</h2>
                <p className="text-gray-300 mb-4">
                  Bem-vindo, <span className="text-red-400 font-semibold">{currentPlayer?.name}</span>
                </p>
                <p className="text-gray-400">
                  Aguardando o início da batalha...
                </p>

                {/* Connection status */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {isConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">Conectado</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">Desconectado</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'preparing':
        const theme = getCharacterTheme(currentPlayer?.character);
        
        return (
          <div className={cn("min-h-screen relative overflow-hidden flex items-center justify-center p-4", theme.bgPattern)}>
            {/* Epic Background Effects */}
            <div className="absolute inset-0 opacity-30">
              <div className={cn("absolute top-20 left-20 w-64 h-64 rounded-full blur-3xl", `bg-gradient-to-br ${theme.primary}`)} />
              <div className={cn("absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl", `bg-gradient-to-tl ${theme.primary}`)} />
              <div className={cn("absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-50", `bg-gradient-to-r ${theme.primary}`)} />
            </div>

            <Card className={cn("w-full max-w-md backdrop-blur-xl border-2 relative z-10", `bg-gradient-to-br ${theme.secondary}`, theme.border, theme.glow, "shadow-2xl")}>
              <CardContent className="p-10 text-center">
                {/* Character Icon with Epic Design */}
                <div className="mb-8">
                  <div className={cn("w-32 h-32 mx-auto rounded-2xl flex items-center justify-center", `bg-gradient-to-br ${theme.primary}`, theme.glow, "shadow-2xl relative")}>
                    {theme.icon}
                    <div className={cn("absolute inset-0 rounded-2xl", `bg-gradient-to-br ${theme.primary}`, "opacity-20 animate-pulse")} />
                  </div>
                </div>
                
                <h2 className="text-4xl font-bold mb-4 text-white">
                  {theme.name}, Prepare-se!
                </h2>
                
                <p className="text-xl text-gray-300 mb-8">
                  A batalha épica está começando...
                </p>
                
                {/* Epic Countdown */}
                <div className="relative mb-8">
                  <div className={cn("w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center relative", theme.border, `bg-gradient-to-br ${theme.secondary}`, theme.glow, "shadow-2xl")}>
                    <span className={cn("text-5xl font-bold animate-pulse", theme.accent)}>
                      {preparationTimer}
                    </span>
                    {/* Rotating border effect */}
                    <div className={cn("absolute inset-0 rounded-full border-4 border-transparent", `bg-gradient-to-r ${theme.primary}`, "animate-spin")} style={{ maskImage: 'linear-gradient(45deg, transparent 50%, black 50%)', WebkitMaskImage: 'linear-gradient(45deg, transparent 50%, black 50%)' }} />
                  </div>
                </div>
                
                <div className={cn("inline-flex items-center gap-3 px-6 py-3 rounded-full", `bg-gradient-to-r ${theme.primary}`, "shadow-lg")}>
                  <span className="text-white font-bold text-lg capitalize">
                    {currentPlayer?.name}
                  </span>
                  <span className="text-white/80">•</span>
                  <span className={cn("font-semibold capitalize", theme.accent)}>
                    {theme.name}
                  </span>
                </div>
                
                {/* Battle preparation text */}
                <div className="mt-6 text-center">
                  <p className={cn("text-sm font-semibold", theme.accent)}>
                    ⚔️ Preparando arsenal de combate...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'question':
        // If no question yet, show loading state
        if (!currentQuestion) {
          return (
            <div className="min-h-screen flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
                  <h2 className="text-2xl font-bold mb-2">Carregando Pergunta...</h2>
                  <p className="text-gray-300">
                    Aguarde um momento...
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        }
        
        return (
          <Question
            question={currentQuestion}
            onAnswer={handleAnswerSubmit}
            timeLeft={timeLeft}
            character={currentPlayer?.character}
          />
        );

      case 'results':
        const resultsTheme = getCharacterTheme(currentPlayer?.character);
        const currentPlayerData = players.find(p => p.id === currentPlayer?.id);
        const isTopPlayer = players.length > 0 && players.sort((a, b) => b.score - a.score)[0]?.id === currentPlayer?.id;
        
        return (
          <div className={cn("h-screen relative overflow-hidden flex items-center justify-center p-4", resultsTheme.bgPattern)}>
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-20">
              <div className={cn("absolute top-20 left-20 w-48 h-48 rounded-full blur-3xl", `bg-gradient-to-br ${resultsTheme.primary}`)} />
              <div className={cn("absolute bottom-20 right-20 w-64 h-64 rounded-full blur-3xl", `bg-gradient-to-tl ${resultsTheme.primary}`)} />
            </div>

            <Card className={cn("w-full max-w-md backdrop-blur-xl border-2 relative z-10", `bg-gradient-to-br ${resultsTheme.secondary}`, resultsTheme.border, resultsTheme.glow, "shadow-2xl")}>
              <CardContent className="p-8 text-center">
                {/* Character Success/Status */}
                <div className="mb-6">
                  <div className={cn("w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4", `bg-gradient-to-br ${resultsTheme.primary}`, resultsTheme.glow, "shadow-xl")}>
                    {resultsTheme.icon}
                  </div>
                  
                  <h2 className={cn("text-3xl font-bold mb-2", isTopPlayer ? "text-yellow-400" : "text-white")}>
                    {isTopPlayer ? "🏆 LIDERANDO!" : "⚔️ BATALHA CONTINUA!"}
                  </h2>
                  
                  <p className="text-xl text-gray-300">
                    {isTopPlayer ? "Você está dominando a batalha!" : "Aguardando próxima pergunta..."}
                  </p>
                </div>

                {/* Player Stats */}
                <div className={cn("p-4 rounded-xl mb-6", `bg-gradient-to-r ${resultsTheme.primary}`, "bg-opacity-20 backdrop-blur-sm")}>
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <div className="text-sm opacity-80">Seu Score</div>
                      <div className="text-2xl font-bold">{currentPlayerData?.score || 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-80">Posição</div>
                      <div className="text-2xl font-bold">
                        #{players.sort((a, b) => b.score - a.score).findIndex(p => p.id === currentPlayer?.id) + 1}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini Ranking - Top 3 */}
                <div className="mb-6">
                  <h3 className="text-white font-bold mb-3 text-lg">🏆 Top Heróis</h3>
                  <div className="space-y-2">
                    {players.sort((a, b) => b.score - a.score).slice(0, 3).map((player, index) => (
                      <div 
                        key={player.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg",
                          player.id === currentPlayer?.id 
                            ? `bg-gradient-to-r ${resultsTheme.primary} shadow-lg` 
                            : "bg-black/20 backdrop-blur-sm"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold", 
                          index === 0 ? "bg-yellow-500 text-black" :
                          index === 1 ? "bg-gray-400 text-black" :
                          "bg-amber-600 text-white"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-white font-semibold">{player.name}</div>
                          <div className={cn("text-xs capitalize", resultsTheme.accent)}>{player.character}</div>
                        </div>
                        <div className="text-white font-bold">{player.score}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hydra Health */}
                <div className="p-4 bg-red-900/30 border border-red-500/40 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-400 font-semibold">🐉 Vida da Hidra</span>
                    <span className="text-white font-bold">{hydraHealth} / {maxHydraHealth}</span>
                  </div>
                  
                  <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700 ease-out"
                      style={{ width: `${(hydraHealth / maxHydraHealth) * 100}%` }}
                    />
                  </div>
                  
                  <div className="mt-2 text-center">
                    <span className={cn("text-sm font-semibold",
                      hydraHealth <= maxHydraHealth * 0.3 ? "text-red-400" :
                      hydraHealth <= maxHydraHealth * 0.6 ? "text-yellow-400" :
                      "text-green-400"
                    )}>
                      {hydraHealth <= maxHydraHealth * 0.3 ? "🔥 CRÍTICA!" :
                       hydraHealth <= maxHydraHealth * 0.6 ? "⚠️ FERIDA" :
                       "💪 FORTE"}
                    </span>
                  </div>
                </div>

                {/* Battle Status */}
                <div className="mt-6">
                  <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full", `bg-gradient-to-r ${resultsTheme.primary}`, "animate-pulse")}>
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    <span className="text-white font-semibold text-sm">Preparando próximo ataque...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'ended':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <h2 className="text-3xl font-bold mb-4">
                  {hydraHealth <= 0 ? '🎉 VITÓRIA! 🎉' : '💀 DERROTA 💀'}
                </h2>
                <p className="text-gray-300 mb-6">
                  {hydraHealth <= 0
                    ? 'A Hidra foi derrotada!'
                    : 'A Hidra dominou os heróis...'
                  }
                </p>

                <Ranking players={players} showDetailed={true} />

                <button
                  onClick={() => setGamePhase('setup')}
                  className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Jogar Novamente
                </button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-900/10 to-gray-900 min-h-screen">
      {renderContent()}
    </div>
  );
}

