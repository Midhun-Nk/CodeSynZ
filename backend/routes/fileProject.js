// routes/fileProject.js (example)
import express from 'express';
import { checkProjectAccess } from '../middlewares/projectAccess.js';
import { getProjectFiles, createFile, updateFileContent, renameFile, deleteFile } from '../controllers/fileController.js';
const router = express.Router();

// GET file tree (requires projectId param)
router.get('/projects/:projectId/files', checkProjectAccess, getProjectFiles);

// Create file (projectId in body) - require project access
router.post('/files', checkProjectAccess, createFile);

// Save content - ensure the user has access to the file's project inside controller
router.put('/files/:fileId/content', checkProjectAccess, updateFileContent);

// Rename
router.put('/files/:fileId/rename', checkProjectAccess, renameFile);

// Delete
router.delete('/files/:fileId', checkProjectAccess, deleteFile);

export default router;
