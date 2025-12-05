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
      id: project._id, // Standardize to 'id' for frontend
      name: project.name,
      description: project.description
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 2. Get Project Details (FIXED) ---
export const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // 1. Fetch Project with Access Requests Populated
    const project = await Project.findById(projectId)
      .populate('owner', 'username email avatarColor')
      .populate('collaborators.user', 'username email avatarColor')
      .populate('accessRequests.user', 'username email'); // <--- CRITICAL FIX

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // 2. Authorization
    const isOwner = String(project.owner._id) === String(userId);
    const isCollaborator = project.collaborators.some(c => String(c.user?._id) === String(userId));
    
    // Allow invited users to view (so they can accept!)
    const isInvited = project.invitations.some(inv => inv.email === req.user.email);

    if (!isOwner && !isCollaborator && !isInvited) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 3. Format Collaborators
    const collabs = project.collaborators
      .filter(c => c.user)
      .map(c => ({
        id: c.user._id,
        name: c.user.username,
        email: c.user.email,
        color: c.user.avatarColor,
        role: c.role,
        status: c.status,
        activeFileId: c.activeFileId
      }));

    // 4. Format Access Requests (Only visible to OWNER)
    let formattedRequests = [];
    if (isOwner && project.accessRequests) {
        formattedRequests = project.accessRequests
            .filter(req => req.status === 'pending')
            .map(req => ({
                _id: req._id,
                user: req.user, // Now fully populated
                email: req.email,
                requestedAt: req.requestedAt
            }));
    }

    res.json({
      id: project._id,
      name: project.name,
      owner: project.owner,
      collaborators: collabs,
      invitations: project.invitations,
      accessRequests: formattedRequests // <--- Sending to frontend
    });

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


// --- 5. Get All Projects for User (Dashboard) ---
export const getAllProjects = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find projects where the user is the Owner OR a Collaborator
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ]
    })
    .sort({ updatedAt: -1 }) // Sort by newest first
    .populate('owner', 'username email') 
    .select('name description updatedAt owner collaborators'); // Select specific fields

    // Format for Frontend
    const formattedProjects = projects.map(p => ({
      _id: p._id,
      title: p.name,
      description: p.description,
      updatedAt: p.updatedAt,
      isOwner: String(p.owner._id) === String(userId),
      userCount: (p.collaborators?.length || 0) + 1 // +1 for owner
    }));

    res.json(formattedProjects);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 6. Delete Project ---
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Ensure only the owner can delete
    if (String(project.owner) !== String(userId)) {
      return res.status(403).json({ message: "Only the owner can delete this project" });
    }

    await Project.findByIdAndDelete(projectId);
    
    res.json({ message: "Project deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};