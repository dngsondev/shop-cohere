import React, { useState, useEffect, useRef, useCallback } from 'react';
import chatService from '../../../services/chatService';
import ChatRoomList from './ChatRoomList';
import ChatRoomDetail from './ChatRoomDetail';
import styles from './AdminChat.module.scss';

function AdminChat() {
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isWindowActive, setIsWindowActive] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    const pollingInterval = useRef(null);
    const retryTimeout = useRef(null);
    const pollingEnabled = useRef(true);

    // Window focus/blur detection
    useEffect(() => {
        const handleFocus = () => {
            console.log('🟢 Window focused - resuming admin chat polling');
            setIsWindowActive(true);
        };

        const handleBlur = () => {
            console.log('🟡 Window blurred - pausing admin chat polling');
            setIsWindowActive(false);
        };

        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            console.log(`👁️ Visibility changed: ${isVisible ? 'visible' : 'hidden'}`);
            setIsWindowActive(isVisible);
        };

        // Add event listeners
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Memoized load function
    const loadChatRooms = useCallback(async (showLoading = false) => {
        if (!pollingEnabled.current) return;

        try {
            if (showLoading) setLoading(true);
            setError(null);

            const response = await chatService.getChatRooms();

            if (response.data && response.data.success) {
                const newRooms = response.data.rooms || [];

                // Only update if data actually changed
                setRooms(prevRooms => {
                    if (JSON.stringify(newRooms) !== JSON.stringify(prevRooms)) {
                        console.log('🏠 Chat rooms updated:', newRooms.length);
                        setLastUpdate(new Date().toLocaleTimeString());
                        return newRooms;
                    }
                    return prevRooms;
                });
            } else {
                throw new Error('Không thể tải danh sách phòng chat');
            }
        } catch (error) {
            console.error('❌ Error loading chat rooms:', error);
            setError(error.message);

            // Retry with exponential backoff
            if (retryTimeout.current) clearTimeout(retryTimeout.current);
            retryTimeout.current = setTimeout(() => {
                if (isWindowActive && pollingEnabled.current) {
                    console.log('🔄 Retrying to load chat rooms...');
                    loadChatRooms();
                }
            }, 5000);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [isWindowActive]);

    // Smart polling logic
    useEffect(() => {
        // Initial load
        loadChatRooms(true);

        return () => {
            pollingEnabled.current = false;
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
            if (retryTimeout.current) {
                clearTimeout(retryTimeout.current);
            }
        };
    }, [loadChatRooms]);

    // Control polling based on window state and room activity
    useEffect(() => {
        const shouldPoll = isWindowActive && rooms.length >= 0; // Always poll when window is active
        const hasActiveRooms = rooms.some(room =>
            room.status === 'active' ||
            room.status === 'pending' ||
            room.status === 'waiting'
        );

        if (shouldPoll) {
            // More frequent polling if there are active rooms
            const pollInterval = hasActiveRooms ? 3000 : 10000; // 3s vs 10s

            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }

            pollingInterval.current = setInterval(() => {
                if (isWindowActive && pollingEnabled.current) {
                    loadChatRooms();
                }
            }, pollInterval);

            console.log(`🔄 Started polling every ${pollInterval / 1000}s (Active rooms: ${hasActiveRooms})`);
        } else {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = null;
                console.log('⏸️ Stopped polling - window inactive');
            }
        }

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = null;
            }
        };
    }, [isWindowActive, rooms.length, loadChatRooms]);

    const handleRoomSelect = useCallback((room) => {
        console.log('🎯 Selected room:', room.room_id || room.id);
        setSelectedRoom(room);
    }, []);

    const handleRoomUpdate = useCallback((updatedRoom) => {
        console.log('📝 Room updated:', updatedRoom.room_id);

        setRooms(prevRooms =>
            prevRooms.map(room =>
                room.room_id === updatedRoom.room_id
                    ? { ...room, ...updatedRoom }
                    : room
            )
        );

        if (selectedRoom && selectedRoom.room_id === updatedRoom.room_id) {
            setSelectedRoom(prev => ({ ...prev, ...updatedRoom }));
        }
    }, [selectedRoom]);

    const handleTakeRoom = useCallback(async (roomId) => {
        try {
            console.log('👤 Taking room:', roomId);
            const adminId = 1; // Get from auth context in real app

            await chatService.takeRoom(roomId, { adminId });

            // Immediate refresh after taking room
            await loadChatRooms();

            // Update selected room if it's the one being taken
            if (selectedRoom && selectedRoom.room_id === roomId) {
                const updatedRoom = rooms.find(r => r.room_id === roomId);
                if (updatedRoom) {
                    setSelectedRoom({ ...updatedRoom, admin_id: adminId });
                }
            }

            console.log('✅ Successfully took room:', roomId);
        } catch (error) {
            console.error('❌ Error taking room:', error);
            alert('Không thể nhận phòng chat này. Vui lòng thử lại.');
        }
    }, [selectedRoom, rooms, loadChatRooms]);

    const handleCloseRoom = useCallback(async (roomId) => {
        if (!window.confirm('Bạn có chắc chắn muốn đóng phòng chat này?')) {
            return;
        }

        try {
            console.log('🔒 Closing room:', roomId);
            await chatService.closeRoom(roomId);

            // Immediate refresh after closing room
            await loadChatRooms();

            // Clear selection if the closed room was selected
            if (selectedRoom && selectedRoom.room_id === roomId) {
                setSelectedRoom(null);
                console.log('🗑️ Cleared selected room after closing');
            }

            console.log('✅ Successfully closed room:', roomId);
        } catch (error) {
            console.error('❌ Error closing room:', error);
            alert('Không thể đóng phòng chat này. Vui lòng thử lại.');
        }
    }, [selectedRoom, loadChatRooms]);

    const handleRefresh = useCallback(async () => {
        console.log('🔄 Manual refresh triggered');
        await loadChatRooms(true);
    }, [loadChatRooms]);

    // Loading state
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Đang tải danh sách chat...</p>
            </div>
        );
    }

    // Get statistics for active rooms
    const activeRoomsCount = rooms.filter(r => r.status === 'active').length;
    const pendingRoomsCount = rooms.filter(r => r.status === 'pending' || r.status === 'waiting').length;

    return (
        <div className={styles.adminChatContainer}>
            {/* Debug info in development */}
            {/* {process.env.NODE_ENV === 'development' && (
                <div className="fixed top-4 right-4 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs z-50 space-y-1">
                    <div className="font-bold text-blue-300">🛠️ Admin Chat Debug</div>
                    <div>Window Active: {isWindowActive ? '✅' : '❌'}</div>
                    <div>Polling: {pollingInterval.current ? '🔄' : '⏸️'}</div>
                    <div>Total Rooms: {rooms.length}</div>
                    <div>Active: {activeRoomsCount} | Pending: {pendingRoomsCount}</div>
                    {lastUpdate && <div>Last Update: {lastUpdate}</div>}
                </div>
            )} */}

            {/* Sidebar với danh sách phòng chat */}
            <div className={styles.chatSidebar}>
                <ChatRoomList
                    rooms={rooms}
                    selectedRoom={selectedRoom}
                    onRoomSelect={handleRoomSelect}
                    onTakeRoom={handleTakeRoom}
                    onCloseRoom={handleCloseRoom}
                    error={error}
                    onRefresh={handleRefresh}
                />
            </div>

            {/* Nội dung chat chính */}
            <div className={styles.chatContent}>
                {selectedRoom ? (
                    <ChatRoomDetail
                        room={selectedRoom}
                        onRoomUpdate={handleRoomUpdate}
                    />
                ) : (
                    <div className={styles.emptyChatState}>
                        <div className={styles.emptyIcon}>💬</div>
                        <h3>Chọn một phòng chat để bắt đầu</h3>
                        <p>Danh sách các cuộc trò chuyện với khách hàng sẽ hiển thị bên trái</p>

                        {/* Quick stats */}
                        {/* {rooms.length > 0 && (
                            <div className="mt-6 flex justify-center space-x-6 text-sm text-gray-500">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{activeRoomsCount}</div>
                                    <div>Đang hoạt động</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{pendingRoomsCount}</div>
                                    <div>Chờ xử lý</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{rooms.length}</div>
                                    <div>Tổng cộng</div>
                                </div>
                            </div>
                        )} */}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminChat;