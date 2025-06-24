import connection from '../config/db.js';
import bcrypt from 'bcryptjs';

import {
  login,
  register,
  loginWithGoogle,
  createDeliveryInfor,
  getUserDeliveryAddresses,
  updateDeliveryAddress,
  deleteDeliveryAddress,
  getLastestUser,
  updateUser,
  setDefaultDeliveryAddress,
  getCustomerOrders,
  getOrderDetail,
  cancelOrder,
  changeUserPassword
} from "../models/userModels.js";


// Import avatar handler
import { saveAvatarFromBase64, deleteOldAvatar, validateAvatarBase64 } from '../utils/avatarHandler.js';

import crypto from 'crypto';
import nodemailer from 'nodemailer';

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("Đang đăng nhập với email:", email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    const result = await login(email, password);
    console.log("Kết quả đăng nhập:", { success: result.success, role: result.user?.role });

    if (result.success) {
      // Chuẩn hóa dữ liệu trả về để tránh lỗi null
      const responseData = {
        success: true,
        message: "Đăng nhập thành công",
        user: {
          ...result.user,
          avatar: result.user.avatar || "/images/default-avatar.png"
        }
      };

      // SỬA: Nếu là admin (role = 0 hoặc 1) thì thêm token và redirect info
      if (result.user?.role === 0 || result.user?.role === 1) {
        responseData.token = result.token;
        responseData.redirectTo = '/admin'; // Thêm thông tin redirect
      } else {
        responseData.redirectTo = '/'; // Customer redirect về trang chủ
      }

      return res.status(200).json(responseData);
    } else {
      return res.status(401).json({
        success: false,
        message: result.message || "Thông tin đăng nhập không đúng"
      });
    }
  } catch (error) {
    console.error("Lỗi đăng nhập chi tiết:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống: " + error.message
    });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const result = await register(username, email, password);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        user: result.user
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ"
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { tokenId } = req.body;

    const result = await loginWithGoogle(tokenId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Đăng nhập Google thành công",
        user: result.user
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ"
    });
  }
};

export const getDeliveryAddresses = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    console.log("Getting addresses for user:", customerId);

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required"
      });
    }

    const result = await getUserDeliveryAddresses(customerId);

    if (result.success) {
      res.status(200).json({
        success: true,
        addresses: result.addresses,
        count: result.addresses.length
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("Error getting delivery addresses:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách địa chỉ giao hàng",
      error: error.message
    });
  }
};

// Cập nhật địa chỉ giao hàng
export const updateDelivery = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const { fullname, phone, address, isDefault } = req.body;

    const result = await updateDeliveryAddress(addressId, fullname, phone, address, isDefault);

    res.status(200).json({
      success: true,
      message: "Cập nhật địa chỉ giao hàng thành công",
      deliveryInfo: result
    });
  } catch (error) {
    console.error("Error updating delivery address:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật địa chỉ giao hàng"
    });
  }
};

// Xóa địa chỉ giao hàng
export const deleteDelivery = async (req, res) => {
  try {
    const addressId = req.params.addressId;

    const result = await deleteDeliveryAddress(addressId);

    res.status(200).json({
      success: true,
      message: "Xóa địa chỉ giao hàng thành công"
    });
  } catch (error) {
    console.error("Error deleting delivery address:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa địa chỉ giao hàng"
    });
  }
};

export const createDelivery = async (req, res) => {
  try {
    // Lấy các trường từ request
    const { customer_id, recipient_name, phone, address } = req.body;

    console.log("Creating delivery with data:", req.body);

    if (!customer_id || !recipient_name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin giao hàng"
      });
    }

    // Validate phone number
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ"
      });
    }

    // Validate tên người nhận
    if (recipient_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Tên người nhận phải có ít nhất 2 ký tự"
      });
    }

    // Gọi hàm createDeliveryInfor với các tham số đúng thứ tự
    const newDelivery = await createDeliveryInfor(
      parseInt(customer_id),
      recipient_name.trim(),
      phone.trim(),
      address.trim()
    );

    res.status(201).json({
      success: true,
      message: "Thêm địa chỉ giao hàng thành công",
      deliveryInfo: newDelivery
    });
  } catch (error) {
    console.error("Error creating delivery:", error);
    // Trả về thông tin lỗi chi tiết hơn
    res.status(500).json({
      success: false,
      message: "Không thể thêm địa chỉ giao hàng: " + error.message,
      error: error.toString()
    });
  }
};

// Lấy thông tin người dùng mới nhất
export const getLastestUserController = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Getting latest user info for user ID:", userId);

    const result = await getLastestUser(userId);

    if (result.success) {
      res.status(200).json({
        success: true,
        user: {
          ...result.user,
          avatar: result.user.avatar || "/images/avatar/avt_default.png"
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || "Không tìm thấy người dùng"
      });
    }
  } catch (error) {
    console.error("Error getting latest user info:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống: " + error.message
    });
  }
}

// Cập nhật thông tin người dùng
export const updateUserController = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userData = req.body;

    console.log("Updating user:", userId, "with data:", userData);

    // Validation cơ bản
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    // Xử lý avatar nếu có
    let avatarPath = null;
    let oldAvatarPath = null;

    if (userData.avatar && userData.avatar.startsWith('data:image/')) {
      // Validate avatar base64
      const validation = validateAvatarBase64(userData.avatar);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      try {
        // Lấy avatar cũ để xóa sau
        const currentUserResponse = await getLastestUser(userId);
        if (currentUserResponse.success && currentUserResponse.user.avatar &&
          currentUserResponse.user.avatar.startsWith('uploads/avatars/')) {
          oldAvatarPath = currentUserResponse.user.avatar;
        }

        // Lưu avatar mới
        avatarPath = await saveAvatarFromBase64(userData.avatar, userId);
        userData.avatar = avatarPath; // Thay thế base64 bằng đường dẫn file

      } catch (avatarError) {
        console.error('Error processing avatar:', avatarError);
        return res.status(400).json({
          success: false,
          message: 'Không thể xử lý avatar: ' + avatarError.message
        });
      }
    }

    // Validation cho fullname
    if (userData.fullname && userData.fullname.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Tên phải có ít nhất 2 ký tự'
      });
    }

    // Validation cho email (nếu có)
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ'
        });
      }
    }

    // Validation cho ngày sinh
    if (userData.birthDay || userData.birthMonth || userData.birthYear) {
      // Nếu có một trong ba trường thì phải có đầy đủ
      if (!userData.birthDay || !userData.birthMonth || !userData.birthYear) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ ngày, tháng, năm sinh'
        });
      }

      // Validation giá trị
      const day = parseInt(userData.birthDay);
      const month = parseInt(userData.birthMonth);
      const year = parseInt(userData.birthYear);

      if (day < 1 || day > 31) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không hợp lệ (1-31)'
        });
      }

      if (month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: 'Tháng sinh không hợp lệ (1-12)'
        });
      }

      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        return res.status(400).json({
          success: false,
          message: `Năm sinh không hợp lệ (1900-${currentYear})`
        });
      }

      // Kiểm tra ngày hợp lệ
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();

      if (birthDate > today) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không thể là ngày trong tương lai'
        });
      }

      if (birthDate.getDate() !== day || birthDate.getMonth() !== month - 1) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không hợp lệ'
        });
      }
    }

    const result = await updateUser(userId, userData);

    if (result.success) {
      // Xóa avatar cũ nếu cập nhật thành công và có avatar mới
      if (avatarPath && oldAvatarPath) {
        deleteOldAvatar(oldAvatarPath);
      }

      res.status(200).json({
        success: true,
        message: result.message,
        user: result.user
      });
    } else {
      // Nếu cập nhật thất bại, xóa avatar mới đã lưu
      if (avatarPath) {
        deleteOldAvatar(avatarPath);
      }

      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống: " + error.message
    });
  }
};

// Đặt địa chỉ làm mặc định
export const setDefaultDelivery = async (req, res) => {
  try {
    const addressId = req.params.addressId;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required"
      });
    }

    const result = await setDefaultDeliveryAddress(addressId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("Error setting default delivery address:", error);
    res.status(500).json({
      success: false,
      message: "Không thể đặt địa chỉ mặc định: " + error.message
    });
  }
};

// Lấy lịch sử đơn hàng của khách hàng
export const getCustomerOrdersController = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required"
      });
    }

    const result = await getCustomerOrders(customerId);

    if (result.success) {
      res.status(200).json({
        success: true,
        orders: result.orders,
        count: result.orders.length
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("Error getting customer orders:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy lịch sử đơn hàng",
      error: error.message
    });
  }
};

// Lấy chi tiết đơn hàng
export const getOrderDetailController = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const result = await getOrderDetail(orderId);

    if (result.success) {
      res.status(200).json({
        success: true,
        order: result.order
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("Error getting order detail:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy chi tiết đơn hàng",
      error: error.message
    });
  }
};

// Hủy đơn hàng
export const cancelOrderController = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const result = await cancelOrder(orderId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        order_id: result.order_id,
        restored_items: result.restored_items
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Không thể hủy đơn hàng: " + error.message
    });
  }
};

// Thêm function đổi mật khẩu
export const changePassword = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    console.log("Changing password for user:", userId);

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự'
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'
      });
    }

    const result = await changeUserPassword(userId, currentPassword, newPassword);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống: " + error.message
    });
  }
};

// Gửi email quên mật khẩu
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Vui lòng nhập email" });

    // Kiểm tra user tồn tại
    const sql = "SELECT customer_id, email FROM customers WHERE email = ?";
    connection.query(sql, [email], async (err, results) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
      if (results.length === 0) return res.status(404).json({ success: false, message: "Email không tồn tại" });

      // Tạo mã OTP 6 số ngẫu nhiên
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 1000 * 60 * 15; // 15 phút

      // Lưu OTP vào DB
      const updateSql = "UPDATE customers SET reset_token = ?, reset_token_expires = ? WHERE email = ?";
      connection.query(updateSql, [otp, expires, email], (updateErr) => {
        if (updateErr) return res.status(500).json({ success: false, message: "Lỗi hệ thống" });

        // Gửi email OTP
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'sondanhkg@gmail.com',
            pass: 'jpmu hxkr nxqe ekle'
          }
        });

        const mailOptions = {
          from: 'sondanhkg@gmail.com',
          to: email,
          subject: 'Mã xác nhận đặt lại mật khẩu',
          html: `<p>Mã xác nhận đặt lại mật khẩu của bạn là: <b>${otp}</b>. Mã này sẽ hết hạn sau 15 phút.</p>`
        };

        console.log("Đang gửi OTP tới:", email);

        transporter.sendMail(mailOptions, (mailErr, info) => {
          if (mailErr) {
            console.error("Mail error:", mailErr);
            return res.status(500).json({ success: false, message: "Không thể gửi email", error: mailErr.toString() });
          }
          res.json({ success: true, message: "Đã gửi mã xác nhận về email" });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// Đặt lại mật khẩu
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ success: false, message: "Thiếu thông tin" });

    // Kiểm tra token
    const sql = "SELECT reset_token, reset_token_expires FROM customers WHERE email = ?";
    connection.query(sql, [email], async (err, results) => {
      if (err || results.length === 0) return res.status(400).json({ success: false, message: "Token không hợp lệ" });
      const user = results[0];
      if (user.reset_token !== token || Date.now() > user.reset_token_expires) {
        return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
      }

      // Hash mật khẩu mới
      // const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(newPassword, 10);

      // Cập nhật mật khẩu và xóa token
      const updateSql = "UPDATE customers SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?";
      connection.query(updateSql, [hashed, email], (updateErr) => {
        if (updateErr) return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        res.json({ success: true, message: "Đặt lại mật khẩu thành công" });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};
