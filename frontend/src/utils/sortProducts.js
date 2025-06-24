/**
 * Sắp xếp danh sách sản phẩm theo tiêu chí
 * @param {Array} products - Danh sách sản phẩm
 * @param {'newest'|'bestsell'|'popular'|'price_asc'|'price_desc'} sortBy - Tiêu chí sắp xếp
 * @returns {Array}
 */
function getDiscountedPrice(price, discount) {
    const priceNum = Number(price) || 0;
    const discountNum = Number(discount) || 0;
    return priceNum - (priceNum * discountNum / 100);
}

export function sortProducts(products, sortBy) {
    if (!Array.isArray(products)) return [];

    switch (sortBy) {
        case "newest":
            return [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case "bestsell":
            return [...products].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
        case "popular":
            return [...products].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        case "price_asc":
            return [...products].sort(
                (a, b) => getDiscountedPrice(a.price, a.discount) - getDiscountedPrice(b.price, b.discount)
            );
        case "price_desc":
            return [...products].sort(
                (a, b) => getDiscountedPrice(b.price, b.discount) - getDiscountedPrice(a.price, a.discount)
            );
        default:
            return products;
    }
}