import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaHome, FaComments, FaShoppingCart, FaBox, FaUsers, FaRobot,
    FaCog, FaStar, FaTicketAlt, FaChevronDown, FaChevronLeft,
    FaChevronRight, FaSignOutAlt, FaArtstation
} from 'react-icons/fa';
import adminService from '../../../services/adminService';

// Import CSS styles
import styles from './Sidebar.module.scss';

function Sidebar() {
    const [openDropdown, setOpenDropdown] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Lấy thông tin user từ localStorage
    useEffect(() => {
        const admin = adminService.getCurrentAdmin();
        if (admin) {
            setUserInfo(admin);
        }
    }, []);

    const isActive = (path) => location.pathname === path;
    const isDropdownActive = () => {
        return location.pathname === '/admin/review-reply' ||
            location.pathname === '/admin/voucher';
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
        if (!isCollapsed) {
            setOpenDropdown(false);
        }
    };

    // Lấy thông tin admin và quyền
    const currentAdmin = adminService.getCurrentAdmin();
    const isSuperAdmin = adminService.isSuperAdmin();
    const isStaff = adminService.isStaff();

    // Cập nhật menuItems dựa trên quyền
    const menuItems = [
        {
            path: '/admin',
            icon: FaHome,
            label: 'Trang chủ',
            exact: true
        },
        {
            path: '/admin/chat',
            icon: FaComments,
            label: 'Chat với khách hàng'
        },
        {
            path: '/admin/orders',
            icon: FaShoppingCart,
            label: 'Đơn hàng'
        },
        {
            path: '/admin/products',
            icon: FaBox,
            label: 'Sản phẩm'
        },
        // CHỈ hiển thị cho Super Admin (role = 0)
        ...(isSuperAdmin ? [{
            path: '/admin/users',
            icon: FaUsers,
            label: 'Người dùng'
        }] : []),
        // CHỈ hiển thị cho Super Admin (role = 0)
        ...(isSuperAdmin ? [{
            path: '/admin/bot',
            icon: FaRobot,
            label: 'Lệnh với AI'
        }] : [])
    ];

    // Cập nhật dropdownItems dựa trên quyền
    const dropdownItems = [
        {
            path: '/admin/review-reply',
            icon: FaStar,
            label: 'Trả lời đánh giá'
        },
        {
            path: '/admin/collections',
            icon: FaArtstation,
            label: 'Quản lí Collections'
        },
        // CHỈ hiển thị cho Super Admin (role = 0)
        ...(isSuperAdmin ? [{
            path: '/admin/voucher',
            icon: FaTicketAlt,
            label: 'Quản lý voucher'
        }] : [])
    ];

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            await adminService.logout();
        } catch (error) {
            console.error('Error during logout:', error);
            // Vẫn chuyển hướng dù có lỗi
            window.location.href = '/';
        } finally {
            setShowLogoutConfirm(false);
        }
    };

    const handleLogoutCancel = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <div className={`relative h-full bg-white shadow-lg transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
                }`}>
                {/* Gradient Border */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200"></div>

                {/* Header */}
                <div className={`px-6 py-6 border-b border-gray-100 ${isCollapsed ? 'px-3 py-4' : ''}`}>
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-lg">
                                    {currentAdmin?.username?.charAt(0)?.toUpperCase() || 'A'}
                                </span>
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-lg font-bold text-gray-800 truncate">
                                        {currentAdmin?.fullname || 'Admin'}
                                    </h1>
                                    <p className="text-sm text-gray-500 truncate">
                                        {isSuperAdmin ? 'Quản trị viên' : 'Nhân viên'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={toggleSidebar}
                            className={`
                                group relative flex items-center justify-center w-8 h-8 
                                rounded-lg border border-gray-200 bg-white hover:bg-gray-50 
                                hover:border-gray-300 transition-all duration-200 
                                hover:shadow-md active:scale-95
                                ${isCollapsed ? 'mx-auto mt-2' : ''}
                            `}
                            title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                        >
                            <div className="relative overflow-hidden w-4 h-4">
                                <FaChevronLeft
                                    className={`
                                        absolute inset-0 w-3 h-3 text-gray-600 group-hover:text-gray-800 
                                        transition-all duration-300 transform
                                        ${isCollapsed ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'}
                                    `}
                                />
                                <FaChevronRight
                                    className={`
                                        absolute inset-0 w-3 h-3 text-gray-600 group-hover:text-gray-800 
                                        transition-all duration-300 transform
                                        ${isCollapsed ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}
                                    `}
                                />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className={`px-4 py-6 ${isCollapsed ? 'px-2' : ''}`}>
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = item.exact ?
                                location.pathname === item.path :
                                isActive(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                                        group flex items-center gap-3 px-3 py-2.5 rounded-xl 
                                        transition-all duration-200 relative overflow-hidden
                                        ${active
                                            ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                        ${isCollapsed ? 'justify-center px-2' : ''}
                                    `}
                                >
                                    {/* Active indicator */}
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
                                    )}

                                    <Icon className={`
                                        w-5 h-5 flex-shrink-0 transition-colors duration-200
                                        ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
                                    `} />

                                    {!isCollapsed && (
                                        <span className="font-medium truncate transition-colors duration-200">
                                            {item.label}
                                        </span>
                                    )}

                                    {/* Tooltip khi collapsed */}
                                    {isCollapsed && (
                                        <div className="
                                            absolute left-full ml-3 px-3 py-2 
                                            bg-gray-900 text-white text-sm rounded-lg 
                                            opacity-0 group-hover:opacity-100 
                                            transition-all duration-200 pointer-events-none 
                                            whitespace-nowrap z-50 shadow-lg
                                            before:content-[''] before:absolute before:right-full before:top-1/2 
                                            before:-translate-y-1/2 before:border-4 before:border-transparent 
                                            before:border-r-gray-900
                                        ">
                                            {item.label}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Dropdown Menu - Ẩn khi collapsed */}
                        {!isCollapsed && dropdownItems.length > 0 && (
                            <div className="relative">
                                <div
                                    className={`
                                        group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl 
                                        cursor-pointer transition-all duration-200
                                        ${isDropdownActive() || openDropdown
                                            ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                    `}
                                    onClick={() => setOpenDropdown((prev) => !prev)}
                                >
                                    <div className="flex items-center gap-3">
                                        <FaCog className={`
                                            w-5 h-5 transition-all duration-200
                                            ${isDropdownActive() || openDropdown ? 'text-blue-600 rotate-90' : 'text-gray-400 group-hover:text-gray-600'}
                                        `} />
                                        <span className="font-medium">Các tính năng khác</span>
                                    </div>
                                    <div className={`transition-transform duration-200 ${openDropdown ? 'rotate-180' : ''}`}>
                                        <FaChevronDown className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Dropdown Items */}
                                <div className={`
                                    overflow-hidden transition-all duration-300 ease-in-out
                                    ${openDropdown ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
                                `}>
                                    <div className="mt-2 ml-6 space-y-1 border-l-2 border-gray-100 pl-4">
                                        {dropdownItems.map((item, index) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.path);

                                            return (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    className={`
                                                        group flex items-center gap-3 px-3 py-2 rounded-lg 
                                                        transition-all duration-200 relative
                                                        ${active
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        }
                                                    `}
                                                    style={{
                                                        transitionDelay: openDropdown ? `${index * 50}ms` : '0ms'
                                                    }}
                                                >
                                                    <Icon className={`
                                                        w-4 h-4 transition-colors duration-200
                                                        ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
                                                    `} />
                                                    <span className="text-sm font-medium">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dropdown items dạng icon khi collapsed */}
                        {isCollapsed && dropdownItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                                        group flex items-center justify-center px-2 py-2.5 rounded-xl 
                                        transition-all duration-200 relative
                                        ${active
                                            ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
                                    )}
                                    <Icon className={`
                                        w-5 h-5 transition-colors duration-200
                                        ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
                                    `} />
                                    <div className="
                                        absolute left-full ml-3 px-3 py-2 
                                        bg-gray-900 text-white text-sm rounded-lg 
                                        opacity-0 group-hover:opacity-100 
                                        transition-all duration-200 pointer-events-none 
                                        whitespace-nowrap z-50 shadow-lg
                                        before:content-[''] before:absolute before:right-full before:top-1/2 
                                        before:-translate-y-1/2 before:border-4 before:border-transparent 
                                        before:border-r-gray-900
                                    ">
                                        {item.label}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer section */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Logout Button */}
                    <div className="mb-4">
                        <button
                            onClick={handleLogoutClick}
                            className={`
                                group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl 
                                text-red-600 hover:bg-red-50 hover:text-red-700
                                transition-all duration-200 border border-red-200 hover:border-red-300
                                ${isCollapsed ? 'justify-center px-2' : ''}
                            `}
                        >
                            <FaSignOutAlt className="w-5 h-5 flex-shrink-0" />

                            {!isCollapsed && (
                                <span className="font-medium">Đăng xuất</span>
                            )}

                            {/* Tooltip khi collapsed */}
                            {isCollapsed && (
                                <div className="
                                    absolute left-full ml-3 px-3 py-2 
                                    bg-gray-900 text-white text-sm rounded-lg 
                                    opacity-0 group-hover:opacity-100 
                                    transition-all duration-200 pointer-events-none 
                                    whitespace-nowrap z-50 shadow-lg
                                    before:content-[''] before:absolute before:right-full before:top-1/2 
                                    before:-translate-y-1/2 before:border-4 before:border-transparent 
                                    before:border-r-gray-900
                                ">
                                    Đăng xuất
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Support card - chỉ hiện khi không collapsed */}
                    {!isCollapsed && (
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold">💡</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold mb-1">Cần hỗ trợ?</h3>
                                    <p className="text-xs text-blue-100 mb-3 leading-relaxed">
                                        Liên hệ đội ngũ kỹ thuật để được hỗ trợ nhanh chóng
                                    </p>
                                    <button className="bg-white text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                                        Liên hệ ngay
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className={styles.modalOverlay} onClick={handleLogoutCancel}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Xác nhận đăng xuất</h3>
                        </div>
                        <div className={styles.modalBody}>
                            <p>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                onClick={handleLogoutCancel}
                                className={styles.cancelButton}
                                type="button"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                className={styles.confirmButton}
                                type="button"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;