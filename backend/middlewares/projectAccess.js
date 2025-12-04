import Project from '../models/Project.js';

// LOGGING (toggle ON/OFF)
const DEBUG = true;
const log = (...msg) => DEBUG && console.log('[ACCESS]', ...msg);

// BASIC ACCESS CHECK
export async function checkProjectAccess(req, res, next) {
  try {
    const projectId = req.params.projectId || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ message: 'projectId required' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id.toString();

    const project = await Project.findById(projectId).populate('collaborators.user');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.owner.toString() === userId;

    // Filter out deleted users (null)
    const collaborator = project.collaborators.find(c => {
      if (!c.user) return false;
      const colId = c.user._id ? c.user._id.toString() : c.user.toString();
      return colId === userId;
    });

    const isCollaborator = !!collaborator;

    log("OWNER:", project.owner.toString());
    log("USER :", userId);
    log("IS OWNER?", isOwner);
    log("IS COLLAB?", isCollaborator);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied (not owner/collaborator)' });
    }

    // Pass data to controllers
    req.project = project;
    req.isOwner = isOwner;
    req.collaboratorRole = isOwner ? 'owner' : collaborator?.role || 'viewer';

    next();

  } catch (err) {
    console.error('Project Access Error:', err);
    return res.status(500).json({ message: 'Server error in project access' });
  }
}

// OWNER-ONLY ACCESS (used for invite + dangerous actions)
export function requireOwner(req, res, next) {
  if (!req.isOwner) {
    return res.status(403).json({ message: 'Only project owner can perform this action' });
  }
  next();
}

// EDITOR OR OWNER
export function requireEditor(req, res, next) {
  if (!['owner', 'editor'].includes(req.collaboratorRole)) {
    return res.status(403).json({ message: 'Viewers cannot modify project' });
  }
  next();
}
