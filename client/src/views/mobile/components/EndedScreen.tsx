import { Card, CardContent } from '@/components/ui/card';
import { Ranking } from '@/components/ui/ranking';

import type { Player } from '@shared/types';

interface EndedScreenProps {
  isVictory: boolean;
  players: Player[];
  onRestart: () => void;
}

export const EndedScreen: React.FC<EndedScreenProps> = ({
  isVictory,
  players,
  onRestart
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <Card className="game-card w-full max-w-md p-6 text-center">
        <div className="badge-purple mb-4 inline-block">
          {isVictory ? '🎉 Vitória' : '💀 Derrota'}
        </div>
        
        <h2 className="title-large mb-4">
          {isVictory ? 'VITÓRIA!' : 'DERROTA'}
        </h2>
        
        <p className="subtitle-red mb-6">
          {isVictory
            ? 'A Hidra foi derrotada!'
            : 'A Hidra dominou os heróis...'
          }
        </p>

        <Ranking players={players} showDetailed={true} />

        <button
          onClick={onRestart}
          className="mt-6 w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all"
        >
          Jogar Novamente
        </button>
      </Card>
    </div>
  );
};