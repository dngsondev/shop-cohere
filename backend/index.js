import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import productRoutes from './src/routes/productRoutes.js';
import cohereRoutes from './src/routes/cohereRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import configRoutes from './src/routes/configRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';

dotenv.config();

// Cấu hình __dirname trong ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
    // origin: '*',
    origin: ['https://shop-cohere.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Tăng giới hạn kích thước request
app.use(express.json({ limit: '100mb' })); // Tăng từ 50mb lên 100mb
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static files cho tất cả các loại ảnh
app.use('/uploads', (req, res, next) => {
    console.log("🖼️ STATIC FILE REQUEST:", {
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Cache-Control', 'public, max-age=31536000');
    next();
}, express.static(path.join(__dirname, 'uploads')));

// Middleware để ghi log request
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Dùng các routes
app.use('/products', productRoutes);
app.use('/api', cohereRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/cart', cartRoutes);
app.use('/order', orderRoutes);
app.use('/upload', uploadRoutes);
app.use('/chat', chatRoutes);

// Route mặc định
app.get('/', (req, res) => {
    res.send('Backend server đang hoạt động');
});

// Tạo tất cả thư mục uploads cần thiết
const createUploadDirectories = () => {
    const uploadsDirs = [
        'uploads',
        'uploads/products',      // Ảnh chung của sản phẩm
        'uploads/variants',      // Ảnh của các biến thể
        'uploads/quill',         // Ảnh trong mô tả (từ Quill editor)
        'uploads/categories',    // Ảnh danh mục
        'uploads/brands',        // Ảnh thương hiệu
        'uploads/banners',       // Ảnh banner/slider
        'uploads/avatars',       // Ảnh đại diện người dùng
        'uploads/temp',          // Thư mục tạm cho upload
        'uploads/commands'
    ];

    uploadsDirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });

    console.log('✅ All upload directories are ready');
};

// Tạo các thư mục khi khởi động server
createUploadDirectories();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
