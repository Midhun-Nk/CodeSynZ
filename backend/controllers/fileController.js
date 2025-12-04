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

// --- 2. Create File/Folder ---
export const createFile = async (req, res) => {
  try {
    const { projectId, parentId, name, type } = req.body;

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
      return res.status(400).json({
        error: "A file with this name already exists in this folder"
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// --- 3. Save File Content ---
export const updateFileContent = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { content } = req.body;

    const file = await File.findByIdAndUpdate(
      fileId, 
      { content }, 
      { new: true }
    );

    if (!file) return res.status(404).json({ message: 'File not found' });

    res.json({ message: 'Saved', lastSaved: new Date() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 4. Rename File/Folder ---
export const renameFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { name } = req.body;

    const existing = await File.findById(fileId);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const alreadyExists = await File.findOne({
      projectId: existing.projectId,
      parentId: existing.parentId,
      name
    });

    if (alreadyExists) {
      return res.status(400).json({
        error: "A file/folder with this name already exists here"
      });
    }

    const file = await File.findByIdAndUpdate(
      fileId,
      { name },
      { new: true }
    );

    res.json(file);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 5. Delete File/Folder ---

const deleteRecursive = async (id) => {
  const children = await File.find({ parentId: id });

  for (let child of children) {
    await deleteRecursive(child._id);
  }

  await File.findByIdAndDelete(id);
};


export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    await deleteRecursive(fileId);

    res.json({ message: "Deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
