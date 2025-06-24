// Thêm vào controllers/orderController.js trên backend
import {
  checkInventory,
  getPayments,
  createOrder,
  getOrderStatus,
  getOrderDetailFull,
  updateOrderStatus,
  getAllOrders,
  updateOrderPaymentStatus,
  createTempOrder,
  updateOrderAfterPayment,
  cancelTempOrder,
  confirmOrderAfterPayment
} from "../models/orderModels.js";
import { removeItemsFromCart } from '../models/cartModels.js';

export const createOrderController = async (req, res) => {
  try {
    const orderData = req.body;
    console.log("Order data received:", orderData);

    // Validate input data
    if (!orderData || !orderData.customer_id || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đơn hàng không hợp lệ. Thiếu customer_id hoặc items"
      });
    }

    // 1. Kiểm tra inventory trước
    const inventoryCheck = await checkInventory(orderData.items);
    console.log("Inventory check result:", inventoryCheck);

    if (!inventoryCheck.success) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm ${inventoryCheck.product} không đủ số lượng. Có sẵn: ${inventoryCheck.available}, Yêu cầu: ${inventoryCheck.requested}`,
      });
    }

    // 2. Xác định trạng thái thanh toán
    let payment_status = "Chưa thanh toán";
    let payment_date = null;
    let voucher_id = orderData.voucher_id || null;

    // Nếu có thanh toán QR
    if (orderData.payment_status === "Đã thanh toán với QR" || orderData.qr_paid) {
      payment_status = "Đã thanh toán với QR";
      payment_date = new Date();
    } else if (orderData.payment_method && parseInt(orderData.payment_method) > 1) {
      payment_status = "Đã thanh toán";
      payment_date = new Date();
    }

    // 3. Tạo đơn hàng (đã bao gồm cập nhật số lượng)
    const orderResult = await createOrder(orderData, voucher_id, payment_date, payment_status);

    console.log("Order created successfully:", orderResult);

    return res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công và đã cập nhật số lượng sản phẩm",
      order_id: orderResult
    });

  } catch (error) {
    console.error("Error creating order:", error);

    // Xử lý các loại lỗi khác nhau
    if (error.message && error.message.includes("Không đủ số lượng")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message && error.message.includes("Missing required fields")) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc để tạo đơn hàng"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi tạo đơn hàng",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Lấy danh sách phương thức thanh toán
export const getPaymentsController = async (req, res) => {
  try {
    console.log('🔍 Getting payment methods...');

    const payments = await getPayments();

    console.log('✅ Retrieved payments:', payments);
    console.log('✅ Is array:', Array.isArray(payments));

    // ✅ Đảm bảo luôn trả về array trong property data
    const responseData = Array.isArray(payments) ? payments : [];

    res.json({
      success: true,
      data: responseData, // ⚠️ Chú ý: Frontend cần access qua .data
      message: 'Lấy danh sách phương thức thanh toán thành công'
    });

  } catch (error) {
    console.error('❌ Error in getPaymentsController:', error);
    res.status(500).json({
      success: false,
      data: [], // ✅ Luôn trả về array rỗng khi lỗi
      message: 'Lỗi lấy danh sách phương thức thanh toán',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getOrderStatusController = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã đơn hàng"
      });
    }

    const orderStatus = await getOrderStatus(orderId);

    if (!orderStatus) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }

    res.json({
      success: true,
      order_id: orderId,
      payment_status: orderStatus.payment_status || "Chưa thanh toán",
      order_status: orderStatus.order_status || "Chờ xác nhận",
      payment_date: orderStatus.payment_date || null
    });
  } catch (error) {
    console.error("Error checking order status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra trạng thái đơn hàng",
      error: error.message
    });
  }
};

export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách đơn hàng" });
  }
};

// THÊM CONTROLLER UPDATE ORDER STATUS
export const updateOrderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: 'Thiếu orderId hoặc status' });
    }

    // Nếu chuyển sang "Hoàn thành" thì cập nhật luôn payment_status
    if (status === 'Hoàn thành') {
      // Cập nhật cả hai trường
      await updateOrderStatus(orderId, status);
      await updateOrderPaymentStatus(orderId, 'Đã thanh toán');
    } else {
      await updateOrderStatus(orderId, status);
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      orderId,
      newStatus: status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái đơn hàng', error: error.message });
  }
};

// THÊM CONTROLLER GET ORDER DETAIL
export const getOrderDetailController = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('🔍 Getting order detail for:', orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu orderId'
      });
    }

    const orderItems = await getOrderDetailFull(orderId);

    if (orderItems && orderItems.length > 0) {
      res.status(200).json({
        success: true,
        message: 'Lấy chi tiết đơn hàng thành công',
        order: orderItems // Trả về mảng items
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong đơn hàng'
      });
    }
  } catch (error) {
    console.error('❌ Error getting order detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết đơn hàng',
      error: error.message
    });
  }
};

// Tạo đơn hàng tạm thời cho VNPAY
export const createTempOrderController = async (req, res) => {
  try {
    console.log("Creating temp order with data:", req.body);

    const orderData = req.body;

    // Validate dữ liệu đầu vào
    if (!orderData.customer_id || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đơn hàng không hợp lệ'
      });
    }

    // Kiểm tra tồn kho
    const inventoryCheck = await checkInventory(orderData.items);
    if (!inventoryCheck.success) {
      return res.status(400).json({
        success: false,
        message: inventoryCheck.message,
        outOfStockItems: inventoryCheck.outOfStockItems
      });
    }

    // Tạo đơn hàng tạm thời
    const result = await createTempOrder(orderData, orderData.voucher_id);

    if (result.success) {
      console.log("Temp order created successfully:", result.order_id);

      res.json({
        success: true,
        order_id: result.order_id,
        message: 'Tạo đơn hàng tạm thời thành công'
      });
    } else {
      throw new Error('Không thể tạo đơn hàng tạm thời');
    }

  } catch (error) {
    console.error("Error creating temp order:", error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo đơn hàng tạm thời: ' + error.message
    });
  }
};

// Hủy đơn hàng tạm thời
export const cancelTempOrderController = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã đơn hàng'
      });
    }

    const result = await cancelTempOrder(orderId);

    res.json({
      success: true,
      message: result.message,
      orderId: result.orderId
    });

  } catch (error) {
    console.error('Error in cancelTempOrderController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi hủy đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Xác nhận đơn hàng sau thanh toán
export const confirmOrderAfterPaymentController = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const confirmData = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã đơn hàng'
      });
    }

    const result = await confirmOrderAfterPayment(orderId, confirmData);

    res.json({
      success: true,
      message: result.message,
      orderId: result.orderId,
      updatedItems: result.updatedItems
    });

  } catch (error) {
    console.error('Error in confirmOrderAfterPaymentController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi xác nhận đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};