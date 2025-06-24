/**
 * Gom nhóm các biến thể có cùng product_id
 * @param {Object} product - Sản phẩm được chọn để chỉnh sửa
 * @param {Array} allProducts - Danh sách tất cả sản phẩm
 * @returns {Object} - Dữ liệu sản phẩm đã được xử lý với biến thể được gộp
 */
export const processProductVariants = (product, allProducts) => {
    if (!product || !allProducts) return product;

    // Lọc tất cả các biến thể có cùng product_id
    const allVariants = allProducts.filter(p => p.product_id === product.product_id);

    // Thu thập tất cả size và color ids từ các biến thể
    const sizeIds = [];
    const colorIds = [];
    const sizeNames = [];
    const colorNames = [];
    const variants = [];

    allVariants.forEach(variant => {
        // Thêm size_id nếu chưa có trong mảng
        if (variant.size_id && !sizeIds.includes(variant.size_id)) {
            sizeIds.push(variant.size_id);
            sizeNames.push(variant.size_name);
        }

        // Thêm color_id nếu chưa có trong mảng
        if (variant.color_id && !colorIds.includes(variant.color_id)) {
            colorIds.push(variant.color_id);
            colorNames.push(variant.color_name);
        }

        // Thêm biến thể vào mảng variants
        if (variant.variant_id) {
            variants.push({
                id: variant.variant_id,
                sizeName: variant.size_name,
                size_id: variant.size_id,
                colorName: variant.color_name,
                color_id: variant.color_id,
                colorValue: variant.color_value || '#000000',
                price: variant.price || 0,
                quantity: variant.quantity || 0,
                imageUrl: variant.image_url ? `/${variant.image_url}` : ''
            });
        }
    });

    // Xử lý hình ảnh sản phẩm
    const productImages = product.product_images ?
        product.product_images.split(',').map(img => `/${img.trim()}`) : [];

    // Trả về sản phẩm đã được xử lý
    return {
        ...product,
        size_ids: sizeIds,
        color_ids: colorIds,
        sizes: sizeNames.join(', '),
        colors: colorNames.join(', '),
        productImages,
        productVariants: variants
    };
};