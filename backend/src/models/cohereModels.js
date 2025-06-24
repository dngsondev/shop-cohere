import db from '../config/db.js'

export const getInforToSuggestQuestions = (userId, productId) => {
    return new Promise((resolve, reject) => {
        let query = ``;
        if (userId) {
            query = `
                SELECT p.product_name, p.description, p.discount, pv.quantity, od.variant_id, c.gender
                FROM products p
                JOIN product_variants pv ON pv.product_id = p.product_id
                LEFT JOIN order_details od ON od.variant_id = pv.variant_id
                LEFT JOIN orders o ON o.order_id = od.order_id
                LEFT JOIN customers c ON o.customer_id = c.customer_id
                WHERE c.customer_id = ?`;
            db.query(query, [userId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        }
        else if (userId && productId) {
            query = `
                SELECT p.product_name, p.description, p.discount, pv.quantity, MAX(od.variant_id) AS variant_id, MAX(c.gender) AS gender
                FROM products p
                JOIN product_variants pv ON pv.product_id = p.product_id
                LEFT JOIN order_details od ON od.variant_id = pv.variant_id
                LEFT JOIN orders o ON o.order_id = od.order_id
                LEFT JOIN customers c ON o.customer_id = c.customer_id
                WHERE c.customer_id = ? OR p.product_id = ?
                GROUP BY p.product_name, p.description, p.discount, pv.quantity`;
            db.query(query, [userId, productId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        }
        else if (productId) {
            query = `
                SELECT p.product_name, p.description, p.discount, pv.quantity, MAX(od.variant_id) AS variant_id, MAX(c.gender) AS gender
                FROM products p
                JOIN product_variants pv ON pv.product_id = p.product_id
                LEFT JOIN order_details od ON od.variant_id = pv.variant_id
                LEFT JOIN orders o ON o.order_id = od.order_id
                LEFT JOIN customers c ON o.customer_id = c.customer_id
                WHERE p.product_id = ?
                GROUP BY p.product_name, p.description, p.discount, pv.quantity`;
            db.query(query, [productId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        }

        // db.query(query, [userId, productId], (err, results) => {
        //     if (err) {
        //         reject(err);
        //     } else {
        //         resolve(results);
        //     }
        // });
    });
}