import express from 'express';
import {
    addToCartController,
    getCartController,
    getQuantityController,
    deleteCartController,
    updateCartController,
    removeItemsFromCartController,
    clearCartController,
    cleanupCartController,
    adjustCartController // ✨ Thêm import mới
} from '../controllers/cartController.js';

const router = express.Router();

router.get('/:customerId', getCartController);
router.post('/insert', addToCartController);
router.get('/quantity/:customerId', getQuantityController);
router.delete('/delete/:cartId', deleteCartController);
router.put('/update', updateCartController);
// Route xóa các sản phẩm cụ thể khỏi giỏ hàng
router.delete('/remove-items', removeItemsFromCartController);
// Route xóa tất cả sản phẩm trong giỏ hàng
router.delete('/clear/:customerId', clearCartController);
router.delete('/cleanup/:customerId', cleanupCartController); // Utility route
// ✨ Route mới để điều chỉnh giỏ hàng
router.post('/adjust/:customerId', adjustCartController);

export default router;