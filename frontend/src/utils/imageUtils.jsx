// Hàm để tạo đường dẫn hình ảnh đầy đủ
// export const getFullImageUrl = (imagePath) => {
//     // Xử lý trường hợp không có đường dẫn
//     if (!imagePath) {
//         return '/images/otherImages/no-image-placeholder.png';
//     }

//     // Nếu đường dẫn đã là URL đầy đủ
//     if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
//         return imagePath;
//     }

//     if (imagePath.startsWith('/uploads/quill/')) {
//         return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imagePath}`;
//     }

//     // Đảm bảo có baseUrl - sử dụng VITE_API_URL để đồng nhất
//     const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

//     // Nếu đường dẫn bắt đầu bằng "/uploads/" (absolute path)
//     if (imagePath.startsWith('/uploads/')) {
//         return `${baseUrl}${imagePath}`;
//     }

//     // Nếu đường dẫn bắt đầu bằng "uploads/" (relative path)
//     if (imagePath.startsWith('uploads/')) {
//         return `${baseUrl}/${imagePath}`;
//     }

//     // Nếu đường dẫn bắt đầu bằng "images/" (frontend static files)
//     if (imagePath.startsWith('images/')) {
//         return `/${imagePath}`;
//     }

//     // Nếu đường dẫn bắt đầu bằng "/images/" (frontend static files)
//     if (imagePath.startsWith('/images/')) {
//         return imagePath;
//     }

//     // Xử lý đường dẫn data URL (base64)
//     if (imagePath.startsWith('data:')) {
//         return imagePath;
//     }

//     // Xử lý đường dẫn blob URL
//     if (imagePath.startsWith('blob:')) {
//         return imagePath;
//     }

//     // Trường hợp mặc định - thêm vào uploads/
//     return `${baseUrl}/uploads/${imagePath}`;
// };

export const getFullImageUrl = (imagePath) => {
    // Xử lý trường hợp không có đường dẫn
    if (!imagePath) {
        return '/images/otherImages/no-image-placeholder.png';
    }

    // Debug log
    console.log('🔍 getFullImageUrl input:', imagePath);

    // Nếu đường dẫn đã là URL đầy đủ
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.log('✅ Full URL detected:', imagePath);
        return imagePath;
    }

    // Xử lý đường dẫn data URL (base64) - di chuyển lên trên
    if (imagePath.startsWith('data:')) {
        console.log('✅ Base64 URL detected');
        return imagePath;
    }

    // Xử lý đường dẫn blob URL - di chuyển lên trên  
    if (imagePath.startsWith('blob:')) {
        console.log('✅ Blob URL detected');
        return imagePath;
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('🔧 Base URL:', baseUrl);

    // Xử lý uploads/avatars/ (thêm case đặc biệt cho avatar)
    if (imagePath.includes('/uploads/avatars/') || imagePath.startsWith('uploads/avatars/')) {
        const finalUrl = imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`;
        console.log('✅ Avatar URL generated:', finalUrl);
        return finalUrl;
    }

    if (imagePath.startsWith('/uploads/quill/')) {
        const finalUrl = `${baseUrl}${imagePath}`;
        console.log('✅ Quill URL generated:', finalUrl);
        return finalUrl;
    }

    // Nếu đường dẫn bắt đầu bằng "/uploads/" (absolute path)
    if (imagePath.startsWith('/uploads/')) {
        const finalUrl = `${baseUrl}${imagePath}`;
        console.log('✅ Uploads absolute URL generated:', finalUrl);
        return finalUrl;
    }

    // Nếu đường dẫn bắt đầu bằng "uploads/" (relative path)
    if (imagePath.startsWith('uploads/')) {
        const finalUrl = `${baseUrl}/${imagePath}`;
        console.log('✅ Uploads relative URL generated:', finalUrl);
        return finalUrl;
    }

    // Nếu đường dẫn bắt đầu bằng "images/" (frontend static files)
    if (imagePath.startsWith('images/')) {
        const finalUrl = `/${imagePath}`;
        console.log('✅ Static images URL generated:', finalUrl);
        return finalUrl;
    }

    // Nếu đường dẫn bắt đầu bằng "/images/" (frontend static files)
    if (imagePath.startsWith('/images/')) {
        console.log('✅ Static images absolute URL:', imagePath);
        return imagePath;
    }

    // Trường hợp mặc định - thêm vào uploads/
    const finalUrl = `${baseUrl}/uploads/${imagePath}`;
    console.log('⚠️ Default URL generated:', finalUrl);
    return finalUrl;
};

// Hàm xử lý đường dẫn hình ảnh biến thể khi lưu vào DB
export const processVariantImageUrl = (imageUrl) => {
    if (!imageUrl) return '';

    // Xử lý data URL hoặc blob URL - these will be processed by backend
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        return imageUrl; // Let backend handle the conversion
    }

    // Nếu là URL localhost hoặc URL đầy đủ
    if (imageUrl.includes('localhost:5000') || imageUrl.startsWith('http')) {
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