import { createVnpayUrl, verifyReturnUrl } from '../services/payment/vnpayService.js';
import connection from '../config/db.js'; // THÊM DÒNG NÀY

export const vnpayCreateOrder = async (req, res) => {
    try {
        console.log("Received VNPAY request body:", req.body);

        const orderData = req.body;

        // Validate input data  
        if (!orderData || typeof orderData !== 'object') {
            console.error("Invalid orderData:", orderData);
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu đơn hàng không hợp lệ'
            });
        }

        if (!orderData.order_id) {
            console.error("Missing order_id:", orderData);
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin mã đơn hàng (order_id)'
            });
        }

        if (!orderData.total_amount || orderData.total_amount <= 0) {
            console.error("Invalid total_amount:", orderData.total_amount);
            return res.status(400).json({
                success: false,
                message: 'Thiếu hoặc sai thông tin số tiền (total_amount)'
            });
        }

        console.log("Creating VNPAY URL for temp order:", orderData.order_id, "Amount:", orderData.total_amount);

        // Tạo URL thanh toán VNPay
        const paymentUrl = createVnpayUrl(orderData);

        if (!paymentUrl) {
            throw new Error('Không thể tạo URL thanh toán VNPAY');
        }

        console.log("VNPAY URL created successfully");

        // Trả về URL để frontend redirect người dùng
        res.json({
            success: true,
            paymentUrl,
            message: 'Tạo link thanh toán thành công'
        });
    } catch (err) {
        console.error('Error creating VNPay URL:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo link thanh toán VNPay',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

// Xử lý callback từ VNPay - Tự động xác nhận đơn hàng
export const vnpayCallback = async (req, res) => {
    console.log("🔥 ==> VNPAY CALLBACK ENTRY POINT <==");
    console.log("🔥 Query params:", req.query);

    try {
        console.log("🔥 VNPAY callback received:", req.query);
        console.log("🔥 Request URL:", req.originalUrl);

        const vnpayParams = req.query;
        const verifyResult = verifyReturnUrl(vnpayParams);

        console.log("🔥 VNPAY verification result:", verifyResult);

        if (verifyResult.isValid && verifyResult.transactionStatus === '00') {
            const orderId = verifyResult.orderId;

            console.log("🔥 Payment successful for order:", orderId);
            console.log("🔥 Starting order update process...");

            try {
                // SỬA: Cập nhật cả order_status và payment_status
                const updateOrderQuery = `
                    UPDATE orders 
                    SET order_status = 'Đã thanh toán', 
                        payment_status = 'Đã thanh toán',
                        updated_at = NOW()
                    WHERE order_id = ?
                `;

                console.log("🔥 Executing update query for order:", orderId);
                console.log("🔥 Update query:", updateOrderQuery);

                connection.query(updateOrderQuery, [orderId], (err, updateResult) => {
                    if (err) {
                        console.error('🔥 Error updating order:', err);
                        console.error('🔥 MySQL Error Code:', err.code);
                        console.error('🔥 MySQL Error Message:', err.message);
                        return res.json({
                            success: false,
                            message: "Không thể cập nhật trạng thái đơn hàng",
                            orderId: orderId,
                            error: err.message
                        });
                    }

                    console.log("🔥 Order updated successfully!");
                    console.log("🔥 Update result:", updateResult);
                    console.log("🔥 Affected rows:", updateResult.affectedRows);
                    console.log("🔥 Changed rows:", updateResult.changedRows);

                    // Verify update by checking the order
                    const checkOrderQuery = `SELECT order_id, order_status, payment_status FROM orders WHERE order_id = ?`;
                    connection.query(checkOrderQuery, [orderId], (checkErr, checkResult) => {
                        if (checkErr) {
                            console.error('🔥 Error checking updated order:', checkErr);
                        } else {
                            console.log("🔥 Order after update:", checkResult[0]);
                        }
                    });

                    // Lấy thông tin để xóa cart
                    console.log("🔥 Getting order info for cart cleanup...");
                    const getOrderInfoQuery = `
                        SELECT o.customer_id, od.variant_id, od.quantity
                        FROM orders o
                        JOIN order_details od ON o.order_id = od.order_id
                        WHERE o.order_id = ?
                    `;

                    connection.query(getOrderInfoQuery, [orderId], (err, orderInfo) => {
                        if (err) {
                            console.error('🔥 Error getting order info:', err);
                        } else if (orderInfo.length > 0) {
                            console.log("🔥 Order info for cart cleanup:", orderInfo);
                            const customerId = orderInfo[0].customer_id;
                            const variantIds = orderInfo.map(item => item.variant_id);

                            console.log("🔥 Customer ID:", customerId);
                            console.log("🔥 Variant IDs to remove:", variantIds);

                            // Xóa sản phẩm khỏi giỏ hàng
                            const deleteCartQuery = `
                                DELETE FROM cart 
                                WHERE customer_id = ? AND variant_id IN (${variantIds.map(() => '?').join(',')})
                            `;

                            console.log("🔥 Executing cart cleanup query...");
                            console.log("🔥 Delete cart query:", deleteCartQuery);

                            connection.query(deleteCartQuery, [customerId, ...variantIds], (cartErr, cartResult) => {
                                if (cartErr) {
                                    console.error('🔥 Error removing items from cart:', cartErr);
                                    console.error('🔥 Cart Error Code:', cartErr.code);
                                    console.error('🔥 Cart Error Message:', cartErr.message);
                                } else {
                                    console.log(`🔥 Cart cleanup successful!`);
                                    console.log(`🔥 Removed ${cartResult.affectedRows} items from cart for customer ${customerId}`);
                                    console.log("🔥 Cart cleanup result:", cartResult);
                                }
                            });
                        } else {
                            console.log("🔥 No order info found for cart cleanup");
                        }
                    });

                    console.log("🔥 Sending success response...");
                    return res.json({
                        success: true,
                        message: "Thanh toán và cập nhật đơn hàng thành công",
                        orderId: orderId
                    });
                });

            } catch (updateError) {
                console.error("🔥 Exception in update process:", updateError);
                console.error("🔥 Update error stack:", updateError.stack);
                return res.json({
                    success: false,
                    message: "Lỗi cập nhật đơn hàng",
                    orderId: orderId,
                    error: updateError.message
                });
            }
        } else {
            console.log("🔥 Payment verification failed!");
            console.log("🔥 Is valid:", verifyResult.isValid);
            console.log("🔥 Transaction status:", verifyResult.transactionStatus);
            console.log("🔥 Expected status: 00");
            return res.json({
                success: false,
                message: "Xác thực thanh toán thất bại",
                orderId: verifyResult.orderId
            });
        }

    } catch (err) {
        console.error('🔥 Exception in VNPay callback:', err);
        console.error('🔥 Error stack:', err.stack);
        res.status(500).json({
            success: false,
            message: 'Lỗi xử lý callback',
            error: err.message
        });
    }
};