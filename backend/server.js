// server.js
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

// init DB + models + passport
import DbConfig from './config/dbconfig.js';
import initPassport from './config/passport.js';
import Project from './models/Project.js';


// routes (your existing controllers/routes)
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';   // expects /api/projects routes
import fileRoutes from './routes/fileRoutes.js';        // expects /api/projects/:projectId/files and /api/files etc

// middlewares
import auth from './middlewares/authMiddleware.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { runSandboxed } from './utils/safeExec.js';
import collabRoutes from './routes/collabRoutes.js';
// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// ----- CORS -----
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '10mb' }));

// DB connect
DbConfig();

// ----- Session + Passport (for OAuth flows) -----
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
// Auth routes (login, oauth callbacks)
app.use('/api/auth', authRoutes);

// Project routes (all routes under /api/projects/*)
app.use('/api/projects', auth, projectRoutes);

// File routes
// fileRoutes should itself register routes like:
// GET  /projects/:projectId/files   -> getProjectFiles (protected by checkProjectAccess inside route definitions)
// POST /files                       -> createFile (expects projectId in body; protected by checkProjectAccess as middleware)
app.use('/api', auth, fileRoutes);
app.use('/api', auth, collabRoutes);

// ----- COMPILER: JDoodle (external) -----
import axios from 'axios';
app.post('/api/compiler/run', auth, rateLimiter, async (req, res) => {
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
    console.error('JDoodle error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Execution failed', details: err.message });
  }
});

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

// ----- SOCKET.IO -----
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// We'll keep an in-memory map for quick lookups, but persist presence to DB
const socketUserMap = new Map(); // socketId -> { userId, projectId, color, name }

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join-room', async ({ roomId, userName, color, token }) => {
    try {
      // Validate JWT token (optional — recommend validating on connection)
      // We rely on your frontend to send auth per API calls; still persist join event
      socket.join(roomId);
      socketUserMap.set(socket.id, { roomId, name: userName, color, socketId: socket.id });

      // Persist "online" status in project collaborators if present
      // Try to find a Project doc with this roomId (you can use a mapping if roomId !== project._id)
      // Here we assume roomId === project._id
      const project = await Project.findById(roomId);
      if (project) {
        // nothing automatic — frontend should have invited/collaborator mapping
        // but we update collaborator status if user already present in project.collaborators by email/username
        // We'll emit current list
        const users = socketArrayForProject(roomId);
        io.to(roomId).emit('sync-users', users);

        // also notify others
        socket.to(roomId).emit('user-joined', { id: socket.id, name: userName, color });
      }
    } catch (err) {
      console.error('join-room error', err);
    }
  });

  socket.on('code-change', ({ roomId, fileId, code }) => {
    socket.to(roomId).emit('code-update', { fileId, code });
  });

  socket.on('cursor-move', async ({ roomId, fileId, cursor, userId }) => {
    // update in-memory
    const current = socketUserMap.get(socket.id) || {};
    socketUserMap.set(socket.id, { ...current, fileId, cursor });

    // emit to others
    socket.to(roomId).emit('cursor-update', { id: socket.id, fileId, cursor });

    // Optionally persist to Project.collaborators (if the user is part of that project)
    try {
      if (userId && roomId) {
        await Project.updateOne(
          { _id: roomId, 'collaborators.user': userId },
          { $set: {
            'collaborators.$.cursorPosition': cursor,
            'collaborators.$.activeFileId': fileId,
            'collaborators.$.status': 'online'
          } }
        );
      }
    } catch (err) {
      console.error('Failed to persist cursor:', err);
    }
  });

  socket.on('file-structure-change', ({ roomId }) => {
    socket.to(roomId).emit('file-structure-update');
  });

  socket.on('disconnect', async () => {
    const info = socketUserMap.get(socket.id);
    if (info) {
      socket.to(info.roomId).emit('user-left', socket.id);
      socketUserMap.delete(socket.id);

      // Optionally set user offline in DB (requires userId)
      // skip if not known
    }
  });
});

// helper: return simple list of online users for projectId
function socketArrayForProject(projectId) {
  const arr = [];
  for (const [sid, info] of socketUserMap.entries()) {
    if (info.roomId === String(projectId)) {
      arr.push({ id: sid, name: info.name, color: info.color, fileId: info.fileId, cursor: info.cursor });
    }
  }
  return arr;
}

// ----- START SERVER -----
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
