import { create } from 'zustand';
import { useBattle } from './useBattle';

interface WebSocketState {
  ws: WebSocket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: any;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
  ws: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  lastMessage: null,
  
  connect: () => {
    const { ws } = get();
    
    // Don't create multiple connections
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }
    
    set({ connectionStatus: 'connecting' });
    
    try {
      // Use the current host with WebSocket protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const newWs = new WebSocket(wsUrl);
      
      newWs.onopen = () => {
        console.log('WebSocket connected');
        set({ 
          ws: newWs, 
          isConnected: true, 
          connectionStatus: 'connected' 
        });
      };
      
      newWs.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          set({ lastMessage: message });
          
          // Handle different message types
          const battleStore = useBattle.getState();
          
          switch (message.type) {
            case 'player_joined':
              battleStore.addPlayer(message.data);
              break;
              
            case 'player_left':
              battleStore.removePlayer(message.data.playerId);
              break;
              
            case 'player_answer':
              const { playerId, isCorrect, answer } = message.data;
              
              // Update player score
              const player = battleStore.players.find(p => p.id === playerId);
              if (player && isCorrect) {
                battleStore.updatePlayer(playerId, { 
                  score: player.score + 100 
                });
                
                // Add attack effect
                battleStore.addAttack({
                  id: `${playerId}-${Date.now()}`,
                  playerId,
                  type: message.data.attackType || 'sword',
                  damage: 100,
                  timestamp: Date.now()
                });
                
                // Damage hydra
                battleStore.damageHydra(100);
              }
              break;
              
            case 'question_start':
              battleStore.setCurrentQuestion(message.data);
              battleStore.setGamePhase('battle');
              break;
              
            case 'question_end':
              battleStore.setCurrentQuestion(null);
              break;
              
            case 'game_phase_change':
              battleStore.setGamePhase(message.data.phase);
              break;
              
            case 'hydra_reset':
              battleStore.resetHydra();
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      newWs.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        set({ 
          ws: null, 
          isConnected: false, 
          connectionStatus: 'disconnected' 
        });
        
        // Auto-reconnect after 3 seconds if not intentionally closed
        if (event.code !== 1000) {
          setTimeout(() => {
            get().reconnect();
          }, 3000);
        }
      };
      
      newWs.onerror = (error) => {
        console.error('WebSocket error:', error);
        set({ connectionStatus: 'error' });
      };
      
      set({ ws: newWs });
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      set({ connectionStatus: 'error' });
    }
  },
  
  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close(1000, 'User disconnected');
      set({ 
        ws: null, 
        isConnected: false, 
        connectionStatus: 'disconnected' 
      });
    }
  },
  
  sendMessage: (message) => {
    const { ws, isConnected } = get();
    if (ws && isConnected) {
      try {
        ws.send(JSON.stringify(message));
        console.log('WebSocket message sent:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  },
  
  reconnect: () => {
    const { disconnect, connect } = get();
    disconnect();
    setTimeout(connect, 1000);
  },
}));
