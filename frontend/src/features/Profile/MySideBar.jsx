import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaMapMarkerAlt, FaLock, FaShieldAlt, FaShoppingBag, FaSignOutAlt, FaChevronDown, FaEdit } from 'react-icons/fa';
import authService from '../../services/authService';

import { getFullImageUrl } from '../../utils/imageUtils';

const menu = [
    {
        label: 'Tài khoản của tôi',
        icon: FaUser,
        subs: [
            { label: 'Hồ sơ', to: '/profile', icon: FaUser },
            { label: 'Địa chỉ', to: '/profile/address', icon: FaMapMarkerAlt },
            { label: 'Đổi mật khẩu', to: '/profile/password', icon: FaLock },
            { label: 'Thiết lập riêng tư', to: '/profile/privacy', icon: FaShieldAlt },
        ]
    },
    { label: 'Đơn đã mua', to: '/profile/orders', icon: FaShoppingBag },
];

function isActive(path, current) {
    if (current === path) {
        return true;
    }

    if (path === '/profile') {
        return current === '/profile';
    }

    return current.startsWith(path);
}

function MySideBar() {
    const [user, setUser] = useState(null);
    const [expandedSections, setExpandedSections] = useState({ 0: true }); // Mặc định expand section đầu tiên
    const location = useLocation();

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
    }, []);

    const toggleSection = (index) => {
        setExpandedSections(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            authService.logout();
        }
    };

    return (
        <div className="w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* User Profile Header */}
            <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-6">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative z-10 flex flex-col items-center text-white">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            {user?.avatar ? (
                                <img
                                    src={getFullImageUrl(user.avatar)}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-white text-2xl font-bold">
                                    {(user?.fullname || user?.username || 'U').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-center">
                        {user?.fullname || user?.username || 'Người dùng'}
                    </h3>
                    <p className="text-sm text-white/80 mt-1">
                        {user?.email || 'Chưa có email'}
                    </p>
                    <Link
                        to="/profile"
                        className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs transition-all duration-200 flex items-center gap-1"
                    >
                        <FaEdit className="w-3 h-3" />
                        Chỉnh sửa
                    </Link>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="p-4">
                <nav className="space-y-2">
                    {menu.map((item, index) => (
                        <div key={index} className="group">
                            {item.subs ? (
                                <div>
                                    <button
                                        onClick={() => toggleSection(index)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 group-hover:shadow-sm"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                                <item.icon className="w-4 h-4 text-gray-600 group-hover:text-purple-600" />
                                            </div>
                                            <span className="font-medium text-sm">{item.label}</span>
                                        </div>
                                        <FaChevronDown
                                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedSections[index] ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    {/* Submenu with smooth animation */}
                                    <div className={`overflow-hidden transition-all duration-300 ${expandedSections[index] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                        }`}>
                                        <ul className="mt-2 ml-6 space-y-1 border-l-2 border-gray-100 pl-4">
                                            {item.subs.map((sub, subIndex) => {
                                                const active = isActive(sub.to, location.pathname);

                                                return (
                                                    <li key={subIndex}>
                                                        <Link
                                                            to={sub.to}
                                                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${active
                                                                ? 'bg-purple-50 text-purple-700 font-medium shadow-sm border-l-3 border-purple-500'
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                }`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${active
                                                                ? 'bg-purple-100'
                                                                : 'bg-gray-100 group-hover:bg-gray-200'
                                                                }`}>
                                                                <sub.icon className={`w-3 h-3 ${active ? 'text-purple-600' : 'text-gray-500'
                                                                    }`} />
                                                            </div>
                                                            <span className="flex-1">{sub.label}</span>
                                                            {active && (
                                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                            )}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    to={item.to}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${isActive(item.to, location.pathname)
                                        ? 'bg-purple-50 text-purple-700 font-medium shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive(item.to, location.pathname)
                                        ? 'bg-purple-100'
                                        : 'bg-gray-100 group-hover:bg-purple-100'
                                        }`}>
                                        <item.icon className={`w-4 h-4 ${isActive(item.to, location.pathname)
                                            ? 'text-purple-600'
                                            : 'text-gray-600 group-hover:text-purple-600'
                                            }`} />
                                    </div>
                                    <span className="flex-1">{item.label}</span>
                                    {isActive(item.to, location.pathname) && (
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    )}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                    >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <FaSignOutAlt className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="font-medium text-sm">Đăng xuất</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="text-center text-xs text-gray-400">
                        <p>© 2025 DNGSON</p>
                        <p className="mt-1">Phiên bản 1.0.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MySideBar;