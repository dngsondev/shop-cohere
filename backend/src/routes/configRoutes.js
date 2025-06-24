import express from 'express';
import { getAuthConfig } from '../controllers/configController.js';

const router = express.Router();
router.get('/auth-config', getAuthConfig);

export default router;