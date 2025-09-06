import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WaitingScreenProps {
  playerName: string;
  connectionStatus: React.ReactNode;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({
  playerName,
  connectionStatus
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <Card className="game-card w-full max-w-md p-6 text-center">
        <div className="badge-purple mb-4 inline-block">
          ⚔️ Batalha
        </div>
        
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--color-secondary))' }} />
        
        <h2 className="title-large mb-4">Pronto!</h2>
        
        <p className="text-gray-300 mb-4 text-lg">
          Bem-vindo, <span className="subtitle-red font-semibold">{playerName}</span>
        </p>
        
        <p className="text-gray-400 mb-6">
          Aguardando o início da batalha...
        </p>

        {/* Connection status */}
        <div className="mt-6">
          {connectionStatus}
        </div>
      </Card>
    </div>
  );
};