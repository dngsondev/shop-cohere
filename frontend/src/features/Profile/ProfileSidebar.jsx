import React from 'react';
import { getFullImageUrl } from '../../utils/imageUtils';

const menu = [
    { label: 'Hồ sơ', key: 'profile' },
    { label: 'Ngân hàng', key: 'bank' },
    { label: 'Địa chỉ', key: 'address' },
    { label: 'Đổi mật khẩu', key: 'password' },
    { label: 'Thiết lập riêng tư', key: 'privacy' },
    { label: 'Đơn đã mua', key: 'orders' },
    { label: 'Kho voucher', key: 'voucher' },
];

export default function ProfileSidebar({ selected, onSelect }) {
    return (
        <div className="w-64 bg-white rounded-lg shadow p-6">
            <div className="flex flex-col items-center mb-6">
                <img
                    src="/images/avatar/avatar-default.png"
                    alt="Avatar"
                    className="w-20 h-20 rounded-full mb-3 object-cover"
                />
                <h3 className="text-lg font-semibold">Người dùng</h3>
            </div>
            <ul className="space-y-2">
                {menu.map(item => (
                    <li
                        key={item.key}
                        className={`cursor-pointer px-4 py-2 rounded ${selected === item.key ? 'bg-purple-100 font-bold' : 'hover:bg-gray-100'}`}
                        onClick={() => onSelect(item.key)}
                    >
                        {item.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}