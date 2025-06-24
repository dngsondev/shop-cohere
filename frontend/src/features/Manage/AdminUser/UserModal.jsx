import React, { useState, useEffect } from 'react';

function UserModal({ user, type, onClose, onSave }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullname: '',
        gender: '',
        birthDay: '',
        birthMonth: '',
        birthYear: '',
        status: 1,
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && (type === 'view' || type === 'edit')) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                fullname: user.fullname || '',
                gender: user.gender !== null ? user.gender.toString() : '',
                birthDay: user.birthDay || '',
                birthMonth: user.birthMonth || '',
                birthYear: user.birthYear || '',
                status: user.status || 1,
                password: '',
                confirmPassword: ''
            });
        }
    }, [user, type]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (type === 'view') {
            onClose();
            return;
        }

        // Validation
        if (!formData.username.trim() || !formData.email.trim() || !formData.fullname.trim()) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (type === 'create' && (!formData.password || !formData.confirmPassword)) {
            alert('Vui lòng nhập mật khẩu');
            return;
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            alert('Mật khẩu xác nhận không khớp');
            return;
        }

        // Validate birth date
        if (formData.birthDay || formData.birthMonth || formData.birthYear) {
            if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
                alert('Vui lòng điền đầy đủ ngày sinh hoặc để trống tất cả');
                return;
            }
        }

        setLoading(true);

        try {
            const dataToSave = { ...formData };

            // Convert gender to number
            if (dataToSave.gender !== '') {
                dataToSave.gender = parseInt(dataToSave.gender);
            } else {
                dataToSave.gender = null;
            }

            // Convert birth date to numbers
            if (dataToSave.birthDay) {
                dataToSave.birthDay = parseInt(dataToSave.birthDay);
            }
            if (dataToSave.birthMonth) {
                dataToSave.birthMonth = parseInt(dataToSave.birthMonth);
            }
            if (dataToSave.birthYear) {
                dataToSave.birthYear = parseInt(dataToSave.birthYear);
            }

            // Remove confirm password
            delete dataToSave.confirmPassword;

            // Don't send empty password for edit
            if (type === 'edit' && !dataToSave.password) {
                delete dataToSave.password;
            }

            await onSave(dataToSave);
        } catch (error) {
            console.error('Error saving user:', error);
        } finally {
            setLoading(false);
        }
    };

    const isReadOnly = type === 'view';
    const title = type === 'create' ? 'Thêm người dùng mới' :
        type === 'edit' ? 'Chỉnh sửa người dùng' : 'Chi tiết người dùng';

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                required
                            />
                        </div>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="fullname"
                            value={formData.fullname}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Giới tính
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Chọn giới tính</option>
                                <option value="1">Nam</option>
                                <option value="0">Nữ</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trạng thái
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value={1}>Hoạt động</option>
                                <option value={0}>Vô hiệu hóa</option>
                            </select>
                        </div>
                    </div>

                    {/* Birth Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày sinh
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <select
                                name="birthDay"
                                value={formData.birthDay}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Ngày</option>
                                {Array.from({ length: 31 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                            </select>
                            <select
                                name="birthMonth"
                                value={formData.birthMonth}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Tháng</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                ))}
                            </select>
                            <select
                                name="birthYear"
                                value={formData.birthYear}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Năm</option>
                                {Array.from({ length: 100 }, (_, i) => {
                                    const year = new Date().getFullYear() - i;
                                    return <option key={year} value={year}>{year}</option>;
                                })}
                            </select>
                        </div>
                    </div>

                    {/* Password fields for create/edit */}
                    {type !== 'view' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {type === 'create' ? 'Mật khẩu' : 'Mật khẩu mới'} {type === 'create' && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required={type === 'create'}
                                />
                                {type === 'edit' && (
                                    <p className="text-xs text-gray-500 mt-1">Để trống nếu không muốn thay đổi</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Xác nhận mật khẩu {type === 'create' && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required={type === 'create'}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            {type === 'view' ? 'Đóng' : 'Hủy'}
                        </button>
                        {type !== 'view' && (
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UserModal;