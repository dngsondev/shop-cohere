import { errorHandler } from './middleware/errorMiddleware.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Import routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
// ... other routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Bật CORS
app.use(cors());

// Body parser 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình serve static files
// Phục vụ các tệp tĩnh từ thư mục uploads trong thư mục gốc
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Mount routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
// ... other routes

// Đặt ở cuối file, sau khi khai báo tất cả routes
app.use(errorHandler);

export default app;