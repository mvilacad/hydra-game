import { useEffect } from 'react';
import { useWebSocket } from '@/lib/stores/useWebSocket';
import { useBattle } from '@/lib/stores/useBattle';
import { BattleScene } from '@/components/game/BattleScene';
import { Ranking } from '@/components/ui/ranking';
import { Timer } from '@/components/ui/timer';
import { Card, CardContent } from '@/components/ui/card';
import { Sword, Users, Target } from 'lucide-react';

export default function HubDisplay() {
  const { connect, isConnected } = useWebSocket();
  const {
    players,
    gamePhase,
    hydraHealth,
    maxHydraHealth,
    currentQuestion,
    questionTimeLeft
  } = useBattle();

  // Connect to WebSocket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  const healthPercent = (hydraHealth / maxHydraHealth) * 100;

  return (
    <div className="w-full h-screen bg-gray-900 overflow-hidden">
      {/* Main battle scene */}
      <div className="relative w-full h-full">
        <BattleScene className="absolute inset-0" />

        {/* UI Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top HUD */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
            {/* Game Status */}
            <Card className="bg-black/70 backdrop-blur-sm border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Sword className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="font-bold text-white">Status da Batalha</h3>
                    <p className="text-gray-300 capitalize">{gamePhase}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-white">{players.length}</span>
                    <span className="text-gray-400">Jogadores</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-gray-400">
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Question Timer */}
            {gamePhase === 'battle' && currentQuestion && (
              <Card className="bg-black/70 backdrop-blur-sm border-blue-500/30">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-white mb-2">Tempo da Pergunta</h4>
                  <Timer
                    duration={30}
                    onComplete={() => { }}
                    className="scale-75"
                    showProgress={false}
                  />

                  <div className="mt-2 text-sm text-gray-300">
                    <Target className="w-4 h-4 inline mr-1" />
                    Rodada {currentQuestion?.round || 1}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right side - Player Ranking */}
          <div className="absolute top-4 right-4 pointer-events-auto">
            <Ranking
              players={players}
              showDetailed={true}
              className="bg-black/70 backdrop-blur-sm border-yellow-500/30"
            />
          </div>

          {/* Bottom HUD - Game Phase Info */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
            <div className="flex justify-center">
              {gamePhase === 'waiting' && (
                <Card className="bg-black/70 backdrop-blur-sm border-purple-500/30">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-2xl font-bold text-purple-400 mb-2">
                      Aguardando Heróis...
                    </h3>
                    <p className="text-gray-300">
                      Jogadores podem entrar visitando o app móvel
                    </p>
                    <div className="mt-4 text-sm text-gray-400">
                      {players.length} jogador{players.length !== 1 ? 'es' : ''} conectado{players.length !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              )}

              {gamePhase === 'victory' && (
                <Card className="bg-gradient-to-r from-green-900/80 to-yellow-900/80 backdrop-blur-sm border-yellow-400/50">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-4xl font-bold text-yellow-400 mb-4">
                      🎉 VICTORY! 🎉
                    </h3>
                    <p className="text-xl text-white mb-4">
                      A Hidra foi derrotada!
                    </p>
                    {players.length > 0 && (
                      <div className="text-lg text-yellow-200">
                        MVP: <span className="font-bold">{players[0]?.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {gamePhase === 'defeat' && (
                <Card className="bg-gradient-to-r from-red-900/80 to-gray-900/80 backdrop-blur-sm border-red-400/50">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-4xl font-bold text-red-400 mb-4">
                      💀 DEFEAT 💀
                    </h3>
                    <p className="text-xl text-white mb-4">
                      Os heróis caíram...
                    </p>
                    <div className="text-lg text-gray-300">
                      Mais sorte na próxima vez!
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Current Question Display (for hub) */}
          {gamePhase === 'battle' && currentQuestion && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
              <Card className="bg-black/80 backdrop-blur-sm border-blue-500/30 max-w-2xl">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-blue-400 mb-3">
                    Questão Atual
                  </h4>
                  <p className="text-white text-xl mb-4">
                    {currentQuestion.question}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {currentQuestion.options?.map((option: string, index: number) => (
                      <div key={index} className="p-2 bg-gray-800/50 rounded border border-gray-600/50">
                        <span className="text-gray-300">{String.fromCharCode(65 + index)}. {option}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}