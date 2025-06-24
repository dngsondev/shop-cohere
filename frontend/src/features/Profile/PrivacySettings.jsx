import React, { useState } from 'react';

export default function PrivacySettings({ user }) {
    const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFAEnabled || false);
    const [loading, setLoading] = useState(false);

    const handleToggle2FA = async () => {
        setLoading(true);
        // Gọi API bật/tắt 2FA ở đây
        setTwoFAEnabled(!twoFAEnabled);
        setLoading(false);
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác!')) {
            setLoading(true);
            // Gọi API xóa tài khoản ở đây
            setLoading(false);
            // Đăng xuất hoặc chuyển hướng về trang chủ
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-8 mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Thiết lập quyền riêng tư</h2>
            <div className="flex items-center ">
                <label className="flex items-center cursor-pointer">
                    <span className="mr-3 text-lg font-medium text-gray-700">Bật xác thực 2 lớp (2FA)</span>
                    <input
                        type="checkbox"
                        checked={twoFAEnabled}
                        onChange={handleToggle2FA}
                        disabled={loading}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 transition-all duration-300 relative">
                        <div className={`absolute top-0.5 left-1 ${twoFAEnabled ? 'translate-x-5' : ''} w-5 h-5 bg-white rounded-full shadow transition-transform duration-300`}></div>
                    </div>
                </label>
            </div>
            <p className="text-sm text-gray-500 mb-8 ml-0.25">Tăng bảo mật cho tài khoản của bạn.</p>
            <div className="mb-2">
                <button
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-semibold shadow transition-all duration-200"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                >
                    Xóa tài khoản
                </button>
                <p className="text-sm text-gray-500 mt-3 ml-1">Yêu cầu xóa vĩnh viễn tài khoản và toàn bộ dữ liệu cá nhân.</p>
            </div>
        </div>
    );
}