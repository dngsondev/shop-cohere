import React, { useState, useEffect } from 'react';
import UserTable from './UserTable';
import UserModal from './UserModal';
import AdminModal from './AdminModal'; // Thêm import
import AdminTable from './AdminTable'; // Thêm import
import adminService from '../../../services/adminService';

function AdminUser() {
    const [allUsers, setAllUsers] = useState([]); // Tất cả users từ server
    const [displayUsers, setDisplayUsers] = useState([]); // Users hiển thị sau filter/search
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('view');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [adminList, setAdminList] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Fetch users data
    const fetchUsers = async () => {
        setLoading(true);
        try {
            console.log('🔍 Fetching users...');
            const response = await adminService.getAllUsers();

            console.log('📋 Full response:', response);
            console.log('📋 Response data:', response.data);
            console.log('📋 Response success:', response.data?.success);

            if (response.data && response.data.success) {
                // THỬ CẢ 2 CÁCH PARSE
                let users = response.data.data?.users || response.data.users || [];

                console.log('✅ Parsed users:', users);
                console.log('✅ Users count:', users.length);

                if (Array.isArray(users) && users.length > 0) {
                    setAllUsers(users);
                    setDisplayUsers(users);
                    console.log('✅ Users set successfully');
                } else {
                    console.warn('⚠️ No users found or invalid data format');
                    setAllUsers([]);
                    setDisplayUsers([]);
                }
            } else {
                console.error('❌ API returned success: false or invalid response');
                console.error('❌ Response:', response.data);
            }
        } catch (error) {
            console.error('❌ Error fetching users:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error response:', error.response?.data);

            // Hiển thị alert với thông tin chi tiết
            alert(`Không thể tải danh sách người dùng: ${error.message}\n${error.response?.data?.message || ''}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch admin data
    const fetchAdmins = async () => {
        try {
            const res = await adminService.getAllAdmins();
            setAdminList(res.data.admins || []);
        } catch (err) {
            setAdminList([]);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchAdmins(); // gọi luôn khi vào trang
    }, []);

    // Filter and search users
    useEffect(() => {
        let filtered = [...allUsers];

        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(user =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (filterStatus !== 'all') {
            const statusValue = filterStatus === 'active' ? 1 : 0;
            filtered = filtered.filter(user => user.status === statusValue);
        }

        setDisplayUsers(filtered);
        setCurrentPage(1); // Reset to first page when filter changes
    }, [allUsers, searchTerm, filterStatus]);

    // Calculate pagination
    const totalPages = Math.ceil(displayUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = displayUsers.slice(startIndex, endIndex);

    const handleSearch = (e) => {
        e.preventDefault();
        // Search is handled by useEffect above
    };

    const handleFilterChange = (newStatus) => {
        setFilterStatus(newStatus);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setModalType('view');
        setShowModal(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setModalType('edit');
        setShowModal(true);
    };

    const handleCreateUser = () => {
        setSelectedUser(null);
        setModalType('create');
        setShowModal(true);
    };

    const handleCreateAdmin = () => {
        setSelectedUser(null);
        setModalType('createAdmin');
        setShowModal(true);
    };

    // Xem chi tiết admin
    const handleViewAdmin = (admin) => {
        setSelectedUser(admin);
        setModalType('viewAdmin');
        setShowModal(true);
    };

    // Chỉnh sửa admin
    const handleEditAdmin = (admin) => {
        setSelectedUser(admin);
        setModalType('editAdmin');
        setShowModal(true);
    };

    // Thêm xử lý lưu admin (giả sử có adminService.createAdmin)
    const handleModalSave = async (userData) => {
        try {
            let response;
            if (modalType === 'create') {
                response = await adminService.createUser(userData);
            } else if (modalType === 'edit') {
                response = await adminService.updateUser(selectedUser.id, userData);
            } else if (modalType === 'createAdmin') {
                response = await adminService.createAdmin(userData); // API này bạn cần tạo ở backend
            } else if (modalType === 'editAdmin') {
                response = await adminService.updateAdmin(selectedUser.admin_id, userData);
            }

            if (response.data.success) {
                alert(
                    modalType === 'createAdmin'
                        ? 'Tạo admin thành công'
                        : modalType === 'create'
                            ? 'Tạo người dùng thành công'
                            : 'Cập nhật người dùng thành công'
                );
                fetchUsers();
                fetchAdmins();
                handleModalClose();
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert(
                error.response?.data?.message ||
                `Không thể ${modalType === 'createAdmin'
                    ? 'tạo admin'
                    : modalType === 'create'
                        ? 'tạo người dùng'
                        : 'cập nhật người dùng'
                }`
            );
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            return;
        }

        try {
            const response = await adminService.deleteUser(userId);
            if (response.data.success) {
                alert('Xóa người dùng thành công');
                fetchUsers(); // Refresh data
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error.response?.data?.message || 'Không thể xóa người dùng');
        }
    };

    const handleDeleteAdmin = async (adminId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa admin này?')) return;
        try {
            const res = await adminService.deleteAdmin(adminId);
            if (res.data.success) {
                alert('Xóa admin thành công');
                fetchAdmins();
            } else {
                alert(res.data.message || 'Không thể xóa admin');
            }
        } catch (err) {
            alert('Có lỗi khi xóa admin');
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            const response = await adminService.updateUserStatus(userId, newStatus);
            if (response.data.success) {
                alert(`${newStatus === 1 ? 'Kích hoạt' : 'Vô hiệu hóa'} người dùng thành công`);
                fetchUsers(); // Refresh data
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Không thể cập nhật trạng thái người dùng');
        }
    };

    const handleToggleAdminStatus = async (adminId, currentStatus) => {
        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            const res = await adminService.updateAdminStatus(adminId, newStatus);
            if (res.data.success) {
                alert(`${newStatus === 1 ? 'Kích hoạt' : 'Vô hiệu hóa'} admin thành công`);
                fetchAdmins();
            }
        } catch (err) {
            alert('Không thể cập nhật trạng thái admin');
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleCreateUser}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Thêm người dùng
                    </button>
                    <button
                        onClick={handleCreateAdmin}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Thêm admin
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email hoặc username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="inactive">Đã vô hiệu hóa</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('all');
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                        Reset
                    </button>
                </form>

                {/* Statistics */}
                <div className="mt-4 text-sm text-gray-600">
                    Hiển thị {currentUsers.length} / {displayUsers.length} người dùng
                    {searchTerm && ` (tìm kiếm: "${searchTerm}")`}
                    {filterStatus !== 'all' && ` (trạng thái: ${filterStatus === 'active' ? 'Hoạt động' : 'Vô hiệu hóa'})`}
                </div>
            </div>

            {/* Users Table */}
            <UserTable
                users={currentUsers}
                loading={loading}
                onView={handleViewUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onToggleStatus={handleToggleStatus}
            />
            {/* Bảng admin */}
            <AdminTable
                admins={adminList}
                loading={loading}
                onView={handleViewAdmin}
                onEdit={handleEditAdmin}
                onDelete={handleDeleteAdmin}
                onToggleStatus={handleToggleAdminStatus}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 rounded-b-lg">
                    <div className="flex items-center justify-between">
                        {/* Items per page */}
                        <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-700">Hiển thị:</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-gray-700">/ trang</span>
                        </div>

                        {/* Pagination info */}
                        <div className="text-sm text-gray-700">
                            Trang {currentPage} / {totalPages} -
                            Hiển thị {startIndex + 1}-{Math.min(endIndex, displayUsers.length)} của {displayUsers.length} kết quả
                        </div>

                        {/* Pagination controls */}
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-2 text-sm rounded-md ${currentPage === 1
                                    ? 'text-gray-300 bg-gray-100 border border-gray-200 cursor-not-allowed'
                                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Trước
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-2 text-sm rounded-md ${page === currentPage
                                        ? 'text-blue-600 bg-blue-50 border border-blue-300'
                                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-2 text-sm rounded-md ${currentPage === totalPages
                                    ? 'text-gray-300 bg-gray-100 border border-gray-200 cursor-not-allowed'
                                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {showModal && (
                modalType === 'createAdmin' || modalType === 'editAdmin' || modalType === 'viewAdmin' ? (
                    <AdminModal
                        admin={selectedUser}
                        type={modalType}
                        onClose={handleModalClose}
                        onSave={handleModalSave}
                    />
                ) : (
                    <UserModal
                        user={selectedUser}
                        type={modalType}
                        onClose={handleModalClose}
                        onSave={handleModalSave}
                    />
                )
            )}
        </div>
    );
}

export default AdminUser;