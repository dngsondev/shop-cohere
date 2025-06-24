import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configure multer storage for specific upload directory
 * @param {string} uploadFolder - Subfolder name in uploads directory
 * @returns {object} Configured multer middleware
 */
export const configureMulter = (uploadFolder) => {
    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, `../../uploads/${uploadFolder}`);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Configure storage
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            // Tạo tên file ngẫu nhiên để tránh trùng lặp
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
        }
    });

    // Configure multer with image filter
    const upload = multer({
        storage,
        fileFilter: (req, file, cb) => {
            // Chỉ chấp nhận các file hình ảnh
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        },
        limits: {
            fileSize: 10 * 1024 * 1024 // Giới hạn file 10MB
        }
    });

    return { upload, uploadDir };
};