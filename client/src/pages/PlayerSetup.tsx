import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sword, Zap, Target, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerSetupProps {
  onReady: (playerData: { name: string; character: string }) => void;
}

const characters = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Master of melee combat',
    icon: Sword,
    color: 'text-orange-400 border-orange-400/30 bg-orange-400/10'
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Wielder of arcane magic',
    icon: Zap,
    color: 'text-purple-400 border-purple-400/30 bg-purple-400/10'
  },
  {
    id: 'archer',
    name: 'Archer',
    description: 'Expert marksman and ranger',
    icon: Target,
    color: 'text-green-400 border-green-400/30 bg-green-400/10'
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Holy warrior and protector',
    icon: Shield,
    color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
  }
];

export default function PlayerSetup({ onReady }: PlayerSetupProps) {
  const [name, setName] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !selectedCharacter) return;
    
    setIsLoading(true);
    
    // Simulate brief loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onReady({
      name: name.trim(),
      character: selectedCharacter
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <User className="w-8 h-8 text-purple-400" />
            Join the Battle
          </CardTitle>
          <p className="text-gray-300">Choose your hero and enter the fray</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Hero Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your hero name"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                maxLength={20}
                required
              />
            </div>

            {/* Character Selection */}
            <div className="space-y-3">
              <Label className="text-white">Choose Your Class</Label>
              <div className="grid grid-cols-2 gap-3">
                {characters.map((character) => {
                  const Icon = character.icon;
                  const isSelected = selectedCharacter === character.id;
                  
                  return (
                    <button
                      key={character.id}
                      type="button"
                      onClick={() => setSelectedCharacter(character.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all duration-200 text-left",
                        "hover:scale-105 hover:shadow-lg",
                        isSelected 
                          ? character.color + " shadow-lg" 
                          : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={cn(
                          "w-6 h-6",
                          isSelected ? character.color.split(' ')[0] : "text-gray-400"
                        )} />
                        <span className={cn(
                          "font-semibold",
                          isSelected ? "text-white" : "text-gray-300"
                        )}>
                          {character.name}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs",
                        isSelected ? "text-gray-200" : "text-gray-400"
                      )}>
                        {character.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
              disabled={!name.trim() || !selectedCharacter || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining Battle...
                </div>
              ) : (
                "Ready for Battle!"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
