import axios from 'axios';

const API_URL = 'http://localhost:5000/chat';

// Tạo axios instance với interceptors
const chatAPI = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor
chatAPI.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
            data: config.data
        });

        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
chatAPI.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        return response;
    },
    (error) => {
        console.error('❌ Chat API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        return Promise.reject(error);
    }
);

const chatService = {
    // Customer APIs
    createOrGetRoom: (customerId) => {
        return chatAPI.post('/room', { customerId });
    },

    getMessages: (roomId) => {
        return chatAPI.get(`/messages/${roomId}`);
    },

    sendMessage: (roomId, senderType, senderId, message) => {
        return chatAPI.post('/message', {
            roomId,
            senderType,
            senderId,
            message
        });
    },

    markAsRead: (roomId, readerType) => {
        return chatAPI.post(`/read/${roomId}`, { readerType });
    },

    updateActivity: (userId, userType) => {
        return chatAPI.post('/activity', { userId, userType });
    },

    // Admin APIs
    getChatRooms: () => {
        return chatAPI.get('/rooms');
    },

    getRooms: () => {
        // Alias cho getChatRooms để tương thích với code cũ
        return chatAPI.get('/rooms');
    },

    assignRoom: (roomId, adminId) => {
        return chatAPI.post('/assign', { roomId, adminId });
    },

    takeRoom: (roomId, adminData) => {
        // Sử dụng assignRoom cho tương thích
        return chatAPI.post('/assign', { roomId, adminId: adminData.adminId });
    },

    closeRoom: (roomId, adminId) => {
        return chatAPI.put(`/close/${roomId}`, { adminId });
    },

    getCustomerStatus: (customerId) => {
        return chatAPI.get(`/customer-status/${customerId}`);
    },

    getStaffStatus: (roomId) => {
        return chatAPI.get(`/staff-status/${roomId}`);
    },

    // Kiểm tra trạng thái online
    getOnlineStatus: (userId, userType = 'customer') => {
        return chatAPI.get(`/online-status/${userId}/${userType}`);
    },

    // Lấy danh sách admins
    getAdmins: () => {
        return chatAPI.get('/admins');
    },

    // Typing indicators
    startTyping: (roomId, userType, userId) => {
        return chatAPI.post('/typing/start', { roomId, userType, userId });
    },

    stopTyping: (roomId, userType, userId) => {
        return chatAPI.post('/typing/stop', { roomId, userType, userId });
    },

    // Room statistics
    getRoomStats: (roomId) => {
        return chatAPI.get(`/stats/${roomId}`);
    },

    // Get unread count
    getUnreadCount: (userId, userType) => {
        return chatAPI.get(`/unread/${userId}/${userType}`);
    },

    // Update room status
    updateRoomStatus: (roomId, status) => {
        return chatAPI.put(`/status/${roomId}`, { status });
    },

    // Get room history
    getRoomHistory: (roomId, page = 1, limit = 50) => {
        return chatAPI.get(`/history/${roomId}`, {
            params: { page, limit }
        });
    },

    // Search messages
    searchMessages: (roomId, query) => {
        return chatAPI.get(`/search/${roomId}`, {
            params: { q: query }
        });
    },

    // File upload (nếu cần)
    uploadFile: (roomId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomId', roomId);

        return chatAPI.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    },

    // Health check
    healthCheck: () => {
        return chatAPI.get('/health');
    },

    // Connection test
    testConnection: () => {
        return chatAPI.get('/test');
    }
};

export default chatService;