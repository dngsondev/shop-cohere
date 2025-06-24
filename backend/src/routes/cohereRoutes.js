import express from 'express';
import { sendToCohere, getQuestionSuggestions, sendMessage } from '../controllers/cohereController.js';

const router = express.Router();

router.post('/sendToCohere', sendToCohere);
router.post('/sendMessage', sendMessage); // API mới cho sendMessage
router.get('/getQuestionSuggestions', getQuestionSuggestions);

export default router;