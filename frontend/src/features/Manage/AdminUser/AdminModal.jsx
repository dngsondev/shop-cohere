import React, { useState } from 'react';

function AdminModal({ admin, type, onClose, onSave }) {
    const [formData, setFormData] = useState({
        admin_username: admin?.admin_username || '',
        admin_name: admin?.admin_name || '',
        email: admin?.email || '',
        password: '',
        confirmPassword: '',
        role: admin?.role ?? 1, // 0: super admin, 1: staff
    });
    const [loading, setLoading] = useState(false);

    const isReadOnly = type === 'view';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (type !== 'view') {
            if (!formData.admin_username || !formData.admin_name || !formData.email) {
                alert('Vui lòng nhập đầy đủ thông tin');
                return;
            }
            if (type === 'createAdmin' && (!formData.password || formData.password.length < 6)) {
                alert('Mật khẩu tối thiểu 6 ký tự');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                alert('Mật khẩu xác nhận không khớp');
                return;
            }
            setLoading(true);
            await onSave(formData);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {type === 'createAdmin' ? 'Thêm admin mới' : 'Chi tiết admin'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-medium">Tên đăng nhập</label>
                        <input
                            type="text"
                            name="admin_username"
                            value={formData.admin_username}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                            disabled={isReadOnly}
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium">Tên hiển thị</label>
                        <input
                            type="text"
                            name="admin_name"
                            value={formData.admin_name}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                            disabled={isReadOnly}
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                            disabled={isReadOnly}
                            required
                        />
                    </div>
                    {type === 'createAdmin' && (
                        <>
                            <div>
                                <label className="block font-medium">Mật khẩu</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full border px-3 py-2 rounded"
                                    disabled={isReadOnly}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-medium">Xác nhận mật khẩu</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full border px-3 py-2 rounded"
                                    disabled={isReadOnly}
                                    required
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block font-medium">Phân quyền</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                            disabled={isReadOnly}
                        >
                            <option value={0}>Super Admin</option>
                            <option value={1}>Nhân viên</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded"
                        >
                            Đóng
                        </button>
                        {!isReadOnly && (
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                                disabled={loading}
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

export default AdminModal;