// routes/fileProject.js
import express from 'express';
import { checkProjectAccess, requireEditor } from '../middlewares/projectAccess.js';
import { 
    getProjectFiles, 
    createFile, 
    updateFileContent, 
    renameFile, 
    deleteFile 
} from '../controllers/fileController.js';

const router = express.Router();

// READ (Allowed for Viewers)
router.get('/projects/:projectId/files', checkProjectAccess, getProjectFiles);

// WRITE (Blocked for Viewers - Added requireEditor)
router.post('/projects/:projectId/files', checkProjectAccess, requireEditor, createFile);
router.put('/projects/:projectId/files/:fileId/content', checkProjectAccess, requireEditor, updateFileContent);
router.put('/projects/:projectId/files/:fileId/rename', checkProjectAccess, requireEditor, renameFile);
router.delete('/projects/:projectId/files/:fileId', checkProjectAccess, requireEditor, deleteFile);

export default router;