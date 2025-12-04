// middlewares/projectAccess.js
import Project from '../models/Project.js';

export async function checkProjectAccess(req, res, next) {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) return res.status(400).json({ message: 'projectId required' });

    const project = await Project.findById(projectId).select('owner collaborators invitations');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const userId = req.user._id;

    const isOwner = String(project.owner) === String(userId);
    const isCollaborator = project.collaborators.some(c => String(c.user) === String(userId));

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied. Not owner or collaborator.' });
    }

    // attach for later callbacks
    req.project = project;
    req.isOwner = isOwner;
    req.isCollaborator = isCollaborator;
    next();
  } catch (err) {
    console.error('checkProjectAccess error', err);
    res.status(500).json({ message: err.message });
  }
}
