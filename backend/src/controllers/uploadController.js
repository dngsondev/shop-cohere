import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn thư mục lưu ảnh tạm thời
const tempUploadsDir = path.join(__dirname, '../../uploads/temp');

// Đảm bảo thư mục uploads/temp tồn tại
if (!fs.existsSync(tempUploadsDir)) {
    fs.mkdirSync(tempUploadsDir, { recursive: true });
}

export const uploadTempImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không có file nào được tải lên' });
        }

        const sessionId = req.body.sessionId || 'default';

        // Tạo thư mục riêng cho phiên làm việc
        const sessionDir = path.join(tempUploadsDir, sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        // Di chuyển file vào thư mục của phiên
        const filename = `${Date.now()}-${req.file.originalname}`;
        const tempFilePath = path.join(sessionDir, filename);

        fs.renameSync(req.file.path, tempFilePath);

        // URL trả về cho client
        const relativePath = path.join('uploads/temp', sessionId, filename).replace(/\\/g, '/');
        const imageUrl = `http://localhost:5000/${relativePath}`;

        res.status(200).json({
            success: true,
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Lỗi khi tải lên hình ảnh tạm:', error);
        res.status(500).json({ message: 'Lỗi server khi tải lên hình ảnh' });
    }
};

export const cleanupTempImages = (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ message: 'Thiếu sessionId' });
        }

        // Xóa thư mục của phiên
        const sessionDir = path.join(tempUploadsDir, sessionId);
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }

        res.status(200).json({ success: true, message: 'Đã xóa ảnh tạm' });
    } catch (error) {
        console.error('Lỗi khi dọn dẹp hình ảnh tạm:', error);
        res.status(500).json({ message: 'Lỗi server khi dọn dẹp hình ảnh' });
    }
};

// Hàm chuyển đổi hình ảnh tạm thời sang vĩnh viễn khi lưu sản phẩm
export const moveTemporaryToFinal = async (sessionId, content) => {
    if (!sessionId) return content;

    const sessionDir = path.join(tempUploadsDir, sessionId);
    if (!fs.existsSync(sessionDir)) return content;

    const productImagesDir = path.join(__dirname, '../../uploads/product-images');
    if (!fs.existsSync(productImagesDir)) {
        fs.mkdirSync(productImagesDir, { recursive: true });
    }

    let updatedContent = content;

    // Tìm tất cả các URL ảnh tạm trong nội dung
    const tempImageRegex = new RegExp(`http://localhost:5000/uploads/temp/${sessionId}/([^"\\s]+)`, 'g');
    let match;

    while ((match = tempImageRegex.exec(content)) !== null) {
        const fullUrl = match[0];
        const filename = match[1];

        // Đường dẫn hiện tại của file
        const tempFilePath = path.join(sessionDir, filename);

        if (fs.existsSync(tempFilePath)) {
            // Tạo đường dẫn mới
            const newFilename = `${Date.now()}-${filename}`;
            const newFilePath = path.join(productImagesDir, newFilename);

            // Di chuyển file
            fs.copyFileSync(tempFilePath, newFilePath);

            // URL mới
            const newUrl = `http://localhost:5000/uploads/product-images/${newFilename}`;

            // Cập nhật nội dung
            updatedContent = updatedContent.replace(fullUrl, newUrl);
        }
    }

    return updatedContent;
};

export const uploadCommandFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không có file nào được tải lên' });
        }
        // Đường dẫn file đã lưu: req.file.path hoặc req.file.filename
        res.json({ success: true, filename: req.file.filename, path: req.file.path });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lưu file', error: error.message });
    }
};

const commandsDir = path.join(__dirname, '../../uploads/commands');

export const getCommandFiles = (req, res) => {
    try {
        if (!fs.existsSync(commandsDir)) {
            fs.mkdirSync(commandsDir, { recursive: true });
        }
        const files = fs.readdirSync(commandsDir).filter(f => !fs.statSync(path.join(commandsDir, f)).isDirectory());
        res.json({ success: true, files });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách file', error: error.message });
    }
};

export const deleteCommandFile = (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(commandsDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return res.json({ success: true, message: 'Đã xoá file thành công' });
        }
        res.status(404).json({ success: false, message: 'File không tồn tại' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xoá file', error: error.message });
    }
};