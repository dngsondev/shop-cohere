import connection from '../config/db.js';
import { getProductById } from './productModel.js';

// Lấy tất cả banner như cũ
export const getAllBanners = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                collection_id,
                collection_name,
                description,
                banner_url,
                created_at
            FROM collections
            WHERE banner_url IS NOT NULL
        `;
        connection.query(sql, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Lấy tất cả sản phẩm thuộc 1 collection (dùng lại getProductById)
export const getProductsByCollectionId = (collectionId) => {
    return new Promise((resolve, reject) => {
        // Lấy tên bộ sưu tập trước
        const sqlCollection = `
            SELECT collection_name 
            FROM collections 
            WHERE collection_id = ?
        `;
        connection.query(sqlCollection, [collectionId], (err, collectionResults) => {
            if (err) return reject(err);
            const collectionName = collectionResults[0]?.collection_name || "";

            // Lấy danh sách product_id
            const sqlProducts = `
                SELECT product_id
                FROM collection_products
                WHERE collection_id = ?
            `;
            connection.query(sqlProducts, [collectionId], async (err, results) => {
                if (err) return reject(err);
                const productIds = results.map(row => row.product_id);
                try {
                    const products = await Promise.all(productIds.map(id => getProductById(id)));
                    // Trả về cả tên bộ sưu tập và danh sách sản phẩm
                    resolve({
                        collection_name: collectionName,
                        products: products.filter(Boolean)
                    });
                } catch (error) {
                    reject(error);
                }
            });
        });
    });
};