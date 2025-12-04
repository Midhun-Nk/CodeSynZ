import mongoose from 'mongoose';


const fileSchema = new mongoose.Schema({
  // Link to the Project
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true,
    index: true // Faster queries
  },

  // Tree Structure Logic
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'File', 
    default: null // Null means it's in the root folder
  },

  name: { type: String, required: true },
  
  // Matches "type: 'folder' | 'file'"
  type: { 
    type: String, 
    enum: ['file', 'folder'], 
    required: true 
  },

  // Specific to Files
  language: { type: String, default: 'javascript' }, // e.g., 'python', 'javascript'
  content: { type: String, default: '' }, // The code itself
  
  // Frontend UI state (Optional to store in DB, but good for persistence)
  isOpen: { type: Boolean, default: false }, 

  createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure unique names inside the same folder
fileSchema.index({ projectId: 1, parentId: 1, name: 1 }, { unique: true });

export default mongoose.model('File', fileSchema);