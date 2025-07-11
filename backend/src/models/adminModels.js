import connection from '../config/db.js';

// COMMAND MANAGEMENT (giữ nguyên)
export const getCommand = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM command', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const updateCommand = (command) => {
  return new Promise((resolve, reject) => {
    connection.query('UPDATE command SET contents = ?', command, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// USER MANAGEMENT MODELS (giữ nguyên code hiện tại)
export const getAllUsersModel = () => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                c.customer_id as id,
                c.customer_username as username,
                c.customer_fullname as fullname,
                c.email,
                c.avatar,
                c.gender,
                c.birth_day as birthDay,
                c.birth_month as birthMonth,
                c.birth_year as birthYear,
                c.provider,
                c.provider_id,
                c.token,
                c.created_at,
                COALESCE(c.status, 1) as status,
                GROUP_CONCAT(DISTINCT di.phone ORDER BY di.delivery_infor_id SEPARATOR ', ') as phones
            FROM customers c
            LEFT JOIN delivery_infor di ON c.customer_id = di.customer_id AND di.is_being_used = 1
            GROUP BY c.customer_id
            ORDER BY c.created_at DESC
        `;

    connection.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const getUserByIdModel = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                c.customer_id as id,
                c.customer_username as username,
                c.customer_fullname as fullname,
                c.password,
                c.email,
                c.avatar,
                c.gender,
                c.birth_day as birthDay,
                c.birth_month as birthMonth,
                c.birth_year as birthYear,
                c.provider,
                c.provider_id,
                c.token,
                c.created_at,
                COALESCE(c.status, 1) as status,
                GROUP_CONCAT(DISTINCT di.phone ORDER BY di.delivery_infor_id SEPARATOR ', ') as phones,
                GROUP_CONCAT(DISTINCT di.address ORDER BY di.delivery_infor_id SEPARATOR ' | ') as addresses
            FROM customers c
            LEFT JOIN delivery_infor di ON c.customer_id = di.customer_id AND di.is_being_used = 1
            WHERE c.customer_id = ?
            GROUP BY c.customer_id
        `;

    connection.query(query, [userId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};

export const createUserModel = (userData) => {
  return new Promise((resolve, reject) => {
    const query = `
            INSERT INTO customers (
                customer_username,
                customer_fullname,
                password,
                email,
                gender,
                birth_day,
                birth_month,
                birth_year,
                provider,
                status,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

    const values = [
      userData.username,
      userData.fullname,
      userData.password,
      userData.email,
      userData.gender,
      userData.birthDay,
      userData.birthMonth,
      userData.birthYear,
      userData.provider || 'local',
      userData.status || 1
    ];

    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.insertId);
      }
    });
  });
};

export const updateUserModel = (userId, userData) => {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    if (userData.username) {
      fields.push('customer_username = ?');
      values.push(userData.username);
    }
    if (userData.fullname) {
      fields.push('customer_fullname = ?');
      values.push(userData.fullname);
    }
    if (userData.password) {
      fields.push('password = ?');
      values.push(userData.password);
    }
    if (userData.email) {
      fields.push('email = ?');
      values.push(userData.email);
    }
    if (userData.avatar) {
      fields.push('avatar = ?');
      values.push(userData.avatar);
    }
    if (userData.gender !== undefined) {
      fields.push('gender = ?');
      values.push(userData.gender);
    }
    if (userData.birthDay !== undefined) {
      fields.push('birth_day = ?');
      values.push(userData.birthDay);
    }
    if (userData.birthMonth !== undefined) {
      fields.push('birth_month = ?');
      values.push(userData.birthMonth);
    }
    if (userData.birthYear !== undefined) {
      fields.push('birth_year = ?');
      values.push(userData.birthYear);
    }
    if (userData.status !== undefined) {
      fields.push('status = ?');
      values.push(userData.status);
    }

    if (fields.length === 0) {
      resolve(true);
      return;
    }

    values.push(userId);
    const query = `UPDATE customers SET ${fields.join(', ')} WHERE customer_id = ?`;

    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const deleteUserModel = (userId) => {
  return new Promise((resolve, reject) => {
    connection.beginTransaction((err) => {
      if (err) {
        reject(err);
        return;
      }

      // Xóa delivery info trước
      connection.query('DELETE FROM delivery_infor WHERE customer_id = ?', [userId], (err) => {
        if (err) {
          return connection.rollback(() => {
            reject(err);
          });
        }

        // Sau đó xóa customer
        connection.query('DELETE FROM customers WHERE customer_id = ?', [userId], (err, results) => {
          if (err) {
            return connection.rollback(() => {
              reject(err);
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                reject(err);
              });
            }
            resolve(results);
          });
        });
      });
    });
  });
};

export const updateUserStatusModel = (userId, status) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE customers SET status = ? WHERE customer_id = ?';

    connection.query(query, [status, userId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const getUserOrdersModel = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                o.*,
                COUNT(od.order_detail_id) as total_items,
                SUM(od.quantity * od.price) as total_amount
            FROM orders o
            LEFT JOIN order_details od ON o.order_id = od.order_id
            WHERE o.customer_id = ?
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
        `;

    connection.query(query, [userId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const getUserStatsModel = () => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN provider = 'local' THEN 1 END) as local_users,
                COUNT(CASE WHEN provider != 'local' THEN 1 END) as social_users,
                COUNT(CASE WHEN COALESCE(status, 1) = 1 THEN 1 END) as active_users,
                COUNT(CASE WHEN COALESCE(status, 1) = 0 THEN 1 END) as inactive_users,
                COUNT(CASE WHEN YEAR(created_at) = YEAR(NOW()) THEN 1 END) as users_this_year,
                COUNT(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 END) as users_this_month,
                COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as users_today
            FROM customers
        `;

    connection.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};

export const checkUserExistsModel = (username, email, excludeUserId = null) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT customer_id FROM customers WHERE customer_username = ? OR email = ?';
    let values = [username, email];

    if (excludeUserId) {
      query += ' AND customer_id != ?';
      values.push(excludeUserId);
    }

    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.length > 0 ? results[0] : null);
      }
    });
  });
};

// ORDER MANAGEMENT MODELS - THÊM MỚI
export const getAllOrdersModel = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        o.*,
        c.customer_fullname,
        di.recipient_name,
        di.phone,
        di.address,
        COUNT(od.order_detail_id) as total_items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN delivery_infor di ON o.delivery_infor_id = di.delivery_infor_id
      LEFT JOIN order_details od ON o.order_id = od.order_id
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `;

    connection.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const getOrderByIdModel = (orderId) => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                o.*,
                c.customer_fullname as customer_name,
                c.email as customer_email,
                di.phone as customer_phone
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            LEFT JOIN delivery_infor di ON o.delivery_infor_id = di.delivery_infor_id
            WHERE o.order_id = ?
        `;

    connection.query(query, [orderId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        if (results.length === 0) {
          resolve(null);
        } else {
          const orderDetailsQuery = `
                        SELECT 
                            od.*, 
                            p.product_name, 
                            pv.price as product_price,
                            od.quantity,
                            od.price as order_price
                        FROM order_details od
                        LEFT JOIN products p ON od.product_id = p.product_id
                        LEFT JOIN product_variants pv ON od.variant_id = pv.variant_id
                        WHERE od.order_id = ?
                    `;

          connection.query(orderDetailsQuery, [orderId], (err, orderDetails) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                order: results[0],
                details: orderDetails
              });
            }
          });
        }
      }
    });
  });
};

export const updateOrderStatusModel = (orderId, status) => {
  return new Promise((resolve, reject) => {
    const query = `
            UPDATE orders 
            SET order_status = ?, updated_at = NOW() 
            WHERE order_id = ?
        `;

    connection.query(query, [status, orderId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const getOrderStatsModel = () => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN order_status = 'Chờ xác nhận' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN order_status = 'Đang xử lý' THEN 1 END) as processing_orders,
                COUNT(CASE WHEN order_status = 'Đã giao' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN order_status = 'Đã hủy' THEN 1 END) as cancelled_orders,
                SUM(CASE WHEN order_status = 'Đã giao' THEN total_price ELSE 0 END) as total_revenue,
                COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as orders_today,
                COUNT(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 END) as orders_this_month
            FROM orders
        `;

    connection.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};

// PRODUCT MANAGEMENT MODELS - SỬA LẠI HOÀN TOÀN
// Nếu có bảng product_variants chứa category_id, brand_id
export const getAllProductsModel = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.*,
        c.category_name,
        b.brand_name,
        pv.price as variant_price
      FROM products p
      LEFT JOIN product_variants pv ON p.product_id = pv.product_id
      LEFT JOIN categories c ON pv.category_id = c.category_id
      LEFT JOIN brands b ON pv.brand_id = b.brand_id
      GROUP BY p.product_id
      ORDER BY p.created_at DESC
    `;

    connection.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const getProductByIdModel = (productId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.*,
        -- Lấy giá từ product_variants nếu có bảng này
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price,
        COUNT(pv.variant_id) as variant_count
      FROM products p
      LEFT JOIN product_variants pv ON p.product_id = pv.product_id
      WHERE p.product_id = ?
      GROUP BY p.product_id
    `;

    connection.query(query, [productId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0] || null);
      }
    });
  });
};

// // REVIEW MANAGEMENT MODELS - UNCOMMENT VÀ IMPLEMENT
export const getAllReviewsModel = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.*,
        c.customer_fullname as user_name,
        p.product_name
      FROM reviews r
      LEFT JOIN customers c ON r.customer_id = c.customer_id
      LEFT JOIN products p ON r.product_id = p.product_id
      ORDER BY r.created_at DESC
    `;

    connection.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const getReviewByIdModel = (reviewId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.*,
        c.customer_fullname as user_name,
        c.email as user_email,
        p.product_name,
        p.product_id
      FROM reviews r
      LEFT JOIN customers c ON r.customer_id = c.customer_id
      LEFT JOIN products p ON r.product_id = p.product_id
      WHERE r.review_id = ?
    `;

    connection.query(query, [reviewId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};

export const replyToReviewModel = (reviewId, replyData) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE reviews 
      SET admin_reply = ?, admin_reply_date = NOW(), updated_at = NOW()
      WHERE review_id = ?
    `;

    connection.query(query, [replyData.reply, reviewId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const updateReviewStatusModel = (reviewId, status) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE reviews 
      SET review_status = ?, updated_at = NOW()
      WHERE review_id = ?
    `;

    connection.query(query, [status, reviewId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const deleteReviewModel = (reviewId) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM reviews WHERE review_id = ?`;

    connection.query(query, [reviewId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// CHAT MANAGEMENT MODELS - THÊM MISSING MODELS
export const getAllChatRoomsModel = () => {
  return new Promise((resolve, reject) => {
    // Xóa các room có last_message = NULL
    const deleteQuery = `
      DELETE FROM chat_rooms
      WHERE last_message IS NULL
    `;
    connection.query(deleteQuery, [], (delErr) => {
      if (delErr) {
        console.error('❌ Error deleting chat rooms with last_message NULL:', delErr);
        // Không reject, vẫn tiếp tục lấy danh sách
      }
      // Lấy danh sách phòng chat còn lại
      const selectQuery = `
        SELECT 
          cr.room_id,
          cr.customer_id,
          cr.admin_id,
          cr.status,
          cr.created_at,
          cr.last_message_at,
          cr.closed_at,
          c.customer_fullname as customer_name,
          c.email as customer_email,
          c.customer_username as customer_username,
          c.avatar as customer_avatar,
          a.admin_name as admin_name,
          a.admin_username as admin_username,
          (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.room_id) as message_count,
          (SELECT cm.message FROM chat_messages cm WHERE cm.room_id = cr.room_id ORDER BY cm.created_at DESC LIMIT 1) as last_message,
          (SELECT cm.created_at FROM chat_messages cm WHERE cm.room_id = cr.room_id ORDER BY cm.created_at DESC LIMIT 1) as last_message_time
        FROM chat_rooms cr
        LEFT JOIN customers c ON cr.customer_id = c.customer_id
        LEFT JOIN admins a ON cr.admin_id = a.admin_id
        ORDER BY 
          CASE 
            WHEN cr.last_message_at IS NOT NULL THEN cr.last_message_at 
            ELSE cr.created_at 
          END DESC
      `;
      connection.query(selectQuery, [], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  });
};

export const getChatHistoryModel = (roomId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM chat_messages 
      WHERE room_id = ? 
      ORDER BY created_at ASC
    `;

    connection.query(query, [roomId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const sendMessageModel = (roomId, messageData) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO chat_messages (room_id, message, sender_type, sender_id, sender_name, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      roomId,
      messageData.message,
      messageData.sender_type,
      messageData.sender_id,
      messageData.sender_name
    ];

    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        // Cập nhật thời gian room
        const updateRoomQuery = `UPDATE chat_rooms SET updated_at = NOW() WHERE room_id = ?`;
        connection.query(updateRoomQuery, [roomId], (updateErr) => {
          if (updateErr) {
            console.error('Error updating room timestamp:', updateErr);
          }
        });

        resolve({
          message_id: results.insertId,
          ...messageData,
          created_at: new Date()
        });
      }
    });
  });
};

export const updateChatStatusModel = (roomId, status) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE chat_rooms 
      SET status = ?, updated_at = NOW()
      WHERE room_id = ?
    `;

    connection.query(query, [status, roomId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// DASHBOARD STATS MODELS - IMPLEMENT MISSING FUNCTIONS
export const getRevenueStatsModel = (period = '7days') => {
  return new Promise((resolve, reject) => {
    let query = '';
    const validStatuses = `'Đã xác nhận', 'Đang giao', 'Hoàn thành'`; // BỎ 'Đã thanh toán QR'

    switch (period) {
      case '7days':
        query = `
          SELECT 
            DATE(created_at) as date,
            SUM(total_price) as revenue,
            COUNT(*) as orders
          FROM orders 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          AND order_status IN (${validStatuses})
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;
      case '30days':
        query = `
          SELECT 
            DATE(created_at) as date,
            SUM(total_price) as revenue,
            COUNT(*) as orders
          FROM orders 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND order_status IN (${validStatuses})
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;
      case '12months':
        query = `
          SELECT 
            YEAR(created_at) as year,
            MONTH(created_at) as month,
            SUM(total_price) as revenue,
            COUNT(*) as orders
          FROM orders 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
          AND order_status IN (${validStatuses})
          GROUP BY YEAR(created_at), MONTH(created_at)
          ORDER BY year ASC, month ASC
        `;
        break;
      default:
        query = `
          SELECT 
            DATE(created_at) as date,
            SUM(total_price) as revenue,
            COUNT(*) as orders
          FROM orders 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          AND order_status IN (${validStatuses})
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
    }

    connection.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const getTopCustomersModel = (limit = 10) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.customer_id,
        c.customer_fullname as customer_name,
        c.email,
        COUNT(o.order_id) as total_orders,
        SUM(o.total_price) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      WHERE o.order_status IN ('Đã xác nhận', 'Đang giao', 'Hoàn thành')
      GROUP BY c.customer_id
      ORDER BY total_spent DESC
      LIMIT ?
    `;

    connection.query(query, [parseInt(limit)], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// DASHBOARD STATS MODELS - BỎ PHẦN CHAT
// export const getDashboardStatsModel = () => {
//   return new Promise((resolve, reject) => {
//     const query = `
//       SELECT 
//         -- Tổng số đơn hàng
//         (SELECT COUNT(*) FROM orders) as totalOrders,

//         -- Tổng số người dùng
//         (SELECT COUNT(*) FROM customers) as totalUsers,

//         -- Tổng số sản phẩm
//         (SELECT COUNT(*) FROM products) as totalProducts,

//         -- SỬA: Tổng doanh thu - bao gồm cả 'Đang giao hàng' khi đã thanh toán
//         (SELECT COALESCE(SUM(total_price), 0) FROM orders 
//          WHERE (payment_status = 'Đã thanh toán' OR payment_status = 'Đã thanh toán với QR')
//          AND (order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng'))) as totalRevenue,

//         -- Số đơn hàng đang chờ xử lý
//         (SELECT COUNT(*) FROM orders 
//          WHERE order_status = 'Chờ xác nhận' OR order_status IS NULL) as pendingOrders,

//         -- Tổng số đánh giá
//         (SELECT COUNT(*) FROM reviews) as totalReviews,

//         -- Điểm đánh giá trung bình
//         (SELECT COALESCE(AVG(rating), 0) FROM reviews) as averageRating,

//         -- SỬA: Doanh thu hôm nay
//         (SELECT COALESCE(SUM(total_price), 0) FROM orders 
//          WHERE DATE(created_at) = CURDATE() 
//          AND (payment_status = 'Đã thanh toán' OR payment_status = 'Đã thanh toán với QR')
//          AND (order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng'))) as todayRevenue,

//         -- Số đơn hàng hôm nay
//         (SELECT COUNT(*) FROM orders 
//          WHERE DATE(created_at) = CURDATE()) as todayOrders,

//         -- Số người dùng mới hôm nay
//         (SELECT COUNT(*) FROM customers 
//          WHERE DATE(created_at) = CURDATE()) as newUsersToday,

//         -- SỬA: Doanh thu tháng này
//         (SELECT COALESCE(SUM(total_price), 0) FROM orders 
//          WHERE YEAR(created_at) = YEAR(CURDATE()) 
//          AND MONTH(created_at) = MONTH(CURDATE())
//          AND (payment_status = 'Đã thanh toán' OR payment_status = 'Đã thanh toán với QR')
//          AND (order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng'))) as monthRevenue,

//         -- SỬA: So sánh với tháng trước
//         (SELECT COALESCE(SUM(total_price), 0) FROM orders 
//          WHERE YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
//          AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
//          AND (payment_status = 'Đã thanh toán' OR payment_status = 'Đã thanh toán với QR')
//          AND (order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng'))) as lastMonthRevenue
//     `;

//     connection.query(query, (err, results) => {
//       if (err) {
//         reject(err);
//       } else {
//         const stats = results[0] || {};

//         // Tính phần trăm thay đổi so với tháng trước
//         let revenueGrowth = 0;
//         if (stats.lastMonthRevenue > 0) {
//           revenueGrowth = ((stats.monthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100;
//         }

//         resolve({
//           ...stats,
//           revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
//           averageRating: parseFloat(parseFloat(stats.averageRating).toFixed(1))
//         });
//       }
//     });
//   });
// };
export const getDashboardStatsModel = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        -- Basic stats
        (SELECT COUNT(*) FROM orders) as totalOrders,
        (SELECT COUNT(*) FROM customers) as totalUsers,
        (SELECT COUNT(*) FROM products) as totalProducts,
        (SELECT COALESCE(SUM(total_price), 0) FROM orders 
         WHERE payment_status = 'Đã thanh toán'
         AND order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng', 'Đã xác nhận')) as totalRevenue,
        (SELECT COUNT(*) FROM orders 
         WHERE order_status = 'Chờ xác nhận' OR order_status IS NULL) as pendingOrders,
        (SELECT COUNT(*) FROM reviews) as totalReviews,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews) as averageRating,
        (SELECT COALESCE(SUM(total_price), 0) FROM orders 
         WHERE DATE(created_at) = CURDATE() 
         AND payment_status = 'Đã thanh toán'
         AND order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng', 'Đã xác nhận')) as todayRevenue,
        (SELECT COUNT(*) FROM orders 
         WHERE DATE(created_at) = CURDATE()) as todayOrders,
        (SELECT COUNT(*) FROM customers 
         WHERE DATE(created_at) = CURDATE()) as newUsersToday,

        -- Monthly comparisons
        (SELECT COALESCE(SUM(total_price), 0) FROM orders 
         WHERE YEAR(created_at) = YEAR(CURDATE()) 
         AND MONTH(created_at) = MONTH(CURDATE())
         AND payment_status = 'Đã thanh toán'
         AND order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng', 'Đã xác nhận')) as currentMonthRevenue,
        (SELECT COALESCE(SUM(total_price), 0) FROM orders 
         WHERE YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
         AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
         AND payment_status = 'Đã thanh toán'
         AND order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng', 'Đã xác nhận')) as lastMonthRevenue,
        (SELECT COUNT(*) FROM orders 
         WHERE YEAR(created_at) = YEAR(CURDATE()) 
         AND MONTH(created_at) = MONTH(CURDATE())) as currentMonthOrders,
        (SELECT COUNT(*) FROM orders 
         WHERE YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
         AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))) as lastMonthOrders,
        (SELECT COUNT(*) FROM customers 
         WHERE YEAR(created_at) = YEAR(CURDATE()) 
         AND MONTH(created_at) = MONTH(CURDATE())) as currentMonthUsers,
        (SELECT COUNT(*) FROM customers 
         WHERE YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
         AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))) as lastMonthUsers,
        (SELECT COUNT(*) FROM products 
         WHERE YEAR(created_at) = YEAR(CURDATE()) 
         AND MONTH(created_at) = MONTH(CURDATE())) as currentMonthProducts,
        (SELECT COUNT(*) FROM products 
         WHERE YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
         AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))) as lastMonthProducts,

        -- Debug info
        YEAR(CURDATE()) as currentYear,
        MONTH(CURDATE()) as currentMonth,
        YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) as lastYear,
        MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) as lastMonth
    `;

    connection.query(query, (err, results) => {
      if (err) {
        console.error('❌ Database Error:', err);
        reject(err);
      } else {
        const stats = results[0] || {};

        // ✅ DETAILED DEBUG LOGGING
        console.log('🔍 RAW DATABASE STATS:', {
          currentMonth: `${stats.currentYear}/${stats.currentMonth}`,
          lastMonth: `${stats.lastYear}/${stats.lastMonth}`,
          currentMonthUsers: stats.currentMonthUsers,
          lastMonthUsers: stats.lastMonthUsers,
          currentMonthOrders: stats.currentMonthOrders,
          lastMonthOrders: stats.lastMonthOrders,
          currentMonthProducts: stats.currentMonthProducts,
          lastMonthProducts: stats.lastMonthProducts,
          currentMonthRevenue: stats.currentMonthRevenue,
          lastMonthRevenue: stats.lastMonthRevenue
        });

        const calculateGrowth = (current, previous) => {
          console.log(`📈 Calculating growth: ${current} vs ${previous}`);
          if (!previous || previous === 0) {
            const result = current > 0 ? 100 : 0;
            console.log(`📈 Growth result (no previous): ${result}%`);
            return result;
          }
          const result = parseFloat(((current - previous) / previous * 100).toFixed(2));
          console.log(`📈 Growth result: ${result}%`);
          return result;
        };

        const result = {
          totalOrders: parseInt(stats.totalOrders) || 0,
          totalUsers: parseInt(stats.totalUsers) || 0,
          totalProducts: parseInt(stats.totalProducts) || 0,
          totalRevenue: parseFloat(stats.totalRevenue) || 0,
          pendingOrders: parseInt(stats.pendingOrders) || 0,
          totalReviews: parseInt(stats.totalReviews) || 0,
          averageRating: parseFloat(parseFloat(stats.averageRating).toFixed(1)),
          todayRevenue: parseFloat(stats.todayRevenue) || 0,
          todayOrders: parseInt(stats.todayOrders) || 0,
          newUsersToday: parseInt(stats.newUsersToday) || 0,
          currentMonthRevenue: parseFloat(stats.currentMonthRevenue) || 0,
          lastMonthRevenue: parseFloat(stats.lastMonthRevenue) || 0,

          // Growth calculations
          revenueGrowth: calculateGrowth(
            parseFloat(stats.currentMonthRevenue) || 0,
            parseFloat(stats.lastMonthRevenue) || 0
          ),
          orderGrowth: calculateGrowth(
            parseInt(stats.currentMonthOrders) || 0,
            parseInt(stats.lastMonthOrders) || 0
          ),
          userGrowth: calculateGrowth(
            parseInt(stats.currentMonthUsers) || 0,
            parseInt(stats.lastMonthUsers) || 0
          ),
          productGrowth: calculateGrowth(
            parseInt(stats.currentMonthProducts) || 0,
            parseInt(stats.lastMonthProducts) || 0
          )
        };

        console.log('📊 FINAL CALCULATED RESULT:', {
          revenueGrowth: result.revenueGrowth,
          orderGrowth: result.orderGrowth,
          userGrowth: result.userGrowth,
          productGrowth: result.productGrowth
        });

        resolve(result);
      }
    });
  });
};

export const getTopProductsModel = (limit = 10) => {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT 
            p.product_id,
            p.product_name,
            MIN(pi.product_image_url) AS image_url,
            MIN(pv.price) as price,
            p.discount,
            (MIN(pv.price) * (1 - p.discount / 100)) AS final_price,
            IFNULL(s.total_sold, 0) AS total_sold,
            IFNULL(s.total_revenue, 0) AS total_revenue,
            COALESCE(r.average_rating, 0) AS average_rating,
            COALESCE(r.review_count, 0) AS review_count,
            IFNULL(stock.total_stock, 0) AS total_stock
        FROM products p
        LEFT JOIN (
            SELECT 
              od.product_id, 
              SUM(od.quantity) AS total_sold,
              SUM(od.quantity * od.price) AS total_revenue
            FROM order_details od
            INNER JOIN orders o ON od.order_id = o.order_id
            WHERE o.order_status IN ('Đã xác nhận', 'Đang giao', 'Hoàn thành')
            GROUP BY od.product_id
        ) s ON p.product_id = s.product_id
        LEFT JOIN product_variants pv ON p.product_id = pv.product_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        LEFT JOIN (
            SELECT 
              product_id, 
              AVG(rating) AS average_rating, 
              COUNT(*) AS review_count
            FROM reviews
            GROUP BY product_id
        ) r ON p.product_id = r.product_id
        LEFT JOIN (
            SELECT 
              product_id, 
              SUM(quantity) AS total_stock
            FROM product_variants
            GROUP BY product_id
        ) stock ON p.product_id = stock.product_id
        WHERE s.total_sold > 0
        GROUP BY p.product_id
        ORDER BY s.total_sold DESC, s.total_revenue DESC
        LIMIT ?
    `;
    connection.query(query, [parseInt(limit)], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// THÊM FUNCTION MỚI - Lấy doanh thu theo khoảng thời gian
export const getRevenueByDateRangeModel = (startDate, endDate, groupBy = 'day') => {
  return new Promise((resolve, reject) => {
    let dateFormat, groupByClause;

    switch (groupBy) {
      case 'day':
        dateFormat = 'DATE(created_at)';
        groupByClause = 'DATE(created_at)';
        break;
      case 'week':
        dateFormat = 'YEARWEEK(created_at)';
        groupByClause = 'YEARWEEK(created_at)';
        break;
      case 'month':
        dateFormat = 'DATE_FORMAT(created_at, "%Y-%m")';
        groupByClause = 'YEAR(created_at), MONTH(created_at)';
        break;
      case 'year':
        dateFormat = 'YEAR(created_at)';
        groupByClause = 'YEAR(created_at)';
        break;
      default:
        dateFormat = 'DATE(created_at)';
        groupByClause = 'DATE(created_at)';
    }

    const query = `
  SELECT 
    ${dateFormat} as period,
    SUM(total_price) as revenue,
    COUNT(*) as total_orders,
    SUM(CASE WHEN payment_status = 'Đã thanh toán' 
              AND order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng', 'Đã xác nhận') 
              THEN total_price ELSE 0 END) as confirmed_revenue,
    COUNT(CASE WHEN payment_status = 'Đã thanh toán' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng', 'Đã xác nhận') THEN 1 END) as completed_orders
  FROM orders 
  WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
  GROUP BY ${groupByClause}
  ORDER BY period ASC
    `;

    connection.query(query, [startDate, endDate], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// SỬA getRevenueSummaryModel:
export const getRevenueSummaryModel = (startDate, endDate) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_price) as total_revenue,
        AVG(total_price) as average_order_value,
        SUM(CASE WHEN payment_status = 'Đã thanh toán' 
                 AND order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng', 'Đã xác nhận') 
                 THEN total_price ELSE 0 END) as confirmed_revenue,
        COUNT(CASE WHEN payment_status = 'Đã thanh toán' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN order_status IN ('Hoàn thành', 'Đã giao', 'Đang giao hàng', 'Đã xác nhận') THEN 1 END) as completed_orders,
        COUNT(CASE WHEN order_status = 'Đã hủy' THEN 1 END) as cancelled_orders
      FROM orders 
      WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
    `;

    connection.query(query, [startDate, endDate], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0] || {});
      }
    });
  });
};

export const checkAdminExistsModel = (username, email, excludeId = null) => {
  let query = `SELECT * FROM admins WHERE (admin_username = ? OR email = ?)`;
  let params = [username, email];
  if (excludeId) {
    query += ' AND admin_id != ?';
    params.push(excludeId);
  }
  return new Promise((resolve, reject) => {
    connection.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

// Tạo admin mới
export const createAdminModel = (adminData) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO admins (admin_username, admin_name, email, password, role, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      adminData.admin_username,
      adminData.admin_name,
      adminData.email,
      adminData.password,
      adminData.role ?? 1,
    ];
    connection.query(query, values, (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};

export const getAllAdminsModel = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT admin_id, admin_username, admin_name, email, role, created_at, status FROM admins ORDER BY created_at DESC`;
    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getAdminByIdModel = (adminId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM admins WHERE admin_id = ? LIMIT 1`;
    connection.query(query, [adminId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const updateAdminModel = (adminId, adminData) => {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];
    if (adminData.admin_username) {
      fields.push('admin_username = ?');
      values.push(adminData.admin_username);
    }
    if (adminData.admin_name) {
      fields.push('admin_name = ?');
      values.push(adminData.admin_name);
    }
    if (adminData.email) {
      fields.push('email = ?');
      values.push(adminData.email);
    }
    if (adminData.password) {
      fields.push('password = ?');
      values.push(adminData.password);
    }
    if (adminData.role !== undefined) {
      fields.push('role = ?');
      values.push(adminData.role);
    }
    if (fields.length === 0) return resolve(true);
    values.push(adminId);
    const query = `UPDATE admins SET ${fields.join(', ')} WHERE admin_id = ?`;
    connection.query(query, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const deleteAdminModel = (adminId) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM admins WHERE admin_id = ?`;
    connection.query(query, [adminId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// BRAND
export const getAllBrandsModel = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM brands', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};
export const createBrandModel = (data) => {
  return new Promise((resolve, reject) => {
    connection.query('INSERT INTO brands (brand_name) VALUES (?)', [data.name], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};
export const updateBrandModel = (id, data) => {
  return new Promise((resolve, reject) => {
    connection.query('UPDATE brands SET brand_name = ? WHERE brand_id = ?', [data.name, id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};
export const deleteBrandModel = (id) => {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM brands WHERE brand_id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// CATEGORY
export const getAllCategoriesModel = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM categories', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const createCategoryModel = (data) => {
  return new Promise((resolve, reject) => {
    connection.query('INSERT INTO categories (category_name) VALUES (?)', [data.name], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};

export const updateCategoryModel = (id, data) => {
  return new Promise((resolve, reject) => {
    connection.query('UPDATE categories SET category_name = ? WHERE category_id = ?', [data.name, id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const deleteCategoryModel = (id) => {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM categories WHERE category_id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// COLOR
export const getAllColorsModel = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM colors', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const createColorModel = (data) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'INSERT INTO colors (color_name, color_code) VALUES (?, ?)',
      [data.name, data.code],
      (err, results) => {
        if (err) reject(err);
        else resolve(results.insertId);
      }
    );
  });
};

export const updateColorModel = (id, data) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'UPDATE colors SET color_name = ?, color_code = ? WHERE color_id = ?',
      [data.name, data.code, id],
      (err, results) => {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
};

export const deleteColorModel = (id) => {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM colors WHERE color_id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getAllMaterialsModel = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM materials', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const createMaterialModel = (data) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'INSERT INTO materials (material_name) VALUES (?)',
      [data.name],
      (err, results) => {
        if (err) reject(err);
        else resolve(results.insertId);
      }
    );
  });
};

export const updateMaterialModel = (id, data) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'UPDATE materials SET material_name = ? WHERE material_id = ?',
      [data.name, id],
      (err, results) => {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
};

export const deleteMaterialModel = (id) => {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM materials WHERE material_id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getAllTargetsModel = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM product_targets', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const createTargetModel = (data) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'INSERT INTO product_targets (target_name) VALUES (?)',
      [data.name],
      (err, results) => {
        if (err) reject(err);
        else resolve(results.insertId);
      }
    );
  });
};

export const updateTargetModel = (id, data) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'UPDATE product_targets SET target_name = ? WHERE target_id = ?',
      [data.name, id],
      (err, results) => {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
};

export const deleteTargetModel = (id) => {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM product_targets WHERE target_id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getAllSizesModel = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM sizes', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const createSizeModel = (data) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'INSERT INTO sizes (size_name) VALUES (?)',
      [data.name],
      (err, results) => {
        if (err) reject(err);
        else resolve(results.insertId);
      }
    );
  });
};

export const updateSizeModel = (id, data) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'UPDATE sizes SET size_name = ? WHERE size_id = ?',
      [data.name, id],
      (err, results) => {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
};

export const deleteSizeModel = (id) => {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM sizes WHERE size_id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// export const getDashboardStatsByMonth = (month, year) => {
//   return new Promise((resolve, reject) => {
//     const query = `
//             SELECT
//                 (SELECT COUNT(*) FROM orders WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND order_status IN ('Đã xác nhận', 'Đang giao', 'Hoàn thành')) AS total_orders,
//                 (SELECT IFNULL(SUM(total_price),0) FROM orders WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND order_status IN ('Đã xác nhận', 'Đang giao', 'Hoàn thành')) AS total_revenue,
//                 (SELECT COUNT(*) FROM customers WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) AS new_customers,
//                 (SELECT COUNT(*) FROM products WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) AS new_products
//         `;
//     connection.query(query, [month, year, month, year, month, year, month, year], (err, results) => {
//       if (err) reject(err);
//       else resolve(results[0]);
//     });
//   });
// };

export const getDashboardStatsAllTime = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COUNT(*) FROM customers) AS total_users,
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT IFNULL(SUM(total_price),0) FROM orders WHERE order_status IN ('Đã xác nhận', 'Đang giao', 'Hoàn thành')) AS total_revenue,
        (SELECT COUNT(*) FROM reviews) AS total_reviews,
        (SELECT ROUND(AVG(rating),1) FROM reviews) AS average_rating
    `;
    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const getDashboardStatsByMonth = (month, year) => {
  return new Promise((resolve, reject) => {
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const query = `
      SELECT
        -- Tháng hiện tại
        (SELECT COUNT(*) FROM orders WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) AS orders_this_month,
        (SELECT IFNULL(SUM(total_price),0) FROM orders WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND order_status IN ('Đã xác nhận', 'Đang giao', 'Hoàn thành')) AS revenue_this_month,
        (SELECT COUNT(*) FROM orders WHERE order_status = 'Chờ xác nhận') AS pending_orders, -- Sửa: bỏ lọc tháng
        (SELECT COUNT(*) FROM customers WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) AS users_this_month,
        (SELECT COUNT(*) FROM products WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) AS products_this_month,
        (SELECT COUNT(*) FROM reviews WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) AS reviews_this_month,
        -- Tháng trước
        (SELECT COUNT(*) FROM orders WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) AS orders_last_month,
        (SELECT IFNULL(SUM(total_price),0) FROM orders WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND order_status IN ('Đã xác nhận', 'Đang giao', 'Hoàn thành')) AS revenue_last_month,
        (SELECT COUNT(*) FROM customers WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) AS users_last_month,
        (SELECT COUNT(*) FROM products WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) AS products_last_month,
        (SELECT COUNT(*) FROM reviews WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) AS reviews_last_month
    `;
    const params = [
      month, year, // orders_this_month
      month, year, // revenue_this_month
      // pending_orders không cần params
      month, year, // users_this_month
      month, year, // products_this_month
      month, year, // reviews_this_month
      prevMonth, prevYear, // orders_last_month
      prevMonth, prevYear, // revenue_last_month
      prevMonth, prevYear, // users_last_month
      prevMonth, prevYear, // products_last_month
      prevMonth, prevYear  // reviews_last_month
    ];
    connection.query(query, params, (err, results) => {
      if (err) reject(err);
      else {
        const r = results[0];
        const calcGrowth = (now, prev) => {
          if (!prev || prev === 0) return now > 0 ? 100 : 0;
          return Math.round(((now - prev) / prev) * 100);
        };
        resolve({
          ...r,
          orders_growth: calcGrowth(r.orders_this_month, r.orders_last_month),
          revenue_growth: calcGrowth(r.revenue_this_month, r.revenue_last_month),
          users_growth: calcGrowth(r.users_this_month, r.users_last_month),
          products_growth: calcGrowth(r.products_this_month, r.products_last_month),
          reviews_growth: calcGrowth(r.reviews_this_month, r.reviews_last_month)
        });
      }
    });
  });
};

export const getTopProductsByMonth = (month, year, limit = 10) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.product_id,
        p.product_name,
        MIN(pi.product_image_url) AS image_url,
        MIN(pv.price) as price,
        p.discount,
        (MIN(pv.price) * (1 - p.discount / 100)) AS final_price,
        IFNULL(s.total_sold, 0) AS total_sold,
        IFNULL(s.total_revenue, 0) AS total_revenue,
        COALESCE(r.average_rating, 0) AS average_rating,
        COALESCE(r.review_count, 0) AS review_count,
        IFNULL(stock.total_stock, 0) AS total_stock
      FROM products p
      LEFT JOIN (
        SELECT 
          od.product_id, 
          SUM(od.quantity) AS total_sold,
          SUM(od.quantity * od.price) AS total_revenue
        FROM order_details od
        INNER JOIN orders o ON od.order_id = o.order_id
        WHERE o.order_status IN ('Đã xác nhận', 'Đang giao', 'Hoàn thành')
          AND MONTH(o.created_at) = ? AND YEAR(o.created_at) = ?
        GROUP BY od.product_id
      ) s ON p.product_id = s.product_id
      LEFT JOIN product_variants pv ON p.product_id = pv.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      LEFT JOIN (
        SELECT 
          product_id, 
          AVG(rating) AS average_rating, 
          COUNT(*) AS review_count
        FROM reviews
        GROUP BY product_id
      ) r ON p.product_id = r.product_id
      LEFT JOIN (
        SELECT 
          product_id, 
          SUM(quantity) AS total_stock
        FROM product_variants
        GROUP BY product_id
      ) stock ON p.product_id = stock.product_id
      WHERE s.total_sold > 0
      GROUP BY p.product_id
      ORDER BY s.total_sold DESC, s.total_revenue DESC
      LIMIT ?
    `;
    connection.query(query, [month, year, parseInt(limit)], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getDailyStatsByMonth = (month, year) => {
  return new Promise((resolve, reject) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Query lấy số đơn, doanh thu, đơn chờ xử lý từng ngày
    const query = `
      SELECT
        DAY(created_at) as day,
        COUNT(*) as orders,
        IFNULL(SUM(total_price), 0) as revenue,
        SUM(order_status = 'Chờ xác nhận') as pending_orders
      FROM orders
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
      GROUP BY DAY(created_at)
    `;

    // Query lấy khách mới từng ngày
    const usersQuery = `
      SELECT
        DAY(created_at) as day,
        COUNT(*) as new_users
      FROM customers
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
      GROUP BY DAY(created_at)
    `;

    // Query lấy mã sản phẩm đã bán từng ngày
    const productsQuery = `
      SELECT
        DAY(o.created_at) as day,
        GROUP_CONCAT(DISTINCT od.product_id) as product_ids
      FROM orders o
      JOIN order_details od ON o.order_id = od.order_id
      WHERE MONTH(o.created_at) = ? AND YEAR(o.created_at) = ?
      GROUP BY DAY(o.created_at)
    `;

    // Query lấy mã sản phẩm đang chờ xử lý từng ngày
    const pendingProductsQuery = `
      SELECT
        DAY(o.created_at) as day,
        GROUP_CONCAT(DISTINCT od.product_id) as pending_product_ids
      FROM orders o
      JOIN order_details od ON o.order_id = od.order_id
      WHERE MONTH(o.created_at) = ? AND YEAR(o.created_at) = ? AND o.order_status = 'Chờ xác nhận'
      GROUP BY DAY(o.created_at)
    `;

    connection.query(query, [month, year], (err, orderResults) => {
      if (err) return reject(err);

      connection.query(usersQuery, [month, year], (err, userResults) => {
        if (err) return reject(err);

        connection.query(productsQuery, [month, year], (err, productResults) => {
          if (err) return reject(err);

          connection.query(pendingProductsQuery, [month, year], (err, pendingProductResults) => {
            if (err) return reject(err);

            // Map dữ liệu từng ngày
            const orderMap = {};
            orderResults.forEach(r => {
              orderMap[r.day] = {
                orders: r.orders,
                revenue: r.revenue,
                pending_orders: r.pending_orders
              };
            });

            const userMap = {};
            userResults.forEach(r => {
              userMap[r.day] = r.new_users;
            });

            const productMap = {};
            productResults.forEach(r => {
              productMap[r.day] = r.product_ids ? r.product_ids.split(',') : [];
            });

            const pendingProductMap = {};
            pendingProductResults.forEach(r => {
              pendingProductMap[r.day] = r.pending_product_ids ? r.pending_product_ids.split(',') : [];
            });

            // Tạo mảng kết quả đủ ngày trong tháng
            const dailyStats = days.map(day => ({
              date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
              orders: orderMap[day]?.orders || 0,
              revenue: orderMap[day]?.revenue || 0,
              new_users: userMap[day] || 0,
              pending_orders: orderMap[day]?.pending_orders || 0,
              product_ids: productMap[day] || [],
              pending_product_ids: pendingProductMap[day] || []
            }));

            resolve(dailyStats);
          });
        });
      });
    });
  });
};

export const updateAdminStatusModel = (adminId, status) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE admins SET status = ? WHERE admin_id = ?';
    connection.query(query, [status, adminId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Lấy tất cả voucher
export const getAllVouchersModel = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM vouchers ORDER BY valid_from DESC', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Lấy voucher theo ID
export const getVoucherByIdModel = (voucherId) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM vouchers WHERE voucher_id = ?', [voucherId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

// Thêm voucher mới
export const createVoucherModel = (voucherData) => {
  return new Promise((resolve, reject) => {
    connection.query('INSERT INTO vouchers SET ?', voucherData, (err, result) => {
      if (err) reject(err);
      else resolve(result.insertId);
    });
  });
};

// Cập nhật voucher
export const updateVoucherModel = (voucherId, voucherData) => {
  return new Promise((resolve, reject) => {
    connection.query('UPDATE vouchers SET ? WHERE voucher_id = ?', [voucherData, voucherId], (err, result) => {
      if (err) reject(err);
      else resolve(result.affectedRows);
    });
  });
};

// Xóa voucher
export const deleteVoucherModel = (voucherId) => {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM vouchers WHERE voucher_id = ?', [voucherId], (err, result) => {
      if (err) reject(err);
      else resolve(result.affectedRows);
    });
  });
};