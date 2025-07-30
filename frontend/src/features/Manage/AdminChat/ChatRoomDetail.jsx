import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FaUser,
    FaPaperPlane,
    FaPhone,
    FaVideo,
    FaEllipsisV,
    FaSmile,
    FaPaperclip,
    FaCheck,
    FaCheckDouble,
    FaCircle
} from 'react-icons/fa';
import { MdClose, MdAssignmentTurnedIn, MdInfo } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import chatService from '../../../services/chatService';
import { getFullImageUrl } from '../../../utils/imageUtils';
import styles from './ChatRoomDetail.module.scss';

function ChatRoomDetail({ room, onRoomUpdate }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showActions, setShowActions] = useState(false);
    const [customerTyping, setCustomerTyping] = useState(false);
    const [lastSeen, setLastSeen] = useState(null);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const actionsRef = useRef(null);

    // Load messages khi room thay đổi
    useEffect(() => {
        if (room?.room_id) {
            loadMessages(true);
        }
    }, [room?.room_id]);

    // Auto scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Click outside to close actions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionsRef.current && !actionsRef.current.contains(event.target)) {
                setShowActions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [newMessage]);

    // Polling mỗi 3 giây, KHÔNG set loading
    useEffect(() => {
        if (!room?.room_id) return;

        const interval = setInterval(() => {
            loadMessages(false);
        }, 3000);

        return () => clearInterval(interval);
    }, [room?.room_id]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Hàm loadMessages gốc, chỉ set loading khi cần
    const loadMessages = async (showLoading = true) => {
        if (!room?.room_id) return;

        try {
            if (showLoading) setLoading(true);
            setError(null);

            const response = await chatService.getMessages(room.room_id);

            if (response.data?.success) {
                setMessages(response.data.messages || []);
            } else {
                throw new Error(response.data?.message || 'Failed to load messages');
            }
        } catch (error) {
            setError('Không thể tải tin nhắn');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !room?.room_id || sending) return;

        try {
            setSending(true);

            // Lấy thông tin admin từ localStorage
            const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
            const adminId = adminData.admin_id || adminData.id || 1;

            console.log('🔍 Admin data:', { adminData, adminId });

            const response = await chatService.sendMessage(
                room.room_id,
                'admin',
                adminId,
                newMessage.trim()
            );

            if (response.data?.success) {
                setNewMessage('');
                await loadMessages(); // Reload messages để có tin nhắn mới nhất
                if (onRoomUpdate) {
                    onRoomUpdate(room.room_id);
                }
            } else {
                throw new Error(response.data?.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
            setError('Không thể gửi tin nhắn');
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';

        try {
            // Thử parse theo nhiều format khác nhau
            let date;

            if (dateString.includes('T')) {
                // ISO format: 2024-01-15T14:45:00.000Z
                date = new Date(dateString);
            } else if (dateString.includes('-')) {
                // MySQL format: 2024-01-15 14:45:00
                date = new Date(dateString.replace(' ', 'T') + 'Z');
            } else {
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) {
                console.warn('Invalid date format:', dateString);
                return '';
            }

            const now = new Date();
            const diffInMs = now - date;
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

            console.log(`⏰ Time debug:`, {
                original: dateString,
                parsed: date.toISOString(),
                now: now.toISOString(),
                diffMinutes: diffInMinutes
            });

            if (diffInMinutes < 1) {
                return 'Vừa xong';
            } else if (diffInMinutes < 60) {
                return `${diffInMinutes} phút trước`;
            } else if (diffInMinutes < 24 * 60) {
                const hours = Math.floor(diffInMinutes / 60);
                return `${hours} giờ trước`;
            } else {
                return date.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit'
                });
            }
        } catch (err) {
            console.error('Error formatting time:', err);
            return '';
        }
    };

    const handleAssignRoom = async () => {
        try {
            const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
            const adminId = adminData.admin_id || adminData.id || 1;

            await chatService.assignRoom(room.room_id, adminId);

            // Refresh room data
            if (onRoomUpdate) {
                onRoomUpdate(room.room_id);
            }

            setShowActions(false);
        } catch (error) {
            console.error('Error assigning room:', error);
            setError('Không thể nhận cuộc trò chuyện');
        }
    };

    const handleCloseRoom = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn đóng cuộc trò chuyện này?')) {
            return;
        }

        try {
            const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
            const adminId = adminData.admin_id || adminData.id || 1;

            await chatService.closeRoom(room.room_id, adminId);

            // Refresh room data
            if (onRoomUpdate) {
                onRoomUpdate(room.room_id);
            }

            setShowActions(false);
        } catch (error) {
            console.error('Error closing room:', error);
            setError('Không thể đóng cuộc trò chuyện');
        }
    };

    const isRoomClosed = room?.status === 'closed' || room?.closed_at;

    if (!room) {
        return (
            <div className={styles.emptyChatState}>
                <div className={styles.emptyIllustration}>
                    <div className={styles.chatBubbles}>
                        <div className={styles.bubble1}></div>
                        <div className={styles.bubble2}></div>
                        <div className={styles.bubble3}></div>
                    </div>
                </div>
                <h3>Chọn cuộc trò chuyện</h3>
                <p>Chọn cuộc trò chuyện từ danh sách để bắt đầu hỗ trợ khách hàng</p>
            </div>
        );
    }

    return (
        <div className={styles.chatRoomDetail}>
            {/* Header - Giống WhatsApp/Telegram */}
            <div className={styles.chatHeader}>
                <div className={styles.customerSection}>
                    <div className={styles.customerAvatar}>
                        {room.customer_avatar ? (
                            <img src={getFullImageUrl(room.customer_avatar)} alt={room.customer_name} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {(room.customer_name || 'K').charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className={styles.customerInfo}>
                        <h3 className={styles.customerName}>
                            {room.customer_name || 'Khách hàng'}
                        </h3>
                        <div className={styles.customerStatus}>
                            {customerTyping ? (
                                <span className={styles.typingIndicator}>
                                    <span className={styles.typingDots}>
                                        <span></span><span></span><span></span>
                                    </span>
                                    đang nhập...
                                </span>
                            ) : (
                                // XÓA hiển thị trạng thái hoạt động
                                <></>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    {/* <button className={styles.actionBtn} title="Gọi điện">
                        <FaPhone />
                    </button>
                    <button className={styles.actionBtn} title="Video call">
                        <FaVideo />
                    </button> */}
                    {/* <button className={styles.actionBtn} title="Thông tin">
                        <MdInfo />
                    </button> */}

                    <div className={styles.dropdownContainer} ref={actionsRef}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => setShowActions(!showActions)}
                            title="Thêm tùy chọn"
                        >
                            <BsThreeDotsVertical />
                        </button>

                        {showActions && (
                            <div className={styles.actionsDropdown}>
                                {room.status === 'waiting' && (
                                    <button onClick={handleAssignRoom} className={styles.dropdownItem}>
                                        <MdAssignmentTurnedIn />
                                        <span>Nhận cuộc trò chuyện</span>
                                    </button>
                                )}
                                {!isRoomClosed && (
                                    <button onClick={handleCloseRoom} className={`${styles.dropdownItem} ${styles.danger}`}>
                                        <MdClose />
                                        <span>Đóng cuộc trò chuyện</span>
                                    </button>
                                )}
                                <div className={styles.dropdownDivider}></div>
                                <div className={styles.roomInfo}>
                                    <small>ID: #{room.room_id}</small>
                                    <small>@{room.customer_username || `customer_${room.customer_id}`}</small>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div className={styles.messagesContainer}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Đang tải tin nhắn...</p>
                    </div>
                ) : error ? (
                    <div className={styles.errorState}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <p>{error}</p>
                        <button onClick={loadMessages} className={styles.retryBtn}>
                            Thử lại
                        </button>
                    </div>
                ) : isRoomClosed ? (
                    <div className={styles.closedState}>
                        <div className={styles.closedIcon}>🔒</div>
                        <h4>Cuộc trò chuyện đã kết thúc</h4>
                        <p>Không thể gửi tin nhắn mới</p>
                    </div>
                ) : (
                    <div className={styles.messagesList}>
                        {/* Chat background pattern */}
                        <div className={styles.chatBackground}></div>

                        {messages.length === 0 ? (
                            <div className={styles.welcomeMessage}>
                                <div className={styles.welcomeIcon}>👋</div>
                                <h4>Chào mừng!</h4>
                                <p>Hãy bắt đầu cuộc trò chuyện với khách hàng</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => {
                                    console.log('🔍 Rendering message:', message);

                                    const isAdmin = message.sender_type === 'admin';
                                    const prevMessage = messages[index - 1];
                                    const nextMessage = messages[index + 1];

                                    // Show time if first message or more than 5 minutes gap
                                    const showTime = index === 0 ||
                                        (prevMessage && new Date(message.created_at) - new Date(prevMessage.created_at) > 300000);

                                    // Check if this is the last message in a group
                                    const isLastInGroup = !nextMessage ||
                                        nextMessage.sender_type !== message.sender_type ||
                                        (new Date(nextMessage.created_at) - new Date(message.created_at) > 60000);

                                    // Check if this is the first message in a group
                                    const isFirstInGroup = index === 0 ||
                                        prevMessage.sender_type !== message.sender_type ||
                                        (new Date(message.created_at) - new Date(prevMessage.created_at) > 60000);

                                    return (
                                        <div key={message.id || `msg-${index}`}>
                                            {showTime && (
                                                <div className={styles.timeStamp}>
                                                    {formatTime(message.created_at)}
                                                </div>
                                            )}

                                            <div className={`${styles.messageRow} ${isAdmin ? styles.sent : styles.received}`}>
                                                {!isAdmin && isFirstInGroup && (
                                                    <div className={styles.senderAvatar}>
                                                        {room.customer_avatar ? (
                                                            <img src={getFullImageUrl(room.customer_avatar)} alt="" />
                                                        ) : (
                                                            <div className={styles.avatarSmall}>
                                                                {(room.customer_name || 'K').charAt(0).toUpperCase()
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className={`${styles.messageBubble} ${isFirstInGroup ? styles.first : ''} ${isLastInGroup ? styles.last : ''}`}>
                                                    <div className={styles.messageContent}>
                                                        {message.message || message.content || 'Tin nhắn không có nội dung'}
                                                    </div>

                                                    {isLastInGroup && (
                                                        <div className={styles.messageFooter}>
                                                            <span className={styles.messageTime}>
                                                                {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                            {isAdmin && (
                                                                <span className={styles.messageStatus}>
                                                                    <FaCheckDouble className={styles.delivered} />
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area - Giống các app chat hiện đại */}
            {!isRoomClosed && (
                <div className={styles.inputArea}>
                    <div className={styles.inputContainer}>
                        <button className={styles.attachBtn} title="Đính kèm">
                            <FaPaperclip />
                        </button>

                        <div className={styles.textInputContainer}>
                            <textarea
                                ref={textareaRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Nhập tin nhắn..."
                                className={styles.messageInput}
                                rows={1}
                                disabled={sending}
                                maxLength={1000}
                            />

                            <button className={styles.emojiBtn} title="Emoji">
                                <FaSmile />
                            </button>
                        </div>

                        <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || sending}
                            className={`${styles.sendBtn} ${newMessage.trim() ? styles.active : ''}`}
                            title="Gửi (Enter)"
                        >
                            {sending ? (
                                <div className={styles.sendingSpinner}></div>
                            ) : (
                                <FaPaperPlane />
                            )}
                        </button>
                    </div>

                    <div className={styles.inputFooter}>
                        <span className={styles.charCount}>{newMessage.length}/1000</span>
                        <span className={styles.inputHint}>
                            Enter để gửi, Shift+Enter để xuống dòng
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatRoomDetail;