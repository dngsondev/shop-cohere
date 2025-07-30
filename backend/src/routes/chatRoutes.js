import express from 'express';
import * as chatController from '../controllers/chatController.js';



const router = express.Router();



// Customer routes
router.post('/room', chatController.createOrGetRoom);
router.get('/messages/:roomId', chatController.getMessages);
router.post('/message', chatController.sendMessage);
router.post('/activity', chatController.updateActivity);
router.put('/room/:roomId/status', chatController.updateRoomStatus);
router.get('/online-status/:userId/:userType', chatController.getOnlineStatus);

// Admin routes
router.get('/rooms', chatController.getChatRooms);
router.post('/assign', chatController.assignRoom);
router.put('/close/:roomId', chatController.closeRoom);
router.get('/staff-status/:roomId', chatController.getStaffStatus);
router.get('/customer-status/:customerId', chatController.getCustomerStatus);
router.get('/admins', chatController.getAdmins);

// Alternative routes for compatibility
router.put('/status/:roomId', chatController.updateRoomStatus); // ✅ Route backup

export default router;