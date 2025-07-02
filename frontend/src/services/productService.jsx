import axios from 'axios';

// const API_URL = 'http://localhost:5000/products';
const API_URL = import.meta.env.VITE_BACKEND_URL + '/products';
// const UPLOAD_URL = 'http://localhost:5000/upload';
const UPLOAD_URL = import.meta.env.VITE_BACKEND_URL + '/upload';

const productService = {
    // Products
    getAllProducts: () => axios.get(API_URL),
    getAllInfoProducts: () => axios.get(`${API_URL}/info`),
    getProductById: (id) => axios.get(`${API_URL}/${id}`),
    getProductbyVariantId: (variantId) => axios.get(`${API_URL}/variant/${variantId}`),
    getTopProducts: () => axios.get(`${API_URL}/top`),
    //Lấy sản phẩm liên quan theo danh mục
    getRelatedProducts: (categoryId, productId) => axios.get(`${API_URL}/${categoryId}/related`, {
        params: { exclude: productId }
    }),

    // Lấy sản phẩm theo người dùng
    getProductsForYou: (userId) => axios.get(`${API_URL}/for-you`, {
        params: { userId }
    }),


    // Voucher - sửa để gửi đúng tham số
    checkVoucher: (voucherCode) => axios.get(`${API_URL}/voucher`, {
        params: { voucherCode } // Đảm bảo gửi đúng tên parameter
    }),

    // Product attributes
    getSizes: () => axios.get(`${API_URL}/sizes`),
    getColors: () => axios.get(`${API_URL}/colors`),
    getTargets: () => axios.get(`${API_URL}/targets`),
    getBrands: () => axios.get(`${API_URL}/brands`),
    getCategories: () => axios.get(`${API_URL}/categories`),
    getMaterials: () => axios.get(`${API_URL}/materials`),
    getAllProductImages: (id) => axios.get(`${API_URL}/${id}/images`), // ✨ Sửa từ /info/:id thành /:id/images

    // Product CRUD
    createProduct: (formData) => axios.post(`${API_URL}/create`, formData),
    updateProduct: (id, formData) => axios.put(`${API_URL}/${id}`, formData),
    deleteProduct: (id) => axios.delete(`${API_URL}/${id}`),

    // Upload services - Đảm bảo có đầy đủ
    uploadProductImages: (formData) => axios.post(`${UPLOAD_URL}/product-images`, formData),
    uploadVariantImage: (formData) => axios.post(`${UPLOAD_URL}/variant-image`, formData),
    uploadQuillImage: (formData) => axios.post(`${UPLOAD_URL}/quill`, formData),
    uploadTempImage: (formData) => axios.post(`${UPLOAD_URL}/temp-image`, formData),

    // Cleanup
    cleanupTempImages: (sessionId) => axios.delete(`${UPLOAD_URL}/cleanup-temp/${sessionId}`),
    deleteProductImage: (filename) => axios.delete(`${UPLOAD_URL}/product-image/${filename}`),
    deleteVariantImage: (filename) => axios.delete(`${UPLOAD_URL}/variant-image/${filename}`),

    // // Product status
    // updateProductStatus: (id, status) => axios.put(`${API_URL}/${id}/status`, { status }),

    // Variants
    addVariant: (productId, variantData) => axios.post(`${API_URL}/${productId}/variants`, variantData),
    updateVariant: (variantId, variantData) => axios.put(`${API_URL}/variants/${variantId}`, variantData),
    deleteVariant: (variantId) => axios.delete(`${API_URL}/variants/${variantId}`),

    // // Stock management
    // updateStock: (variantId, quantity) => axios.put(`${API_URL}/variants/${variantId}/stock`, { quantity }),

    // // Search and filter
    searchProducts: (query) => axios.get(`${API_URL}/search`, {
        params: { q: query }
    }),
    suggestProducts: (keyword) =>
        axios.get(`${API_URL}/suggest?q=${encodeURIComponent(keyword)}`),
    // filterProducts: (filters) => axios.post(`${API_URL}/filter`, filters),

    // // Statistics
    // getProductStats: () => axios.get(`${API_URL}/stats`)

    //Tạo đánh giá sản phẩm
    createReview: (productId, reviewData) => axios.post(`${API_URL}/${productId}/createreviews`, reviewData),
    //Lấy tất cả đánh giá sản phẩm
    getAllReviews: () => axios.get(`${API_URL}/reviews`),
    //Lấy đánh giá sản phẩm
    getProductReviews: (productId) => axios.get(`${API_URL}/${productId}/reviews`),
    //Xoá đánh giá sản phẩm
    deleteReview: (reviewId, userId) =>
        axios.delete(`${API_URL}/reviews/${reviewId}`, {
            data: { userId }
        }),
    //Trả lời đánh giá sản phẩm
    replyReview(reviewId, data) {
        return axios.post(`${API_URL}/reviews/${reviewId}/reply`, data);
    },

    getAllBanners: () => axios.get(`${API_URL}/banner`),
    getProductsByCollectionId: (collectionId) => axios.get(`${API_URL}/banner/${collectionId}`)
};

export default productService;
