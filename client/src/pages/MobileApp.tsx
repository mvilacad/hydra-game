import { useState, useEffect } from 'react';
import { useWebSocket } from '@/lib/stores/useWebSocket';
import { useBattle } from '@/lib/stores/useBattle';
import { useAudio } from '@/lib/stores/useAudio';
import PlayerSetup from './PlayerSetup';
import Question from './Question';
import { Card, CardContent } from '@/components/ui/card';
import { Timer } from '@/components/ui/timer';
import { Ranking } from '@/components/ui/ranking';
import { Loader2, Wifi, WifiOff } from 'lucide-react';

export default function MobileApp() {
  const [gamePhase, setGamePhase] = useState<'setup' | 'waiting' | 'question' | 'results' | 'ended'>('setup');
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  
  const { 
    isConnected, 
    connect, 
    disconnect, 
    sendMessage 
  } = useWebSocket();
  
  const { 
    players, 
    gamePhase: battlePhase,
    hydraHealth 
  } = useBattle();

  const { playSuccess, playHit } = useAudio();

  // Connect to WebSocket on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Handle player setup completion
  const handlePlayerReady = (playerData: { name: string; character: string }) => {
    setCurrentPlayer(playerData);
    setGamePhase('waiting');
    
    sendMessage({
      type: 'player_join',
      data: playerData
    });
  };

  // Handle answer submission
  const handleAnswerSubmit = (answer: string) => {
    if (!currentQuestion || !currentPlayer) return;
    
    const isCorrect = answer === currentQuestion.correct;
    
    sendMessage({
      type: 'answer_submit',
      data: {
        playerId: currentPlayer.id,
        questionId: currentQuestion.id,
        answer,
        isCorrect,
        timeSpent: 30 - timeLeft
      }
    });

    // Play feedback sound
    if (isCorrect) {
      playSuccess();
    } else {
      playHit();
    }

    setGamePhase('results');
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
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
                <h2 className="text-2xl font-bold mb-2">Ready to Battle!</h2>
                <p className="text-gray-300 mb-4">
                  Welcome, <span className="text-purple-400 font-semibold">{currentPlayer?.name}</span>
                </p>
                <p className="text-gray-400">
                  Waiting for the battle to begin...
                </p>
                
                {/* Connection status */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {isConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">Disconnected</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'question':
        return (
          <div className="min-h-screen flex flex-col justify-between p-4">
            {/* Timer at top */}
            <div className="flex justify-center mb-4">
              <Timer 
                duration={30} 
                onComplete={() => handleAnswerSubmit('')}
                className="scale-75"
              />
            </div>
            
            {/* Question */}
            <div className="flex-1">
              <Question 
                question={currentQuestion}
                onAnswer={handleAnswerSubmit}
                timeLeft={timeLeft}
              />
            </div>
            
            {/* Player info at bottom */}
            <div className="mt-4">
              <Card className="bg-gray-800/50">
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-400">Playing as</span>
                    <div className="font-semibold text-white capitalize">
                      {currentPlayer?.name} • {currentPlayer?.character}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-400">Score</span>
                    <div className="font-bold text-purple-400">
                      {players.find(p => p.id === currentPlayer?.id)?.score || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
        
      case 'results':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">Round Complete!</h2>
                <p className="text-gray-300 mb-6">
                  Waiting for next question...
                </p>
                
                {/* Mini ranking */}
                <Ranking 
                  players={players.slice(0, 3)} 
                  className="bg-transparent border-none shadow-none"
                  showDetailed={false}
                />
                
                {/* Hydra health */}
                <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <div className="text-sm text-red-400 mb-2">Hydra Health</div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${(hydraHealth / 1000) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {hydraHealth} / 1000
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
                  {hydraHealth <= 0 ? '🎉 VICTORY! 🎉' : '💀 DEFEAT 💀'}
                </h2>
                <p className="text-gray-300 mb-6">
                  {hydraHealth <= 0 
                    ? 'The Hydra has been defeated!' 
                    : 'The Hydra has overwhelmed the heroes...'
                  }
                </p>
                
                <Ranking players={players} showDetailed={true} />
                
                <button
                  onClick={() => setGamePhase('setup')}
                  className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Play Again
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
    <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 min-h-screen">
      {renderContent()}
    </div>
  );
}
