export type CharacterType = 'warrior' | 'mage' | 'archer' | 'paladin';

export interface CharacterTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  glow: string;
  icon: React.ReactNode;
  bgPattern: string;
}

export interface Character {
  id: CharacterType;
  name: string;
  displayName: string;
  theme: CharacterTheme;
}

export interface CharacterConfig {
  [key: string]: {
    displayName: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    glow: string;
    bgPattern: string;
    iconType: 'sword' | 'zap' | 'target' | 'shield';
  };
}