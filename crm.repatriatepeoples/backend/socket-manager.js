'use strict';

let io = null;

function initSocket(server) {
  const { Server } = require('socket.io');
  // Allow CORS for clients — adjust origin in production
  io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  return io;
}

module.exports = { initSocket, getIO };
