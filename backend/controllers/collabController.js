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

export const reviewAccessRequest = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, status } = req.body; // status: 'approved' or 'rejected'

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // 1. Verify Owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only owner can review requests" });
    }

    // 2. Find the request
    const requestIndex = project.accessRequests.findIndex(
      r => r.user.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Request not found" });
    }

    // 3. Handle Decision
    if (status === 'approved') {
        // Check if already a collaborator to avoid duplicates
        const alreadyExists = project.collaborators.some(
            c => c.user?.toString() === userId
        );

        if (!alreadyExists) {
            project.collaborators.push({
                user: userId,
                role: 'viewer', // Default role, or pass it in body
                status: 'offline'
            });
        }
    }

    // 4. Remove the request (For BOTH 'approved' and 'rejected')
    project.accessRequests.splice(requestIndex, 1);

    await project.save();

    res.json({ message: `Request ${status}` });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// --- 4. Update Collaborator Role (Owner Only) ---
// controllers/collabController.js

// ... (keep existing imports and requestProjectAccess function) ...

// --- FIXED: Remove Collaborator ---
// export const removeCollaborator = async (req, res) => {
//   try {
//     const { projectId, userId } = req.params;
    
//     // We fetch fresh to ensure atomic accuracy, but you can use req.project too
//     const project = await Project.findById(projectId);
    
//     if (String(project.owner) !== String(req.user._id)) {
//         return res.status(403).json({ message: "Only owner can remove members" });
//     }

//     const initialLength = project.collaborators.length;

//     // FIX: Check if c.user is an ID or an Object (handle both cases)
//     project.collaborators = project.collaborators.filter(c => {
//         if (!c.user) return false; // cleanup ghosts
//         const colId = c.user._id ? c.user._id.toString() : c.user.toString();
//         return colId !== userId;
//     });

//     if (initialLength === project.collaborators.length) {
//         return res.status(404).json({ message: "Collaborator not found in this project" });
//     }

//     await project.save();
//     res.json({ message: "User removed" });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// --- FIXED: Update Collaborator Role ---
export const updateCollaboratorRole = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    const validRoles = ['editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Use the project attached by middleware (which is populated)
    const project = req.project; 

    // Prevent changing Owner
    if (project.owner._id.toString() === userId) {
        return res.status(400).json({ message: "Cannot change owner role" });
    }

    // FIX: Safe ID Comparison
    const collaborator = project.collaborators.find(c => {
        if (!c.user) return false;
        // Handle populated (c.user._id) vs unpopulated (c.user)
        const colId = c.user._id ? c.user._id.toString() : c.user.toString();
        return colId === userId;
    });

    if (!collaborator) {
      return res.status(404).json({ message: "Collaborator not found in this project" });
    }

    collaborator.role = role;
    await project.save();

    res.json({ message: "Role updated" });

  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ... (keep reviewAccessRequest, respondToInvite, etc.) ...

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

export const requestProjectAccess = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.email;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Ensure array exists
    if (!project.accessRequests) project.accessRequests = [];

    // Check existing request
    const existing = project.accessRequests.find(r => String(r.user) === String(userId));
    if (existing) {
        return res.status(400).json({ message: "Request already pending" });
    }

    project.accessRequests.push({
      user: userId,
      email: userEmail,
      status: 'pending'
    });

    await project.save();
    res.json({ message: "Request sent successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- FIXED: Remove Collaborator ---
// --- FIXED: Remove Collaborator (Kick OR Leave) ---
export const removeCollaborator = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const currentUserId = req.user._id.toString(); // The person making the request

    // Fetch fresh project data
    const project = await Project.findById(projectId);
    
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isOwner = String(project.owner) === currentUserId;
    const isSelf = userId === currentUserId;

    // 1. Permission Check: Allow if Owner OR if removing Self
    if (!isOwner && !isSelf) {
        return res.status(403).json({ message: "You do not have permission to remove this user." });
    }

    // 2. Prevent Owner from leaving (Owner must delete project instead)
    if (String(project.owner) === userId) {
        return res.status(400).json({ message: "Owner cannot leave. Delete the project instead." });
    }

    const initialLength = project.collaborators.length;

    // 3. Filter out the user (Handle populated vs unpopulated IDs)
    project.collaborators = project.collaborators.filter(c => {
        if (!c.user) return false; // cleanup ghosts
        const colId = c.user._id ? c.user._id.toString() : c.user.toString();
        return colId !== userId;
    });

    // 4. Check if anyone was actually removed
    if (initialLength === project.collaborators.length) {
        return res.status(404).json({ message: "User not found in project" });
    }

    await project.save();
    res.json({ message: isSelf ? "You have left the project" : "User removed" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};