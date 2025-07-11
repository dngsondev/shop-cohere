import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaUser, FaTimes, FaPhone, FaVideo, FaInfo, FaPaperPlane, FaCircle } from 'react-icons/fa';
import { IoMdSend } from 'react-icons/io';
// import { BsThreeDotsVertical } from 'react-icons/bs';
import { MdSupportAgent } from 'react-icons/md';
import chatService from '../../services/chatService';
import styles from './StaffChat.module.scss';

// Lấy userId, nếu chưa có thì tạo userId tạm cho khách
const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) return user.id;
    let guestId = localStorage.getItem('guest_id');
    if (!guestId) {
        guestId = 'guest_' + Date.now();
        localStorage.setItem('guest_id', guestId);
    }
    return guestId;
};

function StaffChat({ setShowChat, chatType, setChatType, user, globalRoomId, onRoomCreated }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [roomId, setRoomId] = useState(globalRoomId);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [isTyping, setIsTyping] = useState(false);
    const [staffStatus, setStaffStatus] = useState({
        isOnline: false,
        lastSeen: null,
        isTyping: false,
        assignedTo: null
    });

    // Flags để tránh multiple calls
    const [isInitialized, setIsInitialized] = useState(false);
    const initializingRef = useRef(false);
    const mountedRef = useRef(true);

    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const pollingInterval = useRef(null);
    const statusCheckInterval = useRef(null);
    const typingTimeout = useRef(null);

    // Lấy thông tin user
    const userId = user?.id || getUserId();
    const userName = user?.name || JSON.parse(localStorage.getItem('user'))?.name || 'Khách hàng';

    // Cleanup function
    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            initializingRef.current = false;

            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = null;
            }
            if (statusCheckInterval.current) {
                clearInterval(statusCheckInterval.current);
                statusCheckInterval.current = null;
            }
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
                typingTimeout.current = null;
            }
        };
    }, []);

    // Khởi tạo chat
    useEffect(() => {
        console.log(`🔍 StaffChat Effect: UserId=${userId}, GlobalRoomId=${globalRoomId}, IsInitialized=${isInitialized}, IsInitializing=${initializingRef.current}`);

        if (!userId) {
            console.log('❌ No userId found');
            return;
        }

        if (isInitialized) {
            console.log('✅ Already initialized');
            return;
        }

        if (initializingRef.current) {
            console.log('⏳ Already initializing');
            return;
        }

        console.log('🚀 Starting chat initialization...');
        initializeChat();
    }, [userId, globalRoomId]);

    // Cập nhật room khi globalRoomId thay đổi
    useEffect(() => {
        if (globalRoomId && globalRoomId !== roomId && isInitialized) {
            console.log(`🔄 Updating to existing room: ${globalRoomId}`);
            setRoomId(globalRoomId);
            loadMessages(globalRoomId);
            startPolling(globalRoomId);
        }
    }, [globalRoomId, roomId, isInitialized]);

    // Auto scroll khi có tin nhắn mới
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
    }, [messages]);

    const initializeChat = useCallback(async () => {
        if (initializingRef.current || !mountedRef.current) return;

        try {
            initializingRef.current = true;
            setIsLoading(true);
            setConnectionStatus('connecting');

            console.log(`🔄 Initializing chat for user: ${userId}`);

            // Nếu có globalRoomId, sử dụng luôn
            if (globalRoomId) {
                console.log(`♻️ Using existing global room: ${globalRoomId}`);
                setRoomId(globalRoomId);
                await loadMessages(globalRoomId);
                startPolling(globalRoomId);
                setConnectionStatus('connected');
                setIsInitialized(true);
                return;
            }

            // Tạo hoặc lấy room
            console.log(`🆕 Creating or getting room for customer: ${userId}`);
            const response = await chatService.createOrGetRoom(userId);

            if (!mountedRef.current) return;

            // Sử dụng response.data trực tiếp vì axios đã wrap
            if (response.data?.success && response.data?.room) {
                const room = response.data.room;
                console.log(`🏠 Room ${room.room_id} ${room.isExisting ? 'found' : 'created'}`);

                setRoomId(room.room_id);

                // Thông báo cho parent component
                if (onRoomCreated && !room.isExisting) {
                    onRoomCreated(room.room_id);
                }

                // Load messages và start polling
                await loadMessages(room.room_id);
                startPolling(room.room_id);
                setConnectionStatus('connected');
                setIsInitialized(true);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('❌ Error initializing chat:', error);
            if (mountedRef.current) {
                setConnectionStatus('error');
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
            initializingRef.current = false;
        }
    }, [userId, globalRoomId, onRoomCreated]);

    const loadMessages = useCallback(async (targetRoomId) => {
        if (!targetRoomId || !mountedRef.current) return;

        try {
            console.log(`📥 Loading messages for room: ${targetRoomId}`);
            const response = await chatService.getMessages(targetRoomId);

            // Axios response structure
            if (response.data?.success && mountedRef.current) {
                const newMessages = response.data.messages || [];
                setMessages(newMessages);
                console.log(`✅ Loaded ${newMessages.length} messages`);
            }
        } catch (error) {
            console.error('❌ Error loading messages:', error);
        }
    }, []);

    const startPolling = useCallback((targetRoomId) => {
        if (!targetRoomId) return;

        // Clear existing polling
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
        }

        console.log(`🔄 Starting polling for room: ${targetRoomId}`);
        pollingInterval.current = setInterval(() => {
            if (mountedRef.current) {
                loadMessages(targetRoomId);
                checkStaffStatus(targetRoomId);
            }
        }, 3000);

        // Start staff status checking
        if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current);
        }

        statusCheckInterval.current = setInterval(() => {
            if (mountedRef.current) {
                checkStaffStatus(targetRoomId);
            }
        }, 10000);
    }, [loadMessages]);

    const checkStaffStatus = useCallback(async (targetRoomId) => {
        if (!targetRoomId || !mountedRef.current) return;

        try {
            const response = await chatService.getStaffStatus(targetRoomId);
            // Axios response structure
            if (response.data?.success && mountedRef.current) {
                setStaffStatus(response.data.status);
            }
        } catch (error) {
            console.error('❌ Error checking staff status:', error);
            if (mountedRef.current) {
                setStaffStatus({
                    isOnline: false,
                    lastSeen: null,
                    isTyping: false,
                    assignedTo: null
                });
            }
        }
    }, []);

    const handleSendMessage = useCallback(async () => {
        if (!input.trim() || !roomId || isLoading || !mountedRef.current) return;

        const messageText = input.trim();
        setInput('');
        setIsLoading(true);

        // Thêm tin nhắn tạm thời
        const tempMessage = {
            id: `temp_${Date.now()}`,
            message: messageText,
            sender_type: 'customer',
            sender_id: userId,
            sender_name: userName,
            created_at: new Date().toISOString(),
            isTemp: true
        };

        setMessages(prev => [...prev, tempMessage]);
        scrollToBottom();

        try {
            const response = await chatService.sendMessage(roomId, 'customer', userId, messageText);

            // Axios response structure
            if (response.data?.success && mountedRef.current) {
                // Xóa tin nhắn tạm thời và reload messages
                setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
                await loadMessages(roomId);
                console.log('✅ Message sent successfully');
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
            if (mountedRef.current) {
                // Xóa tin nhắn tạm thời
                setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [input, roomId, isLoading, userId, userName, loadMessages]);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    const formatTime = useCallback((timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const handleSwitchToChatBot = useCallback(() => {
        setChatType('bot');
    }, [setChatType]);

    const handleRetry = useCallback(() => {
        setIsInitialized(false);
        initializingRef.current = false;
        initializeChat();
    }, [initializeChat]);

    const getConnectionStatusText = () => {
        switch (connectionStatus) {
            case 'connecting': return 'Đang kết nối...';
            case 'connected':
                if (staffStatus.isOnline) {
                    return staffStatus.isTyping ? 'Nhân viên đang nhập...' : 'Trực tuyến';
                }
                return staffStatus.lastSeen ? `Hoạt động ${formatTime(staffStatus.lastSeen)}` : 'Ngoại tuyến';
            case 'error': return 'Lỗi kết nối';
            default: return 'Đang chờ';
        }
    };

    const getStatusColor = () => {
        if (connectionStatus === 'connected' && staffStatus.isOnline) return '#10b981';
        if (connectionStatus === 'connecting') return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className={styles.chatContainer}>
            {/* Header */}
            <div className={styles.chatHeader}>
                <div className={styles.headerInfo}>
                    <div className={styles.avatar}>
                        <MdSupportAgent className={styles.avatarIcon} />
                        <div
                            className={styles.statusDot}
                            style={{ backgroundColor: getStatusColor() }}
                        />
                    </div>
                    <div className={styles.staffDetails}>
                        <div className={styles.staffName}>
                            {staffStatus.assignedTo || 'Hỗ trợ khách hàng'}
                        </div>
                        <div className={styles.statusText}>
                            {getConnectionStatusText()}
                        </div>
                        {roomId && (
                            <div className={styles.roomInfo}>
                                Room #{roomId}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <button
                        className={styles.actionButton}
                        onClick={handleSwitchToChatBot}
                        title="Chuyển sang Chat Bot"
                    >
                        <img src="/images/bot/meow.gif" alt="" />
                    </button>
                    {/* <button className={styles.actionButton} title="Thông tin">
                        <FaInfo />
                    </button>
                    <button className={styles.actionButton} title="Tùy chọn">
                        <BsThreeDotsVertical />
                    </button> */}
                    <button
                        className={styles.closeButton}
                        onClick={() => setShowChat(false)}
                        title="Đóng chat"
                    >
                        <FaTimes />
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div className={styles.messagesContainer}>
                {connectionStatus === 'error' && (
                    <div className={styles.errorBanner}>
                        <p>Không thể kết nối đến hỗ trợ. Vui lòng thử lại.</p>
                        <button
                            className={styles.retryButton}
                            onClick={handleRetry}
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {isLoading && messages.length === 0 ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Đang kết nối với nhân viên hỗ trợ...</p>
                        {roomId && <small>Room ID: {roomId}</small>}
                    </div>
                ) : (
                    <>
                        {messages.length === 0 ? (
                            <div className={styles.welcomeMessage}>
                                <div className={styles.welcomeAvatar}>
                                    <MdSupportAgent />
                                </div>
                                <div className={styles.welcomeContent}>
                                    <h4>Chào mừng bạn đến với hỗ trợ khách hàng! Vui lòng đăng nhập để tiếp tục.
                                    </h4>
                                    <p></p>
                                    <p>Chúng tôi sẽ hỗ trợ bạn trong thời gian sớm nhất. Hãy mô tả vấn đề bạn gặp phải.</p>
                                    {roomId && <small>Room #{roomId} đã được tạo</small>}
                                </div>
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <div
                                    key={message.id || index}
                                    className={`${styles.messageWrapper} ${message.sender_type === 'customer' ? styles.userMessage : styles.staffMessage
                                        } ${message.isTemp ? styles.tempMessage : ''}`}
                                >
                                    {message.sender_type !== 'customer' && (
                                        <div className={styles.messageAvatar}>
                                            <MdSupportAgent />
                                        </div>
                                    )}

                                    <div className={styles.messageContent}>
                                        <div className={styles.messageBubble}>
                                            <div className={styles.messageText}>
                                                {message.message || message.content}
                                            </div>
                                        </div>
                                        <div className={styles.messageFooter}>
                                            <span className={styles.messageTime}>
                                                {formatTime(message.created_at || message.timestamp)}
                                            </span>
                                            {message.sender_type === 'customer' && (
                                                <span className={styles.messageStatus}>
                                                    {message.isTemp ? '⏳' : message.is_read ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {staffStatus.isTyping && (
                            <div className={styles.typingIndicator}>
                                <div className={styles.messageAvatar}>
                                    <MdSupportAgent />
                                </div>
                                <div className={styles.typingBubble}>
                                    <div className={styles.typingDots}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Container */}
            <div className={styles.inputContainer}>
                <div className={styles.inputWrapper}>
                    <textarea
                        ref={inputRef}
                        className={styles.messageInput}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            connectionStatus === 'connected'
                                ? "Nhập tin nhắn..."
                                : connectionStatus === 'connecting'
                                    ? "Đang kết nối..."
                                    : "Không thể kết nối"
                        }
                        disabled={connectionStatus !== 'connected' || isLoading}
                        rows={1}
                        style={{
                            resize: 'none',
                            minHeight: '20px',
                            maxHeight: '100px',
                            overflow: 'auto'
                        }}
                    />
                    <button
                        className={styles.sendButton}
                        onClick={handleSendMessage}
                        disabled={!input.trim() || connectionStatus !== 'connected' || isLoading}
                        title="Gửi tin nhắn"
                    >
                        {isLoading ? (
                            <div className={styles.spinner} />
                        ) : (
                            <IoMdSend />
                        )}
                    </button>
                </div>

                {connectionStatus === 'connected' && (
                    <div className={styles.inputHint}>
                        <small>Enter để gửi, Shift+Enter để xuống dòng</small>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StaffChat;