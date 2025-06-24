import axios from 'axios';

const API_URL = 'http://localhost:5000/order';

const orderService = {
    // Lấy thông tin đơn hàng
    getOrder: (customerId) => axios.get(`${API_URL}/${customerId}`),
    getOrderDetail: (orderId) => axios.get(`${API_URL}/detail/${orderId}`),

    // Tạo đơn hàng mới - thêm error handling
    createOrder: async (orderData) => {
        try {
            console.log("Creating order with data:", orderData);
            const response = await axios.post(`${API_URL}/create`, orderData);
            return response;
        } catch (error) {
            console.error("Error in orderService.createOrder:", error);
            throw error;
        }
    },

    // Tạo đơn hàng tạm thời cho VNPAY
    createTempOrder: (orderData) => {
        console.log("Creating temp order with:", orderData);
        return axios.post(`${API_URL}/create-temp`, orderData);
    },

    // Xác nhận đơn hàng sau thanh toán
    confirmOrderAfterPayment: (orderId, confirmData) => {
        console.log("Confirming order after payment:", orderId, confirmData);
        return axios.post(`${API_URL}/confirm/${orderId}`, confirmData);
    },

    // Xóa đơn hàng
    deleteOrder: (orderId) => axios.delete(`${API_URL}/delete/${orderId}`),

    getPayments: () => {
        console.log("🔍 Calling payments API...");
        return axios.get(`${API_URL}/payments`);
    },

    createZaloPayOrder: (orderData) => {
        // Gửi toàn bộ thông tin đơn hàng, KHÔNG chỉ gửi order_id và total_amount
        return axios.post(`${API_URL}/zalopay/create`, orderData);
    },

    // VNPAY - sử dụng order_id có sẵn
    createVnpayOrder: (orderData) => {
        console.log("Creating VNPAY order with:", orderData);

        const vnpayData = {
            order_id: orderData.order_id,
            total_amount: orderData.total_amount
        };

        console.log("VNPAY data to send:", vnpayData);

        if (!vnpayData.order_id || !vnpayData.total_amount) {
            return Promise.reject(new Error('Thiếu thông tin order_id hoặc total_amount'));
        }

        return axios.post(`${API_URL}/vnpay/create`, vnpayData);
    },
};

export default orderService;