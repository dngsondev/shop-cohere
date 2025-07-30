import * as chatModels from '../models/chatModels.js';

// Tạo hoặc lấy phòng chat
export const createOrGetRoom = async (req, res) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        console.log(`🔍 Finding or creating room for customer: ${customerId}`);

        // Tìm hoặc tạo room
        const room = await chatModels.findOrCreateRoom(customerId);

        res.json({
            success: true,
            room: room,
            message: room.room_id ? 'Room found' : 'Room created'
        });

    } catch (error) {
        console.error('❌ Error in createOrGetRoom:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// Lấy danh sách phòng chat (Admin)
export const getChatRooms = async (req, res) => {
    try {
        const rooms = await chatModels.getAllChatRooms();

        res.json({
            success: true,
            rooms: rooms.map(room => ({
                id: room.room_id,
                room_id: room.room_id,
                customer_id: room.customer_id,
                customer_name: room.customer_name || room.customer_username,
                customer_email: room.customer_email,
                admin_id: room.admin_id,
                staff_name: room.admin_name,
                status: room.status,
                last_message: room.last_message,
                last_message_at: room.last_message_at,
                unread_count: room.unread_count || 0,
                created_at: room.created_at,
                closed_at: room.closed_at
            }))
        });
    } catch (error) {
        console.error('Error in getChatRooms:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Lấy messages của room
export const getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        console.log(`🔍 Getting messages for room: ${roomId}`);

        // Kiểm tra room tồn tại
        const room = await chatModels.getRoomDetails(roomId);

        // Lấy messages
        const messages = await chatModels.getRoomMessages(roomId);

        res.json({
            success: true,
            messages: messages,
            room: room,
            total: messages.length
        });

    } catch (error) {
        console.error('❌ Error getting messages:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// Gửi tin nhắn
export const sendMessage = async (req, res) => {
    try {
        const { roomId, senderType, senderId, message } = req.body;

        if (!roomId || !senderType || !senderId || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        console.log(`📤 Sending message:`, {
            roomId,
            senderType,
            senderId,
            messageLength: message.length
        });

        // Kiểm tra room tồn tại và không bị đóng
        const room = await chatModels.getRoomDetails(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        if (room.status === 'closed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot send message to closed room'
            });
        }

        // Insert message
        const newMessage = await chatModels.insertMessage(roomId, senderType, senderId, message.trim());

        res.json({
            success: true,
            message: newMessage
        });

    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// Cập nhật trạng thái room
export const updateRoomStatus = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { status, adminId } = req.body;

        if (!roomId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Room ID and status are required'
            });
        }

        console.log(`🔄 Updating room ${roomId} status to: ${status}`);

        // Validate status
        const validStatuses = ['pending', 'active', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        // Xử lý logic đặc biệt cho từng status
        if (status === 'active' && adminId) {
            // Assign room to admin khi chuyển sang active
            await chatModels.assignRoomToAdmin(roomId, adminId);
            console.log(`👤 Room ${roomId} assigned to admin ${adminId}`);
        } else if (status === 'closed') {
            // Đóng room
            await chatModels.closeRoom(roomId, adminId);
            console.log(`🔒 Room ${roomId} closed by admin ${adminId}`);
        } else {
            // Chỉ update status thông thường
            await chatModels.updateRoomStatus(roomId, status);
        }

        // Lấy thông tin room đã update
        const updatedRoom = await chatModels.getRoomDetails(roomId);

        res.json({
            success: true,
            room: updatedRoom,
            message: `Room status updated to ${status}`,
            previous_status: req.body.previousStatus || 'unknown'
        });

    } catch (error) {
        console.error('❌ Error updating room status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// Assign phòng chat cho admin
export const assignRoom = async (req, res) => {
    try {
        const { roomId, adminId } = req.body;

        if (!roomId || !adminId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID and Admin ID are required'
            });
        }

        console.log(`🔄 Assigning room ${roomId} to admin ${adminId}`);

        // Kiểm tra admin tồn tại
        const adminInfo = await chatModels.getAdminInfo(adminId);

        // Assign room
        const updatedRoom = await chatModels.assignRoomToAdmin(roomId, adminId);

        res.json({
            success: true,
            message: `Phòng chat đã được giao cho ${adminInfo.name}`,
            room: updatedRoom,
            admin: adminInfo
        });
    } catch (error) {
        console.error('Error assigning room:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// Đóng phòng chat
export const closeRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { adminId } = req.body;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        console.log(`🔄 Closing room ${roomId} by admin ${adminId}`);

        await chatModels.closeRoom(roomId, adminId);

        res.json({
            success: true,
            message: 'Phòng chat đã được đóng'
        });
    } catch (error) {
        console.error('Error closing room:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// Lấy danh sách admin
export const getAdmins = async (req, res) => {
    try {
        const admins = await chatModels.getOnlineAdmins();

        res.json({
            success: true,
            admins: admins
        });
    } catch (error) {
        console.error('Error getting admins:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Lấy trạng thái customer
export const getCustomerStatus = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        console.log(`🔍 Getting status for customer: ${customerId}`);
        const customerStatus = await chatModels.getCustomerStatus(customerId);

        res.json({
            success: true,
            status: {
                isOnline: false, // Mặc định offline
                lastSeen: null,
                isTyping: false,
                customer: {
                    id: customerStatus.customer_id,
                    name: customerStatus.name || 'Khách hàng',
                    email: customerStatus.email,
                    username: customerStatus.username,
                    avatar: customerStatus.avatar,
                    joinedDate: customerStatus.joined_date
                }
            }
        });
    } catch (error) {
        console.error('Error in getCustomerStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Lấy trạng thái staff của phòng chat
export const getStaffStatus = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        const room = await chatModels.getRoomDetails(roomId);

        res.json({
            success: true,
            status: {
                isOnline: room.admin_id ? true : false,
                assignedTo: room.admin_name || null,
                adminId: room.admin_id || null,
                adminUsername: room.admin_username || null,
                roomStatus: room.status || 'pending'
            }
        });
    } catch (error) {
        console.error('Error in getStaffStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update user activity - Giả lập để tương thích
export const updateActivity = async (req, res) => {
    try {
        const { userId, userType } = req.body;

        console.log(`📊 Activity updated for ${userType}: ${userId}`);

        res.json({
            success: true,
            message: 'Activity updated'
        });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Lấy room hiện tại của customer
export const getCurrentRoom = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        const room = await chatModels.getCurrentCustomerRoom(customerId);

        res.json({
            success: true,
            room: room,
            hasActiveRoom: !!room
        });
    } catch (error) {
        console.error('Error in getCurrentRoom:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Endpoint để kiểm tra trạng thái online - Giả lập
export const getOnlineStatus = async (req, res) => {
    try {
        const { userId, userType } = req.params;

        // Trả về offline cho tất cả users vì không có bảng user_sessions
        res.json({
            success: true,
            online_status: {
                isOnline: false,
                lastActivity: null,
                minutesOffline: null
            }
        });

    } catch (error) {
        console.error('❌ Error getting online status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};