import { BattleHUD } from '@/components/ui/battle-hud';
import { CombatLog } from '@/components/ui/combat-log';
import { DamageMeter } from '@/components/ui/damage-meter';
import { QRCodeDisplay } from '@/components/ui/qr-code-display';
import { BattleScene } from '@/features/game-3d';
import { useBattle } from '@/lib/stores/useBattle';
import { useWebSocket } from '@/lib/stores/useWebSocket';
import { useEffect } from 'react';

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
    <div className="w-full h-screen game-background overflow-hidden relative">
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
            <div className="game-card p-8 text-center max-w-md">
              <div className="badge-purple mb-4 inline-block">
                🎉 Vitória
              </div>
              <h3 className="title-large mb-6">
                VITÓRIA!
              </h3>
              <p className="subtitle-red mb-6">
                A Hidra foi derrotada!
              </p>
              {players.length > 0 && (
                <div className="text-lg sm:text-2xl text-gray-300 mb-4">
                  MVP: <span className="font-bold text-white">{players.sort((a, b) => b.score - a.score)[0]?.name}</span>
                </div>
              )}
              <button
                onClick={() => sendMessage({ type: 'admin_command', data: { command: 'reset_game' } })}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Nova Batalha
              </button>
            </div>
          </div>
        )}

        {gamePhase === 'defeat' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <div className="game-card p-8 text-center max-w-md">
              <div className="badge-purple mb-4 inline-block">
                💀 Derrota
              </div>
              <h3 className="title-large mb-6">
                DERROTA
              </h3>
              <p className="subtitle-red mb-6">
                A Hidra dominou os heróis...
              </p>
              <div className="text-lg text-gray-300 mb-4">
                Mais sorte na próxima!
              </div>
              <button
                onClick={() => sendMessage({ type: 'admin_command', data: { command: 'reset_game' } })}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        )}

        {/* Current Question Display - Figma Style */}
        {gamePhase === 'battle' && currentQuestion && (
          <div className="absolute bottom-4 right-4 left-1/2 transform -translate-x-1/2 pointer-events-auto max-w-3xl">
            <div className="game-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="badge-purple">
                  ❓ Questão
                </div>
                <h4 className="text-xl font-semibold text-white">
                  Rodada {currentQuestion.round || 1}
                </h4>
              </div>
              
              <p className="text-white text-xl mb-6 leading-relaxed">
                {currentQuestion.question}
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options?.map((option: string, index: number) => (
                  <div 
                    key={index} 
                    className="game-card p-4 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span className="text-gray-200 font-medium">
                      {String.fromCharCode(65 + index)}. {option}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}