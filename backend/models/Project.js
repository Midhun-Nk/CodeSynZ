import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    default: "Untitled Project"
  },
  description: String,
  
  // 1. OWNER: The creator (Full Control)
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // 2. COLLABORATORS: Users who accepted invites (Matches "collaborators" state)
  collaborators: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    role: { 
      type: String, 
      enum: ['editor', 'viewer'], 
      default: 'editor' 
    },
    cursorPosition: {
        line: { type: Number, default: 0 },
        col: { type: Number, default: 0 }
    },
    activeFileId: { type: String, default: null }, // File they are currently viewing
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    }
  }],

  // 3. PENDING INVITES: Sent but not accepted (Matches "pendingInvites" state)
  invitations: [{
    email: { type: String, required: true },
    role: { type: String, default: 'editor' },
    status: { 
      type: String, 
      enum: ['pending', 'rejected'], 
      default: 'pending' 
    },
    sentAt: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


export default mongoose.model('Project', projectSchema);