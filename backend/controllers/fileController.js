import File from '../models/File.js';

// --- Helper: Build Tree Structure ---
// Converts flat DB array [ {id:2, parent:1}, {id:1, parent:null} ] 
// into Tree [ {id:1, children: [ {id:2} ] } ]
const buildTree = (files, parentId = null) => {
  return files
    .filter(file => String(file.parentId || null) === String(parentId || null))
    .map(file => ({
      id: file._id,
      name: file.name,
      type: file.type,
      content: file.content,
      lang: file.language,
      isOpen: false, // UI State for folders
      // Recursive call for children if it's a folder
      children: file.type === 'folder' ? buildTree(files, file._id) : undefined
    }));
};

// --- 1. Get Project Files (Tree Structure) ---
export const getProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Fetch all files for this project (Flat list)
    const files = await File.find({ projectId }).sort({ type: 1, name: 1 }); // Sort folders first usually

    // Convert to Tree
    const fileTree = buildTree(files, null);

    res.json(fileTree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// --- 2. Create File/Folder (Updated) ---
export const createFile = async (req, res) => {
  try {
    const { projectId } = req.params; // Get from URL now
    const { parentId, name, type } = req.body;

    // Security Check: If parentId is provided, ensure that parent folder 
    // actually belongs to this project!
    if (parentId) {
      const parentParams = await File.findOne({ _id: parentId, projectId });
      if (!parentParams) {
        return res.status(400).json({ message: "Parent folder does not belong to this project" });
      }
    }

    const newFile = new File({
      projectId,
      parentId: parentId || null,
      name,
      type,
      language: type === "file" ? name.split('.').pop() : null,
      content: type === "file" ? "" : ""
    });

    await newFile.save();

    res.status(201).json({
      id: newFile._id,
      name: newFile.name,
      type: newFile.type,
      parentId: newFile.parentId,
      content: newFile.content,
      children: type === "folder" ? [] : undefined
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "File already exists in this directory" });
    }
    res.status(500).json({ error: error.message });
  }
};


// --- 3. Save File Content (Updated) ---
export const updateFileContent = async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const { content } = req.body;

    // SECURITY FIX: We query by _id AND projectId.
    // This prevents a user from editing a file in a project they don't own
    // just by guessing a fileId.
    const file = await File.findOneAndUpdate(
      { _id: fileId, projectId: projectId }, 
      { content }, 
      { new: true }
    );

    if (!file) return res.status(404).json({ message: 'File not found or access denied' });

    res.json({ message: 'Saved', lastSaved: new Date() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// --- 4. Rename File/Folder (Updated) ---
export const renameFile = async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const { name } = req.body;

    // 1. Find the file ensuring it belongs to the project
    const existing = await File.findOne({ _id: fileId, projectId });
    if (!existing) return res.status(404).json({ error: "File not found" });

    // 2. Check for duplicate name in the *same* folder of this project
    const alreadyExists = await File.findOne({
      projectId: existing.projectId,
      parentId: existing.parentId,
      name,
      _id: { $ne: fileId } // Exclude self
    });

    if (alreadyExists) {
      return res.status(400).json({ error: "A file with this name already exists here" });
    }

    existing.name = name;
    // Update language extension if it's a file
    if (existing.type === 'file') {
        existing.language = name.split('.').pop();
    }
    
    await existing.save();

    res.json(existing);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// --- 5. Delete File/Folder (Updated) ---

// Helper: Delete recursively
const deleteRecursive = async (fileId, projectId) => {
  // Find children ensuring they belong to the same project context
  const children = await File.find({ parentId: fileId, projectId });

  for (let child of children) {
    await deleteRecursive(child._id, projectId);
  }

  // Delete the file itself
  await File.findOneAndDelete({ _id: fileId, projectId });
};

export const deleteFile = async (req, res) => {
  try {
    const { projectId, fileId } = req.params;

    // Verify file exists in this project first
    const file = await File.findOne({ _id: fileId, projectId });
    if (!file) return res.status(404).json({ message: "File not found" });

    await deleteRecursive(fileId, projectId);

    res.json({ message: "Deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};