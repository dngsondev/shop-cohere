import connection from '../config/db.js';

export const addToCart = (customerId, productId, variantId, quantity) => {
    return new Promise((resolve, reject) => {
        console.log("Adding to cart:", { customerId, productId, variantId, quantity });

        const query = `
            INSERT INTO cart (customer_id, product_id, variant_id, quantity)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + ?
        `;
        connection.query(query, [customerId, productId, variantId, quantity, quantity], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

export const getCart = (customerId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT ca.cart_id, ca.quantity, pv.variant_id, s.size_name, p.product_id,
                pv.price, p.product_name, c.color_name, pv.image_url, p.discount
            FROM cart ca
            JOIN product_variants pv ON ca.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            JOIN colors c ON c.color_id = pv.color_id
            JOIN sizes s ON s.size_id = pv.size_id
            WHERE ca.customer_id = ?
            ORDER BY ca.cart_id DESC
        `;
        connection.query(query, [customerId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

export const getQuantity = (customerId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT COUNT(cart_id) AS total_quantity
            FROM cart
            WHERE customer_id = ?
        `;
        connection.query(query, [customerId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                // Handle null total_quantity (when cart is empty)
                if (results[0].total_quantity === null) {
                    results[0].total_quantity = 0;
                }
                resolve(results);
            }
        });
    });
}

export const deleteCart = (cartId) => {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM cart WHERE cart_id = ?`;
        connection.query(query, [cartId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

export const updateCart = (cartId, quantity) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE cart SET quantity = ? WHERE cart_id = ?`;
        connection.query(query, [quantity, cartId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// Xóa các sản phẩm cụ thể khỏi giỏ hàng theo cart_id
export const removeItemsFromCart = (customerId, cartIds) => {
    return new Promise((resolve, reject) => {
        console.log("Removing items from cart:", { customerId, cartIds });

        if (!customerId || !cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
            return reject(new Error('Customer ID and cart item IDs are required'));
        }

        // Tạo placeholders cho SQL IN clause
        const placeholders = cartIds.map(() => '?').join(',');
        const query = `DELETE FROM cart WHERE customer_id = ? AND cart_id IN (${placeholders})`;
        const params = [customerId, ...cartIds];

        connection.query(query, params, (err, results) => {
            if (err) {
                console.error('Database error removing items from cart:', err);
                reject(err);
            } else {
                console.log(`Successfully removed ${results.affectedRows} items from cart`);
                resolve({
                    success: true,
                    removedItems: results.affectedRows,
                    affectedRows: results.affectedRows
                });
            }
        });
    });
};

// Xóa tất cả sản phẩm trong giỏ hàng của customer
export const clearCartByCustomerId = (customerId) => {
    return new Promise((resolve, reject) => {
        console.log("Clearing cart for customer:", customerId);

        if (!customerId) {
            return reject(new Error('Customer ID is required'));
        }

        const query = 'DELETE FROM cart WHERE customer_id = ?';

        connection.query(query, [customerId], (err, results) => {
            if (err) {
                console.error('Database error clearing cart:', err);
                reject(err);
            } else {
                console.log(`Successfully cleared cart for customer ${customerId}, removed ${results.affectedRows} items`);
                resolve({
                    success: true,
                    removedItems: results.affectedRows,
                    affectedRows: results.affectedRows
                });
            }
        });
    });
};

// Kiểm tra xem cart_id có thuộc về customer không (security check)
export const verifyCartOwnership = (customerId, cartIds) => {
    return new Promise((resolve, reject) => {
        if (!customerId || !cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
            return reject(new Error('Customer ID and cart item IDs are required'));
        }

        const placeholders = cartIds.map(() => '?').join(',');
        const query = `
            SELECT cart_id, customer_id 
            FROM cart 
            WHERE customer_id = ? AND cart_id IN (${placeholders})
        `;
        const params = [customerId, ...cartIds];

        connection.query(query, params, (err, results) => {
            if (err) {
                console.error('Database error verifying cart ownership:', err);
                reject(err);
            } else {
                // Kiểm tra xem tất cả cart_id có thuộc về customer không
                const verifiedCartIds = results.map(row => row.cart_id);
                const invalidCartIds = cartIds.filter(id => !verifiedCartIds.includes(parseInt(id)));

                if (invalidCartIds.length > 0) {
                    console.warn(`Invalid cart IDs for customer ${customerId}:`, invalidCartIds);
                    resolve({
                        valid: false,
                        verifiedCartIds,
                        invalidCartIds
                    });
                } else {
                    resolve({
                        valid: true,
                        verifiedCartIds,
                        invalidCartIds: []
                    });
                }
            }
        });
    });
};

// Lấy chi tiết sản phẩm trong giỏ hàng theo cart_id (để logging/tracking)
export const getCartItemsByIds = (cartIds) => {
    return new Promise((resolve, reject) => {
        if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
            return resolve([]);
        }

        const placeholders = cartIds.map(() => '?').join(',');
        const query = `
            SELECT 
                ca.cart_id, 
                ca.customer_id,
                ca.quantity, 
                pv.variant_id, 
                s.size_name, 
                p.product_id,
                pv.price, 
                p.product_name, 
                c.color_name, 
                pv.image_url, 
                p.discount
            FROM cart ca
            JOIN product_variants pv ON ca.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            JOIN colors c ON c.color_id = pv.color_id
            JOIN sizes s ON s.size_id = pv.size_id
            WHERE ca.cart_id IN (${placeholders})
            ORDER BY ca.cart_id
        `;

        connection.query(query, cartIds, (err, results) => {
            if (err) {
                console.error('Database error getting cart items by IDs:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Xóa các sản phẩm đã hết hạn/không còn tồn tại (utility function)
export const cleanupInvalidCartItems = (customerId) => {
    return new Promise((resolve, reject) => {
        console.log("Cleaning up invalid cart items for customer:", customerId);

        const query = `
            DELETE ca FROM cart ca
            LEFT JOIN product_variants pv ON ca.variant_id = pv.variant_id
            LEFT JOIN products p ON pv.product_id = p.product_id
            WHERE ca.customer_id = ? 
            AND (pv.variant_id IS NULL OR p.product_id IS NULL OR pv.quantity <= 0)
        `;

        connection.query(query, [customerId], (err, results) => {
            if (err) {
                console.error('Database error cleaning up invalid cart items:', err);
                reject(err);
            } else {
                console.log(`Cleaned up ${results.affectedRows} invalid cart items for customer ${customerId}`);
                resolve({
                    success: true,
                    removedItems: results.affectedRows,
                    affectedRows: results.affectedRows
                });
            }
        });
    });
};

// Thêm hàm kiểm tra tồn kho cho cart items
export const getCartWithStockCheck = (customerId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT ca.cart_id, ca.quantity, pv.variant_id, s.size_name, p.product_id,
                pv.price, p.product_name, c.color_name, pv.image_url, p.discount,
                pv.quantity as stock_quantity,
                CASE 
                    WHEN pv.quantity <= 0 THEN 'out_of_stock'
                    WHEN ca.quantity > pv.quantity THEN 'insufficient_stock'
                    ELSE 'available'
                END as stock_status
            FROM cart ca
            JOIN product_variants pv ON ca.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            JOIN colors c ON c.color_id = pv.color_id
            JOIN sizes s ON s.size_id = pv.size_id
            WHERE ca.customer_id = ?
            ORDER BY ca.cart_id DESC
        `;
        connection.query(query, [customerId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Hàm cập nhật số lượng trong giỏ hàng theo tồn kho hiện tại
export const adjustCartQuantityToStock = (cartId, maxQuantity) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE cart SET quantity = ? WHERE cart_id = ?`;
        connection.query(query, [maxQuantity, cartId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Hàm xóa các sản phẩm hết hàng khỏi giỏ hàng
export const removeOutOfStockItems = (customerId) => {
    return new Promise((resolve, reject) => {
        const query = `
            DELETE ca FROM cart ca
            JOIN product_variants pv ON ca.variant_id = pv.variant_id
            WHERE ca.customer_id = ? AND pv.quantity <= 0
        `;
        connection.query(query, [customerId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    removedItems: results.affectedRows
                });
            }
        });
    });
};