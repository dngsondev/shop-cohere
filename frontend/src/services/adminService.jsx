import axios from 'axios';

const API_URL = 'http://localhost:5000/admin';

// Tạo instance axios với interceptor
const adminAxios = axios.create({
    baseURL: API_URL
});

// Thêm interceptor để tự động gửi token trong header
adminAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

const adminService = {
    // Bot/Command APIs
    getCommands: () => {
        const token = localStorage.getItem('token');
        return adminAxios.get('/command', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    },
    updateCommands: (input) => adminAxios.put('/command', { contents: input }),

    // LOGOUT
    logout: async () => {
        try {
            // Call API logout (optional)
            await adminAxios.post('/logout');
        } catch (error) {
            console.error('Server logout error:', error);
        } finally {
            // Clear local storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('admin_user');

            // Chuyển hướng về trang chủ
            window.location.href = '/';
        }
    },

    // ADMIN AUTHENTICATION & AUTHORIZATION
    getCurrentAdmin: () => {
        const adminData = localStorage.getItem('user');
        if (adminData) {
            try {
                const admin = JSON.parse(adminData);
                // Kiểm tra xem có phải admin không (role = 0 hoặc 1)
                if (admin && (admin.role === 0 || admin.role === 1)) {
                    return admin;
                }
            } catch (error) {
                console.error('Error parsing admin data:', error);
            }
        }
        return null;
    },

    isSuperAdmin: () => {
        const admin = adminService.getCurrentAdmin();
        return admin && admin.role === 0;
    },

    isStaff: () => {
        const admin = adminService.getCurrentAdmin();
        return admin && admin.role === 1;
    },

    isAdmin: () => {
        const admin = adminService.getCurrentAdmin();
        return admin && (admin.role === 0 || admin.role === 1);
    },

    hasToken: () => {
        return !!localStorage.getItem('token');
    },

    getDashboardStatsByMonth: (month, year) => adminAxios.get(`/dashboard/stats-by-month?month=${month}&year=${year}`),
    getTopProductsByMonth: (month, year, limit = 10) => adminAxios.get(`/dashboard/top-products-by-month?month=${month}&year=${year}&limit=${limit}`),

    // User Management APIs
    getAllUsers: () => adminAxios.get('/users'),
    getUserById: (userId) => adminAxios.get(`/users/${userId}`),

    createUser: (userData) => adminAxios.post('/users', userData),
    updateUser: (userId, userData) => adminAxios.put(`/users/${userId}`, userData),
    deleteUser: (userId) => adminAxios.delete(`/users/${userId}`),

    updateUserStatus: (userId, status) => adminAxios.patch(`/users/${userId}/status`, { status }),
    getUserOrders: (userId) => adminAxios.get(`/users/${userId}/orders`),
    getUserStats: () => adminAxios.get('/users/stats'),

    createAdmin: (adminData) => adminAxios.post('/admins', adminData),
    getAllAdmins: () => adminAxios.get('/admins'),
    updateAdmin: (adminId, adminData) => adminAxios.put(`/admins/${adminId}`, adminData),
    deleteAdmin: (adminId) => adminAxios.delete(`/admins/${adminId}`),

    // Order Management APIs
    getAllOrders: () => adminAxios.get('/orders'),
    getOrderById: (orderId) => adminAxios.get(`/orders/${orderId}`),
    updateOrderStatus: (orderId, status) => adminAxios.patch(`/orders/${orderId}/status`, { status }),
    getOrderStats: () => adminAxios.get('/orders/stats'),

    // Product Management APIs - CHỈ GIỮ LẠI NHỮNG GÌ THỰC SỰ HOẠT ĐỘNG
    getAllProducts: () => adminAxios.get('/products'),
    getProductById: (productId) => adminAxios.get(`/products/${productId}`),
    // COMMENT OUT NHỮNG CHƯA IMPLEMENT
    // createProduct: (productData) => adminAxios.post('/products', productData),
    // updateProduct: (productId, productData) => adminAxios.put(`/products/${productId}`, productData),
    // deleteProduct: (productId) => adminAxios.delete(`/products/${productId}`),
    // getProductStats: () => adminAxios.get('/products/stats'),

    // BRAND
    getAllBrands: () => adminAxios.get('/brands'),
    createBrand: (data) => adminAxios.post('/brands', data),
    updateBrand: (id, data) => adminAxios.put(`/brands/${id}`, data),
    deleteBrand: (id) => adminAxios.delete(`/brands/${id}`),

    // CATEGORY
    getAllCategories: () => adminAxios.get('/categories'),
    createCategory: (data) => adminAxios.post('/categories', data),
    updateCategory: (id, data) => adminAxios.put(`/categories/${id}`, data),
    deleteCategory: (id) => adminAxios.delete(`/categories/${id}`),

    // COLOR
    getAllColors: () => adminAxios.get('/colors'),
    createColor: (data) => adminAxios.post('/colors', data),
    updateColor: (id, data) => adminAxios.put(`/colors/${id}`, data),
    deleteColor: (id) => adminAxios.delete(`/colors/${id}`),

    // MATERIAL
    getAllMaterials: () => adminAxios.get('/materials'),
    createMaterial: (data) => adminAxios.post('/materials', data),
    updateMaterial: (id, data) => adminAxios.put(`/materials/${id}`, data),
    deleteMaterial: (id) => adminAxios.delete(`/materials/${id}`),

    // SIZE
    getAllSizes: () => adminAxios.get('/sizes'),
    createSize: (data) => adminAxios.post('/sizes', data),
    updateSize: (id, data) => adminAxios.put(`/sizes/${id}`, data),
    deleteSize: (id) => adminAxios.delete(`/sizes/${id}`),

    // TARGET
    getAllTargets: () => adminAxios.get('/targets'),
    createTarget: (data) => adminAxios.post('/targets', data),
    updateTarget: (id, data) => adminAxios.put(`/targets/${id}`, data),
    deleteTarget: (id) => adminAxios.delete(`/targets/${id}`),

    // Chat Management APIs - GIỮ LẠI NHỮNG GÌ CẦN THIẾT
    getChatHistory: (roomId) => adminAxios.get(`/chat/rooms/${roomId}/messages`),
    sendMessage: (roomId, messageData) => adminAxios.post(`/chat/rooms/${roomId}/messages`, messageData),
    updateChatStatus: (roomId, status) => adminAxios.patch(`/chat/rooms/${roomId}/status`, { status }),
    // COMMENT OUT getAllChatRooms VÌ KHÔNG DÙNG CHO DASHBOARD NỮA
    // getAllChatRooms: () => adminAxios.get('/chat/rooms'),

    // Review Management APIs
    getAllReviews: () => adminAxios.get('/reviews'),
    getReviewById: (reviewId) => adminAxios.get(`/reviews/${reviewId}`),
    replyToReview: (reviewId, replyData) => adminAxios.post(`/reviews/${reviewId}/reply`, replyData),
    updateReviewStatus: (reviewId, status) => adminAxios.patch(`/reviews/${reviewId}/status`, { status }),
    deleteReview: (reviewId) => adminAxios.delete(`/reviews/${reviewId}`),

    // Dashboard & Analytics APIs
    getDashboardStats: () => adminAxios.get('/dashboard/stats'),
    getRevenueStats: (period) => adminAxios.get(`/dashboard/revenue?period=${period}`),
    getTopProducts: (limit = 10) => adminAxios.get(`/dashboard/top-products?limit=${limit}`),
    getTopCustomers: (limit = 10) => adminAxios.get(`/dashboard/top-customers?limit=${limit}`),

    // THÊM METHOD MỚI
    getRevenueByDateRange: (startDate, endDate, groupBy = 'day') => {
        const params = new URLSearchParams({
            startDate,
            endDate,
            groupBy
        });
        return adminAxios.get(`/dashboard/revenue-range?${params}`);
    },

    // COMMENT OUT NHỮNG API CHƯA IMPLEMENT
    // uploadImage: (formData) => adminAxios.post('/upload/image', formData, {
    //     headers: {
    //         'Content-Type': 'multipart/form-data'
    //     }
    // }),
    // uploadMultipleImages: (formData) => adminAxios.post('/upload/images', formData, {
    //     headers: {
    //         'Content-Type': 'multipart/form-data'
    //     }
    // }),

    // getAllNotifications: () => adminAxios.get('/notifications'),
    // markNotificationAsRead: (notificationId) => adminAxios.patch(`/notifications/${notificationId}/read`),
    // deleteNotification: (notificationId) => adminAxios.delete(`/notifications/${notificationId}`),

    // getSystemSettings: () => adminAxios.get('/settings'),
    // updateSystemSettings: (settings) => adminAxios.put('/settings', settings),

    // generateSalesReport: (startDate, endDate) => adminAxios.get(`/reports/sales?start=${startDate}&end=${endDate}`),
    // generateInventoryReport: () => adminAxios.get('/reports/inventory'),
    // generateCustomerReport: () => adminAxios.get('/reports/customers'),
    // exportReport: (reportType, format = 'excel') => adminAxios.get(`/reports/export/${reportType}?format=${format}`, {
    //     responseType: 'blob'
    // })
};

export default adminService;