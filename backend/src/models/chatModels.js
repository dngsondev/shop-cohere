import connection from '../config/db.js';

// Tạo phòng chat mới
export const createChatRoom = async (customerId) => {
    return new Promise((resolve, reject) => {
        try {
            const query = `
                INSERT INTO chat_rooms (customer_id, status, created_at) 
                VALUES (?, 'pending', NOW())
            `;

            connection.query(query, [customerId], (err, result) => {
                if (err) {
                    console.error('Error creating chat room:', err);
                    return reject(new Error('Không thể tạo phòng chat: ' + err.message));
                }

                resolve({
                    room_id: result.insertId,
                    customer_id: customerId,
                    status: 'pending',
                    created_at: new Date()
                });
            });
        } catch (error) {
            console.error('Error creating chat room:', error);
            reject(new Error('Không thể tạo phòng chat: ' + error.message));
        }
    });
};

// Lấy hoặc tạo phòng chat
export const getOrCreateRoom = async (customerId) => {
    return new Promise((resolve, reject) => {
        try {
            // Tìm room đang active của customer này trước
            const findActiveRoomQuery = `
                SELECT cr.*, c.customer_fullname as customer_name
                FROM chat_rooms cr
                LEFT JOIN customers c ON cr.customer_id = c.customer_id
                WHERE cr.customer_id = ? 
                AND cr.status IN ('pending', 'active', 'closed')
                ORDER BY cr.created_at DESC 
                LIMIT 1
            `;

            connection.query(findActiveRoomQuery, [customerId], (err, results) => {
                if (err) {
                    console.error('Error finding active room:', err);
                    return reject(err);
                }

                // Nếu đã có room active, trả về room đó
                if (results.length > 0) {
                    const existingRoom = results[0];
                    console.log(`✅ Found existing active room: ${existingRoom.room_id} for customer: ${customerId}`);
                    return resolve(existingRoom);
                }

                // Nếu chưa có room active, tạo mới
                console.log(`🆕 Creating new room for customer: ${customerId}`);
                const createRoomQuery = `
                    INSERT INTO chat_rooms (customer_id, status, created_at, last_message_at) 
                    VALUES (?, 'pending', NOW(), NOW())
                `;

                connection.query(createRoomQuery, [customerId], (err, result) => {
                    if (err) {
                        console.error('Error creating chat room:', err);
                        return reject(err);
                    }

                    const newRoomId = result.insertId;
                    console.log(`✅ Created new room: ${newRoomId} for customer: ${customerId}`);

                    // Lấy thông tin room vừa tạo với thông tin customer
                    const getRoomQuery = `
                        SELECT cr.*, c.customer_fullname as customer_name
                        FROM chat_rooms cr
                        LEFT JOIN customers c ON cr.customer_id = c.customer_id
                        WHERE cr.room_id = ?
                    `;

                    connection.query(getRoomQuery, [newRoomId], (err, roomResults) => {
                        if (err) {
                            console.error('Error fetching new room:', err);
                            return reject(err);
                        }

                        resolve(roomResults[0]);
                    });
                });
            });
        } catch (error) {
            console.error('Error in getOrCreateRoom:', error);
            reject(new Error('Không thể lấy hoặc tạo phòng chat: ' + error.message));
        }
    });
};

// Lấy danh sách phòng chat cho admin
export const getAllChatRooms = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                cr.room_id,
                cr.customer_id,
                cr.admin_id,
                cr.status,
                cr.created_at,
                cr.last_message_at,
                cr.closed_at,
                c.customer_fullname as customer_name,
                c.avatar as customer_avatar,
                c.email as customer_email,
                c.customer_username as customer_username,
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

        connection.query(query, [], (err, results) => {
            if (err) {
                console.error('❌ Error getting chat rooms:', err);
                return reject(err);
            }

            // Lấy danh sách room_id cần xoá (không có last_message)
            const roomsToDelete = results
                .filter(room => room.last_message === null)
                .map(room => room.room_id);

            if (roomsToDelete.length > 0) {
                // Xoá các phòng chat không có tin nhắn
                const deleteQuery = `
                    DELETE FROM chat_rooms
                    WHERE room_id IN (?)
                `;
                connection.query(deleteQuery, [roomsToDelete], (delErr) => {
                    if (delErr) {
                        console.error('❌ Error deleting empty chat rooms:', delErr);
                        // Vẫn tiếp tục trả về các phòng hợp lệ
                    }
                    // Sau khi xoá, chỉ trả về các phòng còn lại (có last_message)
                    const filteredResults = results.filter(room => room.last_message !== null);
                    const formattedResults = filteredResults.map(room => ({
                        ...room,
                        status: room.status || (room.closed_at ? 'closed' : 'pending'),
                        customer_name: room.customer_name || 'Khách hàng',
                        admin_name: room.admin_name || null,
                        message_count: parseInt(room.message_count) || 0
                    }));
                    console.log(`✅ Found ${formattedResults.length} chat rooms (after delete)`);
                    resolve(formattedResults);
                });
            } else {
                // Không có phòng nào cần xoá
                const filteredResults = results.filter(room => room.last_message !== null);
                const formattedResults = filteredResults.map(room => ({
                    ...room,
                    status: room.status || (room.closed_at ? 'closed' : 'pending'),
                    customer_name: room.customer_name || 'Khách hàng',
                    admin_name: room.admin_name || null,
                    message_count: parseInt(room.message_count) || 0
                }));
                console.log(`✅ Found ${formattedResults.length} chat rooms`);
                resolve(formattedResults);
            }
        });
    });
};

// Lấy tin nhắn của phòng chat
export const getRoomMessages = (roomId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                cm.*,
                CASE 
                    WHEN cm.sender_type = 'customer' THEN c.customer_fullname
                    WHEN cm.sender_type = 'admin' THEN a.admin_name
                    ELSE 'System'
                END as sender_name,
                CASE 
                    WHEN cm.sender_type = 'customer' THEN c.avatar
                    ELSE NULL
                END as sender_avatar
            FROM chat_messages cm
            LEFT JOIN customers c ON cm.sender_type = 'customer' AND cm.sender_id = c.customer_id
            LEFT JOIN admins a ON cm.sender_type = 'admin' AND cm.sender_id = a.admin_id
            WHERE cm.room_id = ?
            ORDER BY cm.created_at ASC
        `;

        connection.query(query, [roomId], (err, results) => {
            if (err) {
                console.error('❌ Error getting messages:', err);
                return reject(err);
            }

            // Format messages data
            const formattedMessages = results.map(msg => ({
                id: msg.message_id,
                room_id: msg.room_id,
                sender_type: msg.sender_type,
                sender_id: msg.sender_id,
                sender_name: msg.sender_name || 'Unknown',
                sender_avatar: msg.sender_avatar,
                message: msg.message,
                created_at: msg.created_at,
                formatted_time: new Date(msg.created_at).toISOString()
            }));

            console.log(`✅ Found ${formattedMessages.length} messages for room ${roomId}`);
            resolve(formattedMessages);
        });
    });
};

// Gửi tin nhắn
export const insertMessage = (roomId, senderType, senderId, message) => {
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT INTO chat_messages (room_id, sender_type, sender_id, message, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        `;

        connection.query(insertQuery, [roomId, senderType, senderId, message], (err, result) => {
            if (err) {
                console.error('❌ Error inserting message:', err);
                return reject(err);
            }

            const messageId = result.insertId;

            // Lấy thông tin message vừa insert với thông tin sender
            const getMessageQuery = `
                SELECT 
                    cm.*,
                    CASE 
                        WHEN cm.sender_type = 'customer' THEN c.customer_fullname
                        WHEN cm.sender_type = 'admin' THEN a.admin_name
                        ELSE 'System'
                    END as sender_name,
                    CASE 
                        WHEN cm.sender_type = 'customer' THEN c.avatar
                        ELSE NULL
                    END as sender_avatar
                FROM chat_messages cm
                LEFT JOIN customers c ON cm.sender_type = 'customer' AND cm.sender_id = c.customer_id
                LEFT JOIN admins a ON cm.sender_type = 'admin' AND cm.sender_id = a.admin_id
                WHERE cm.message_id = ?
            `;

            connection.query(getMessageQuery, [messageId], (err, messageResults) => {
                if (err) {
                    console.error('❌ Error getting inserted message:', err);
                    return reject(err);
                }

                const insertedMessage = messageResults[0];

                // Update last_message và last_message_at cho room
                const updateRoomQuery = `
                    UPDATE chat_rooms 
                    SET last_message = ?, last_message_at = NOW()
                    WHERE room_id = ?
                `;

                connection.query(updateRoomQuery, [message, roomId], (updateErr) => {
                    if (updateErr) {
                        console.error('❌ Error updating room last_message:', updateErr);
                    }
                });

                // Thêm formatted_time
                insertedMessage.formatted_time = insertedMessage.created_at;

                console.log('✅ Message inserted successfully:', {
                    id: insertedMessage.message_id,
                    room_id: insertedMessage.room_id,
                    sender_type: insertedMessage.sender_type,
                    sender_id: insertedMessage.sender_id,
                    sender_name: insertedMessage.sender_name,
                    sender_avatar: insertedMessage.sender_avatar,
                    message: insertedMessage.message,
                    created_at: insertedMessage.created_at,
                    formatted_time: insertedMessage.formatted_time
                });

                resolve(insertedMessage);
            });
        });
    });
};

// Assign room cho admin
export const assignRoomToAdmin = (roomId, adminId) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE chat_rooms 
            SET admin_id = ?, status = 'active'
            WHERE room_id = ? AND status IN ('pending', 'closed')
        `;

        connection.query(query, [adminId, roomId], (err, result) => {
            if (err) {
                console.error('Error assigning room to admin:', err);
                return reject(err);
            }

            if (result.affectedRows === 0) {
                return reject(new Error('Room not found or already assigned'));
            }

            console.log(`✅ Room ${roomId} assigned to admin ${adminId}`);

            // Lấy thông tin room sau khi assign
            getRoomDetails(roomId)
                .then(room => resolve(room))
                .catch(err => reject(err));
        });
    });
};

// Đóng phòng chat
export const closeRoom = (roomId, adminId) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE chat_rooms 
            SET status = 'closed', closed_at = NOW()
            WHERE room_id = ? AND status IN ('pending', 'active', 'closed')
        `;

        connection.query(query, [roomId], (err, result) => {
            if (err) {
                console.error('Error closing room:', err);
                return reject(err);
            }

            if (result.affectedRows === 0) {
                return reject(new Error('Room not found or already closed'));
            }

            console.log(`✅ Room ${roomId} closed by admin ${adminId}`);
            resolve(result);
        });
    });
};

// Lấy thông tin chi tiết phòng chat
export const getRoomDetails = (roomId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                cr.*,
                c.customer_fullname as customer_name,
                c.email as customer_email,
                c.customer_username as customer_username,
                c.avatar as customer_avatar,
                a.admin_name as admin_name,
                a.admin_username as admin_username,
                (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.room_id) as total_messages
            FROM chat_rooms cr
            LEFT JOIN customers c ON cr.customer_id = c.customer_id
            LEFT JOIN admins a ON cr.admin_id = a.admin_id
            WHERE cr.room_id = ?
        `;

        connection.query(query, [roomId], (err, results) => {
            if (err) {
                console.error('❌ Error getting room details:', err);
                return reject(err);
            }

            if (results.length === 0) {
                return reject(new Error('Room not found'));
            }

            const room = results[0];

            // Ensure proper data format
            const formattedRoom = {
                ...room,
                status: room.status || 'pending',
                closed_at: room.closed_at || null,
                customer_name: room.customer_name || 'Khách hàng',
                total_messages: parseInt(room.total_messages) || 0
            };

            console.log('✅ Room details:', formattedRoom);
            resolve(formattedRoom);
        });
    });
};

// Lấy trạng thái staff của room
export const getStaffStatus = (roomId) => {
    return new Promise((resolve, reject) => {
        try {
            const query = `
                SELECT 
                    cr.admin_id,
                    cr.status as room_status,
                    a.admin_username as staff_name
                FROM chat_rooms cr
                LEFT JOIN admins a ON cr.admin_id = a.admin_id
                WHERE cr.room_id = ?
            `;

            connection.query(query, [roomId], (err, results) => {
                if (err) {
                    console.error('Error getting staff status:', err);
                    return resolve({
                        isOnline: false,
                        lastSeen: null,
                        isTyping: false,
                        assignedTo: null
                    });
                }

                if (results.length === 0) {
                    return resolve({
                        isOnline: false,
                        lastSeen: null,
                        isTyping: false,
                        assignedTo: null
                    });
                }

                const result = results[0];
                resolve({
                    isOnline: result.admin_id ? true : false,
                    lastSeen: null,
                    isTyping: false,
                    assignedTo: result.staff_name || result.admin_id
                });
            });
        } catch (error) {
            console.error('Error getting staff status:', error);
            resolve({
                isOnline: false,
                lastSeen: null,
                isTyping: false,
                assignedTo: null
            });
        }
    });
};

// Lấy trạng thái customer
export const getCustomerStatus = (customerId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                c.customer_id,
                c.customer_fullname as name,
                c.email,
                c.customer_username as username,
                c.avatar,
                c.created_at as joined_date
            FROM customers c
            WHERE c.customer_id = ?
        `;

        connection.query(query, [customerId], (err, results) => {
            if (err) {
                console.error('❌ Error getting customer status:', err);
                return reject(err);
            }

            if (results.length === 0) {
                console.log('❌ Customer not found:', customerId);
                return resolve({
                    customer_id: customerId,
                    name: 'Khách hàng',
                    email: null,
                    username: null,
                    avatar: null,
                    status: 'offline',
                    last_seen: null,
                    is_typing: false
                });
            }

            const customer = results[0];
            const customerStatus = {
                ...customer,
                status: 'offline', // Mặc định offline
                last_seen: null,
                is_typing: false
            };

            console.log('✅ Customer status:', customerStatus);
            resolve(customerStatus);
        });
    });
};

// Lấy thông tin admin
export const getAdminInfo = (adminId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                admin_id,
                admin_name as name,
                admin_username as username,
                email,
                role,
                created_at
            FROM admins 
            WHERE admin_id = ?
        `;

        connection.query(query, [adminId], (err, results) => {
            if (err) {
                console.error('Error getting admin info:', err);
                return reject(err);
            }

            if (results.length === 0) {
                return reject(new Error('Admin not found'));
            }

            resolve(results[0]);
        });
    });
};

// Lấy danh sách admin online
export const getOnlineAdmins = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                admin_id,
                admin_name as name,
                admin_username as username,
                role
            FROM admins 
            WHERE role IN (0, 1) AND status = 1
            ORDER BY admin_name
        `;

        connection.query(query, [], (err, results) => {
            if (err) {
                console.error('Error getting online admins:', err);
                return reject(err);
            }

            // Tất cả admin được coi là online
            const onlineAdmins = results.map(admin => ({
                ...admin,
                isOnline: true,
                lastSeen: new Date()
            }));

            resolve(onlineAdmins);
        });
    });
};

// Kiểm tra room hiện tại của customer
export const getCurrentCustomerRoom = async (customerId) => {
    return new Promise((resolve, reject) => {
        try {
            const query = `
                SELECT cr.*, c.customer_fullname as customer_name
                FROM chat_rooms cr
                LEFT JOIN customers c ON cr.customer_id = c.customer_id
                WHERE cr.customer_id = ? 
                AND cr.status IN ('pending', 'active', 'closed')
                ORDER BY cr.created_at DESC 
                LIMIT 1
            `;

            connection.query(query, [customerId], (err, results) => {
                if (err) {
                    console.error('Error checking current room:', err);
                    return reject(err);
                }

                resolve(results.length > 0 ? results[0] : null);
            });
        } catch (error) {
            console.error('Error in getCurrentCustomerRoom:', error);
            reject(error);
        }
    });
};

// Sửa lại hàm findOrCreateRoom
export const findOrCreateRoom = (customerId) => {
    return new Promise((resolve, reject) => {
        // Tìm room hiện tại của customer (chưa đóng)
        const findQuery = `
            SELECT cr.*, c.customer_fullname, c.customer_username, c.email, c.avatar
            FROM chat_rooms cr
            LEFT JOIN customers c ON cr.customer_id = c.customer_id
            WHERE cr.customer_id = ? AND cr.status != 'closed' 
            ORDER BY cr.created_at DESC 
            LIMIT 1
        `;

        connection.query(findQuery, [customerId], (err, results) => {
            if (err) {
                console.error('❌ Error finding room:', err);
                return reject(err);
            }

            if (results.length > 0) {
                // Đã có room đang hoạt động
                const existingRoom = results[0];
                console.log(`✅ Found existing room ${existingRoom.room_id} for customer ${customerId}`);
                resolve(existingRoom);
            } else {
                // Tạo room mới
                const createQuery = `
                    INSERT INTO chat_rooms (customer_id, status, created_at) 
                    VALUES (?, 'pending', NOW())
                `;

                connection.query(createQuery, [customerId], (createErr, createResult) => {
                    if (createErr) {
                        console.error('❌ Error creating room:', createErr);
                        return reject(createErr);
                    }

                    const newRoomId = createResult.insertId;

                    // Lấy thông tin room vừa tạo
                    const getNewRoomQuery = `
                        SELECT cr.*, c.customer_fullname, c.customer_username, c.email, c.avatar
                        FROM chat_rooms cr
                        LEFT JOIN customers c ON cr.customer_id = c.customer_id
                        WHERE cr.room_id = ?
                    `;

                    connection.query(getNewRoomQuery, [newRoomId], (getErr, getRoomResults) => {
                        if (getErr) {
                            console.error('❌ Error getting new room:', getErr);
                            return reject(getErr);
                        }

                        const newRoom = getRoomResults[0];
                        console.log(`✅ Created new room ${newRoomId} for customer ${customerId}`);
                        resolve(newRoom);
                    });
                });
            }
        });
    });
};

// Cập nhật trạng thái room
export const updateRoomStatus = (roomId, status) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE chat_rooms 
            SET status = ?, 
                last_message_at = NOW()
                ${status === 'closed' ? ', closed_at = NOW()' : ''}
            WHERE room_id = ?
        `;

        connection.query(query, [status, roomId], (err, result) => {
            if (err) {
                console.error('❌ Error updating room status:', err);
                return reject(err);
            }

            if (result.affectedRows === 0) {
                return reject(new Error('Room not found or no changes made'));
            }

            console.log(`✅ Room ${roomId} status updated to: ${status}`);
            resolve({
                room_id: roomId,
                status: status,
                affected_rows: result.affectedRows
            });
        });
    });
};