import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import authService from '../../services/authService';

import MySideBar from './MySideBar';
import ProfileSummary from './ProfileSummary';
import DeliveryInfoList from '../../components/EditDeliveryModal/DeliveryInfoList';
import PrivacySettings from './PrivacySettings';
import OrderHistory from './OrderHistory';
import ChangePassword from './ChangePassword';

export default function ProfilePage() {
    const [user, setUser] = useState(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {});
    const [selectedMenu, setSelectedMenu] = useState('profile');
    const location = useLocation();

    // Xác định menu được chọn dựa trên URL
    useEffect(() => {
        const path = location.pathname;
        console.log('Current path:', path); // Debug log

        if (path.includes('/password')) {
            setSelectedMenu('password');
        } else if (path.includes('/address')) {
            setSelectedMenu('address');
        } else if (path.includes('/privacy')) {
            setSelectedMenu('privacy');
        } else if (path.includes('/orders')) {
            setSelectedMenu('orders');
        } else if (path.includes('/voucher')) {
            setSelectedMenu('voucher');
        } else {
            setSelectedMenu('profile');
        }
    }, [location.pathname]);

    // Debug log để kiểm tra selectedMenu
    useEffect(() => {
        console.log('Selected menu:', selectedMenu);
    }, [selectedMenu]);

    // Hàm fetch lại user từ server
    const fetchUser = async () => {
        try {
            const currentUser = authService.getCurrentUser();
            if (currentUser && currentUser.id) {
                const response = await authService.getLastestUser(currentUser.id);
                if (response.data.success) {
                    const updatedUser = response.data.user;
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    // Hàm xử lý khi delivery list thay đổi
    const handleDeliveryChange = async () => {
        try {
            await fetchUser();
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                const response = await authService.getLastestUser(currentUser.id);
                if (response.data.success) {
                    const updatedUser = response.data.user;
                    setUser(updatedUser);
                    authService.setCurrentUser(updatedUser);
                }
            }
        } catch (error) {
            console.error("Error refreshing user data:", error);
        }
    };

    // Hàm lưu thông tin người dùng
    const handleSave = async (updatedUser) => {
        try {
            const response = await authService.updateUser(user.id, updatedUser);
            if (response.data.success) {
                await fetchUser();
                return { success: true };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error("Error updating user:", error);
            return { success: false, message: "Có lỗi xảy ra khi cập nhật thông tin" };
        }
    };

    // Render content dựa trên menu được chọn
    let content = null;
    switch (selectedMenu) {
        case 'address':
            content = <DeliveryInfoList onChange={handleDeliveryChange} />;
            break;
        case 'profile':
            content = <ProfileSummary user={user} onSave={handleSave} />;
            break;
        case 'bank':
            content = <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Ngân hàng</h2>
                <p className="text-gray-500">Tính năng đang phát triển</p>
            </div>;
            break;
        case 'password':
            content = <ChangePassword />;
            break;
        case 'privacy':
            content = <PrivacySettings user={user} />;
            break;
        case 'orders':
            content = <OrderHistory />;
            break;
        case 'voucher':
            content = <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Kho voucher</h2>
                <p className="text-gray-500">Tính năng đang phát triển</p>
            </div>;
            break;
        default:
            content = <ProfileSummary user={user} onSave={handleSave} />;
    }

    return (
        <div className="flex min-h-[80vh] bg-[#f5f6fa] py-10 px-0 justify-center">
            <div className="w-[300px] flex-shrink-0 flex justify-end">
                <MySideBar />
            </div>
            <div className="flex-1 flex justify-center">
                <div className="w-full max-w-3xl">
                    {content}
                </div>
            </div>
        </div>
    );
}