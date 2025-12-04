import express from 'express';
import File from '../models/File.js';
import Project from '../models/Project.js';

const router = express.Router();

// --- HELPER: Convert Flat DB List to Recursive Tree ---
const buildFileTree = (files) => {
  const fileMap = {};
  const tree = [];

  // 1. Create a map of items
  files.forEach(file => {
    // Transform Mongoose doc to Plain Object & map fields to Frontend requirements
    fileMap[file._id] = {
      id: file._id.toString(), // Frontend expects 'id', not '_id'
      name: file.name,
      type: file.type,
      content: file.content,
      lang: file.language, // Frontend key is 'lang'
      parentId: file.parentId?.toString() || null,
      isOpen: false, // Default UI state
      children: file.type === 'folder' ? [] : undefined 
    };
  });

  // 2. Build the hierarchy
  Object.values(fileMap).forEach(file => {
    if (file.parentId && fileMap[file.parentId]) {
      fileMap[file.parentId].children.push(file);
    } else {
      tree.push(file); // Root item
    }
  });

  return tree;
};

// 1. GET FILES (Returns Tree Structure)
router.get('/project/:slug', async (req, res) => {
  try {
    // 1. Find Project by "project-1" (slug) OR _id
    const project = await Project.findOne({ 
        $or: [{ slug: req.params.slug }, { _id: req.params.slug.match(/^[0-9a-fA-F]{24}$/) ? req.params.slug : null }] 
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    // 2. Get all files flat
    const files = await File.find({ projectId: project._id }).lean();

    // 3. Convert to Tree for Frontend
    const responseTree = buildFileTree(files);

    res.json(responseTree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE FILE
router.post('/', async (req, res) => {
  try {
    const { name, type, parentId, projectId } = req.body;
    
    // Resolve project ID if frontend sent a slug
    let dbProjectId = projectId;
    if(!projectId.match(/^[0-9a-fA-F]{24}$/)) {
        const proj = await Project.findOne({ slug: projectId });
        if(proj) dbProjectId = proj._id;
    }

    const newFile = new File({
      name,
      type,
      content: '',
      language: name.split('.').pop() === 'py' ? 'python' : 'javascript',
      projectId: dbProjectId,
      parentId: parentId || null
    });
    
    await newFile.save();

    // Return format matching frontend expectation
    res.status(201).json({
        id: newFile._id,
        name: newFile.name,
        type: newFile.type,
        content: newFile.content,
        lang: newFile.language,
        children: newFile.type === 'folder' ? [] : undefined
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. UPDATE FILE (Save Content)
router.put('/:id', async (req, res) => {
  try {
    const { content, name } = req.body;
    const updateData = {};
    if(content !== undefined) updateData.content = content;
    if(name) updateData.name = name;

    await File.findByIdAndUpdate(req.params.id, updateData);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE FILE
router.delete('/:id', async (req, res) => {
  try {
    // Recursive delete helper
    const deleteRecursive = async (fileId) => {
        const children = await File.find({ parentId: fileId });
        for(const child of children) await deleteRecursive(child._id);
        await File.findByIdAndDelete(fileId);
    }
    await deleteRecursive(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;