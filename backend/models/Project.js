import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    default: "Untitled Project"
  },
  description: {
    type: String,
    trim: true,
    default: "No description provided"
  },
  
  // 1. OWNER: The creator (Full Control)
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  language:{
    type: String,
    default: "javascript"
  },

  // 2. COLLABORATORS: Users who accepted invites
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
    // Real-time presence data
    cursorPosition: {
        line: { type: Number, default: 0 },
        col: { type: Number, default: 0 }
    },
    activeFileId: { type: String, default: null }, 
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    }
  }],

  // 3. OUTBOUND INVITES: Owner invited someone (Status: pending -> accepted/rejected)
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

  // 4. INBOUND ACCESS REQUESTS (NEW FIELD) 
  // Users asking "Can I join?" (Status: pending -> (moves to collaborators) or ignored)
  accessRequests: [{
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    email: { type: String }, // Stored for easier UI display without population
    status: { 
        type: String, 
        enum: ['pending', 'ignored'], 
        default: 'pending' 
    },
    requestedAt: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Project', projectSchema);