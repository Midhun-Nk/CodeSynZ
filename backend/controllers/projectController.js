import Project from '../models/Project.js';
import User from '../models/User.js';

// --- 1. Create a New Project ---
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      collaborators: []
    });

    res.status(201).json({
      id: project._id,
      name: project.name,
      description: project.description
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 2. Get Project Details (Metadata + Collabs + Invites) ---
// This populates the "Collaboration" sidebar
export const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId)
      .populate('owner', 'username email avatarColor')
      .populate('collaborators.user', 'username email avatarColor');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // --- Authorization: Only owner/collaborator can access ---
    const isOwner = String(project.owner._id) === String(userId);
    const isCollaborator = project.collaborators.some(c => String(c.user?._id) === String(userId));

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Access denied" });
    }

    // SAFE MAP (avoid undefined user)
    const collabs = project.collaborators
      .filter(c => c.user)
      .map(c => ({
        id: c.user._id,
        name: c.user.username,
        email: c.user.email,
        color: c.user.avatarColor,
        role: c.role,
        status: c.status,
        cursor: c.cursorPosition,
        activeFileId: c.activeFileId
      }));

    const response = {
      id: project._id,
      name: project.name,
      owner: project.owner,
      collaborators: collabs,
      pendingInvites: project.invitations.map(inv => ({
        id: inv._id,
        email: inv.email,
        status: inv.status,
        role: inv.role,
        sentAt: inv.sentAt
      }))
    };

    res.json(response);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// --- 3. Send Invite ---
export const sendInvite = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;

    const project = await Project.findById(projectId);

    if (!project) 
      return res.status(404).json({ message: "Project not found" });

    // --- Only owner can invite ---
    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the project owner can send invites" });
    }

    // Already collaborator?
    const alreadyCollab = project.collaborators.some(
      c => String(c.email) === email
    );
    if (alreadyCollab) {
      return res.status(400).json({ message: "User is already a collaborator" });
    }

    // Invite exists?
    const existingInvite = project.invitations.find(i => i.email === email);
    if (existingInvite) {
      return res.status(400).json({ message: "Invite already pending" });
    }

    const newInvite = {
      email,
      role: "editor"
    };

    project.invitations.push(newInvite);
    await project.save();

    res.json({
      message: "Invite sent",
      invite: newInvite
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// --- 4. Accept Invite ---
export const acceptInvite = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const project = await Project.findById(projectId);

    if (!project) 
      return res.status(404).json({ message: "Project not found" });

    // Invite lookup
    const inviteIndex = project.invitations.findIndex(
      inv => inv.email === user.email
    );

    if (inviteIndex === -1) {
      return res.status(403).json({ message: "Invite not found" });
    }

    // Prevent duplicate collaborators
    const exists = project.collaborators.some(
      c => String(c.user) === String(userId)
    );

    if (exists) {
      return res.status(400).json({ message: "User already a collaborator" });
    }

    // Add collaborator
    const role = project.invitations[inviteIndex].role;

    project.collaborators.push({
      user: userId,
      role,
      status: "online",
      cursorPosition: { line: 0, col: 0 },
      activeFileId: null
    });

    // Remove invite
    project.invitations.splice(inviteIndex, 1);

    await project.save();

    res.json({ message: "Joined project successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
