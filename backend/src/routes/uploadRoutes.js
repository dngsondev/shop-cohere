import express from 'express';
import {
    quillImageUpload,
    variantImageUpload,
    categoryImageUpload,
    brandImageUpload,
    bannerImageUpload,
    avatarImageUpload,
    getImageUrl
} from '../config/multerConfig.js';

const router = express.Router();

// Upload ảnh cho Quill editor (mô tả sản phẩm)
router.post('/quill', quillImageUpload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file hình ảnh được cung cấp'
            });
        }

        const imageUrl = getImageUrl('quill', req.file.filename);
        console.log('📸 Ảnh Quill đã được tải lên:', imageUrl);

        res.json({
            success: true,
            imageUrl: `/${imageUrl}`, // Đảm bảo có dấu / ở đầu
            path: `/${imageUrl}`,     // Thêm field path cho tương thích
            message: 'Ảnh đã được tải lên thành công'
        });
    } catch (error) {
        console.error('❌ Lỗi khi tải ảnh quill lên:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải ảnh lên',
            error: error.message
        });
    }
});

// Upload ảnh variant
router.post('/variants', variantImageUpload.array('images', 20), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có file hình ảnh nào được cung cấp'
            });
        }

        const imageUrls = req.files.map(file => `/${getImageUrl('variants', file.filename)}`);

        res.json({
            success: true,
            imageUrls,
            count: imageUrls.length,
            message: 'Ảnh biến thể đã được tải lên thành công'
        });
    } catch (error) {
        console.error('❌ Lỗi khi tải ảnh biến thể lên:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải ảnh lên',
            error: error.message
        });
    }
});

// Upload ảnh category
router.post('/categories', categoryImageUpload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file hình ảnh được cung cấp'
            });
        }

        const imageUrl = getImageUrl('categories', req.file.filename);

        res.json({
            success: true,
            imageUrl: `/${imageUrl}`,
            message: 'Ảnh danh mục đã được tải lên thành công'
        });
    } catch (error) {
        console.error('❌ Lỗi khi tải ảnh danh mục lên:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải ảnh lên',
            error: error.message
        });
    }
});

// Upload ảnh brand
router.post('/brands', brandImageUpload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file hình ảnh được cung cấp'
            });
        }

        const imageUrl = getImageUrl('brands', req.file.filename);

        res.json({
            success: true,
            imageUrl: `/${imageUrl}`,
            message: 'Ảnh thương hiệu đã được tải lên thành công'
        });
    } catch (error) {
        console.error('❌ Lỗi khi tải ảnh thương hiệu lên:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải ảnh lên',
            error: error.message
        });
    }
});

// Upload ảnh banner
router.post('/banners', bannerImageUpload.array('images', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có file hình ảnh nào được cung cấp'
            });
        }

        const imageUrls = req.files.map(file => `/${getImageUrl('banners', file.filename)}`);

        res.json({
            success: true,
            imageUrls,
            count: imageUrls.length,
            message: 'Ảnh banner đã được tải lên thành công'
        });
    } catch (error) {
        console.error('❌ Lỗi khi tải ảnh banner lên:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải ảnh lên',
            error: error.message
        });
    }
});

// Upload avatar
router.post('/avatars', avatarImageUpload.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file avatar nào được cung cấp'
            });
        }

        const imageUrl = getImageUrl('avatars', req.file.filename);

        res.json({
            success: true,
            imageUrl: `/${imageUrl}`,
            message: 'Avatar đã được tải lên thành công'
        });
    } catch (error) {
        console.error('❌ Lỗi khi tải avatar lên:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải avatar lên',
            error: error.message
        });
    }
});

export default router;