import express from 'express';
import { checkProjectAccess, requireOwner } from '../middlewares/projectAccess.js';
import { 
    sendInvite, 
    respondToInvite, 
    removeCollaborator,
    getMyInvites 
} from '../controllers/collabController.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- DASHBOARD ROUTES ---
router.get('/invites', auth, getMyInvites);

// --- PROJECT SPECIFIC ROUTES ---

// 1. Send Invite (Strictly Owner only)
router.post('/projects/:projectId/invite', auth, checkProjectAccess, requireOwner, sendInvite);

// 2. Accept/Reject Invite (User logged in, no project access needed yet)
router.post('/projects/:projectId/invite/respond', auth, respondToInvite);

// 3. Remove Collaborator / Leave Project
// REMOVED 'requireOwner' here because we now handle the logic (Owner vs Self) inside the controller
router.delete('/projects/:projectId/collaborators/:userId', auth, checkProjectAccess, removeCollaborator);

export default router;