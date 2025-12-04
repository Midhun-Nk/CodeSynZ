import Project from '../models/Project.js';
import User from '../models/User.js';

// --- 1. Send Invite (Owner Only) ---
export const sendInvite = async (req, res) => {
  try {
    const { email, role = 'editor' } = req.body; 
    const project = req.project; // Populated by middleware

    // 1. Validation: Self-invite
    if (req.user?.email && email === req.user.email) {
      return res.status(400).json({ message: "You cannot invite yourself" });
    }

    // 2. Resolve Target User
    const targetUser = await User.findOne({ email });
    
    // 3. Check if already collaborator
    if (targetUser) {
        // CRITICAL FIX: Use optional chaining (?.) and check for existence
        const isAlreadyCollab = project.collaborators.some(c => {
            if (!c.user) return false; // Skip "ghost" users
            const collabId = c.user._id ? c.user._id.toString() : c.user.toString();
            return collabId === targetUser._id.toString();
        });

        if (isAlreadyCollab) {
            return res.status(400).json({ message: "User is already a collaborator" });
        }
    }

    // 4. Check if invite pending
    const existingInvite = project.invitations.find(i => i.email === email);
    if (existingInvite) {
      return res.status(400).json({ message: "Invite already sent to this email" });
    }

    // 5. Add to DB
    project.invitations.push({
      email,
      role,
      status: 'pending'
    });
    
    await project.save();

    res.json({ message: `Invite sent to ${email}`, invite: project.invitations.at(-1) });

  } catch (error) {
    console.error("Invite Error:", error);
    res.status(500).json({ error: error.message });
  }
};
// --- 2. Respond to Invite (Accept/Reject) ---
export const respondToInvite = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const userId = req.user._id;
    const userEmail = req.user.email;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // 1. Find Invite
    const inviteIndex = project.invitations.findIndex(i => i.email === userEmail);

    if (inviteIndex === -1) {
      return res.status(404).json({ message: "No invite found for your email address" });
    }

    const invite = project.invitations[inviteIndex];

    if (status === 'accepted') {
      // Check if already in collaborators (safety net)
      const exists = project.collaborators.some(c => String(c.user) === String(userId));
      
      if (!exists) {
        project.collaborators.push({
          user: userId,
          role: invite.role,
          // Removed ephemeral state (cursor/status) from here based on File 1 analysis
        });
      }
      
      // Remove invite
      project.invitations.splice(inviteIndex, 1);
      await project.save();
      return res.json({ message: "Welcome to the project!", projectId: project._id });

    } else if (status === 'rejected') {
      // Remove invite
      project.invitations.splice(inviteIndex, 1);
      await project.save();
      return res.json({ message: "Invite rejected" });
    }

    res.status(400).json({ message: "Invalid status" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. Remove Collaborator (Owner OR Self) ---
export const removeCollaborator = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const project = req.project; // Populated by checkProjectAccess
    const currentUserId = req.user._id.toString();

    const isOwner = project.owner.toString() === currentUserId;
    const isSelf = userId === currentUserId;

    // 1. Permission Check: Must be Owner OR the user removing themselves
    if (!isOwner && !isSelf) {
        return res.status(403).json({ message: "You do not have permission to remove this user." });
    }

    // 2. Integrity Check: Cannot remove the Project Owner
    // (Even the owner cannot remove themselves via this route; they must delete the project)
    if (project.owner.toString() === userId) {
      return res.status(400).json({ message: "Owner cannot be removed. Delete project instead." });
    }

    // 3. Atomic Pull
    await Project.findByIdAndUpdate(projectId, {
      $pull: { collaborators: { user: userId } }
    });

    res.json({ message: isSelf ? "You left the project" : "Collaborator removed" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 4. Get User's Pending Invites ---
export const getMyInvites = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Find projects where invitations array contains this email
    const projects = await Project.find({
      'invitations.email': userEmail
    }).select('name description owner createdAt invitations');

    const invites = projects.map(p => {
        const invite = p.invitations.find(i => i.email === userEmail);
        return {
            projectId: p._id,
            projectName: p.name,
            ownerId: p.owner, // Consider populating owner name here if needed
            role: invite.role,
            sentAt: invite.sentAt
        };
    });

    res.json(invites);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};