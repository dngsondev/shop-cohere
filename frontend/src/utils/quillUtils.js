import productService from '../services/productService';
import { getFullImageUrl, processQuillImageUrls } from './imageUtils';

// Export lại hàm từ imageUtils để tương thích với code cũ
export const processQuillContent = processQuillImageUrls;

// Hàm xử lý content khi hiển thị (đảm bảo ảnh có đường dẫn đầy đủ)
export const processQuillContentForDisplay = (content) => {
    if (!content) return '';

    // Sử dụng getFullImageUrl để xử lý ảnh giống như ảnh sản phẩm
    return content.replace(
        /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
        (match, beforeSrc, src, afterSrc) => {
            // Sử dụng getFullImageUrl để xử lý đường dẫn
            const fullImageUrl = getFullImageUrl(src);
            return `<img${beforeSrc}src="${fullImageUrl}"${afterSrc}>`;
        }
    );
};

// Hàm xử lý content khi edit (chuyển full URL về relative path)
export const processQuillContentForEdit = (content) => {
    if (!content) return '';

    // console.log('🔄 Processing Quill content for edit:', content);


    try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/';

        const processedContent = content.replace(
            /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
            (match, beforeSrc, src, afterSrc) => {
                let relativePath = src;

                // Nếu là full URL thì chuyển về relative path
                if (src.startsWith(baseUrl)) {
                    relativePath = src.replace(baseUrl, '');
                    if (relativePath.startsWith('/')) {
                        relativePath = relativePath.substring(1);
                    }
                }

                // Đảm bảo đường dẫn bắt đầu với uploads/
                if (!relativePath.startsWith('uploads/') && relativePath.includes('uploads')) {
                    relativePath = relativePath.substring(relativePath.indexOf('uploads'));
                }

                // Loại bỏ style cũ nếu có
                const cleanAfterSrc = afterSrc.replace(/\s*style=["'][^"']*["']/gi, '');

                console.log('📝 Processed image src:', relativePath);

                const newSrc = baseUrl + relativePath;

                return `<img${beforeSrc}src="${newSrc}"${cleanAfterSrc}>`;
            }
        );

        return processedContent;
    } catch (error) {
        console.error('Error processing Quill content for edit:', error);
        return content;
    }
};

// Image handler cho ReactQuill với fix context issue
export const imageHandler = function () {
    const quillInstance = this;

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        if (file) {
            // Kiểm tra kích thước file (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
                return;
            }

            // Kiểm tra loại file
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chọn file hình ảnh!');
                return;
            }

            const formData = new FormData();
            formData.append('image', file);

            try {
                let range = quillInstance.getSelection(true);
                if (!range) {
                    const length = quillInstance.getLength();
                    quillInstance.setSelection(length - 1);
                    range = { index: length - 1, length: 0 };
                }

                // Chèn placeholder text
                quillInstance.insertText(range.index, 'Đang tải hình ảnh...', 'user');

                // Upload hình ảnh
                const response = await productService.uploadQuillImage(formData);
                console.log('📸 Upload response:', response.data);

                if (response.data.success) {
                    // Xóa text loading
                    quillInstance.deleteText(range.index, 'Đang tải hình ảnh...'.length);

                    // Lấy URL từ response - ưu tiên imageUrl hoặc path
                    let imageUrl = response.data.imageUrl || response.data.path || response.data.url;

                    // Kiểm tra URL hợp lệ
                    if (!imageUrl || imageUrl === '//:0') {
                        throw new Error('Invalid image URL received from server');
                    }

                    // Xử lý đường dẫn cho uploads
                    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
                        // Đảm bảo đường dẫn có dạng uploads/...
                        imageUrl = imageUrl.replace(/^\/uploads\//, 'uploads/');
                    }

                    console.log('📸 Inserting image with URL:', imageUrl);

                    // Chèn ảnh với URL đã xử lý
                    quillInstance.insertEmbed(range.index, 'image', imageUrl);

                    // Đặt con trỏ sau ảnh
                    quillInstance.setSelection(range.index + 1);
                } else {
                    throw new Error(response.data.message || 'Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                // Xóa loading text nếu có lỗi
                try {
                    const range = quillInstance.getSelection(true) || { index: 0, length: 0 };
                    quillInstance.deleteText(range.index, 'Đang tải hình ảnh...'.length);
                    quillInstance.insertText(range.index, '❌ Lỗi upload hình ảnh!', { color: '#dc2626' });
                } catch (cleanupError) {
                    console.error('Error during cleanup:', cleanupError);
                }
                alert('Lỗi khi upload hình ảnh: ' + error.message);
            }
        }
    };
};

// Cấu hình modules cho ReactQuill
export const quillModules = {
    toolbar: {
        container: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean']
        ],
        handlers: {
            image: imageHandler
        }
    }
};

// Formats cho ReactQuill
export const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'blockquote', 'code-block', 'link', 'image'
];

// Hàm để normalize content trước khi lưu vào DB
export const normalizeQuillContentForDB = (content) => {
    if (!content) return '';

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Thay thế các URL đầy đủ thành đường dẫn tương đối để lưu vào DB
    let normalizedContent = content
        .replace(new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^"\\s]+)`, 'g'), '$1')
        .replace(/src="\/uploads\//g, 'src="uploads/') // Bỏ dấu / ở đầu uploads cho DB
        .replace(/src="uploads\//g, 'src="uploads/'); // Đảm bảo format đúng

    console.log('🔄 Normalized content for DB:', normalizedContent);
    return normalizedContent;
};

// Hàm clean up HTML content từ Quill
export const cleanQuillContent = (content) => {
    if (!content) return '';

    return content
        .replace(/<p><br><\/p>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/Đang tải hình ảnh\.\.\./g, '')
        .replace(/<span[^>]*color:[^>]*dc2626[^>]*>.*?<\/span>/g, '')
        .trim();
};

// Hàm helper để xử lý ảnh trong Quill content một cách thống nhất
export const processQuillContentWithUploads = (content) => {
    if (!content) return '';

    return content.replace(
        /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
        (match, beforeSrc, src, afterSrc) => {
            let processedSrc = src;

            // Xử lý đường dẫn uploads
            if (src.startsWith('uploads/')) {
                processedSrc = getFullImageUrl(src);
            } else if (src.includes('uploads')) {
                // Trích xuất phần uploads từ đường dẫn
                const uploadsIndex = src.indexOf('uploads');
                processedSrc = getFullImageUrl(src.substring(uploadsIndex));
            }

            return `<img${beforeSrc}src="${processedSrc}"${afterSrc} style="max-width: 100%; height: auto;">`;
        }
    );
};

// Export thêm một hàm tổng hợp để sử dụng dễ dàng
export const getProcessedQuillContent = (content, forEdit = false) => {
    if (!content) return '';

    if (forEdit) {
        return processQuillContentForEdit(content);
    } else {
        return processQuillContentWithUploads(content);
    }
};