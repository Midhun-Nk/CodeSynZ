import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// init DB + models + passport
import dbconfig from './config/dbConfig.js';
import initPassport from './config/passport.js';
import Project from './models/Project.js';

// routes
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import collabRoutes from './routes/collabRoutes.js';

// middlewares
import auth from './middlewares/authMiddleware.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { runSandboxed } from './utils/safeExec.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// const "*" = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({
  origin: "*",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '10mb' }));

dbconfig();

app.use(session({
  secret: process.env.SESSION_SECRET || 'SESSION_SECRET',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());
initPassport();

// ----- ROUTES -----
app.use('/api/auth', authRoutes);
app.use('/api/projects', auth, projectRoutes);
app.use('/api', auth, fileRoutes);
app.use('/api', auth, collabRoutes);

// ----- COMPILER ROUTES (Keep existing) -----
import axios from 'axios';
app.post('/api/compiler/run', auth, rateLimiter, async (req, res) => {
  // ... (Keep your existing JDoodle logic)
  const { script, language, versionIndex } = req.body;
  try {
    const response = await axios.post('https://api.jdoodle.com/v1/execute', {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script,
      language,
      versionIndex: versionIndex || '0'
    });
    res.json({ output: response.data.output });
  } catch (err) {
    res.status(500).json({ error: 'Execution failed' });
  }
});

// app.post('/api/compiler/run-project', auth, rateLimiter, async (req, res) => {
//   // ... (Keep your existing Local run logic)
//   res.json({ output: "Multi-file execution placeholder" }); 
// });
// ----- COMPILER: Local multi-file run (sandboxed) -----
app.post('/api/compiler/run-project', auth, rateLimiter, async (req, res) => {
  const { files, entryFile } = req.body;
  if (!files || !entryFile) return res.status(400).json({ error: 'files and entryFile required' });

  // create safe temp directory
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'synccode-'));
  try {
    // write files safely
    for (const rel of Object.keys(files)) {
      const safeRel = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
      const full = path.join(tmp, safeRel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, files[rel], { encoding: 'utf8' });
    }

    // run sandboxed command
    const result = await runSandboxed({
      cwd: tmp,
      entry: entryFile,
      timeoutMs: 4000
    });

    res.json(result);
  } catch (err) {
    console.error('Local run error:', err);
    res.status(500).json({ error: err.message || 'Execution error' });
  } finally {
    // cleanup
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
  }
});
// ---------------------------------------------------------
// SOCKET.IO SETUP
// ---------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const socketUserMap = new Map();

// 1. AUTH MIDDLEWARE
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.token;
    if (!token) return next(new Error("Authentication error: No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; 
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication error: Invalid Token"));
  }
});

// 2. CONNECTION HANDLER
io.on('connection', (socket) => {
  // --- DEBUG LOG ---
  // Depending on how your JWT is signed, ID might be in .id or ._id
  const connectedUserId = socket.user.id || socket.user._id;
  console.log(`[SOCKET] Connected: ${socket.id} | UserID: ${connectedUserId}`);

  socket.on('join-room', async ({ roomId, userName, color }) => {
    try {
      // 1. Safe ID Extraction
      const userId = socket.user.id || socket.user._id;
      const userEmail = socket.user.email ? socket.user.email.toLowerCase() : '';

      console.log(`[SOCKET] ${userName} attempting to join ${roomId}`);

      // 2. Fetch Project
      const project = await Project.findById(roomId).populate('collaborators.user');
      
      if (!project) {
        console.log(`[SOCKET] Project ${roomId} not found`);
        socket.emit('error', 'Project not found');
        return;
      }

      // 3. Permission Check Logic
      const ownerId = project.owner.toString();
      const isOwner = ownerId === userId;
      
      const isCollab = project.collaborators.some(c => 
         c.user && c.user._id.toString() === userId
      );

      const isInvited = project.invitations.some(inv => 
         inv.email.toLowerCase() === userEmail
      );

      console.log(`[SOCKET] Permissions -> Owner: ${isOwner}, Collab: ${isCollab}, Invited: ${isInvited}`);

      if (!isOwner && !isCollab && !isInvited) {
         console.log(`[SOCKET] ACCESS DENIED for ${userName}`);
         socket.emit('error', 'Access Denied');
         return;
      }

      // 4. Determine Role
      let role = 'viewer';
      if (isOwner) role = 'owner';
      else if (isCollab) {
          const c = project.collaborators.find(c => c.user._id.toString() === userId);
          role = c.role;
      } else if (isInvited) {
          const inv = project.invitations.find(i => i.email.toLowerCase() === userEmail);
          role = inv.role;
      }

      // 5. Join Room & Store
      socket.join(roomId);
      
      socketUserMap.set(socket.id, { 
          userId, 
          roomId, 
          name: userName, 
          color, 
          role, 
          socketId: socket.id 
      });

      // 6. Broadcast Sync
      const users = socketArrayForProject(roomId);
      console.log(`[SOCKET] Broadcasting sync-users to ${roomId}. Users:`, users.length);
      
      // Emit to SELF
      socket.emit('sync-users', users);
      // Emit to OTHERS
      socket.to(roomId).emit('sync-users', users);
      socket.to(roomId).emit('user-joined', { id: socket.id, name: userName, color });

    } catch (err) {
      console.error('[SOCKET] join-room error:', err);
      socket.emit('error', 'Server error while joining');
    }
  });

  socket.on('code-change', ({ roomId, fileId, code }) => {
    const user = socketUserMap.get(socket.id);
    if (!user) return; // User not in map?

    // Security: Viewers cannot edit
    if (user.role === 'viewer') return; 

    // Broadcast to everyone else in room
    socket.to(roomId).emit('code-update', { fileId, code });
  });

  socket.on('cursor-move', ({ roomId, fileId, cursor }) => {
    const current = socketUserMap.get(socket.id);
    if (!current) return;

    // Update memory
    socketUserMap.set(socket.id, { ...current, fileId, cursor });

    // Broadcast
    socket.to(roomId).emit('cursor-update', { id: socket.id, fileId, cursor });
  });

  socket.on('disconnect', () => {
    const info = socketUserMap.get(socket.id);
    if (info) {
      console.log(`[SOCKET] Disconnected: ${info.name}`);
      socket.to(info.roomId).emit('user-left', socket.id);
      socketUserMap.delete(socket.id);
    }
  });
});

function socketArrayForProject(projectId) {
  const arr = [];
  for (const [sid, info] of socketUserMap.entries()) {
    if (info.roomId === String(projectId)) {
      arr.push({ 
          id: sid, 
          name: info.name, 
          color: info.color, 
          fileId: info.fileId, 
          cursor: info.cursor 
      });
    }
  }
  return arr;
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});