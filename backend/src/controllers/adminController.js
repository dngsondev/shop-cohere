import {
  getCommand,
  updateCommand,
  getAllUsersModel,
  getUserByIdModel,
  createUserModel,
  updateUserModel,
  deleteUserModel,
  updateUserStatusModel,
  getUserOrdersModel,
  getUserStatsModel,
  checkUserExistsModel,
  // Order models
  getAllOrdersModel,
  getOrderByIdModel,
  updateOrderStatusModel,
  getOrderStatsModel,
  // Product models
  getAllProductsModel,
  getProductByIdModel,
  // updateProductModel,
  // deleteProductModel,
  // getProductStatsModel,
  // Category models
  // getAllCategoriesModel, createCategoryModel, updateCategoryModel, deleteCategoryModel,

  // Brand models
  getAllBrandsModel, createBrandModel, updateBrandModel, deleteBrandModel,

  // Category models
  getAllCategoriesModel, createCategoryModel, updateCategoryModel, deleteCategoryModel,

  getAllColorsModel,
  createColorModel,
  updateColorModel,
  deleteColorModel,

  getAllMaterialsModel,
  createMaterialModel,
  updateMaterialModel,
  deleteMaterialModel,

  getAllTargetsModel,
  createTargetModel,
  updateTargetModel,
  deleteTargetModel,

  getAllSizesModel,
  createSizeModel,
  updateSizeModel,
  deleteSizeModel,

  // Chat models
  getChatHistoryModel,
  sendMessageModel,
  updateChatStatusModel,
  // Review models
  getAllReviewsModel,
  getReviewByIdModel,
  replyToReviewModel,
  updateReviewStatusModel,
  deleteReviewModel,
  // Stats models
  getDashboardStatsModel,
  getRevenueStatsModel,
  getTopProductsModel,
  getTopCustomersModel,
  getRevenueByDateRangeModel, // THÊM IMPORT NÀY
  getRevenueSummaryModel,    // THÊM IMPORT NÀY

  checkAdminExistsModel,
  createAdminModel,
  getAllAdminsModel,
  updateAdminModel,
  deleteAdminModel,
  getAdminByIdModel,

  getDashboardStatsAllTime,
  getDashboardStatsByMonth,
  getTopProductsByMonth,
  getDailyStatsByMonth,

  updateAdminStatusModel,

  getAllVouchersModel,
  getVoucherByIdModel,
  createVoucherModel,
  updateVoucherModel,
  deleteVoucherModel,
} from "../models/adminModels.js";
import bcrypt from 'bcrypt';

// COMMAND MANAGEMENT
export const getCommands = async (req, res) => {
  try {
    const commands = await getCommand();
    res.status(200).json(commands);
  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCommands = async (req, res) => {
  try {
    const { contents } = req.body;
    await updateCommand(contents);
    res.status(200).json({ message: 'Command updated successfully' });
  } catch (error) {
    console.error('Error updating commands:', error);
    res.status(500).json({ message: error.message });
  }
};

// ADMIN LOGOUT
export const logoutAdmin = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng xuất'
    });
  }
};

// USER MANAGEMENT (giữ nguyên như code hiện tại)
export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersModel();
    res.status(200).json({
      success: true,
      data: { users: users },
      message: 'Lấy danh sách người dùng thành công'
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách người dùng'
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserByIdModel(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    delete user.password;

    res.status(200).json({
      success: true,
      user: user,
      message: 'Lấy thông tin người dùng thành công'
    });
  } catch (error) {
    console.error('Error getting user by id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin người dùng'
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, fullname, password, gender, birthDay, birthMonth, birthYear, status } = req.body;

    if (!username || !email || !fullname || !password) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (username, email, fullname, password)'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const existingUser = await checkUserExistsModel(username, email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username hoặc email đã tồn tại'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      fullname: fullname.trim(),
      password: hashedPassword,
      gender: gender || null,
      birthDay: birthDay || null,
      birthMonth: birthMonth || null,
      birthYear: birthYear || null,
      status: status !== undefined ? status : 1,
      provider: 'local'
    };

    const userId = await createUserModel(userData);

    res.status(201).json({
      success: true,
      data: { userId: userId },
      message: 'Tạo người dùng thành công'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo người dùng'
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, fullname, password, gender, birthDay, birthMonth, birthYear, status } = req.body;

    if (!username || !email || !fullname) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (username, email, fullname)'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    const existingUser = await getUserByIdModel(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    if (username !== existingUser.username || email !== existingUser.email) {
      const userExists = await checkUserExistsModel(username.trim(), email.trim().toLowerCase(), userId);
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'Username hoặc email đã tồn tại'
        });
      }
    }

    const updateData = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      fullname: fullname.trim(),
      gender: gender || null,
      birthDay: birthDay || null,
      birthMonth: birthMonth || null,
      birthYear: birthYear || null,
      status: status !== undefined ? status : existingUser.status
    };

    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    await updateUserModel(userId, updateData);

    res.status(200).json({
      success: true,
      data: {},
      message: 'Cập nhật người dùng thành công'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật người dùng'
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const existingUser = await getUserByIdModel(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const userOrders = await getUserOrdersModel(userId);
    if (userOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa người dùng có đơn hàng. Vui lòng vô hiệu hóa thay vì xóa.'
      });
    }

    await deleteUserModel(userId);

    res.status(200).json({
      success: true,
      data: {},
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa người dùng'
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin trạng thái'
      });
    }

    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ (0 hoặc 1)'
      });
    }

    const existingUser = await getUserByIdModel(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    await updateUserStatusModel(userId, status);

    res.status(200).json({
      success: true,
      data: {},
      message: `${status === 1 ? 'Kích hoạt' : 'Vô hiệu hóa'} người dùng thành công`
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái'
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const existingUser = await getUserByIdModel(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const orders = await getUserOrdersModel(userId);

    res.status(200).json({
      success: true,
      data: { orders: orders },
      message: 'Lấy danh sách đơn hàng thành công'
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đơn hàng'
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const stats = await getUserStatsModel();

    res.status(200).json({
      success: true,
      data: { stats: stats },
      message: 'Lấy thống kê người dùng thành công'
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê'
    });
  }
};

// ORDER MANAGEMENT - THÊM MỚI
export const getAllOrders = async (req, res) => {
  try {
    const orders = await getAllOrdersModel();
    res.status(200).json({
      success: true,
      data: { orders: orders },
      message: 'Lấy danh sách đơn hàng thành công'
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đơn hàng'
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await getOrderByIdModel(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    res.status(200).json({
      success: true,
      data: { order: order },
      message: 'Lấy thông tin đơn hàng thành công'
    });
  } catch (error) {
    console.error('Error getting order by id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đơn hàng'
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin trạng thái đơn hàng'
      });
    }

    const result = await updateOrderStatusModel(orderId, status);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'Cập nhật trạng thái đơn hàng thành công'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái đơn hàng'
    });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const stats = await getOrderStatsModel();
    res.status(200).json({
      success: true,
      data: { stats: stats },
      message: 'Lấy thống kê đơn hàng thành công'
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê đơn hàng'
    });
  }
};

// PRODUCT MANAGEMENT - THÊM MỚI
export const getAllProducts = async (req, res) => {
  try {
    const products = await getAllProductsModel();
    res.status(200).json({
      success: true,
      data: { products: products },
      message: 'Lấy danh sách sản phẩm thành công'
    });
  } catch (error) {
    console.error('Error getting all products:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sản phẩm'
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await getProductByIdModel(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.status(200).json({
      success: true,
      data: { product: product },
      message: 'Lấy thông tin sản phẩm thành công'
    });
  } catch (error) {
    console.error('Error getting product by id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin sản phẩm'
    });
  }
};

// DASHBOARD STATS - THÊM MỚI  
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await getDashboardStatsModel();
    res.status(200).json({
      success: true,
      data: stats,
      message: 'Lấy thống kê dashboard thành công'
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê dashboard'
    });
  }
};

// CHAT MANAGEMENT - THÊM MỚI
export const getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const history = await getChatHistoryModel(roomId);
    res.status(200).json({
      success: true,
      data: { history: history },
      message: 'Lấy lịch sử chat thành công'
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử chat'
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    await sendMessageModel(roomId, req.body);
    res.status(201).json({
      success: true,
      message: 'Gửi tin nhắn thành công'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi tin nhắn',
      error: error.message
    });
  }
};

export const updateChatStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body;
    await updateChatStatusModel(roomId, status);
    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái chat thành công'
    });
  } catch (error) {
    console.error('Error updating chat status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái chat',
      error: error.message
    });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await getReviewByIdModel(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    res.status(200).json({
      success: true,
      data: { review: review },
      message: 'Lấy thông tin đánh giá thành công'
    });
  } catch (error) {
    console.error('Error getting review by id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đánh giá'
    });
  }
};

export const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    await replyToReviewModel(reviewId, req.body);
    res.status(201).json({
      success: true,
      message: 'Trả lời đánh giá thành công'
    });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi trả lời đánh giá',
      error: error.message
    });
  }
};

export const updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;
    await updateReviewStatusModel(reviewId, status);
    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đánh giá thành công'
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái đánh giá',
      error: error.message
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    await deleteReviewModel(reviewId);
    res.status(200).json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa đánh giá',
      error: error.message
    });
  }
};

export const getRevenueStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const stats = await getRevenueStatsModel(period);
    res.status(200).json({
      success: true,
      data: { stats: stats },
      message: 'Lấy thống kê doanh thu thành công'
    });
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê doanh thu'
    });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await getTopProductsModel(parseInt(limit));
    res.status(200).json({
      success: true,
      data: products || [],
      message: 'Lấy sản phẩm bán chạy thành công'
    });
  } catch (error) {
    console.error('Error getting top products:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy sản phẩm bán chạy'
    });
  }
};

export const getTopCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const customers = await getTopCustomersModel(parseInt(limit));
    res.status(200).json({
      success: true,
      data: { customers: customers },
      message: 'Lấy khách hàng VIP thành công'
    });
  } catch (error) {
    console.error('Error getting top customers:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy khách hàng VIP'
    });
  }
};

// THÊM CÁC CONTROLLERS THIẾU:

// Get all reviews
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await getAllReviewsModel();
    res.status(200).json({
      success: true,
      data: { reviews: reviews },
      message: 'Lấy danh sách đánh giá thành công'
    });
  } catch (error) {
    console.error('Error getting all reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá'
    });
  }
};

// Get all chat rooms
export const getAllChatRooms = async (req, res) => {
  try {
    const rooms = await getAllChatRoomsModel();
    res.status(200).json({
      success: true,
      data: { rooms: rooms },
      message: 'Lấy danh sách phòng chat thành công'
    });
  } catch (error) {
    console.error('Error getting chat rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách phòng chat'
    });
  }
};

// THÊM CONTROLLER MỚI
export const getRevenueByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp startDate và endDate'
      });
    }

    console.log('📊 Getting revenue data:', { startDate, endDate, groupBy });

    const [revenueData, summaryData] = await Promise.all([
      getRevenueByDateRangeModel(startDate, endDate, groupBy),
      getRevenueSummaryModel(startDate, endDate)
    ]);

    res.json({
      success: true,
      data: {
        summary: summaryData,
        chartData: revenueData
      }
    });

  } catch (error) {
    console.error('❌ Error getting revenue data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu doanh thu',
      error: error.message
    });
  }
};

// Tạo admin mới
export const createAdmin = async (req, res) => {
  try {
    const { admin_username, admin_name, email, password, role } = req.body;
    if (!admin_username || !admin_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu tối thiểu 6 ký tự' });
    }
    // Kiểm tra trùng username/email
    const existed = await checkAdminExistsModel(admin_username, email);
    if (existed) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc email đã tồn tại' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminId = await createAdminModel({
      admin_username,
      admin_name,
      email,
      password: hashedPassword,
      role: role ?? 1,
    });
    res.status(201).json({ success: true, admin_id: adminId, message: 'Tạo admin thành công' });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo admin' });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await getAllAdminsModel();
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách admin' });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { admin_username, admin_name, email, password, role } = req.body;

    // Kiểm tra trùng username/email (trừ chính mình)
    const existed = await checkAdminExistsModel(admin_username, email, adminId);
    if (existed) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc email đã tồn tại' });
    }

    let updateData = {
      admin_username,
      admin_name,
      email,
      role: role ?? 1,
    };

    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await updateAdminModel(adminId, updateData);

    res.json({ success: true, message: 'Cập nhật admin thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật admin' });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await getAdminByIdModel(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy admin' });
    }
    await deleteAdminModel(adminId);
    res.json({ success: true, message: 'Xóa admin thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa admin' });
  }
};

// BRAND
export const getAllBrands = async (req, res) => {
  try {
    const brands = await getAllBrandsModel();
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách thương hiệu' });
  }
};
export const createBrand = async (req, res) => {
  try {
    const id = await createBrandModel(req.body);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo thương hiệu' });
  }
};
export const updateBrand = async (req, res) => {
  try {
    await updateBrandModel(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật thương hiệu' });
  }
};
export const deleteBrand = async (req, res) => {
  try {
    await deleteBrandModel(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa thương hiệu' });
  }
};

// Lấy tất cả danh mục
export const getAllCategories = async (req, res) => {
  try {
    const categories = await getAllCategoriesModel();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh mục', error: err });
  }
};

// Thêm danh mục
export const createCategory = async (req, res) => {
  try {
    const id = await createCategoryModel(req.body);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi thêm danh mục', error: err });
  }
};

// Sửa danh mục
export const updateCategory = async (req, res) => {
  try {
    await updateCategoryModel(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật danh mục', error: err });
  }
};

// Xóa danh mục
export const deleteCategory = async (req, res) => {
  try {
    await deleteCategoryModel(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi xóa danh mục', error: err });
  }
};

// Lấy tất cả màu sắc
export const getAllColors = async (req, res) => {
  try {
    const colors = await getAllColorsModel();
    res.json({ success: true, data: colors });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lấy màu sắc', error: err });
  }
};

// Thêm màu sắc
export const createColor = async (req, res) => {
  try {
    const id = await createColorModel(req.body);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi thêm màu sắc', error: err });
  }
};

// Sửa màu sắc
export const updateColor = async (req, res) => {
  try {
    await updateColorModel(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật màu sắc', error: err });
  }
};

// Xóa màu sắc
export const deleteColor = async (req, res) => {
  try {
    await deleteColorModel(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi xóa màu sắc', error: err });
  }
};

export const getAllMaterials = async (req, res) => {
  try {
    const materials = await getAllMaterialsModel();
    res.json({ success: true, data: materials });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lấy chất liệu', error: err });
  }
};

export const createMaterial = async (req, res) => {
  try {
    const id = await createMaterialModel(req.body);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi thêm chất liệu', error: err });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    await updateMaterialModel(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật chất liệu', error: err });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    await deleteMaterialModel(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi xóa chất liệu', error: err });
  }
};

export const getAllTargets = async (req, res) => {
  try {
    const targets = await getAllTargetsModel();
    res.json({ success: true, data: targets });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lấy đối tượng', error: err });
  }
};

export const createTarget = async (req, res) => {
  try {
    const id = await createTargetModel(req.body);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi thêm đối tượng', error: err });
  }
};

export const updateTarget = async (req, res) => {
  try {
    await updateTargetModel(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật đối tượng', error: err });
  }
};

export const deleteTarget = async (req, res) => {
  try {
    await deleteTargetModel(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi xóa đối tượng', error: err });
  }
};

export const getAllSizes = async (req, res) => {
  try {
    const sizes = await getAllSizesModel();
    res.json({ success: true, data: sizes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lấy kích thước', error: err });
  }
};

export const createSize = async (req, res) => {
  try {
    const id = await createSizeModel(req.body);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi thêm kích thước', error: err });
  }
};

export const updateSize = async (req, res) => {
  try {
    await updateSizeModel(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật kích thước', error: err });
  }
};

export const deleteSize = async (req, res) => {
  try {
    await deleteSizeModel(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi xóa kích thước', error: err });
  }
};

export const getDashboardStatsAllTimeController = async (req, res) => {
  try {
    const stats = await getDashboardStatsAllTime();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDashboardStatsByMonthController = async (req, res) => {
  try {
    const { month, year } = req.query;
    const stats = await getDashboardStatsByMonth(Number(month), Number(year));
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTopProductsByMonthController = async (req, res) => {
  try {
    const { month, year, limit } = req.query;
    const products = await getTopProductsByMonth(month, year, limit || 10);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDailyStatsByMonthController = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Thiếu tháng hoặc năm" });
    }
    const stats = await getDailyStatsByMonth(Number(month), Number(year));
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAdminStatus = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { status } = req.body;
    if (status === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin trạng thái' });
    }
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ (0 hoặc 1)' });
    }
    const result = await updateAdminStatusModel(adminId, status);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy admin' });
    }
    res.json({ success: true, message: `${status === 1 ? 'Kích hoạt' : 'Vô hiệu hóa'} admin thành công` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái admin' });
  }
};

export const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await getAllVouchersModel();
    res.json({ success: true, vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách voucher' });
  }
};

export const getVoucherById = async (req, res) => {
  try {
    const voucher = await getVoucherByIdModel(req.params.voucherId);
    if (!voucher) return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
    res.json({ success: true, voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy voucher' });
  }
};

export const createVoucher = async (req, res) => {
  try {
    const id = await createVoucherModel(req.body);
    res.json({ success: true, id, message: 'Tạo voucher thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo voucher' });
  }
};

export const updateVoucher = async (req, res) => {
  try {
    const affected = await updateVoucherModel(req.params.voucherId, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
    res.json({ success: true, message: 'Cập nhật voucher thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật voucher' });
  }
};

export const deleteVoucher = async (req, res) => {
  try {
    const affected = await deleteVoucherModel(req.params.voucherId);
    if (!affected) return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
    res.json({ success: true, message: 'Xóa voucher thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa voucher' });
  }
};