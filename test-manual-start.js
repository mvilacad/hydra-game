import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
  
  // Join as hub
  socket.emit('join_room', { roomCode: 'J2Q66Q', isHub: true });
  
  // Wait 2 seconds then send start command
  setTimeout(() => {
    console.log('Sending admin_command: start_game');
    socket.emit('admin_command', { command: 'start_game' });
    
    // Disconnect after 5 seconds
    setTimeout(() => {
      console.log('Disconnecting...');
      socket.disconnect();
    }, 5000);
  }, 2000);
});

socket.on('game_state_update', (data) => {
  console.log('Received game_state_update:', {
    phase: data.phase,
    players: data.players?.length,
    hasTimestamps: !!(data.phaseStartsAt && data.phaseEndsAt)
  });
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  process.exit(1);
});