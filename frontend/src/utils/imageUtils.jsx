export const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '/images/avatar/avt_default.png';

    // Nếu là URL đầy đủ (Google, Facebook, ...)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // Nếu là base64
    if (imagePath.startsWith('data:')) {
        return imagePath;
    }

    // Nếu là đường dẫn uploads (avatar upload)
    // const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    if (imagePath.startsWith('/uploads/')) {
        return `${baseUrl}${imagePath}`;
    }
    if (imagePath.startsWith('uploads/')) {
        return `${baseUrl}/${imagePath}`;
    }

    if (imagePath.startsWith('public/')) {
        return `/${imagePath.replace(/^public\//, '')}`;
    }

    // Nếu là ảnh mặc định
    if (imagePath.startsWith('/images/')) {
        return imagePath;
    }

    if (imagePath.startsWith('images/')) {
        return `/${imagePath}`;
    }

    // Trường hợp khác
    return imagePath;
};

// Hàm xử lý đường dẫn hình ảnh biến thể khi lưu vào DB
export const processVariantImageUrl = (imageUrl) => {
    if (!imageUrl) return '';

    // Xử lý data URL hoặc blob URL - these will be processed by backend
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        return imageUrl; // Let backend handle the conversion
    }

    // Nếu là URL localhost hoặc URL đầy đủ
    if (
        imageUrl.includes('localhost:5000') ||
        imageUrl.includes(import.meta.env.VITE_BACKEND_URL) ||
        imageUrl.startsWith('http')
    ) {
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];

        // Xác định thư mục dựa trên URL
        if (imageUrl.includes('/uploads/variants/')) {
            return `uploads/variants/${filename}`;
        } else if (imageUrl.includes('/uploads/products/')) {
            return `uploads/products/${filename}`;
        } else if (imageUrl.includes('/uploads/quill/')) {
            return `uploads/quill/${filename}`;
        } else {
            // Mặc định là variants nếu không xác định được
            return `uploads/variants/${filename}`;
        }
    }

    // Nếu đã là đường dẫn uploads chuẩn
    if (imageUrl.startsWith('uploads/')) {
        return imageUrl; // KHÔNG thêm dấu / ở đầu
    }

    // Nếu bắt đầu bằng / thì bỏ dấu / để tránh hiểu lầm là domain
    if (imageUrl.startsWith('/')) {
        const withoutSlash = imageUrl.substring(1);
        if (withoutSlash.startsWith('uploads/')) {
            return withoutSlash;
        }
    }

    return imageUrl;
};

// Hàm xử lý nội dung Quill để chuyển đổi URL ảnh
export const processQuillImageUrls = (content) => {
    if (!content) return '';

    try {
        // Sử dụng regex để tìm và thay thế src trong thẻ img
        const processedContent = content.replace(
            /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
            (match, beforeSrc, src, afterSrc) => {
                // Chuyển đổi relative path thành full URL
                const fullImageUrl = getFullImageUrl(src);

                // Thêm style để ảnh hiển thị đẹp hơn trong Quill content
                const style = 'max-width: 100%; height: auto; display: block; margin: 10px auto; border-radius: 4px;';

                return `<img${beforeSrc}src="${fullImageUrl}" style="${style}"${afterSrc}>`;
            }
        );

        return processedContent;
    } catch (error) {
        console.error('Error processing Quill image URLs:', error);
        return content;
    }
};

// Hàm helper để xác định loại ảnh dựa trên đường dẫn
export const getImageType = (imagePath) => {
    if (!imagePath) return 'unknown';

    if (imagePath.includes('/uploads/products/') || imagePath.includes('uploads/products/')) {
        return 'product';
    } else if (imagePath.includes('/uploads/variants/') || imagePath.includes('uploads/variants/')) {
        return 'variant';
    } else if (imagePath.includes('/uploads/quill/') || imagePath.includes('uploads/quill/')) {
        return 'description';
    } else if (imagePath.includes('/uploads/categories/') || imagePath.includes('uploads/categories/')) {
        return 'category';
    } else if (imagePath.includes('/uploads/brands/') || imagePath.includes('uploads/brands/')) {
        return 'brand';
    } else if (imagePath.includes('/uploads/banners/') || imagePath.includes('uploads/banners/')) {
        return 'banner';
    } else if (imagePath.includes('/uploads/avatars/') || imagePath.includes('uploads/avatars/')) {
        return 'avatar';
    } else if (imagePath.startsWith('images/')) {
        return 'static';
    } else if (imagePath.startsWith('data:')) {
        return 'base64';
    } else if (imagePath.startsWith('blob:')) {
        return 'blob';
    }

    return 'unknown';
};

// Hàm để kiểm tra ảnh có tồn tại không
export const checkImageExists = async (imagePath) => {
    try {
        const fullUrl = getFullImageUrl(imagePath);
        const response = await fetch(fullUrl, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error('Error checking image existence:', error);
        return false;
    }
};

// Hàm để debug đường dẫn ảnh
export const debugImagePath = (imagePath) => {
    console.log('🔍 Debug Image Path:', {
        original: imagePath,
        type: getImageType(imagePath),
        fullUrl: getFullImageUrl(imagePath),
        processed: processVariantImageUrl(imagePath)
    });
};

// Hàm tạo URL preview cho file được chọn
export const createPreviewUrl = (file) => {
    if (!file) return null;

    if (file instanceof File) {
        return URL.createObjectURL(file);
    }

    return getFullImageUrl(file);
};

// Hàm giải phóng URL preview
export const revokePreviewUrl = (url) => {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};