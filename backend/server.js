require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend (assuming it runs on port 5173 or 3000)
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your frontend URL
    methods: ["GET", "POST"]
  }
});

// --- 1. JDoodle Compiler API Route ---
app.post('/run', async (req, res) => {
  const { script, language, versionIndex } = req.body;

  // Map your frontend language keys to JDoodle language codes
  const languageMap = {
    'nodejs': 'nodejs',
    'python3': 'python3',
    'java': 'java',
    'cpp17': 'cpp17',
    'c': 'c',
    'go': 'go'
  };

  const jdoodleLang = languageMap[language] || language;

  try {
    const response = await axios.post('https://api.jdoodle.com/v1/execute', {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: script,
      language: jdoodleLang,
      versionIndex: versionIndex || '0'
    });

    res.json({ output: response.data.output });
  } catch (error) {
    console.error('JDoodle Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Execution failed', details: error.message });
  }
});

// --- 2. Socket.io Collaboration Logic ---

// Store user state in memory
const userState = {}; 

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins the project room
  socket.on('join-room', (user) => {
    const { roomId, userName, color } = user;
    socket.join(roomId);
    
    // Save user info (Initialize fileId as null)
    userState[socket.id] = { 
      id: socket.id, 
      name: userName, 
      color, 
      roomId, // Store roomId to broadcast disconnects efficiently
      fileId: null, 
      cursor: { line: 0, col: 0 } 
    };

    // Broadcast to others in the room that a user joined
    socket.to(roomId).emit('user-joined', userState[socket.id]);
    
    // Send current list of users to the new joiner
    // We filter specifically for users in this room
    const roomUsers = Object.values(userState).filter(u => u.roomId === roomId);
    socket.emit('sync-users', roomUsers);
  });

  // Handle Code Changes
  // UPDATED: Now accepts and broadcasts fileId
  socket.on('code-change', ({ roomId, fileId, code }) => {
    // Broadcast code AND fileId to everyone else in the room
    socket.to(roomId).emit('code-update', { fileId, code });
  });

  // Handle Cursor Movements
  // UPDATED: Now accepts and broadcasts fileId
  socket.on('cursor-move', ({ roomId, fileId, cursor }) => {
    if (userState[socket.id]) {
      // Update server state
      userState[socket.id].cursor = cursor;
      userState[socket.id].fileId = fileId; 
      
      // Broadcast new cursor position AND fileId to others
      socket.to(roomId).emit('cursor-update', { id: socket.id, fileId, cursor });
    }
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const disconnectedUser = userState[socket.id];
    
    if (disconnectedUser) {
      // Notify others in the specific room
      socket.to(disconnectedUser.roomId).emit('user-left', socket.id);
      delete userState[socket.id];
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});