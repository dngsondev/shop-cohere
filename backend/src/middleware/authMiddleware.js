import jwt from 'jsonwebtoken';

export const verifyAdminToken = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không có token, truy cập bị từ chối'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_backup_secret_key');

        // Kiểm tra xem có phải admin không (role = 0 hoặc 1)
        if (decoded.role !== 0 && decoded.role !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập. Chỉ dành cho quản trị viên.'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Admin token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

// Export middleware cũ để tương thích
export const authMiddleware = verifyAdminToken;