import { Player } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';
import { Trophy, Star, Sword, Shield, Target, Zap } from 'lucide-react';

interface RankingProps {
  players: Player[];
  className?: string;
  showDetailed?: boolean;
}

export function Ranking({ players, className, showDetailed = false }: RankingProps) {
  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getCharacterIcon = (character: string) => {
    switch (character) {
      case 'warrior': return <Sword className="w-4 h-4" />;
      case 'mage': return <Zap className="w-4 h-4" />;
      case 'archer': return <Target className="w-4 h-4" />;
      case 'paladin': return <Shield className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getCharacterColor = (character: string) => {
    switch (character) {
      case 'warrior': return 'text-orange-400 border-orange-400/30';
      case 'mage': return 'text-purple-400 border-purple-400/30';
      case 'archer': return 'text-green-400 border-green-400/30';
      case 'paladin': return 'text-yellow-400 border-yellow-400/30';
      default: return 'text-gray-400 border-gray-400/30';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-gray-400 font-bold">#{rank}</span>;
  };

  return (
    <Card className={cn("min-w-[300px]", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Ranking dos Jogadores
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {sortedPlayers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Nenhum jogador entrou ainda
          </div>
        ) : (
          sortedPlayers.map((player, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={player.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                  "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70",
                  isTop3 && "bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-yellow-400/20",
                  rank === 1 && "shadow-lg shadow-yellow-400/20"
                )}
              >
                {/* Rank */}
                <div className="flex-shrink-0">
                  {getRankIcon(rank)}
                </div>

                {/* Character Icon */}
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-full border",
                  getCharacterColor(player.character)
                )}>
                  {getCharacterIcon(player.character)}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "font-semibold truncate",
                      rank === 1 ? "text-yellow-400" : "text-white"
                    )}>
                      {player.name}
                    </h4>
                    {player.isConnected ? (
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                    )}
                  </div>

                  {showDetailed && (
                    <div className="text-xs text-gray-400 capitalize">
                      {player.character}
                    </div>
                  )}
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <div className={cn(
                    "font-bold",
                    rank === 1 ? "text-yellow-400" : "text-white"
                  )}>
                    {player.score}
                  </div>
                  {showDetailed && (
                    <div className="text-xs text-gray-400">
                      pts
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* MVP Indicator */}
        {sortedPlayers.length > 0 && sortedPlayers[0].score > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400 font-semibold">
              <Star className="w-5 h-5" />
              <span>MVP Atual: {sortedPlayers[0].name}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}