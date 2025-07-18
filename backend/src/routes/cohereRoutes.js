import express from 'express';
import {
    getQuestionSuggestions,
    sendMessage
} from '../controllers/cohereController.js';

import {
    uploadCommandFile,
    getCommandFiles,
    deleteCommandFile
} from '../controllers/uploadController.js';
import { commandFileUpload } from "../config/multerConfig.js"

const router = express.Router();

// Upload command file route
router.post('/upload-command-file', commandFileUpload.single('commandFile'), uploadCommandFile);

// Lấy danh sách file lệnh
router.get('/command-files', getCommandFiles);

// Xoá file lệnh
router.delete('/command-files/:filename', deleteCommandFile);

router.post('/sendMessage', sendMessage);
router.get('/getQuestionSuggestions', getQuestionSuggestions);

export default router;