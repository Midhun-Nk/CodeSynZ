// routes/projectRoutes.js
import express from 'express';
import { createProject, getProjectDetails, sendInvite, acceptInvite } from '../controllers/projectController.js';
import { checkProjectAccess } from '../middlewares/projectAccess.js';
const router = express.Router();

// Create project - auth already run in server.js when mounting
router.post('/', createProject);

// Get details (only owner/collaborator)
router.get('/:projectId', checkProjectAccess, getProjectDetails);

// Owner-only: send invite
router.post('/:projectId/invite', checkProjectAccess, (req, res, next) => {
  if (!req.isOwner) return res.status(403).json({ message: 'Only owner may invite' });
  next();
}, sendInvite);

// Accept invite - authenticated user can call this
router.post('/:projectId/join', acceptInvite);

export default router;
