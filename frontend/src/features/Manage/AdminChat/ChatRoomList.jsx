import React, { useState, useEffect } from 'react';
import {
    FaSearch,
    FaUser,
    FaCircle,
    FaCheckDouble,
    FaCheck,
    FaBell,
    FaBellSlash,
    FaSync,
    FaSyncAlt
} from 'react-icons/fa';
import {
    MdClose,
    MdFilterList,
    MdRefresh,
    MdCached,
    MdRotateRight
} from 'react-icons/md';
import {
    BsThreeDotsVertical,
    BsArrowClockwise,
    BsArrowRepeat
} from 'react-icons/bs';
import {
    HiRefresh,
    HiOutlineRefresh
} from 'react-icons/hi';
import {
    IoRefresh,
    IoRefreshOutline,
    IoReload,
    IoReloadOutline
} from 'react-icons/io5';
import styles from './ChatRoomList.module.scss';

function ChatRoomList({ rooms, selectedRoom, onRoomSelect, error, onRefresh, loading }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.customer_username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || room.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const formatTime = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = (now - date) / (1000 * 60);

        if (diffInMinutes < 1) {
            return 'Vừa xong';
        } else if (diffInMinutes < 60) {
            return `${Math.floor(diffInMinutes)} phút`;
        } else if (diffInMinutes < 24 * 60) {
            return date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (diffInMinutes < 7 * 24 * 60) {
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            return days[date.getDay()];
        } else {
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit'
            });
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'waiting':
                return {
                    text: 'Chờ phản hồi',
                    color: '#ff9800',
                    bgColor: 'rgba(255, 152, 0, 0.1)',
                    textColor: '#ff9800'
                };
            case 'active':
                return {
                    text: 'Đang hoạt động',
                    color: '#4caf50',
                    bgColor: 'rgba(76, 175, 80, 0.1)',
                    textColor: '#4caf50'
                };
            case 'closed':
                return {
                    text: 'Đã đóng',
                    color: '#9e9e9e',
                    bgColor: 'rgba(158, 158, 158, 0.1)',
                    textColor: '#9e9e9e'
                };
            default:
                return {
                    text: 'Không xác định',
                    color: '#757575',
                    bgColor: 'rgba(117, 117, 117, 0.1)',
                    textColor: '#757575'
                };
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const getUnreadCount = (room) => {
        // Giả lập số tin nhắn chưa đọc
        return room.unread_count || 0;
    };

    const getOnlineStatus = (room) => {
        const isOnline = room.is_online || false;
        const minutesOffline = room.minutes_offline || 0;

        let statusText = 'Offline';
        if (isOnline) {
            statusText = 'Đang hoạt động';
        } else if (minutesOffline < 60) {
            statusText = `${minutesOffline} phút trước`;
        } else if (minutesOffline < 24 * 60) {
            const hours = Math.floor(minutesOffline / 60);
            statusText = `${hours} giờ trước`;
        } else {
            const days = Math.floor(minutesOffline / (24 * 60));
            statusText = `${days} ngày trước`;
        }

        return { isOnline, statusText };
    };

    return (
        <div className={styles.chatRoomList}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerMain}>
                    <h1 className={styles.title}>Tin nhắn</h1>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.headerBtn}
                            onClick={() => setShowFilters(!showFilters)}
                            title="Bộ lọc"
                        >
                            <MdFilterList />
                        </button>
                        <button
                            className={`${styles.headerBtn} ${loading ? styles.spinning : ''}`}
                            onClick={onRefresh}
                            title="Làm mới"
                            disabled={loading}
                        >
                            {loading ? (
                                <IoRefresh className={styles.spinningIcon} />
                            ) : (
                                <IoRefreshOutline />
                            )}
                        </button>
                        <button className={styles.headerBtn} title="Thêm tùy chọn">
                            <BsThreeDotsVertical />
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className={styles.quickStats}>
                    <div className={styles.statChip}>
                        <FaCircle className={styles.waitingDot} />
                        <span>{rooms.filter(r => r.status === 'waiting').length} chờ</span>
                    </div>
                    <div className={styles.statChip}>
                        <FaCircle className={styles.activeDot} />
                        <span>{rooms.filter(r => r.status === 'active').length} hoạt động</span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className={styles.searchSection}>
                <div className={styles.searchContainer}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm khách hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchTerm && (
                        <button
                            onClick={clearSearch}
                            className={styles.clearSearch}
                        >
                            <MdClose />
                        </button>
                    )}
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className={styles.filtersRow}>
                        {['all', 'waiting', 'active', 'closed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`${styles.filterChip} ${filterStatus === status ? styles.active : ''}`}
                            >
                                {status === 'all' ? 'Tất cả' :
                                    status === 'waiting' ? 'Chờ' :
                                        status === 'active' ? 'Hoạt động' : 'Đã đóng'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Rooms List */}
            <div className={styles.roomsList}>
                {error ? (
                    <div className={styles.errorState}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <h4>Lỗi tải dữ liệu</h4>
                        <p>{error}</p>
                        <button onClick={onRefresh} className={styles.retryBtn}>
                            Thử lại
                        </button>
                    </div>
                ) : loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Đang tải cuộc trò chuyện...</p>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            {searchTerm ? '🔍' : '💬'}
                        </div>
                        <h4>
                            {searchTerm ? 'Không tìm thấy' : 'Chưa có cuộc trò chuyện'}
                        </h4>
                        <p>
                            {searchTerm
                                ? `Không có kết quả cho "${searchTerm}"`
                                : 'Các cuộc trò chuyện sẽ xuất hiện ở đây'
                            }
                        </p>
                        {searchTerm && (
                            <button onClick={clearSearch} className={styles.clearBtn}>
                                Xóa tìm kiếm
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.roomsContainer}>
                        {filteredRooms.map(room => {
                            const isSelected = selectedRoom?.room_id === room.room_id;
                            const statusInfo = getStatusInfo(room.status);
                            const unreadCount = getUnreadCount(room);
                            const { isOnline, statusText } = getOnlineStatus(room);

                            return (
                                <div
                                    key={room.room_id}
                                    className={`${styles.roomItem} ${isSelected ? styles.selected : ''} ${unreadCount > 0 ? styles.unread : ''}`}
                                    onClick={() => onRoomSelect(room)}
                                >
                                    <div className={styles.avatarSection}>
                                        <div className={styles.avatarContainer}>
                                            {room.customer_avatar ? (
                                                <img
                                                    src={room.customer_avatar}
                                                    alt={room.customer_name}
                                                    className={styles.avatar}
                                                />
                                            ) : (
                                                <div className={styles.avatarPlaceholder}>
                                                    {(room.customer_name || 'K').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {isOnline && (
                                                <div className={styles.onlineIndicator}>
                                                    <FaCircle />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.contentSection}>
                                        <div className={styles.topRow}>
                                            <h4 className={styles.customerName}>
                                                {room.customer_name || 'Khách hàng'}
                                            </h4>
                                            <div className={styles.metaInfo}>
                                                <span className={styles.timeStamp}>
                                                    {formatTime(room.last_message_at || room.created_at)}
                                                </span>
                                                {unreadCount > 0 && (
                                                    <div className={styles.unreadBadge}>
                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.bottomRow}>
                                            <div className={styles.messagePreview}>
                                                {room.last_message ? (
                                                    <span className={styles.lastMessage}>
                                                        {room.last_message}
                                                    </span>
                                                ) : (
                                                    <span className={styles.noMessage}>
                                                        Chưa có tin nhắn
                                                    </span>
                                                )}
                                            </div>

                                            {/* <div className={styles.statusInfo}>
                                                <span className={styles.onlineStatus}>
                                                    {statusText}
                                                </span>
                                            </div> */}
                                        </div>
                                    </div>

                                    {/* Selection indicator */}
                                    {isSelected && (
                                        <div className={styles.selectedIndicator}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatRoomList;