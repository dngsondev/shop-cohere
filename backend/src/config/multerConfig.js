import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo storage cho từng loại upload
const createStorage = (subFolder) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = path.join(__dirname, '../../uploads', subFolder);

            // Tạo thư mục nếu chưa tồn tại
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
                console.log(`📁 Created directory: uploads/${subFolder}`);
            }

            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const extension = path.extname(originalName);
            const baseName = path.basename(originalName, extension);

            // Tạo tên file an toàn
            const safeName = baseName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .trim();

            const fileName = `${safeName}-${uniqueSuffix}${extension}`;
            console.log(`📁 Saving to ${subFolder}:`, fileName);

            cb(null, fileName);
        }
    });
};

// File filter cho images
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Tạo các multer instances cho từng loại upload
export const productImageUpload = multer({
    storage: createStorage('products'),
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 20, // Tăng từ 10 lên 20 files
        fieldSize: 50 * 1024 * 1024 // 50MB total
    }
});

export const variantImageUpload = multer({
    storage: createStorage('variants'),
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 30, // Tăng lên 30 files cho variants
        fieldSize: 50 * 1024 * 1024
    }
});

export const quillImageUpload = multer({
    storage: createStorage('quill'),
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1 // 1 file tại một thời điểm
    }
});

export const categoryImageUpload = multer({
    storage: createStorage('categories'),
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    }
});

export const brandImageUpload = multer({
    storage: createStorage('brands'),
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    }
});

export const bannerImageUpload = multer({
    storage: createStorage('banners'),
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5
    }
});

export const avatarImageUpload = multer({
    storage: createStorage('avatars'),
    fileFilter: imageFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1
    }
});

// Storage cho media review (ảnh và video)
const reviewMediaStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        let subFolder = '';
        if (file.mimetype.startsWith('image/')) {
            subFolder = 'review-images';
        } else if (file.mimetype.startsWith('video/')) {
            subFolder = 'review-videos';
        } else {
            subFolder = 'temp';
        }
        const uploadPath = path.join(__dirname, '../../uploads', subFolder);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log(`📁 Created directory: uploads/${subFolder}`);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const safeName = baseName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .trim();
        const fileName = `${safeName}-${uniqueSuffix}${extension}`;
        cb(null, fileName);
    }
});

// Không filter, cho phép cả ảnh và video
export const reviewMediaUpload = multer({
    storage: reviewMediaStorage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB per file (tùy chỉnh)
        files: 5
    }
});

// Utility function để lấy đường dẫn URL
export const getImageUrl = (subFolder, filename) => {
    return `uploads/${subFolder}/${filename}`;
};

// Helper function để xóa file
export const deleteImage = (filePath) => {
    try {
        const fullPath = path.join(__dirname, '../../', filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`🗑️ Deleted image: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error deleting image ${filePath}:`, error);
        return false;
    }
};

// Ensure directories exist
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dirPath}`);
    }
};

export const commandFileUpload = multer({
    storage: createStorage('commands'),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

// Create all required directories
const uploadDirs = [
    'uploads/products',
    'uploads/variants', // Make sure this exists
    'uploads/quill',
    'uploads/categories',
    'uploads/brands',
    'uploads/banners',
    'uploads/avatars',
    'uploads/temp'
];

uploadDirs.forEach(dir => {
    ensureDirectoryExists(path.join(process.cwd(), dir));
});

// Export default cho backward compatibility
export default {
    productImageUpload,
    variantImageUpload,
    quillImageUpload,
    categoryImageUpload,
    brandImageUpload,
    bannerImageUpload,
    avatarImageUpload,
    // getImageUrl,
    // deleteImage,
    commandFileUpload
};