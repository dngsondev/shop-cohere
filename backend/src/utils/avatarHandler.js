import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function lưu base64 avatar thành file
export const saveAvatarFromBase64 = async (base64Data, userId) => {
    try {
        // Tách base64 header và data
        const matches = base64Data.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 image format');
        }

        const imageType = matches[1]; // jpg, png, gif, etc.
        const imageData = matches[2];

        // Tạo tên file unique cho avatar
        const timestamp = Date.now();
        const fileName = `avatar-${userId}-${timestamp}.${imageType}`;

        // Tạo đường dẫn thư mục avatars
        const avatarDir = path.join(__dirname, '../../uploads/avatars');

        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(avatarDir)) {
            fs.mkdirSync(avatarDir, { recursive: true });
            console.log('📁 Created avatars directory');
        }

        // Đường dẫn file đầy đủ
        const filePath = path.join(avatarDir, fileName);

        // Chuyển đổi base64 thành buffer và lưu file
        const buffer = Buffer.from(imageData, 'base64');
        fs.writeFileSync(filePath, buffer);

        // Trả về đường dẫn relative để lưu vào database
        const relativePath = `uploads/avatars/${fileName}`;
        console.log(`💾 Saved avatar: ${relativePath}`);

        return relativePath;

    } catch (error) {
        console.error('❌ Error saving avatar:', error);
        throw error;
    }
};

// Function xóa avatar cũ
export const deleteOldAvatar = (avatarPath) => {
    try {
        if (!avatarPath || !avatarPath.startsWith('uploads/avatars/')) {
            return false; // Không xóa nếu không phải avatar file
        }

        const fullPath = path.join(__dirname, '../../', avatarPath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`🗑️ Deleted old avatar: ${avatarPath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error deleting avatar ${avatarPath}:`, error);
        return false;
    }
};

// Function validate avatar base64
export const validateAvatarBase64 = (base64Data) => {
    try {
        const matches = base64Data.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return { valid: false, error: 'Invalid base64 format' };
        }

        const imageType = matches[1].toLowerCase();
        const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];

        if (!allowedTypes.includes(imageType)) {
            return { valid: false, error: 'Unsupported image format. Only JPEG, PNG, WEBP allowed.' };
        }

        const imageData = matches[2];
        const buffer = Buffer.from(imageData, 'base64');

        // Kiểm tra kích thước (2MB = 2 * 1024 * 1024 bytes)
        if (buffer.length > 2 * 1024 * 1024) {
            return { valid: false, error: 'Image size exceeds 2MB limit' };
        }

        return { valid: true, imageType, buffer };
    } catch (error) {
        return { valid: false, error: 'Error validating image: ' + error.message };
    }
};