import express from 'express';
import { verifyAdminToken } from '../middleware/authMiddleware.js';
import {
    // Command management
    getCommands,
    updateCommands,
    logoutAdmin,

    // User management - ĐÃ IMPLEMENT
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    getUserOrders,
    getUserStats,

    // Order management - ĐÃ IMPLEMENT
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats,

    // Product management - ĐÃ IMPLEMENT (một phần)
    getAllProducts,
    getProductById,

    // Chat management - ĐÃ IMPLEMENT (một phần)
    getAllChatRooms,  // THÊM LẠI
    getChatHistory,
    sendMessage,
    updateChatStatus,

    // Review management - ĐÃ IMPLEMENT
    getAllReviews,    // THÊM LẠI
    getReviewById,
    replyToReview,
    updateReviewStatus,
    deleteReview,

    // Dashboard & Analytics - ĐÃ IMPLEMENT
    getDashboardStats,
    getRevenueStats,
    getTopProducts,
    getTopCustomers,
    getRevenueByDateRange, // THÊM IMPORT NÀY

    // Admin management - THÊM NHÓM HÀNH ĐỘNG MỚI
    createAdmin, // THÊM IMPORT
    getAllAdmins, // THÊM IMPORT
    updateAdmin,   // thêm
    deleteAdmin,   // thêm

    getAllBrands,
    createBrand,
    updateBrand,
    deleteBrand,

    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    getAllColors,
    createColor,
    updateColor,
    deleteColor,

    getAllMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,

    getAllTargets,
    createTarget,
    updateTarget,
    deleteTarget,

    getAllSizes,
    createSize,
    updateSize,
    deleteSize,

    getDashboardStatsByMonthController,
    getTopProductsByMonthController,
} from '../controllers/adminController.js';

// Import order controllers
import {
    getAllOrdersController,
    getOrderDetailController,
    updateOrderStatusController
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/dashboard/stats-by-month', getDashboardStatsByMonthController);
router.get('/dashboard/top-products-by-month', getTopProductsByMonthController);

//BRAND
router.get('/brands', getAllBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// Category
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// COLOR
router.get('/colors', getAllColors);
router.post('/colors', createColor);
router.put('/colors/:id', updateColor);
router.delete('/colors/:id', deleteColor);

// MATERIAL
router.get('/materials', getAllMaterials);
router.post('/materials', createMaterial);
router.put('/materials/:id', updateMaterial);
router.delete('/materials/:id', deleteMaterial);

// TARGET
router.get('/targets', getAllTargets);
router.post('/targets', createTarget);
router.put('/targets/:id', updateTarget);
router.delete('/targets/:id', deleteTarget);

// SIZE
router.get('/sizes', getAllSizes);
router.post('/sizes', createSize);
router.put('/sizes/:id', updateSize);
router.delete('/sizes/:id', deleteSize);

// Áp dụng middleware cho tất cả các route admin
router.use(verifyAdminToken);

// Admin commands routes
router.get('/command', getCommands);
router.put('/command', updateCommands);

// Admin logout route
router.post('/logout', logoutAdmin);

// Dashboard & Analytics routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/revenue', getRevenueStats);
router.get('/dashboard/revenue-range', getRevenueByDateRange);
router.get('/dashboard/top-products', getTopProducts);
router.get('/dashboard/top-customers', getTopCustomers);

// User management routes
router.get('/users/stats', getUserStats);
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.patch('/users/:userId/status', updateUserStatus);
router.get('/users/:userId/orders', getUserOrders);

// Order management routes
router.get('/orders/stats', getOrderStats);
router.get('/orders', async (req, res) => {
    try {
        console.log('🔍 Admin requesting all orders via /admin/orders');
        await getAllOrdersController(req, res);
    } catch (error) {
        console.error('❌ Error in admin orders route:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách đơn hàng',
            error: error.message
        });
    }
});
router.get('/orders/:orderId', async (req, res) => {
    try {
        console.log('🔍 Admin requesting order detail via /admin/orders/:orderId');
        await getOrderDetailController(req, res);
    } catch (error) {
        console.error('❌ Error in admin order detail route:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy chi tiết đơn hàng',
            error: error.message
        });
    }
});
router.patch('/orders/:orderId/status', async (req, res) => {
    try {
        console.log('🔄 Admin updating order status via /admin/orders/:orderId/status');
        await updateOrderStatusController(req, res);
    } catch (error) {
        console.error('❌ Error in admin update order status route:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật trạng thái đơn hàng',
            error: error.message
        });
    }
});

// Product management routes
router.get('/products', getAllProducts);
router.get('/products/:productId', getProductById);

// Chat management routes - THÊM LẠI ROUTE CHO getAllChatRooms
router.get('/chat/rooms', getAllChatRooms);
router.get('/chat/rooms/:roomId/messages', getChatHistory);
router.post('/chat/rooms/:roomId/messages', sendMessage);
router.patch('/chat/rooms/:roomId/status', updateChatStatus);

// Review management routes - THÊM LẠI ROUTE CHO getAllReviews
router.get('/reviews', getAllReviews);
router.get('/reviews/:reviewId', getReviewById);
router.post('/reviews/:reviewId/reply', replyToReview);
router.patch('/reviews/:reviewId/status', updateReviewStatus);
router.delete('/reviews/:reviewId', deleteReview);

// Thêm route tạo admin
router.post('/admins', createAdmin);
router.get('/admins', getAllAdmins);
router.put('/admins/:adminId', updateAdmin);    // thêm
router.delete('/admins/:adminId', deleteAdmin); // thêm

export default router;