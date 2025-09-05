import { useEffect } from 'react';
import { useWebSocket } from '@/lib/stores/useWebSocket';
import { useBattle } from '@/lib/stores/useBattle';
import { BattleScene } from '@/components/game/BattleScene';
import { DamageMeter } from '@/components/ui/damage-meter';
import { CombatLog } from '@/components/ui/combat-log';
import { BattleHUD } from '@/components/ui/battle-hud';
import { QRCodeDisplay } from '@/components/ui/qr-code-display';
import { Card, CardContent } from '@/components/ui/card';

export default function HubDisplay() {
  const { connect, isConnected, sendMessage } = useWebSocket();
  const gameState = useBattle();
  const { players, gamePhase, attacks, currentQuestion } = gameState;

  // Connect to WebSocket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Handle manual battle start
  const handleStartBattle = () => {
    if (players.length > 0 && gamePhase === 'waiting') {
      sendMessage({
        type: 'admin_command',
        data: { command: 'start_battle' }
      });
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 overflow-hidden relative">
      {/* Main battle scene */}
      <BattleScene className="absolute inset-0" />

      {/* Professional MMO-style UI Overlay */}
      <div className="absolute inset-0 pointer-events-none p-2 sm:p-4">
        {/* Top HUD - Battle Status & Question Timer */}
        <div className="absolute top-0 left-0 pointer-events-auto">
          <BattleHUD 
            gameState={gameState} 
            isConnected={isConnected} 
          />
        </div>

        {/* Right side - Damage Meter (MMO Style) */}
        <div className="absolute top-0 right-0 w-64 sm:w-80 pointer-events-auto">
          <DamageMeter
            players={players}
            attacks={attacks}
          />
        </div>

        {/* Bottom Left - Combat Log */}
        <div className="absolute bottom-0 left-0 w-72 sm:w-96 pointer-events-auto">
          <CombatLog
            attacks={attacks}
            players={players}
          />
        </div>

        {/* Center - QR Code & Battle Controls */}
        {gamePhase === 'waiting' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <QRCodeDisplay
              onStartBattle={handleStartBattle}
              canStart={players.length > 0}
              playerCount={players.length}
            />
          </div>
        )}

        {gamePhase === 'victory' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <Card className="bg-gradient-to-r from-green-900/95 to-yellow-900/95 backdrop-blur-sm border-yellow-400/50 glow-yellow max-w-md">
              <CardContent className="p-8 text-center">
                <h3 className="text-4xl sm:text-6xl font-bold text-gradient-gold mb-6">
                  🎉 VITÓRIA! 🎉
                </h3>
                <p className="text-xl sm:text-3xl text-white mb-6">
                  A Hidra foi derrotada!
                </p>
                {players.length > 0 && (
                  <div className="text-lg sm:text-2xl text-yellow-200 mb-4">
                    MVP: <span className="font-bold text-yellow-400">{players.sort((a, b) => b.score - a.score)[0]?.name}</span>
                  </div>
                )}
                <button
                  onClick={() => sendMessage({ type: 'admin_command', data: { command: 'reset_game' } })}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Nova Batalha
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {gamePhase === 'defeat' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <Card className="bg-gradient-to-r from-red-900/95 to-gray-900/95 backdrop-blur-sm border-red-400/50 glow-red max-w-md">
              <CardContent className="p-8 text-center">
                <h3 className="text-4xl sm:text-6xl font-bold text-red-400 mb-6">
                  💀 DERROTA 💀
                </h3>
                <p className="text-xl sm:text-3xl text-white mb-6">
                  A Hidra dominou os heróis...
                </p>
                <div className="text-lg sm:text-2xl text-gray-300 mb-4">
                  Mais sorte na próxima!
                </div>
                <button
                  onClick={() => sendMessage({ type: 'admin_command', data: { command: 'reset_game' } })}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Tentar Novamente
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Question Display - Enhanced */}
        {gamePhase === 'battle' && currentQuestion && (
          <div className="absolute bottom-4 right-4 left-1/2 transform -translate-x-1/2 pointer-events-auto max-w-3xl">
            <Card className="bg-gray-900/95 backdrop-blur-sm border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-400/10 rounded border border-blue-400/20">
                    <div className="w-5 h-5 text-blue-400">❓</div>
                  </div>
                  <h4 className="text-xl font-semibold text-blue-400">
                    Questão Ativa - Rodada {currentQuestion.round || 1}
                  </h4>
                </div>
                
                <p className="text-white text-xl mb-6 leading-relaxed">
                  {currentQuestion.question}
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options?.map((option: string, index: number) => (
                    <div 
                      key={index} 
                      className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/50 hover:bg-gray-700/50 transition-colors"
                    >
                      <span className="text-gray-200 font-medium">
                        {String.fromCharCode(65 + index)}. {option}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}