import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function để lưu base64 image với tên tùy chỉnh
export const saveBase64Image = async (base64Data, subFolder, customFileName) => {
    try {
        // Tách base64 header và data
        const matches = base64Data.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 image format');
        }

        const imageType = matches[1]; // jpg, png, gif, etc.
        const imageData = matches[2];

        // Tạo tên file với extension đúng
        const fileName = `${customFileName}.${imageType}`;

        // Tạo đường dẫn thư mục
        const uploadDir = path.join(__dirname, '../../uploads', subFolder);

        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`📁 Created directory: uploads/${subFolder}`);
        }

        // Đường dẫn file đầy đủ
        const filePath = path.join(uploadDir, fileName);

        // Chuyển đổi base64 thành buffer và lưu file
        const buffer = Buffer.from(imageData, 'base64');
        fs.writeFileSync(filePath, buffer);

        // Trả về đường dẫn relative để lưu vào database
        const relativePath = `uploads/${subFolder}/${fileName}`;
        console.log(`💾 Saved base64 image: ${relativePath}`);

        return relativePath;

    } catch (error) {
        console.error('❌ Error saving base64 image:', error);
        throw error;
    }
};

// Function xử lý images trong description - CẢI TIẾN
export const processImagesInDescription = async (description) => {
    if (!description) return { processedDescription: description, uploadedImageUrls: [] };

    const uploadedImageUrls = [];
    let processedDescription = description;

    // Regex để tìm base64 images trong description
    const base64ImageRegex = /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/g;

    let match;
    let imageIndex = 1;
    const timestamp = Date.now();

    console.log('🖼️ Processing images in description...');

    while ((match = base64ImageRegex.exec(description)) !== null) {
        try {
            const fullBase64 = match[0].match(/src="([^"]+)"/)[1];
            const fileName = `description-${timestamp}-${imageIndex}`;

            // Lưu ảnh vào thư mục quill
            const savedImagePath = await saveBase64Image(fullBase64, 'quill', fileName);
            uploadedImageUrls.push(savedImagePath);

            // Thay thế base64 bằng URL trong description (không có dấu / ở đầu)
            const newImageTag = match[0].replace(/src="[^"]+"/, `src="${savedImagePath}"`);
            processedDescription = processedDescription.replace(match[0], newImageTag);

            console.log(`📝 Processed description image ${imageIndex}: ${savedImagePath}`);
            imageIndex++;

        } catch (error) {
            console.error(`❌ Error processing description image ${imageIndex}:`, error);
            imageIndex++;
        }
    }

    console.log(`✅ Processed ${imageIndex - 1} images in description`);
    return {
        processedDescription,
        uploadedImageUrls
    };
};

// Function mới: Extract base64 images từ HTML content
export const extractBase64Images = (htmlContent) => {
    const base64Regex = /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/g;
    const images = [];
    let match;

    while ((match = base64Regex.exec(htmlContent)) !== null) {
        images.push({
            fullMatch: match[0],
            format: match[1], // jpeg, png, etc.
            data: match[2],   // base64 data
            fullBase64: match[0].match(/src="([^"]+)"/)[1] // complete data:image/...
        });
    }

    return images;
};

// Function mới: Xử lý description với tên file tùy chỉnh
export const processDescriptionImages = async (description, customPrefix = null) => {
    if (!description) return description;

    const base64Images = extractBase64Images(description);
    if (base64Images.length === 0) {
        console.log('ℹ️ No base64 images found in description');
        return description;
    }

    let processedDescription = description;
    const timestamp = Date.now();

    console.log(`🖼️ Found ${base64Images.length} base64 images to process`);

    for (let i = 0; i < base64Images.length; i++) {
        const image = base64Images[i];
        const prefix = customPrefix || 'description';
        const fileName = `${prefix}-${timestamp}-${i + 1}`;

        try {
            // Lưu ảnh vào thư mục quill
            const savedImagePath = await saveBase64Image(image.fullBase64, 'quill', fileName);

            // Thay thế base64 bằng đường dẫn file
            const newImgTag = image.fullMatch.replace(
                /src="data:image\/[^;]+;base64,[^"]+"/,
                `src="${savedImagePath}"`
            );

            processedDescription = processedDescription.replace(image.fullMatch, newImgTag);

            console.log(`✅ Converted base64 image ${i + 1} to: ${savedImagePath}`);
        } catch (error) {
            console.error(`❌ Error processing image ${i + 1}:`, error);
        }
    }

    return processedDescription;
};

// Function mới: Cleanup images cũ từ description
export const cleanupOldDescriptionImages = async (oldDescription) => {
    if (!oldDescription) return;

    const imgRegex = /<img[^>]+src="(uploads\/quill\/[^"]+)"[^>]*>/g;
    let match;
    let cleanedCount = 0;

    console.log('🧹 Cleaning up old description images...');

    while ((match = imgRegex.exec(oldDescription)) !== null) {
        const imagePath = match[1];
        const deleted = deleteImage(imagePath);
        if (deleted) cleanedCount++;
    }

    if (cleanedCount > 0) {
        console.log(`✅ Cleaned up ${cleanedCount} old description images`);
    }
};

// Function mới: Validate và extract images từ description
export const extractImagesFromDescription = (description) => {
    if (!description) return [];

    const imgRegex = /<img[^>]+src="(uploads\/quill\/[^"]+)"[^>]*>/g;
    const images = [];
    let match;

    while ((match = imgRegex.exec(description)) !== null) {
        images.push(match[1]);
    }

    return images;
};

// Function để xóa file (giữ nguyên)
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

// Function mới: Cleanup orphaned images
export const cleanupOrphanedImages = async (usedImages = []) => {
    try {
        const quillDir = path.join(__dirname, '../../uploads/quill');
        if (!fs.existsSync(quillDir)) {
            console.log('ℹ️ Quill directory does not exist');
            return 0;
        }

        const files = fs.readdirSync(quillDir);
        const usedImageSet = new Set(usedImages.map(img => path.basename(img)));
        let cleanedCount = 0;

        for (const file of files) {
            if (!usedImageSet.has(file)) {
                const filePath = `uploads/quill/${file}`;
                const deleted = deleteImage(filePath);
                if (deleted) cleanedCount++;
            }
        }

        console.log(`🧹 Cleaned up ${cleanedCount} orphaned images`);
        return cleanedCount;

    } catch (error) {
        console.error('❌ Error cleaning up orphaned images:', error);
        return 0;
    }
};

// Function mới: Get all images từ tất cả descriptions trong database
export const getAllUsedDescriptionImages = async (pool) => {
    try {
        const [rows] = await pool.execute('SELECT description FROM products WHERE description IS NOT NULL');
        const allUsedImages = [];

        rows.forEach(row => {
            const images = extractImagesFromDescription(row.description);
            allUsedImages.push(...images);
        });

        return [...new Set(allUsedImages)]; // Remove duplicates

    } catch (error) {
        console.error('❌ Error getting used description images:', error);
        return [];
    }
};