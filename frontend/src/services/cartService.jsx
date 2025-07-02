import axios from 'axios';

// const API_URL = 'http://localhost:5000/cart';
const API_URL = import.meta.env.VITE_BACKEND_URL + '/cart';

const cartService = {
    getCart: (customerId) => axios.get(`${API_URL}/${customerId}`),
    getQuantity: (customerId) => axios.get(`${API_URL}/quantity/${customerId}`),
    deleteCart: (cartId) => axios.delete(`${API_URL}/delete/${cartId}`),
    addToCart: (customerId, productId, variantId, quantity) =>
        axios.post(`${API_URL}/insert`, { customerId, productId, variantId, quantity }),
    updateCart: (cartId, quantity) =>
        axios.put(`${API_URL}/update`, { cartId, quantity }),

    // Xóa sản phẩm khỏi giỏ hàng sau khi thanh toán thành công
    removeItemsFromCart: (customerId, cartIds) => {
        return axios.delete(`${API_URL}/remove-items`, {
            data: { customerId, cartIds }
        });
    },

    // Xóa tất cả sản phẩm của customer
    clearCart: (customerId) => {
        return axios.delete(`${API_URL}/clear/${customerId}`);
    },

    // ✨ Method mới để điều chỉnh giỏ hàng
    adjustCart: (customerId, action) => {
        return axios.post(`${API_URL}/adjust/${customerId}`, { action });
    },
};

export default cartService;