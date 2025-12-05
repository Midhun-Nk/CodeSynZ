// routes/projectRoutes.js
import express from 'express';
import { createProject, getProjectDetails, sendInvite, acceptInvite, getAllProjects, deleteProject } from '../controllers/projectController.js';
import { checkProjectAccess } from '../middlewares/projectAccess.js';
import auth from '../middlewares/authMiddleware.js';
import Project from '../models/Project.js';
const router = express.Router();

// Create project - auth already run in server.js when mounting
router.post('/', auth, createProject);
router.get('/', auth, getAllProjects); // List (New)
// Get details (only owner/collaborator)
router.get('/:projectId',auth, checkProjectAccess, getProjectDetails);

// Owner-only: send invite
router.post('/:projectId/invite',auth, checkProjectAccess, (req, res, next) => {
  if (!req.isOwner) return res.status(403).json({ message: 'Only owner may invite' });
  next();
}, sendInvite);

// Accept invite - authenticated user can call this
router.post('/:projectId/join',auth, acceptInvite);

router.delete('/:projectId', auth, deleteProject);

// router.post('/:projectId/request-access', auth, async (req, res) => {
//     try {
//         const { projectId } = req.params;
//         const project = await Project.findById(projectId);
        
//         if (!project) return res.status(404).json({ message: "Project not found" });

//         // Add to a 'accessRequests' array in your model, 
//         // OR just send an email/notification to the owner
//         // For now, let's just log it or add to invitations with 'pending_approval' status
        
//         /* Example Logic:
//            project.accessRequests.push({ userId: req.user.id, email: req.user.email });
//            await project.save();
//         */

//         res.json({ message: "Request sent successfully" });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
export default router;
