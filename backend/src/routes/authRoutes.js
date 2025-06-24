import express from 'express';
import {
  loginUser, registerUser, googleLogin,
  getDeliveryAddresses, createDelivery, updateDelivery, deleteDelivery,
  getLastestUserController, updateUserController, setDefaultDelivery,
  getCustomerOrdersController, getOrderDetailController,
  cancelOrderController, changePassword, forgotPassword, resetPassword
} from '../controllers/userController.js';

const router = express.Router();

// Auth routes
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/google-login', googleLogin);
router.get('/user/:userId', getLastestUserController);
router.put('/user/:userId', updateUserController);
router.put('/user/:userId/change-password', changePassword); // Thêm route đổi mật khẩu
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Delivery routes
router.get('/delivery/user/:customerId', getDeliveryAddresses);
router.post('/delivery', createDelivery);
router.put('/delivery/:addressId', updateDelivery);
router.delete('/delivery/:addressId', deleteDelivery);
router.patch('/delivery/:addressId/default', setDefaultDelivery);

// Order routes
router.get('/orders/customer/:customerId', getCustomerOrdersController);
router.get('/orders/detail/:orderId', getOrderDetailController);
router.patch('/orders/cancel/:orderId', cancelOrderController);

export default router;