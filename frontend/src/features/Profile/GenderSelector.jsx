import React from 'react';

export default function GenderSelector({ value, onChange }) {
    return (
        <div className="flex gap-6">
            <label className="flex items-center cursor-pointer">
                <input
                    type="radio"
                    name="gender"
                    value="1"
                    checked={value === 1 || value === '1'}
                    onChange={onChange}
                    className="mr-2 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-gray-700">Nam</span>
            </label>
            <label className="flex items-center cursor-pointer">
                <input
                    type="radio"
                    name="gender"
                    value="2"
                    checked={value === 2 || value === '2'}
                    onChange={onChange}
                    className="mr-2 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-gray-700">Nữ</span>
            </label>
            <label className="flex items-center cursor-pointer">
                <input
                    type="radio"
                    name="gender"
                    value="0"
                    checked={value === 0 || value === '0'}
                    onChange={onChange}
                    className="mr-2 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-gray-700">Khác</span>
            </label>
        </div>
    );
}