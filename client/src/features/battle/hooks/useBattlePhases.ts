import { useState, useCallback, useRef, useEffect } from 'react';
import type { BattlePhase, BattleState, BattlePhaseTransition } from '../types/battleTypes';

const INITIAL_BATTLE_STATE: BattleState = {
  phase: 'setup',
  questionTimer: { timeLeft: 30, isActive: false },
  preparationTimer: { count: 3, isActive: false },
  isTransitioning: false
};

export const useBattlePhases = () => {
  const [battleState, setBattleState] = useState<BattleState>(INITIAL_BATTLE_STATE);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const transitionToPhase = useCallback((
    newPhase: BattlePhase, 
    duration?: number, 
    callback?: () => void
  ) => {
    setBattleState(prev => ({ ...prev, isTransitioning: true }));

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = setTimeout(() => {
      setBattleState(prev => ({
        ...prev,
        phase: newPhase,
        isTransitioning: false
      }));
      
      callback?.();
    }, duration || 500);
  }, []);

  const startPreparationPhase = useCallback(() => {
    setBattleState(prev => ({
      ...prev,
      phase: 'preparing',
      preparationTimer: { count: 3, isActive: true }
    }));

    const countdown = (count: number) => {
      if (count > 0) {
        setTimeout(() => {
          setBattleState(prev => ({
            ...prev,
            preparationTimer: { count: count - 1, isActive: true }
          }));
          countdown(count - 1);
        }, 1000);
      } else {
        setTimeout(() => {
          setBattleState(prev => ({
            ...prev,
            phase: 'question',
            preparationTimer: { count: 0, isActive: false },
            questionTimer: { timeLeft: 30, isActive: true }
          }));
        }, 500);
      }
    };

    countdown(3);
  }, []);

  const startQuestionTimer = useCallback(() => {
    setBattleState(prev => ({
      ...prev,
      questionTimer: { timeLeft: 30, isActive: true }
    }));
  }, []);

  const stopQuestionTimer = useCallback(() => {
    setBattleState(prev => ({
      ...prev,
      questionTimer: { ...prev.questionTimer, isActive: false }
    }));
  }, []);

  const resetBattle = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    setBattleState(INITIAL_BATTLE_STATE);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return {
    battleState,
    transitionToPhase,
    startPreparationPhase,
    startQuestionTimer,
    stopQuestionTimer,
    resetBattle
  };
};