import React, { useState } from 'react';
import { FaCamera, FaUpload } from 'react-icons/fa';
import GenderSelector from './GenderSelector';
import authService from '../../services/authService';
import { getFullImageUrl } from '../../utils/imageUtils';

export default function ProfileSummary({ user, onSave }) {
    const [form, setForm] = useState({
        ...user,
        birthDay: user.birthDay || '',
        birthMonth: user.birthMonth || '',
        birthYear: user.birthYear || '',
        gender: user.gender || ''
    });
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleGenderChange = e => setForm(prev => ({ ...prev, gender: e.target.value }));


    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Kiểm tra kích thước file (2MB = 2 * 1024 * 1024 bytes)
        if (file.size > 2 * 1024 * 1024) {
            alert('Kích thước file không được vượt quá 2MB');
            return;
        }

        // Kiểm tra định dạng file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Chỉ chấp nhận file định dạng JPEG, PNG, JPG, WEBP');
            return;
        }

        setUploadingAvatar(true);

        try {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const base64Image = ev.target.result;

                // Cập nhật avatar trong form để preview
                setForm(prev => ({ ...prev, avatar: base64Image }));

                // Lưu avatar ngay lập tức
                const currentUser = authService.getCurrentUser();
                if (currentUser && currentUser.id) {
                    try {
                        const response = await authService.updateUser(currentUser.id, {
                            avatar: base64Image
                        });

                        if (response.data && response.data.success) {
                            // Cập nhật localStorage với đường dẫn file mới từ server
                            const updatedUser = {
                                ...currentUser,
                                avatar: response.data.user.avatar // Đây sẽ là đường dẫn uploads/avatars/...
                            };
                            authService.setCurrentUser(updatedUser);

                            // Cập nhật form với đường dẫn file thay vì base64
                            setForm(prev => ({ ...prev, avatar: response.data.user.avatar }));

                            if (onSave) {
                                await onSave(updatedUser);
                            }

                            alert('Cập nhật avatar thành công!');
                        } else {
                            throw new Error(response.data?.message || 'Cập nhật avatar thất bại');
                        }
                    } catch (error) {
                        console.error('Error updating avatar:', error);
                        alert('Có lỗi xảy ra khi cập nhật avatar');
                        // Rollback avatar change
                        setForm(prev => ({ ...prev, avatar: user.avatar }));
                    }
                }

                setUploadingAvatar(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Có lỗi xảy ra khi đọc file');
            setUploadingAvatar(false);
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        // Validation - chỉ yêu cầu tên
        if (!form.fullname?.trim()) {
            alert('Vui lòng nhập tên');
            return;
        }

        if (form.fullname.trim().length < 2) {
            alert('Tên phải có ít nhất 2 ký tự');
            return;
        }

        // Validation ngày sinh (chỉ khi người dùng nhập)
        const hasBirthDay = form.birthDay && form.birthDay !== '';
        const hasBirthMonth = form.birthMonth && form.birthMonth !== '';
        const hasBirthYear = form.birthYear && form.birthYear !== '';

        if (hasBirthDay || hasBirthMonth || hasBirthYear) {
            if (!hasBirthDay || !hasBirthMonth || !hasBirthYear) {
                alert('Vui lòng điền đầy đủ ngày, tháng, năm sinh hoặc để trống tất cả');
                return;
            }

            const birthDate = new Date(form.birthYear, form.birthMonth - 1, form.birthDay);
            const today = new Date();
            if (birthDate > today) {
                alert('Ngày sinh không thể là ngày trong tương lai');
                return;
            }
        }

        // Chuẩn bị dữ liệu - không bao gồm avatar vì đã được lưu riêng
        const dataToSave = {
            fullname: form.fullname.trim(),
        };

        // Xử lý giới tính theo quy định DB
        if (form.gender !== '' && form.gender !== null && form.gender !== undefined) {
            dataToSave.gender = parseInt(form.gender);
        }

        // Chỉ thêm ngày sinh nếu có đầy đủ thông tin
        if (hasBirthDay && hasBirthMonth && hasBirthYear) {
            dataToSave.birthDay = parseInt(form.birthDay);
            dataToSave.birthMonth = parseInt(form.birthMonth);
            dataToSave.birthYear = parseInt(form.birthYear);
        }

        console.log('Submitting profile form:', dataToSave);

        try {
            setLoading(true);

            const currentUser = authService.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                alert('Không tìm thấy thông tin người dùng');
                return;
            }

            const response = await authService.updateUser(currentUser.id, dataToSave);

            if (response.data && response.data.success) {
                const updatedUser = response.data.user;
                authService.setCurrentUser(updatedUser);

                if (onSave) {
                    await onSave(updatedUser);
                }

                alert('Cập nhật thông tin thành công!');
            } else {
                throw new Error(response.data?.message || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu thông tin';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-white rounded-2xl shadow-lg overflow-hidden">
            <form onSubmit={handleSubmit} className="flex-1 px-12 py-10">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Hồ sơ của tôi</h2>
                <p className="text-gray-500 mb-8">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
                <div className="space-y-5">
                    <div className="flex items-center">
                        <label className="w-40 text-gray-600 font-medium">Tên đăng nhập:</label>
                        <input
                            value={form.username || ''}
                            disabled
                            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 bg-gray-100 text-gray-700"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="w-40 text-gray-600 font-medium">
                            Tên: <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="fullname"
                            value={form.fullname || ''}
                            onChange={handleChange}
                            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                            required
                            placeholder="Nhập tên của bạn"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="w-40 text-gray-600 font-medium">Số điện thoại:</label>
                        <input
                            value={form.phone || ''}
                            disabled
                            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 bg-gray-100 text-gray-700"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="w-40 text-gray-600 font-medium">Email:</label>
                        <input
                            value={form.email || ''}
                            disabled
                            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 bg-gray-100 text-gray-700"
                        />
                        {/* <button type="button" className="ml-4 text-blue-500 text-sm font-medium hover:underline">Đổi</button> */}
                    </div>

                    <div className="flex items-center">
                        <label className="w-40 text-gray-600 font-medium">
                            Giới tính:
                        </label>
                        <div className="flex-1">
                            <GenderSelector value={form.gender} onChange={handleGenderChange} />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <label className="w-40 text-gray-600 font-medium">
                            Ngày sinh:
                        </label>
                        <div className="flex gap-2">
                            <select
                                name="birthDay"
                                value={form.birthDay}
                                onChange={handleChange}
                                className="border border-gray-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                            >
                                <option value="">Ngày</option>
                                {Array.from({ length: 31 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                            </select>
                            <select
                                name="birthMonth"
                                value={form.birthMonth}
                                onChange={handleChange}
                                className="border border-gray-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                            >
                                <option value="">Tháng</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                ))}
                            </select>
                            <select
                                name="birthYear"
                                value={form.birthYear}
                                onChange={handleChange}
                                className="border border-gray-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                            >
                                <option value="">Năm</option>
                                {Array.from({ length: 50 }, (_, i) => {
                                    const year = new Date().getFullYear() - i;
                                    return <option key={year} value={year}>{year}</option>
                                })}
                            </select>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                        * Các trường có dấu sao là bắt buộc
                    </div>
                </div>
                <div className="flex justify-center mt-10">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-12 py-2 text-white rounded-lg font-semibold text-lg shadow transition-colors ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-purple-500 hover:bg-purple-600'
                            }`}
                    >
                        {loading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </form>

            {/* Avatar Section */}
            <div className="w-[340px] flex flex-col items-center justify-center border-l bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-36 h-36 rounded-full border-4 border-purple-200 flex items-center justify-center overflow-hidden mb-4 bg-white shadow-lg">
                            {form.avatar ? (
                                <img
                                    src={getFullImageUrl(form.avatar)}
                                    alt="avatar"
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                        // Fallback nếu không load được ảnh
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div className={`w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold ${form.avatar ? 'hidden' : ''}`}>
                                {(form.fullname || form.username || 'U').charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Upload overlay */}
                        {uploadingAvatar && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        )}
                    </div>

                    <label
                        htmlFor="avatar-upload"
                        className={`inline-flex items-center px-6 py-3 bg-white border-2 border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-400 font-medium transition-all duration-200 shadow-sm ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploadingAvatar ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                                Đang tải...
                            </>
                        ) : (
                            <>
                                <FaCamera className="mr-2 text-purple-600" />
                                Chọn ảnh
                            </>
                        )}
                    </label>

                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handleAvatarChange}
                        disabled={uploadingAvatar}
                        className="hidden"
                    />

                    <div className="text-gray-400 text-xs mt-3 text-center">
                        Dung lượng file tối đa 2 MB<br />
                        Định dạng: JPEG, PNG, JPG, WEBP
                    </div>
                </div>
            </div>
        </div>
    );
}