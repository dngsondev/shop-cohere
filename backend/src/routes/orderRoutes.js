import express from 'express';
import {
    createOrderController,
    createTempOrderController,
    cancelTempOrderController,
    confirmOrderAfterPaymentController,
    getAllOrdersController,
    getOrderDetailController,
    updateOrderStatusController,
    getOrderStatusController,
    getPaymentsController
} from '../controllers/orderController.js';
import { vnpayCreateOrder, vnpayCallback } from '../controllers/vnpayController.js';

const router = express.Router();

// cho admin
router.get('/all', getAllOrdersController);
router.get('/detail/:orderId', getOrderDetailController);
router.put('/update-status/:orderId', updateOrderStatusController);

router.post('/vnpay/create', vnpayCreateOrder); // Đúng với controller hiện tại
router.get('/vnpay/callback', vnpayCallback);

// cho user
router.post('/create', createOrderController); // COD và thanh toán trực tiếp
router.post('/create-temp', createTempOrderController); // Tạo đơn hàng tạm thời cho VNPAY
router.post('/confirm/:orderId', confirmOrderAfterPaymentController); // Xác nhận đơn hàng sau thanh toán
router.delete('/cancel/:orderId', cancelTempOrderController); // Hủy đơn hàng tạm thời

// Lấy thông tin đơn hàng và phương thức thanh toán
router.get('/status/:orderId', getOrderStatusController);
router.get('/payments', getPaymentsController);  // ✅ Đảm bảo route này có

// Debug middleware để test
router.use('/vnpay/*', (req, res, next) => {
    console.log('🔥 VNPAY ROUTE HIT:', req.method, req.originalUrl);
    next();
});

export default router;

