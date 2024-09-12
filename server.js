const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const chatRooms = new Map(); // Map to store chat rooms and their clients

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Generate a unique chat room ID
function generateRoomId() {
  return crypto.randomBytes(8).toString('hex');
}

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const roomId = new URL(req.headers.origin).pathname.slice(1) || generateRoomId();
  
  if (!chatRooms.has(roomId)) {
    chatRooms.set(roomId, new Set());
  }
  
  const clients = chatRooms.get(roomId);
  clients.add(ws);

  console.log(`Client connected to room ${roomId}`);

  ws.on('message', (message) => {
    console.log(`Received message in room ${roomId}:`, message);
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log(`Client disconnected from room ${roomId}`);
    clients.delete(ws);
    if (clients.size === 0) {
      chatRooms.delete(roomId);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
