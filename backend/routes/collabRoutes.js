import express from 'express';
import { checkProjectAccess, requireOwner } from '../middlewares/projectAccess.js';
import { 
    sendInvite, 
    respondToInvite, 
    removeCollaborator,
    getMyInvites, 
    updateCollaboratorRole,
    requestProjectAccess,
    reviewAccessRequest
} from '../controllers/collabController.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- DASHBOARD ROUTES ---
router.get('/invites', auth, getMyInvites);

// NEW: Request Access (For non-members)
// Note: No checkProjectAccess middleware here, as the user is not a member yet.
router.post('/projects/:projectId/request-access', auth, requestProjectAccess);
router.post('/projects/:projectId/access-requests/review', auth, reviewAccessRequest);
// --- PROJECT SPECIFIC ROUTES ---

// 1. Send Invite (Strictly Owner only)
router.post('/projects/:projectId/invite', auth, checkProjectAccess, requireOwner, sendInvite);

// 2. Accept/Reject Invite (User logged in, no project access needed yet)
router.post('/projects/:projectId/invite/respond', auth, respondToInvite);

// 3. Update Collaborator Role (e.g., Viewer -> Editor)
// STRICTLY OWNER ONLY
router.patch('/projects/:projectId/collaborators/:userId', auth, checkProjectAccess, requireOwner, updateCollaboratorRole);

// 4. Remove Collaborator / Leave Project
// Logic handles "Owner kicking user" OR "User leaving self"
router.delete('/projects/:projectId/collaborators/:userId', auth, checkProjectAccess, removeCollaborator);
export default router;