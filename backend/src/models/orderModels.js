import connection from '../config/db.js';

// Thêm function getOrderStatus
export function getOrderStatus(orderId) {
    return new Promise((resolve, reject) => {
        const query = `SELECT payment_status, order_status, payment_date 
                   FROM orders 
                   WHERE order_id = ?`;

        connection.query(query, [orderId], (err, results) => {
            if (err) {
                console.error("Error getting order status:", err);
                return reject(new Error("Lỗi khi truy vấn trạng thái đơn hàng"));
            }

            if (results.length === 0) {
                return resolve(null);
            }

            resolve(results[0]);
        });
    });
}

// Cải tiến function checkInventory
export const checkInventory = (items) => {
    return new Promise((resolve, reject) => {
        if (!items || items.length === 0) {
            return resolve({ success: true, message: "No items to check" });
        }

        const variantIds = items.map(item => item.variantId);
        console.log("Checking inventory for variants:", variantIds);

        const query = `
            SELECT 
                pv.variant_id, 
                pv.quantity,
                p.product_name,
                c.color_name,
                s.size_name
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            LEFT JOIN colors c ON pv.color_id = c.color_id
            LEFT JOIN sizes s ON pv.size_id = s.size_id
            WHERE pv.variant_id IN (?)
        `;

        connection.query(query, [variantIds], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return reject(err);
            }

            console.log("Inventory check results:", results);

            // Kiểm tra từng sản phẩm
            for (const item of items) {
                const variant = results.find(v => v.variant_id === item.variantId);

                if (!variant) {
                    return resolve({
                        success: false,
                        product: `Sản phẩm không tồn tại (ID: ${item.variantId})`
                    });
                }

                if (variant.quantity < item.quantity) {
                    const productInfo = `${variant.product_name} - ${variant.color_name || 'N/A'} - ${variant.size_name || 'N/A'}`;
                    return resolve({
                        success: false,
                        product: productInfo,
                        available: variant.quantity,
                        requested: item.quantity
                    });
                }
            }

            resolve({
                success: true,
                message: "Tất cả sản phẩm đều có đủ số lượng"
            });
        });
    });
};

// Lấy danh sách phương thức thanh toán
export const getPayments = () => {
    return new Promise((resolve, reject) => {
        // Kiểm tra xem có bảng payment_methods không
        const checkTableQuery = "SHOW TABLES LIKE 'payment_methods'";

        connection.query(checkTableQuery, (err, results) => {
            if (err) {
                console.error('Error checking payment_methods table:', err);
                return reject(err);
            }

            if (results.length > 0) {
                // Có bảng payment_methods
                const query = `
                    SELECT 
                        method_id,
                        note,
                        provider
                    FROM payment_methods 
                    ORDER BY method_id ASC
                `;

                connection.query(query, (err, results) => {
                    if (err) {
                        console.error('Error getting payment methods:', err);
                        return reject(err);
                    }

                    // ✅ Đảm bảo results là array và format đúng
                    const validResults = Array.isArray(results) ? results : [];
                    console.log('✅ Payment methods from DB:', validResults);

                    // ✅ Trả về array trực tiếp
                    resolve(validResults);
                });
            } else {
                // Không có bảng, trả về data tĩnh
                const staticPaymentMethods = [
                    {
                        method_id: 1,
                        note: "Thanh toán khi nhận hàng",
                        provider: "COD"
                    },
                    {
                        method_id: 2,
                        note: "Cổng thanh toán VNPay",
                        provider: "VNPay"
                    }
                ];

                console.log('✅ Using static payment methods:', staticPaymentMethods);
                resolve(staticPaymentMethods);
            }
        });
    });
}

// Thêm function để cập nhật số lượng sản phẩm
export const updateProductQuantities = (items) => {
    return new Promise((resolve, reject) => {
        console.log('Updating product quantities for items:', items);

        // Tạo câu query để cập nhật số lượng cho nhiều variant cùng lúc
        const updatePromises = items.map(item => {
            return new Promise((resolveItem, rejectItem) => {
                const query = `
                    UPDATE product_variants 
                    SET quantity = quantity - ? 
                    WHERE variant_id = ? AND quantity >= ?
                `;

                connection.query(query, [item.quantity, item.variantId, item.quantity], (err, result) => {
                    if (err) {
                        console.error(`Error updating variant ${item.variantId}:`, err);
                        return rejectItem(err);
                    }

                    if (result.affectedRows === 0) {
                        return rejectItem(new Error(`Không đủ số lượng cho variant ${item.variantId}`));
                    }

                    console.log(`Updated variant ${item.variantId}: -${item.quantity}`);
                    resolveItem({
                        variantId: item.variantId,
                        quantityReduced: item.quantity,
                        affectedRows: result.affectedRows
                    });
                });
            });
        });

        Promise.all(updatePromises)
            .then(results => {
                console.log('All product quantities updated successfully:', results);
                resolve({
                    success: true,
                    updatedItems: results,
                    message: `Đã cập nhật ${results.length} sản phẩm`
                });
            })
            .catch(error => {
                console.error('Error updating product quantities:', error);
                reject(error);
            });
    });
};

// Cập nhật function createOrder để bao gồm việc giảm số lượng
export const createOrder = (orderData, voucher_id, payment_date, payment_status) => {
    return new Promise((resolve, reject) => {
        const { customer_id, items, address, delivery_id, payment_method, total_amount, note, recipient_name, phone } = orderData;

        console.log("Creating order with data:", {
            customer_id,
            items: items?.length,
            address,
            delivery_id,
            payment_method,
            total_amount,
            voucher_id,
            payment_status
        });

        // Validate required fields
        if (!customer_id || !items || items.length === 0) {
            return reject(new Error("Missing required fields: customer_id or items"));
        }

        // Bắt đầu transaction để đảm bảo tính nhất quán
        connection.getConnection((err, conn) => {
            if (err) return reject(err);

            conn.beginTransaction((transactionErr) => {
                if (transactionErr) {
                    conn.release();
                    console.error("Transaction error:", transactionErr);
                    return reject(transactionErr);
                }

                // 1. Chèn đơn hàng vào bảng `orders`
                const orderQuery = `
                    INSERT INTO orders (
                        customer_id,
                        delivery_infor_id,
                        total_price,    
                        voucher_id,
                        created_at,
                        order_status,
                        payment_method,
                        payment_status,
                        note
                    ) VALUES (?, ?, ?, ?, NOW(), 'Chờ xác nhận', ?, ?, ?);
                `;

                conn.query(orderQuery, [
                    customer_id,
                    delivery_id || null,
                    total_amount,
                    voucher_id || null,
                    payment_method,
                    payment_status || 'Chưa thanh toán',
                    note || null
                ], (err, orderResult) => {
                    if (err) {
                        console.error("Lỗi khi tạo đơn hàng:", err);
                        return conn.rollback(() => {
                            conn.release();
                            reject(err);
                        });
                    }

                    const orderId = orderResult.insertId;
                    console.log(`✅ Created order with ID ${orderId}`);

                    // 2. Chèn chi tiết đơn hàng vào bảng `order_details`
                    const orderDetailQuery = `
                        INSERT INTO order_details (order_id, product_id, variant_id, quantity, price) 
                        VALUES ?
                    `;
                    const orderDetails = items.map(item => [
                        orderId,
                        item.productId,
                        item.variantId,
                        item.quantity,
                        item.priceQuotation
                    ]);

                    conn.query(orderDetailQuery, [orderDetails], (detailErr, orderDetailResult) => {
                        if (detailErr) {
                            console.error("Lỗi khi thêm chi tiết đơn hàng:", detailErr);
                            return conn.rollback(() => {
                                conn.release();
                                reject(detailErr);
                            });
                        }

                        console.log(`✅ Created order details for order ${orderId}`);

                        // 3. Cập nhật số lượng sản phẩm
                        const updateQuantityPromises = items.map(item => {
                            return new Promise((resolveUpdate, rejectUpdate) => {
                                const updateQuery = `
                                    UPDATE product_variants 
                                    SET quantity = quantity - ? 
                                    WHERE variant_id = ? AND quantity >= ?
                                `;

                                conn.query(updateQuery, [item.quantity, item.variantId, item.quantity], (updateErr, updateResult) => {
                                    if (updateErr) {
                                        console.error(`Error updating variant ${item.variantId}:`, updateErr);
                                        return rejectUpdate(updateErr);
                                    }

                                    if (updateResult.affectedRows === 0) {
                                        return rejectUpdate(new Error(`Không đủ số lượng cho variant ${item.variantId}`));
                                    }

                                    console.log(`✅ Updated quantity for variant ${item.variantId}: -${item.quantity}`);
                                    resolveUpdate();
                                });
                            });
                        });

                        Promise.all(updateQuantityPromises)
                            .then(() => {
                                // Commit transaction nếu tất cả đều thành công
                                conn.commit((commitErr) => {
                                    conn.release();
                                    if (commitErr) {
                                        console.error("Commit error:", commitErr);
                                        return reject(commitErr);
                                    }

                                    console.log(`✅ Order ${orderId} created successfully with quantity updates`);
                                    resolve(orderId);
                                });
                            })
                            .catch((quantityErr) => {
                                console.error("Error updating quantities:", quantityErr);
                                conn.rollback(() => {
                                    conn.release();
                                    reject(quantityErr);
                                });
                            });
                    });
                });
            });
        });
    });
};

export const updateOrderPaymentStatus = (orderId, status) => {
    return new Promise((resolve, reject) => {
        const query = `
      UPDATE orders 
      SET payment_status = ? 
      WHERE order_id = ?
    `;

        connection.query(query, [status, orderId], (err, result) => {
            if (err) {
                console.error("Lỗi khi cập nhật trạng thái thanh toán:", err);
                return reject(err);
            }
            resolve(result);
        });
    });
}

export const getAllOrders = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT o.*, c.customer_username, c.customer_fullname as customer_name, c.customer_id
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            ORDER BY o.created_at DESC
        `;
        connection.query(query, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

export const updateOrderStatus = (orderId, status) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE orders SET order_status = ? WHERE order_id = ?`;
        connection.query(query, [status, orderId], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

export const getOrderDetailFull = (orderId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                od.*, 
                p.product_name, 
                pv.color_id, 
                pv.size_id, 
                c.color_name, 
                s.size_name, 
                pi.product_image_url as image_url
            FROM order_details od
            JOIN products p ON od.product_id = p.product_id
            LEFT JOIN product_variants pv ON od.variant_id = pv.variant_id
            LEFT JOIN colors c ON pv.color_id = c.color_id
            LEFT JOIN sizes s ON pv.size_id = s.size_id
            LEFT JOIN (
                SELECT product_id, MIN(product_image_url) as product_image_url
                FROM product_images
                GROUP BY product_id
            ) pi ON p.product_id = pi.product_id
            WHERE od.order_id = ?
        `;
        connection.query(query, [orderId], (err, results) => {
            if (err) reject(err);
            else resolve(results); // Trả về mảng items
        });
    });
};

// Tạo đơn hàng tạm thời cho VNPAY (chưa thanh toán)
// export const createTempOrder = (orderData, voucher_id = null) => {
//     return new Promise((resolve, reject) => {
//         connection.beginTransaction((err) => {
//             if (err) {
//                 console.error('Error starting transaction:', err);
//                 return reject(err);
//             }

//             try {
//                 // 1. Tạo đơn hàng với trạng thái "Chờ thanh toán"
//                 const orderQuery = `
//                     INSERT INTO orders (
//                         customer_id, delivery_infor_id, payment_method, 
//                         total_price, order_status, payment_status, note, 
//                         voucher_id, created_at
//                     ) VALUES (?, ?, ?, ?, 'Chờ xác nhận', 'Chưa thanh toán', ?, ?, NOW())
//                 `;

//                 connection.query(orderQuery, [
//                     orderData.customer_id,
//                     orderData.delivery_id || null,
//                     orderData.payment_method,
//                     orderData.total_amount,
//                     orderData.note || '',
//                     voucher_id
//                 ], (err, orderResult) => {
//                     if (err) {
//                         console.error('Error creating temp order:', err);
//                         return connection.rollback(() => reject(err));
//                     }

//                     const orderId = orderResult.insertId;
//                     console.log('Temp order created with ID:', orderId);

//                     // 2. Thêm chi tiết đơn hàng
//                     const orderDetailQueries = orderData.items.map(item => {
//                         return new Promise((resolveItem, rejectItem) => {
//                             const detailQuery = `
//                                 INSERT INTO order_details (
//                                     order_id, product_id, variant_id, quantity, price
//                                 ) VALUES (?, ?, ?, ?, ?)
//                             `;

//                             connection.query(detailQuery, [
//                                 orderId,
//                                 item.productId,
//                                 item.variantId,
//                                 item.quantity,
//                                 item.priceQuotation
//                             ], (err, result) => {
//                                 if (err) {
//                                     console.error('Error creating order detail:', err);
//                                     return rejectItem(err);
//                                 }
//                                 resolveItem(result);
//                             });
//                         });
//                     });

//                     // Thực hiện tất cả chi tiết đơn hàng
//                     Promise.all(orderDetailQueries)
//                         .then(() => {
//                             // 3. Commit transaction
//                             connection.commit((err) => {
//                                 if (err) {
//                                     console.error('Error committing temp order transaction:', err);
//                                     return connection.rollback(() => reject(err));
//                                 }

//                                 console.log('Temp order transaction completed successfully');
//                                 resolve({
//                                     success: true,
//                                     order_id: orderId,
//                                     message: 'Tạo đơn hàng tạm thời thành công'
//                                 });
//                             });
//                         })
//                         .catch((err) => {
//                             console.error('Error in order details:', err);
//                             connection.rollback(() => reject(err));
//                         });
//                 });

//             } catch (error) {
//                 console.error('Unexpected error in createTempOrder:', error);
//                 connection.rollback(() => reject(error));
//             }
//         });
//     });
// };

export const createTempOrder = (orderData, voucher_id = null) => {
    return new Promise((resolve, reject) => {
        connection.getConnection((err, conn) => {
            if (err) return reject(err);

            conn.beginTransaction((err) => {
                if (err) {
                    conn.release();
                    console.error('Error starting transaction:', err);
                    return reject(err);
                }

                try {
                    // 1. Tạo đơn hàng với trạng thái "Chờ thanh toán"
                    const orderQuery = `
                        INSERT INTO orders (
                            customer_id, delivery_infor_id, payment_method, 
                            total_price, order_status, payment_status, note, 
                            voucher_id, created_at
                        ) VALUES (?, ?, ?, ?, 'Chờ xác nhận', 'Chưa thanh toán', ?, ?, NOW())
                    `;

                    conn.query(orderQuery, [
                        orderData.customer_id,
                        orderData.delivery_id || null,
                        orderData.payment_method,
                        orderData.total_amount,
                        orderData.note || '',
                        voucher_id
                    ], (err, orderResult) => {
                        if (err) {
                            console.error('Error creating temp order:', err);
                            return conn.rollback(() => {
                                conn.release();
                                reject(err);
                            });
                        }

                        const orderId = orderResult.insertId;
                        console.log('Temp order created with ID:', orderId);

                        // 2. Thêm chi tiết đơn hàng
                        const orderDetailQueries = orderData.items.map(item => {
                            return new Promise((resolveItem, rejectItem) => {
                                const detailQuery = `
                                    INSERT INTO order_details (
                                        order_id, product_id, variant_id, quantity, price
                                    ) VALUES (?, ?, ?, ?, ?)
                                `;

                                conn.query(detailQuery, [
                                    orderId,
                                    item.productId,
                                    item.variantId,
                                    item.quantity,
                                    item.priceQuotation
                                ], (err, result) => {
                                    if (err) {
                                        console.error('Error creating order detail:', err);
                                        return rejectItem(err);
                                    }
                                    resolveItem(result);
                                });
                            });
                        });

                        // Thực hiện tất cả chi tiết đơn hàng
                        Promise.all(orderDetailQueries)
                            .then(() => {
                                // 3. Commit transaction
                                conn.commit((err) => {
                                    if (err) {
                                        console.error('Error committing temp order transaction:', err);
                                        return conn.rollback(() => {
                                            conn.release();
                                            reject(err);
                                        });
                                    }

                                    console.log('Temp order transaction completed successfully');
                                    conn.release();
                                    resolve({
                                        success: true,
                                        order_id: orderId,
                                        message: 'Tạo đơn hàng tạm thời thành công'
                                    });
                                });
                            })
                            .catch((err) => {
                                console.error('Error in order details:', err);
                                conn.rollback(() => {
                                    conn.release();
                                    reject(err);
                                });
                            });
                    });

                } catch (error) {
                    console.error('Unexpected error in createTempOrder:', error);
                    conn.rollback(() => {
                        conn.release();
                        reject(error);
                    });
                }
            });
        });
    });
};

// Cập nhật trạng thái đơn hàng sau khi thanh toán thành công
export const updateOrderAfterPayment = (orderId, paymentStatus = 'Đã thanh toán') => {
    return new Promise((resolve, reject) => {
        connection.getConnection((err, conn) => {
            if (err) return reject(err);

            conn.beginTransaction((err) => {
                if (err) {
                    conn.release();
                    return reject(err);
                }

                try {
                    const updateOrderQuery = `
                        UPDATE orders 
                        SET payment_status = ?, 
                            order_status = 'Đã xác nhận', 
                            payment_date = NOW(),
                            updated_at = NOW()
                        WHERE order_id = ?
                    `;
                    conn.query(updateOrderQuery, [paymentStatus, orderId], (err, result) => {
                        if (err) {
                            return conn.rollback(() => {
                                conn.release();
                                reject(err);
                            });
                        }
                        if (result.affectedRows === 0) {
                            return conn.rollback(() => {
                                conn.release();
                                reject(new Error('Không tìm thấy đơn hàng để cập nhật'));
                            });
                        }
                        const getOrderItemsQuery = `
                            SELECT od.variant_id, od.quantity 
                            FROM order_details od 
                            WHERE od.order_id = ?
                        `;
                        conn.query(getOrderItemsQuery, [orderId], (err, orderItems) => {
                            if (err) {
                                return conn.rollback(() => {
                                    conn.release();
                                    reject(err);
                                });
                            }
                            if (orderItems.length === 0) {
                                return conn.commit((err) => {
                                    conn.release();
                                    if (err) return reject(err);
                                    resolve({
                                        success: true,
                                        message: 'Cập nhật trạng thái đơn hàng thành công',
                                        orderId: orderId
                                    });
                                });
                            }
                            const updateInventoryQueries = orderItems.map(item => {
                                return new Promise((resolveUpdate, rejectUpdate) => {
                                    const updateInventoryQuery = `
                                        UPDATE product_variants 
                                        SET quantity = GREATEST(0, quantity - ?) 
                                        WHERE variant_id = ?
                                    `;
                                    conn.query(updateInventoryQuery, [
                                        item.quantity,
                                        item.variant_id
                                    ], (err, result) => {
                                        if (err) return rejectUpdate(err);
                                        resolveUpdate();
                                    });
                                });
                            });
                            Promise.all(updateInventoryQueries)
                                .then(() => {
                                    conn.commit((err) => {
                                        conn.release();
                                        if (err) return reject(err);
                                        resolve({
                                            success: true,
                                            message: 'Cập nhật trạng thái thanh toán và trừ kho thành công',
                                            orderId: orderId,
                                            updatedItems: orderItems.length
                                        });
                                    });
                                })
                                .catch((err) => {
                                    conn.rollback(() => {
                                        conn.release();
                                        reject(err);
                                    });
                                });
                        });
                    });
                } catch (error) {
                    conn.rollback(() => {
                        conn.release();
                        reject(error);
                    });
                }
            });
        });
    });
};

// Hủy đơn hàng tạm thời (xóa đơn hàng chưa thanh toán)
export const cancelTempOrder = (orderId) => {
    return new Promise((resolve, reject) => {
        connection.getConnection((err, conn) => {
            if (err) return reject(err);

            conn.beginTransaction((err) => {
                if (err) {
                    conn.release();
                    return reject(err);
                }

                try {
                    const checkOrderQuery = `
                        SELECT order_id, payment_status, order_status 
                        FROM orders 
                        WHERE order_id = ?
                    `;
                    conn.query(checkOrderQuery, [orderId], (err, orderResult) => {
                        if (err) {
                            return conn.rollback(() => {
                                conn.release();
                                reject(err);
                            });
                        }
                        if (orderResult.length === 0) {
                            return conn.rollback(() => {
                                conn.release();
                                reject(new Error('Không tìm thấy đơn hàng'));
                            });
                        }
                        const order = orderResult[0];
                        if (order.payment_status === 'Đã thanh toán') {
                            return conn.rollback(() => {
                                conn.release();
                                reject(new Error('Không thể hủy đơn hàng đã thanh toán'));
                            });
                        }
                        const deleteOrderDetailsQuery = `
                            DELETE FROM order_details 
                            WHERE order_id = ?
                        `;
                        conn.query(deleteOrderDetailsQuery, [orderId], (err, detailResult) => {
                            if (err) {
                                return conn.rollback(() => {
                                    conn.release();
                                    reject(err);
                                });
                            }
                            const deleteOrderQuery = `
                                DELETE FROM orders 
                                WHERE order_id = ?
                            `;
                            conn.query(deleteOrderQuery, [orderId], (err, orderDeleteResult) => {
                                if (err) {
                                    return conn.rollback(() => {
                                        conn.release();
                                        reject(err);
                                    });
                                }
                                if (orderDeleteResult.affectedRows === 0) {
                                    return conn.rollback(() => {
                                        conn.release();
                                        reject(new Error('Không thể xóa đơn hàng'));
                                    });
                                }
                                conn.commit((err) => {
                                    conn.release();
                                    if (err) return reject(err);
                                    resolve({
                                        success: true,
                                        message: 'Hủy đơn hàng tạm thời thành công',
                                        orderId: orderId
                                    });
                                });
                            });
                        });
                    });
                } catch (error) {
                    conn.rollback(() => {
                        conn.release();
                        reject(error);
                    });
                }
            });
        });
    });
};

// Thêm hàm xác nhận đơn hàng sau thanh toán
export const confirmOrderAfterPayment = (orderId, confirmData) => {
    return new Promise((resolve, reject) => {
        connection.getConnection((err, conn) => {
            if (err) return reject(err);

            conn.beginTransaction((err) => {
                if (err) {
                    conn.release();
                    return reject(err);
                }

                try {
                    const updateOrderQuery = `
                        UPDATE orders 
                        SET payment_status = 'Đã thanh toán',
                            order_status = 'Đã xác nhận',
                            payment_date = NOW(),
                            transaction_id = ?,
                            updated_at = NOW()
                        WHERE order_id = ? AND payment_status != 'Đã thanh toán'
                    `;
                    conn.query(updateOrderQuery, [
                        confirmData.transaction_id || null,
                        orderId
                    ], (err, result) => {
                        if (err) {
                            return conn.rollback(() => {
                                conn.release();
                                reject(err);
                            });
                        }
                        if (result.affectedRows === 0) {
                            return conn.rollback(() => {
                                conn.release();
                                reject(new Error('Đơn hàng đã được xác nhận hoặc không tồn tại'));
                            });
                        }
                        const getOrderItemsQuery = `
                            SELECT od.variant_id, od.quantity 
                            FROM order_details od 
                            WHERE od.order_id = ?
                        `;
                        conn.query(getOrderItemsQuery, [orderId], (err, orderItems) => {
                            if (err) {
                                return conn.rollback(() => {
                                    conn.release();
                                    reject(err);
                                });
                            }
                            if (orderItems.length === 0) {
                                return conn.commit((err) => {
                                    conn.release();
                                    if (err) return reject(err);
                                    resolve({
                                        success: true,
                                        message: 'Xác nhận đơn hàng thành công',
                                        orderId: orderId
                                    });
                                });
                            }
                            const updateInventoryQueries = orderItems.map(item => {
                                return new Promise((resolveUpdate, rejectUpdate) => {
                                    const updateInventoryQuery = `
                                        UPDATE product_variants 
                                        SET quantity = GREATEST(0, quantity - ?) 
                                        WHERE variant_id = ?
                                    `;
                                    conn.query(updateInventoryQuery, [
                                        item.quantity,
                                        item.variant_id
                                    ], (err, result) => {
                                        if (err) return rejectUpdate(err);
                                        resolveUpdate();
                                    });
                                });
                            });
                            Promise.all(updateInventoryQueries)
                                .then(() => {
                                    conn.commit((err) => {
                                        conn.release();
                                        if (err) return reject(err);
                                        resolve({
                                            success: true,
                                            message: 'Xác nhận đơn hàng và cập nhật kho thành công',
                                            orderId: orderId,
                                            updatedItems: orderItems.length
                                        });
                                    });
                                })
                                .catch((err) => {
                                    conn.rollback(() => {
                                        conn.release();
                                        reject(err);
                                    });
                                });
                        });
                    });
                } catch (error) {
                    conn.rollback(() => {
                        conn.release();
                        reject(error);
                    });
                }
            });
        });
    });
};