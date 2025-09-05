import { Attack, Player } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';
import { Sword, Target, Zap, Shield, Skull, AlertTriangle, ScrollText } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface CombatLogProps {
  attacks: Attack[];
  players: Player[];
  className?: string;
  maxEntries?: number;
}

interface LogEntry {
  id: string;
  type: 'attack' | 'damage' | 'miss' | 'critical' | 'death';
  message: string;
  timestamp: number;
  playerId?: string;
  damage?: number;
  attackType?: string;
  color: string;
  icon: React.ReactNode;
}

export function CombatLog({ attacks, players, className, maxEntries = 50 }: CombatLogProps) {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Convert attacks to log entries
  useEffect(() => {
    const newEntries: LogEntry[] = attacks.slice(-maxEntries).map(attack => {
      const player = players.find(p => p.id === attack.playerId);
      const playerName = player?.name || 'Unknown';
      
      const getAttackInfo = (type: string) => {
        switch (type) {
          case 'sword':
            return { name: 'Espada', icon: <Sword className="w-3 h-3" />, color: 'text-orange-400' };
          case 'arrow':
            return { name: 'Flecha', icon: <Target className="w-3 h-3" />, color: 'text-green-400' };
          case 'magic':
            return { name: 'Magia', icon: <Zap className="w-3 h-3" />, color: 'text-blue-400' };
          case 'fire':
            return { name: 'Fogo', icon: <Shield className="w-3 h-3" />, color: 'text-yellow-400' };
          default:
            return { name: 'Ataque', icon: <Sword className="w-3 h-3" />, color: 'text-gray-400' };
        }
      };

      const attackInfo = getAttackInfo(attack.type);
      
      let entryType: LogEntry['type'] = 'attack';
      let message = '';
      let color = attackInfo.color;
      let icon = attackInfo.icon;

      if (attack.damage === 0) {
        entryType = 'miss';
        message = `${playerName} errou o ataque com ${attackInfo.name}`;
        color = 'text-gray-400';
        icon = <AlertTriangle className="w-3 h-3" />;
      } else if (attack.damage > 150) { // Critical hit threshold
        entryType = 'critical';
        message = `${playerName} acerto crítico! ${attack.damage} de dano com ${attackInfo.name}`;
        color = 'text-yellow-400';
        icon = <Skull className="w-3 h-3" />;
      } else {
        entryType = 'damage';
        message = `${playerName} causou ${attack.damage} de dano com ${attackInfo.name}`;
        color = attackInfo.color;
      }

      return {
        id: attack.id,
        type: entryType,
        message,
        timestamp: attack.timestamp,
        playerId: attack.playerId,
        damage: attack.damage,
        attackType: attack.type,
        color,
        icon
      };
    });

    setLogEntries(newEntries);
  }, [attacks, players, maxEntries]);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logEntries]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <Card className={cn("bg-gray-900/95 border-gray-700/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-400">
          <ScrollText className="w-5 h-5" />
          Combat Log
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div 
          ref={scrollRef}
          className="space-y-1 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
          {logEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhuma ação de combate ainda...
            </div>
          ) : (
            logEntries.map((entry, index) => (
              <div
                key={`${entry.id}-${index}`}
                className={cn(
                  "flex items-start gap-2 p-2 rounded text-xs transition-all duration-200",
                  "hover:bg-gray-800/30",
                  entry.type === 'critical' && "bg-yellow-400/10 border border-yellow-400/20"
                )}
              >
                <div className={cn("flex-shrink-0 mt-0.5", entry.color)}>
                  {entry.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn("leading-tight", entry.color)}>
                    {entry.message}
                  </p>
                </div>
                
                <div className="flex-shrink-0 text-gray-500 text-xs">
                  {formatTime(entry.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
        
        {logEntries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-400 text-center">
            {logEntries.length} entradas • Atualização em tempo real
          </div>
        )}
      </CardContent>
    </Card>
  );
}