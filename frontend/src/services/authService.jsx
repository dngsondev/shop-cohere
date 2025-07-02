import axios from 'axios';

// const API_URL = 'http://localhost:5000/auth';
const API_URL = import.meta.env.VITE_BACKEND_URL + '/auth';

const authService = {
    login: (email, password) =>
        axios.post(`${API_URL}/login`, { email, password }),

    register: (username, email, password) =>
        axios.post(`${API_URL}/register`, { username, email, password }),

    loginWithGoogle: (tokenId) =>
        axios.post(`${API_URL}/google-login`, { tokenId }),

    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Nếu đang ở trang admin, chuyển về trang chủ
        if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/';
        } else {
            window.location.href = '/';
        }
    },

    createDelivery: (deliveryData) => {
        console.log("Sending create delivery request:", deliveryData);
        // Đảm bảo endpoint đúng - có thể cần thay đổi từ /delivery thành /deliveries
        return axios.post(`${API_URL}/delivery`, deliveryData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    },

    //Sửa thông tin người dùng
    updateUser: (userId, userData) => {
        console.log("Updating user:", userId, "with data:", userData);
        return axios.put(`${API_URL}/user/${userId}`, userData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    },

    getCurrentUser: () => {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
            return null;
        }
    },

    setCurrentUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
    },

    getLastestUser: (userId) => axios.get(`${API_URL}/user/${userId}`),

    hasToken: () => {
        return !!localStorage.getItem('token');
    },

    isAdmin: () => {
        const user = authService.getCurrentUser();
        const hasToken = authService.hasToken();
        return user && hasToken && (user.role === 0 || user.role === 1);
    },

    // THÊM: Kiểm tra quyền quản trị viên (role = 0)
    isSuperAdmin: () => {
        const user = authService.getCurrentUser();
        return user && user.role === 0;
    },

    // THÊM: Kiểm tra quyền nhân viên (role = 1)
    isStaff: () => {
        const user = authService.getCurrentUser();
        return user && user.role === 1;
    },

    // API lấy danh sách địa chỉ giao hàng
    getUserDeliveryAddresses: (customerId) =>
        axios.get(`${API_URL}/delivery/user/${customerId}`),

    // Cập nhật địa chỉ giao hàng
    updateDeliveryAddress: async (addressId, fullname, phone, address, isDefault) => {
        try {
            const response = await axios.put(`${API_URL}/delivery/${addressId}`, {
                fullname,
                phone,
                address,
                isDefault
            });
            return response;
        } catch (error) {
            console.error("Error updating delivery address:", error);
            throw error;
        }
    },

    setDefaultDeliveryAddress: async (addressId) => {
        try {
            const response = await axios.patch(`${API_URL}/delivery/${addressId}/default`);
            return response;
        } catch (error) {
            console.error("Error setting default delivery address:", error);
            throw error;
        }
    },

    // Xóa địa chỉ giao hàng
    deleteDeliveryAddress: async (addressId) => {
        try {
            const response = await axios.delete(`${API_URL}/delivery/${addressId}`);
            return response;
        } catch (error) {
            console.error("Error deleting delivery address:", error);
            throw error;
        }
    },

    // API lấy lịch sử đơn hàng của khách hàng
    getCustomerOrders: (customerId) => {
        return axios.get(`${API_URL}/orders/customer/${customerId}`);
    },

    // API lấy chi tiết đơn hàng
    getOrderDetail: (orderId) => {
        return axios.get(`${API_URL}/orders/detail/${orderId}`);
    },

    // Thêm API hủy đơn hàng
    cancelOrder: async (orderId) => {
        try {
            const response = await axios.patch(`${API_URL}/orders/cancel/${orderId}`);
            return response;
        } catch (error) {
            console.error("Error cancelling order:", error);
            throw error;
        }
    },

    // Thêm API đổi mật khẩu
    changePassword: async (userId, passwordData) => {
        try {
            const response = await axios.put(`${API_URL}/user/${userId}/change-password`, passwordData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response;
        } catch (error) {
            console.error("Error changing password:", error);
            throw error;
        }
    },

    forgotPassword: (email) =>
        axios.post(`${API_URL}/forgot-password`, { email }),

    resetPassword: (email, token, newPassword) =>
        axios.post(`${API_URL}/reset-password`, { email, token, newPassword }),
};

export default authService;