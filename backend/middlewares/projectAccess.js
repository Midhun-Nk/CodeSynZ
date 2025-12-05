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
    // FIX 1: Normalize email to lowercase to prevent mismatch errors
    const userEmail = req.user.email ? req.user.email.toLowerCase() : ''; 

    // Fetch project and populate collaborators
    const project = await Project.findById(projectId).populate('collaborators.user');
    
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // 1. Check Ownership
    const isOwner = project.owner.toString() === userId;

    // 2. Check Active Collaborators
    const collaborator = project.collaborators.find(c => {
      if (!c.user) return false;
      const colId = c.user._id ? c.user._id.toString() : c.user.toString();
      return colId === userId;
    });
    const isCollaborator = !!collaborator;

    // 3. Check Pending Invitations (FIX 2: Case Insensitive Check)
    // This ensures invited users can view the project to Accept/Reject the invite
    const pendingInvite = project.invitations?.find(inv => 
        inv.email.toLowerCase() === userEmail
    );
    const isInvited = !!pendingInvite;

    log("User:", userEmail, "| Owner:", isOwner, "| Collab:", isCollaborator, "| Invited:", isInvited);

    // 4. Final Access Decision
    // If you are not owner, not a collaborator, and not invited, you cannot see the project.
    if (!isOwner && !isCollaborator && !isInvited) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project.' });
    }

    // 5. Determine Role
    // Priority: Owner -> Active Collaborator Role -> Invited Role -> Viewer
    let role = 'viewer';
    if (isOwner) {
        role = 'owner';
    } else if (isCollaborator) {
        role = collaborator.role;
    } else if (isInvited) {
        // Allow invited users to see the project so they can accept the invite
        role = pendingInvite.role || 'viewer';
    }

    // Pass data to controllers
    req.project = project;
    req.isOwner = isOwner;
    req.collaboratorRole = role;

    next();

  } catch (err) {
    console.error('Project Access Error:', err);
    return res.status(500).json({ message: 'Server error in project access' });
  }
}

// OWNER-ONLY ACCESS
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