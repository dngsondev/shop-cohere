import connection from '../config/db.js';
import bcrypt from 'bcrypt';
import axios from 'axios';
import jwt from 'jsonwebtoken'; // Thêm import này ở đầu file
import { downloadImageToAvatars } from '../utils/downloadImage.js';

function checkPasswordWithDeliveryInfo(user, password, resolve, reject) {
  bcrypt.compare(password, user.password, (compareErr, isMatch) => {
    if (compareErr) return reject(compareErr);

    if (!isMatch) {
      return resolve({ success: false, message: 'Mật khẩu không đúng' });
    }

    // Xử lý để lấy thông tin địa chỉ đang được sử dụng
    let currentPhone = null;
    let currentAddress = null;
    let currentRecipientName = null;
    let currentDeliveryId = null;

    if (user.phones && user.is_being_used_flags) {
      const phones = user.phones.split(', ');
      const addresses = user.addresses ? user.addresses.split(', ') : [];
      const recipientNames = user.recipient_names ? user.recipient_names.split(', ') : [];
      const deliveryIds = user.delivery_infor_ids ? user.delivery_infor_ids.split(', ') : [];
      const flags = user.is_being_used_flags.split(', ');

      const currentIndex = flags.findIndex(flag => flag === '1');

      if (currentIndex !== -1) {
        currentPhone = phones[currentIndex] || null;
        currentAddress = addresses[currentIndex] || null;
        currentRecipientName = recipientNames[currentIndex] || null;
        currentDeliveryId = deliveryIds[currentIndex] || null;
      }
    }

    return resolve({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        avatar: user.avatar || "images/otherImages/avt_defaut.png",
        role: user.role,
        gender: user.gender || null,
        // Thông tin địa chỉ hiện tại
        delivery_infor_id: currentDeliveryId,
        recipient_name: currentRecipientName,
        address: currentAddress,
        phone: currentPhone,
        // Thông tin tất cả địa chỉ
        delivery_infor_ids: user.delivery_infor_ids,
        recipient_names: user.recipient_names,
        addresses: user.addresses,
        phones: user.phones,
        is_being_used_flags: user.is_being_used_flags
      }
    });
  });
}

function checkPasswordAdmin(admin, password, resolve, reject) {
  bcrypt.compare(password, admin.password, (compareErr, isMatch) => {
    if (compareErr) return reject(compareErr);

    if (!isMatch) {
      return resolve({ success: false, message: 'Mật khẩu không đúng' });
    }

    // Tạo token cho admin
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || 'your_backup_secret_key',
      { expiresIn: '24h' }
    );

    return resolve({
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        fullname: admin.fullname,
        email: admin.email,
        avatar: "images/otherImages/avt_defaut.png",
        role: admin.role, // Giữ nguyên role số từ database
        gender: null,
        delivery_infor_ids: null,
        recipient_names: null,
        addresses: null,
        phones: null,
        is_being_used_flags: null
      },
      token
    });
  });
}

export const login = (emailOrUsername, password) => {
  return new Promise((resolve, reject) => {
    // Truy vấn customer với delivery info
    const customerQuery = `
      SELECT 
        c.customer_id as id, 
        c.customer_username as username, 
        c.customer_fullname as fullname,
        c.password, 
        c.email, 
        c.avatar, 
        c.gender, 
        'customer' as role,
        c.status,
        GROUP_CONCAT(DISTINCT di.delivery_infor_id ORDER BY di.delivery_infor_id SEPARATOR ', ') AS delivery_infor_ids,
        GROUP_CONCAT(DISTINCT di.recipient_name ORDER BY di.delivery_infor_id SEPARATOR ', ') AS recipient_names,
        GROUP_CONCAT(DISTINCT di.address ORDER BY di.delivery_infor_id SEPARATOR ', ') AS addresses,
        GROUP_CONCAT(DISTINCT di.phone ORDER BY di.delivery_infor_id SEPARATOR ', ') AS phones,
        GROUP_CONCAT(DISTINCT di.is_being_used ORDER BY di.delivery_infor_id SEPARATOR ', ') AS is_being_used_flags
      FROM customers c
      LEFT JOIN delivery_infor di ON c.customer_id = di.customer_id
      WHERE c.email = ? OR c.customer_username = ?
      GROUP BY c.customer_id
`;

    // SỬA: Lấy role từ database thay vì hardcode 'admin'
    const adminQuery = `
      SELECT admin_id as id, admin_username as username, admin_name as fullname,
             password, email, role, status
      FROM admins
      WHERE email = ? OR admin_username = ?
    `;

    // Trước tiên kiểm tra trong bảng khách hàng
    connection.query(customerQuery, [emailOrUsername, emailOrUsername], (err, customerResults) => {
      if (err) return reject(err);

      if (customerResults.length > 0) {
        const user = customerResults[0];
        if (user.status === 0) {
          return resolve({ success: false, message: 'Tài khoản khách hàng đã bị vô hiệu hóa' });
        }
        return checkPasswordWithDeliveryInfo(user, password, resolve, reject);
      }

      // Nếu không có trong bảng customers, kiểm tra bảng admins
      connection.query(adminQuery, [emailOrUsername, emailOrUsername], (err, adminResults) => {
        if (err) return reject(err);

        if (adminResults.length > 0) {
          const admin = adminResults[0];
          if (admin.status === 0) {
            return resolve({ success: false, message: 'Tài khoản admin đã bị vô hiệu hóa' });
          }
          return checkPasswordAdmin(admin, password, resolve, reject);
        }

        // Không tìm thấy ở cả 2 bảng
        return resolve({ success: false, message: 'Email hoặc tên đăng nhập không tồn tại' });
      });
    });
  });
};

export const register = (username, email, password) => {
  return new Promise((resolve, reject) => {
    // Validation
    if (!username || !email || !password) {
      return resolve({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return resolve({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Kiểm tra trùng lặp
    connection.query(
      'SELECT customer_id FROM customers WHERE customer_username = ? OR email = ?',
      [username, email],
      (checkErr, checkResults) => {
        if (checkErr) return reject(checkErr);

        if (checkResults.length > 0) {
          connection.query(
            'SELECT customer_id FROM customers WHERE customer_username = ?',
            [username],
            (usernameErr, usernameResults) => {
              if (usernameErr) return reject(usernameErr);

              if (usernameResults.length > 0) {
                return resolve({
                  success: false,
                  message: 'Tên đăng nhập đã được sử dụng'
                });
              } else {
                return resolve({
                  success: false,
                  message: 'Email đã được sử dụng'
                });
              }
            }
          );
          return;
        }

        // Validation mật khẩu
        if (password.length < 8) {
          return resolve({
            success: false,
            message: 'Mật khẩu phải có ít nhất 8 ký tự'
          });
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          return resolve({
            success: false,
            message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'
          });
        }

        // Mã hóa và lưu
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            return resolve({
              success: false,
              message: 'Lỗi hệ thống, vui lòng thử lại sau'
            });
          }

          const user = {
            customer_username: username,
            customer_fullname: username,
            email: email,
            password: hashedPassword,
            avatar: "images/otherImages/avt_defaut.png",
            created_at: new Date()
          };

          connection.query('INSERT INTO customers SET ?', user, (err, results) => {
            if (err) {
              if (err.code === 'ER_DUP_ENTRY') {
                return resolve({
                  success: false,
                  message: err.sqlMessage.includes('email') ? 'Email đã tồn tại' : 'Thông tin đăng ký đã tồn tại'
                });
              }

              return resolve({
                success: false,
                message: 'Lỗi hệ thống, vui lòng thử lại sau'
              });
            }

            // Trả về format đồng nhất với getLastestUser
            return resolve({
              success: true,
              user: {
                id: results.insertId,
                username,
                fullname: username,
                email,
                avatar: "images/otherImages/avt_defaut.png",
                role: "customer",
                gender: null,
                delivery_infor_ids: null,
                recipient_names: null,
                addresses: null,
                phones: null,
                is_being_used_flags: null
              }
            });
          });
        });
      }
    );
  });
};

export const loginWithGoogle = async (tokenId) => {
  try {
    // Verify token với Google
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenId}`);
    const { email, name, picture, sub: googleId } = response.data;

    if (!email) {
      return { success: false, message: "Email không được cung cấp từ Google" };
    }

    return new Promise((resolve, reject) => {
      // Query với delivery info như getLastestUser
      const sql = `
        SELECT 
          c.customer_id as id, 
          c.customer_username as username, 
          c.customer_fullname as fullname,
          c.password, 
          c.email, 
          c.avatar, 
          c.gender, 
          'customer' as role,
          GROUP_CONCAT(DISTINCT di.delivery_infor_id ORDER BY di.delivery_infor_id SEPARATOR ', ') AS delivery_infor_ids,
          GROUP_CONCAT(DISTINCT di.recipient_name ORDER BY di.delivery_infor_id SEPARATOR ', ') AS recipient_names,
          GROUP_CONCAT(DISTINCT di.address ORDER BY di.delivery_infor_id SEPARATOR ', ') AS addresses,
          GROUP_CONCAT(DISTINCT di.phone ORDER BY di.delivery_infor_id SEPARATOR ', ') AS phones,
          GROUP_CONCAT(DISTINCT di.is_being_used ORDER BY di.delivery_infor_id SEPARATOR ', ') AS is_being_used_flags
        FROM customers c
        LEFT JOIN delivery_infor di ON c.customer_id = di.customer_id
        WHERE c.email = ?
        GROUP BY c.customer_id
      `;

      connection.query(sql, [email], async (err, results) => {
        if (err) return reject(err);

        if (results.length > 0) {
          // User đã tồn tại
          const user = results[0];

          // Nếu avatar là link Google, tải về server và update DB
          let avatarPath = user.avatar;
          if (user.avatar && user.avatar.startsWith('http')) {
            const localAvatar = await downloadImageToAvatars(user.avatar, user.id);
            if (localAvatar) {
              avatarPath = localAvatar;
              // Update DB
              await new Promise((res, rej) => {
                connection.query(
                  'UPDATE customers SET avatar = ? WHERE customer_id = ?',
                  [localAvatar, user.id],
                  (err) => err ? rej(err) : res()
                );
              });
            }
          }

          // Xử lý để lấy thông tin địa chỉ đang được sử dụng
          let currentPhone = null;
          let currentAddress = null;
          let currentRecipientName = null;
          let currentDeliveryId = null;

          if (user.phones && user.is_being_used_flags) {
            const phones = user.phones.split(', ');
            const addresses = user.addresses ? user.addresses.split(', ') : [];
            const recipientNames = user.recipient_names ? user.recipient_names.split(', ') : [];
            const deliveryIds = user.delivery_infor_ids ? user.delivery_infor_ids.split(', ') : [];
            const flags = user.is_being_used_flags.split(', ');

            const currentIndex = flags.findIndex(flag => flag === '1');

            if (currentIndex !== -1) {
              currentPhone = phones[currentIndex] || null;
              currentAddress = addresses[currentIndex] || null;
              currentRecipientName = recipientNames[currentIndex] || null;
              currentDeliveryId = deliveryIds[currentIndex] || null;
            }
          }

          return resolve({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              fullname: user.fullname,
              email: user.email,
              avatar: avatarPath || "images/otherImages/avt_defaut.png",
              role: user.role,
              gender: user.gender || null,
              // Thông tin địa chỉ hiện tại
              delivery_infor_id: currentDeliveryId,
              recipient_name: currentRecipientName,
              address: currentAddress,
              phone: currentPhone,
              // Thông tin tất cả địa chỉ
              delivery_infor_ids: user.delivery_infor_ids,
              recipient_names: user.recipient_names,
              addresses: user.addresses,
              phones: user.phones,
              is_being_used_flags: user.is_being_used_flags
            }
          });
        } else {
          // Tạo user mới
          const username = email.split('@')[0];
          const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          let avatarPath = "images/otherImages/avt_defaut.png";
          if (picture) {
            const localAvatar = await downloadImageToAvatars(picture, googleId);
            if (localAvatar) avatarPath = localAvatar;
          }
          const newUser = {
            customer_username: username,
            customer_fullname: name,
            email,
            password: hashedPassword,
            provider: 'google',
            provider_id: googleId,
            avatar: avatarPath,
            created_at: new Date()
          };

          connection.query('INSERT INTO customers SET ?', newUser, (err, results) => {
            if (err) {
              console.error("Lỗi đăng ký người dùng Google:", err);
              return reject(err);
            }

            return resolve({
              success: true,
              user: {
                id: results.insertId,
                username,
                fullname: name,
                email,
                avatar: picture || "images/otherImages/avt_defaut.png",
                role: "customer",
                gender: null,
                delivery_infor_ids: null,
                recipient_names: null,
                addresses: null,
                phones: null,
                is_being_used_flags: null
              }
            });
          });
        }
      });
    });
  } catch (error) {
    console.error("Google token verification error:", error);
    return { success: false, message: "Không thể xác thực đăng nhập Google" };
  }
};

// Hàm này có thể có lỗi, kiểm tra dòng nào bị lỗi:
export const createDeliveryInfor = (userId, fullname, phone, address) => {
  return new Promise((resolve, reject) => {
    console.log("Creating delivery with params:", { userId, fullname, phone, address });

    if (!userId || !fullname || !phone || !address) {
      return reject(new Error('Missing required fields'));
    }

    // Kiểm tra xem người dùng đã có địa chỉ nào chưa
    const checkQuery = "SELECT COUNT(*) as count FROM delivery_infor WHERE customer_id = ?";

    connection.query(checkQuery, [parseInt(userId)], (err, results) => {
      if (err) {
        console.error("Error checking existing addresses:", err);
        return reject(err);
      }

      const hasExistingAddresses = results[0].count > 0;

      // Nếu chưa có địa chỉ nào, đặt địa chỉ mới làm mặc định
      const isDefault = hasExistingAddresses ? 0 : 1;

      const insertQuery = `
        INSERT INTO delivery_infor (customer_id, recipient_name, phone, address, is_being_used) 
        VALUES (?, ?, ?, ?, ?)
      `;

      connection.query(
        insertQuery,
        [parseInt(userId), fullname.trim(), phone.trim(), address.trim(), isDefault],
        (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Error inserting delivery info:", insertErr);
            return reject(insertErr);
          }

          const newDeliveryId = insertResult.insertId;
          console.log("Created new delivery address with ID:", newDeliveryId);

          // Trả về thông tin địa chỉ vừa tạo
          resolve({
            delivery_infor_id: newDeliveryId,
            customer_id: parseInt(userId),
            recipient_name: fullname,
            phone: phone,
            address: address,
            is_being_used: isDefault
          });
        }
      );
    });
  });
};

// Function lấy danh sách địa chỉ giao hàng
export const getUserDeliveryAddresses = (userId) => {
  return new Promise((resolve, reject) => {
    console.log("Getting delivery addresses for user ID:", userId);

    if (!userId) {
      return resolve({
        success: false,
        message: 'User ID is required'
      });
    }

    const query = `
      SELECT 
        delivery_infor_id,
        recipient_name,
        phone,
        address,
        is_being_used,
        customer_id
      FROM delivery_infor 
      WHERE customer_id = ?
      ORDER BY is_being_used DESC
    `;

    connection.query(query, [parseInt(userId)], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return reject(err);
      }

      console.log("Database results:", results);

      if (results.length === 0) {
        return resolve({
          success: true,
          addresses: [],
          message: 'No addresses found'
        });
      }

      return resolve({
        success: true,
        addresses: results
      });
    });
  });
};

// Function cập nhật địa chỉ
export const updateDeliveryAddress = (addressId, fullname, phone, address, isDefault) => {
  return new Promise((resolve, reject) => {
    // Kiểm tra nếu đặt làm mặc định
    if (isDefault) {
      // Lấy thông tin để biết customer_id
      const getAddressQuery = "SELECT customer_id FROM delivery_infor WHERE delivery_infor_id = ?";
      connection.query(getAddressQuery, [addressId], (err, results) => {
        if (err) {
          return reject(err);
        }

        if (results.length === 0) {
          return reject(new Error('Không tìm thấy địa chỉ'));
        }

        const customerId = results[0].customer_id;

        // Đặt tất cả địa chỉ khác thành không mặc định
        const resetDefaultQuery = "UPDATE delivery_infor SET is_being_used = 0 WHERE customer_id = ?";
        connection.query(resetDefaultQuery, [customerId], (resetErr) => {
          if (resetErr) {
            return reject(resetErr);
          }

          // Sau đó cập nhật địa chỉ được chọn
          updateAddressQuery();
        });
      });
    } else {
      // Nếu không đặt làm mặc định, chỉ cập nhật thông tin
      updateAddressQuery();
    }

    function updateAddressQuery() {
      // SỬA: Dùng tên cột đúng theo database
      const updateQuery = `
        UPDATE delivery_infor 
        SET recipient_name = ?, 
            phone = ?, 
            address = ?,
            is_being_used = ?
        WHERE delivery_infor_id = ?
      `;

      console.log("Updating address with values:", [fullname, phone, address, isDefault ? 1 : 0, addressId]);

      connection.query(
        updateQuery,
        [fullname, phone, address, isDefault ? 1 : 0, addressId],
        (err, result) => {
          if (err) {
            console.error("Error updating delivery address:", err);
            return reject(err);
          }

          console.log("Address updated successfully, affected rows:", result.affectedRows);

          resolve({
            success: true,
            message: 'Cập nhật địa chỉ thành công'
          });
        }
      );
    }
  });
};

// Function xóa địa chỉ
export const deleteDeliveryAddress = (addressId) => {
  return new Promise((resolve, reject) => {
    // Sửa lại query dùng delivery_infor_id thay vì id
    const checkQuery = `
      SELECT d.is_being_used, d.customer_id, 
        (SELECT COUNT(*) FROM delivery_infor WHERE customer_id = d.customer_id) as total
      FROM delivery_infor d 
      WHERE d.delivery_infor_id = ?
    `;

    connection.query(checkQuery, [addressId], (err, results) => {
      if (err) return reject(err);

      if (results.length === 0) {
        return resolve({
          success: false,
          message: "Không tìm thấy địa chỉ"
        });
      }

      const info = results[0];

      // Nếu là địa chỉ mặc định duy nhất, không cho phép xóa
      if (info.is_being_used === 1 && info.total <= 1) {
        return resolve({
          success: false,
          message: "Không thể xóa địa chỉ mặc định duy nhất"
        });
      }

      // Sửa lại query dùng delivery_infor_id thay vì id
      const deleteQuery = "DELETE FROM delivery_infor WHERE delivery_infor_id = ?";
      connection.query(deleteQuery, [addressId], (err, result) => {
        if (err) return reject(err);

        resolve({
          success: true,
          message: "Xóa địa chỉ thành công"
        });
      });
    });
  });
};

// Lấy thông tin người dùng mới nhất
export const getLastestUser = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        customer_id as id,
        customer_username as username,
        customer_fullname as fullname,
        email,
        avatar,
        gender,
        birth_day as birthDay,
        birth_month as birthMonth,
        birth_year as birthYear,
        provider,
        provider_id,
        token,
        created_at
      FROM customers 
      WHERE customer_id = ?
    `;

    connection.query(sql, [userId], (err, result) => {
      if (err) {
        console.error("Error fetching user:", err);
        return reject(err);
      }

      if (result.length === 0) {
        return resolve({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      const user = result[0];

      // SỬA: Dùng tên cột đúng theo database
      const deliverySql = `
        SELECT 
          delivery_infor_id as id,
          recipient_name as fullname,
          phone,
          address,
          is_being_used
        FROM delivery_infor 
        WHERE customer_id = ?
      `;

      connection.query(deliverySql, [userId], (deliveryErr, deliveryResult) => {
        if (deliveryErr) {
          console.error("Error fetching delivery info:", deliveryErr);
          return resolve({
            success: true,
            user: { ...user, delivery_addresses: [], phone: null }
          });
        }

        // Tìm địa chỉ đang được sử dụng (is_being_used = 1) để lấy phone
        const currentDelivery = deliveryResult.find(delivery => delivery.is_being_used === 1);
        const currentPhone = currentDelivery ? currentDelivery.phone : null;

        console.log("Delivery addresses found:", deliveryResult);
        console.log("Current delivery with is_being_used = 1:", currentDelivery);
        console.log("Phone extracted:", currentPhone);

        resolve({
          success: true,
          user: {
            ...user,
            phone: currentPhone, // Thêm phone từ delivery_infor với is_being_used = 1
            delivery_addresses: deliveryResult
          }
        });
      });
    });
  });
};

// Cập nhật thông tin người dùng
export const updateUser = (userId, userData) => {
  return new Promise((resolve, reject) => {
    const fieldsToUpdate = [];
    const values = [];

    if (userData.fullname) {
      fieldsToUpdate.push('customer_fullname = ?');
      values.push(userData.fullname);
    }
    if (userData.email) {
      fieldsToUpdate.push('email = ?');
      values.push(userData.email);
    }
    if (userData.avatar) {
      fieldsToUpdate.push('avatar = ?');
      values.push(userData.avatar);
    }
    if (userData.gender !== undefined && userData.gender !== null) {
      fieldsToUpdate.push('gender = ?');
      const genderValue = userData.gender === '' ? null : parseInt(userData.gender);
      values.push(genderValue);
    }
    if (userData.birthDay !== undefined) {
      fieldsToUpdate.push('birth_day = ?');
      values.push(userData.birthDay ? parseInt(userData.birthDay) : null);
    }
    if (userData.birthMonth !== undefined) {
      fieldsToUpdate.push('birth_month = ?');
      values.push(userData.birthMonth ? parseInt(userData.birthMonth) : null);
    }
    if (userData.birthYear !== undefined) {
      fieldsToUpdate.push('birth_year = ?');
      values.push(userData.birthYear ? parseInt(userData.birthYear) : null);
    }

    // KHÔNG thêm phone vào đây vì phone lưu ở delivery_infor

    if (fieldsToUpdate.length === 0) {
      return resolve({
        success: false,
        message: 'Không có thông tin nào để cập nhật'
      });
    }

    values.push(userId);
    const sql = `UPDATE customers SET ${fieldsToUpdate.join(', ')} WHERE customer_id = ?`;

    console.log("Executing SQL:", sql);
    console.log("With values:", values);

    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error updating user:", err);
        return reject(err);
      }

      if (result.affectedRows === 0) {
        return resolve({
          success: false,
          message: 'Không tìm thấy người dùng để cập nhật'
        });
      }

      // Lấy thông tin user mới nhất sau khi cập nhật
      getLastestUser(userId)
        .then(userResult => {
          if (userResult.success) {
            resolve({
              success: true,
              message: 'Cập nhật thông tin thành công',
              user: userResult.user
            });
          } else {
            resolve({
              success: false,
              message: 'Cập nhật thành công nhưng không thể lấy thông tin mới'
            });
          }
        })
        .catch(fetchErr => {
          console.error("Error fetching updated user:", fetchErr);
          resolve({
            success: true,
            message: 'Cập nhật thành công nhưng không thể lấy thông tin mới'
          });
        });
    });
  });
};

// Function đặt địa chỉ làm mặc định
export const setDefaultDeliveryAddress = (addressId) => {
  return new Promise((resolve, reject) => {
    // Lấy thông tin để biết customer_id
    const getAddressQuery = "SELECT customer_id FROM delivery_infor WHERE delivery_infor_id = ?";
    connection.query(getAddressQuery, [addressId], (err, results) => {
      if (err) {
        return reject(err);
      }

      if (results.length === 0) {
        return reject(new Error('Không tìm thấy địa chỉ'));
      }

      const customerId = results[0].customer_id;

      // Đặt tất cả địa chỉ khác thành không mặc định (is_being_used = 0)
      const resetDefaultQuery = "UPDATE delivery_infor SET is_being_used = 0 WHERE customer_id = ?";
      connection.query(resetDefaultQuery, [customerId], (resetErr) => {
        if (resetErr) {
          return reject(resetErr);
        }

        // Sau đó đặt địa chỉ được chọn làm mặc định (is_being_used = 1)
        const setDefaultQuery = "UPDATE delivery_infor SET is_being_used = 1 WHERE delivery_infor_id = ?";
        connection.query(setDefaultQuery, [addressId], (setErr, result) => {
          if (setErr) {
            return reject(setErr);
          }

          console.log("Set default address successfully, affected rows:", result.affectedRows);

          resolve({
            success: true,
            message: 'Đặt địa chỉ mặc định thành công'
          });
        });
      });
    });
  });
};

// Lấy lịch sử đơn hàng của khách hàng
export const getCustomerOrders = (customerId) => {
  return new Promise((resolve, reject) => {
    console.log("Getting orders for customer ID:", customerId);

    if (!customerId) {
      return resolve({
        success: false,
        message: 'Customer ID is required'
      });
    }

    // Thay đổi query để không dùng JSON_ARRAYAGG
    const query = `
      SELECT 
        o.order_id,
        o.total_price,
        o.created_at,
        o.order_status,
        o.payment_status,
        o.note,
        di.recipient_name,
        di.phone,
        di.address
      FROM orders o
      LEFT JOIN delivery_infor di ON o.delivery_infor_id = di.delivery_infor_id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `;

    connection.query(query, [parseInt(customerId)], (err, orderResults) => {
      if (err) {
        console.error("Database error:", err);
        return reject(err);
      }

      console.log("Database results:", orderResults);

      if (orderResults.length === 0) {
        return resolve({
          success: true,
          orders: [],
          message: 'No orders found'
        });
      }

      // Lấy chi tiết từng đơn hàng
      const orderPromises = orderResults.map(order => {
        return new Promise((resolveOrder, rejectOrder) => {
          const itemQuery = `
            SELECT 
              od.product_id,
              od.variant_id,
              p.product_name,
              od.quantity,
              od.price,
              pv.image_url,
              c.color_name,
              s.size_name
            FROM order_details od
            LEFT JOIN products p ON od.product_id = p.product_id
            LEFT JOIN product_variants pv ON od.variant_id = pv.variant_id
            LEFT JOIN colors c ON pv.color_id = c.color_id
            LEFT JOIN sizes s ON pv.size_id = s.size_id
            WHERE od.order_id = ?
          `;

          connection.query(itemQuery, [order.order_id], (itemErr, itemResults) => {
            if (itemErr) {
              return rejectOrder(itemErr);
            }

            resolveOrder({
              ...order,
              items: itemResults || []
            });
          });
        });
      });

      Promise.all(orderPromises)
        .then(ordersWithItems => {
          resolve({
            success: true,
            orders: ordersWithItems
          });
        })
        .catch(promiseErr => {
          console.error("Error getting order items:", promiseErr);
          reject(promiseErr);
        });
    });
  });
};

// Lấy chi tiết đơn hàng
export const getOrderDetail = (orderId) => {
  return new Promise((resolve, reject) => {
    console.log("Getting order detail for order ID:", orderId);

    if (!orderId) {
      return resolve({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Query thông tin đơn hàng chính
    const orderQuery = `
      SELECT 
        o.order_id,
        o.customer_id,
        o.total_price,
        o.created_at,
        o.order_status,
        o.payment_status,
        o.payment_method,
        o.note,
        o.voucher_id,
        di.recipient_name,
        di.phone,
        di.address,
        c.customer_fullname,
        c.email as customer_email,
        pm.payment_name,
        v.voucher_code,
        v.discount_percent
      FROM orders o
      LEFT JOIN delivery_infor di ON o.delivery_infor_id = di.delivery_infor_id
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN payment_methods pm ON o.payment_method = pm.payment_id
      LEFT JOIN vouchers v ON o.voucher_id = v.voucher_id
      WHERE o.order_id = ?
    `;

    connection.query(orderQuery, [parseInt(orderId)], (err, orderResults) => {
      if (err) {
        console.error("Database error:", err);
        return reject(err);
      }

      if (orderResults.length === 0) {
        return resolve({
          success: false,
          message: 'Order not found'
        });
      }

      const order = orderResults[0];

      // Query chi tiết sản phẩm
      const itemQuery = `
        SELECT 
          od.product_id,
          od.variant_id,
          p.product_name,
          od.quantity,
          od.price,
          pv.image_url,
          col.color_name,
          s.size_name,
          b.brand_name,
          cat.category_name
        FROM order_details od
        LEFT JOIN products p ON od.product_id = p.product_id
        LEFT JOIN product_variants pv ON od.variant_id = pv.variant_id
        LEFT JOIN colors col ON pv.color_id = col.color_id
        LEFT JOIN sizes s ON pv.size_id = s.size_id
        LEFT JOIN brands b ON pv.brand_id = b.brand_id
        LEFT JOIN categories cat ON pv.category_id = cat.category_id
        WHERE od.order_id = ?
      `;

      connection.query(itemQuery, [parseInt(orderId)], (itemErr, itemResults) => {
        if (itemErr) {
          console.error("Error getting order items:", itemErr);
          return reject(itemErr);
        }

        const orderWithItems = {
          ...order,
          items: itemResults || []
        };

        return resolve({
          success: true,
          order: orderWithItems
        });
      });
    });
  });
};

// Hủy đơn hàng và trả về số lượng sản phẩm
export const cancelOrder = (orderId) => {
  return new Promise((resolve, reject) => {
    console.log("Cancelling order ID:", orderId);

    // Bắt đầu transaction để đảm bảo tính nhất quán
    connection.beginTransaction((transactionErr) => {
      if (transactionErr) {
        console.error("Transaction error:", transactionErr);
        return reject(transactionErr);
      }

      // 1. Kiểm tra trạng thái đơn hàng trước khi hủy
      const checkOrderQuery = `
        SELECT order_status, customer_id 
        FROM orders 
        WHERE order_id = ?
      `;

      connection.query(checkOrderQuery, [orderId], (checkErr, orderResults) => {
        if (checkErr) {
          console.error("Error checking order status:", checkErr);
          return connection.rollback(() => {
            reject(checkErr);
          });
        }

        if (orderResults.length === 0) {
          return connection.rollback(() => {
            resolve({
              success: false,
              message: 'Không tìm thấy đơn hàng'
            });
          });
        }

        const order = orderResults[0];

        // Chỉ cho phép hủy đơn hàng có trạng thái "Chờ xác nhận"
        if (order.order_status !== 'Chờ xác nhận') {
          return connection.rollback(() => {
            resolve({
              success: false,
              message: 'Không thể hủy đơn hàng này. Chỉ có thể hủy đơn hàng đang chờ xác nhận.'
            });
          });
        }

        // 2. Lấy danh sách sản phẩm trong đơn hàng để trả về số lượng
        const getOrderItemsQuery = `
          SELECT variant_id, quantity 
          FROM order_details 
          WHERE order_id = ?
        `;

        connection.query(getOrderItemsQuery, [orderId], (itemsErr, itemsResults) => {
          if (itemsErr) {
            console.error("Error getting order items:", itemsErr);
            return connection.rollback(() => {
              reject(itemsErr);
            });
          }

          if (itemsResults.length === 0) {
            return connection.rollback(() => {
              resolve({
                success: false,
                message: 'Không tìm thấy sản phẩm trong đơn hàng'
              });
            });
          }

          // 3. Trả về số lượng cho từng sản phẩm
          const restoreQuantityPromises = itemsResults.map(item => {
            return new Promise((resolveRestore, rejectRestore) => {
              const restoreQuery = `
                UPDATE product_variants 
                SET quantity = quantity + ? 
                WHERE variant_id = ?
              `;

              connection.query(restoreQuery, [item.quantity, item.variant_id], (restoreErr, restoreResult) => {
                if (restoreErr) {
                  console.error(`Error restoring quantity for variant ${item.variant_id}:`, restoreErr);
                  return rejectRestore(restoreErr);
                }

                console.log(`✅ Restored quantity for variant ${item.variant_id}: +${item.quantity}`);
                resolveRestore({
                  variant_id: item.variant_id,
                  restored_quantity: item.quantity
                });
              });
            });
          });

          Promise.all(restoreQuantityPromises)
            .then((restoreResults) => {
              // 4. Cập nhật trạng thái đơn hàng thành "Đã hủy"
              const updateOrderQuery = `
                UPDATE orders 
                SET order_status = 'Đã hủy', 
                    updated_at = NOW() 
                WHERE order_id = ?
              `;

              connection.query(updateOrderQuery, [orderId], (updateErr, updateResult) => {
                if (updateErr) {
                  console.error("Error updating order status:", updateErr);
                  return connection.rollback(() => {
                    reject(updateErr);
                  });
                }

                // Commit transaction nếu tất cả đều thành công
                connection.commit((commitErr) => {
                  if (commitErr) {
                    console.error("Commit error:", commitErr);
                    return connection.rollback(() => {
                      reject(commitErr);
                    });
                  }

                  console.log(`✅ Order ${orderId} cancelled successfully with quantity restoration`);
                  resolve({
                    success: true,
                    message: 'Hủy đơn hàng thành công và đã hoàn trả số lượng sản phẩm',
                    order_id: orderId,
                    restored_items: restoreResults
                  });
                });
              });
            })
            .catch((restoreErr) => {
              console.error("Error restoring quantities:", restoreErr);
              connection.rollback(() => {
                reject(restoreErr);
              });
            });
        });
      });
    });
  });
};

export const changeUserPassword = (userId, currentPassword, newPassword) => {
  return new Promise((resolve, reject) => {
    // Lấy mật khẩu hiện tại từ database
    const getUserQuery = "SELECT password FROM customers WHERE customer_id = ?";

    connection.query(getUserQuery, [userId], (err, results) => {
      if (err) {
        console.error("Error getting user password:", err);
        return reject(err);
      }

      if (results.length === 0) {
        return resolve({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      const user = results[0];

      // Kiểm tra mật khẩu hiện tại
      bcrypt.compare(currentPassword, user.password, (compareErr, isMatch) => {
        if (compareErr) {
          console.error("Error comparing password:", compareErr);
          return reject(compareErr);
        }

        if (!isMatch) {
          return resolve({
            success: false,
            message: 'Mật khẩu hiện tại không đúng'
          });
        }

        // Mã hóa mật khẩu mới
        bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error("Error hashing new password:", hashErr);
            return reject(hashErr);
          }

          // Cập nhật mật khẩu mới
          const updateQuery = "UPDATE customers SET password = ? WHERE customer_id = ?";

          connection.query(updateQuery, [hashedPassword, userId], (updateErr, result) => {
            if (updateErr) {
              console.error("Error updating password:", updateErr);
              return reject(updateErr);
            }

            if (result.affectedRows === 0) {
              return resolve({
                success: false,
                message: 'Không thể cập nhật mật khẩu'
              });
            }

            return resolve({
              success: true,
              message: 'Đổi mật khẩu thành công'
            });
          });
        });
      });
    });
  });
};


