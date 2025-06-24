import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaLock, FaCheck } from 'react-icons/fa';
import authService from '../../services/authService';

export default function ChangePassword() {
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        // Xóa lỗi khi người dùng bắt đầu nhập
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.currentPassword) {
            newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
        }

        if (!form.newPassword) {
            newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else if (form.newPassword.length < 8) {
            newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword)) {
            newErrors.newPassword = 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt';
        }

        if (!form.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
        } else if (form.newPassword !== form.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword) {
            newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                alert('Không tìm thấy thông tin người dùng');
                return;
            }

            const response = await authService.changePassword(currentUser.id, {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
                confirmPassword: form.confirmPassword
            });

            if (response.data && response.data.success) {
                alert('Đổi mật khẩu thành công!');
                // Reset form
                setForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setShowPasswords({
                    current: false,
                    new: false,
                    confirm: false
                });
            } else {
                throw new Error(response.data?.message || 'Đổi mật khẩu thất bại');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi đổi mật khẩu';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(form.newPassword);
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const strengthLabels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
                <FaLock className="text-2xl text-purple-600 mr-3" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Đổi mật khẩu</h2>
                    <p className="text-gray-500">Cập nhật mật khẩu để bảo mật tài khoản của bạn</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Mật khẩu hiện tại */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.current ? "text" : "password"}
                            name="currentPassword"
                            value={form.currentPassword}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Nhập mật khẩu hiện tại"
                        />
                        <button
                            type="button"
                            onClick={() => toggleShowPassword('current')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    {errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                    )}
                </div>

                {/* Mật khẩu mới */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.new ? "text" : "password"}
                            name="newPassword"
                            value={form.newPassword}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Nhập mật khẩu mới"
                        />
                        <button
                            type="button"
                            onClick={() => toggleShowPassword('new')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    {errors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                    )}

                    {/* Password strength indicator */}
                    {form.newPassword && (
                        <div className="mt-2">
                            <div className="flex space-x-1 mb-2">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-2 w-full rounded ${level <= passwordStrength
                                                ? strengthColors[passwordStrength - 1]
                                                : 'bg-gray-200'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-600">
                                Độ mạnh: <span className={`font-medium ${passwordStrength >= 3 ? 'text-green-600' : 'text-orange-600'}`}>
                                    {strengthLabels[passwordStrength - 1] || 'Rất yếu'}
                                </span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Xác nhận mật khẩu */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.confirm ? "text" : "password"}
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Nhập lại mật khẩu mới"
                        />
                        <button
                            type="button"
                            onClick={() => toggleShowPassword('confirm')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                    {form.confirmPassword && form.newPassword === form.confirmPassword && (
                        <div className="mt-1 flex items-center text-green-600">
                            <FaCheck className="mr-1 text-xs" />
                            <span className="text-sm">Mật khẩu khớp</span>
                        </div>
                    )}
                </div>

                {/* Ghi chú bảo mật */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Lưu ý bảo mật:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Mật khẩu phải có ít nhất 8 ký tự</li>
                        <li>• Nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                        <li>• Không sử dụng thông tin cá nhân dễ đoán</li>
                        <li>• Thay đổi mật khẩu định kỳ để tăng cường bảo mật</li>
                    </ul>
                </div>

                {/* Submit button */}
                <div className="flex justify-center pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-8 py-3 text-white font-semibold rounded-lg shadow-md transition-all duration-200 ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Đang cập nhật...
                            </div>
                        ) : (
                            'Đổi mật khẩu'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}