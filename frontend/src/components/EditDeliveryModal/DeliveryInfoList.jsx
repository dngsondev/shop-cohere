import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrashAlt, FaMapMarkerAlt, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import authService from '../../services/authService';
import EditDeliveryModal from './EditDeliveryModal';

function DeliveryInfoList({ onClose, onSelect, onChange }) { // Thêm onChange vào props
    const [deliveryList, setDeliveryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingInfo, setEditingInfo] = useState(null);

    // Helper function để lấy ID của địa chỉ, giúp code linh hoạt hơn
    const getAddressId = (info) => {
        // Ưu tiên dùng delivery_infor_id (từ API trả về)
        // Nếu không có, dùng id (từ mock data)
        return info.delivery_infor_id || info.id;
    };

    // Lấy danh sách địa chỉ từ server
    const fetchDeliveryAddresses = async () => {
        setLoading(true);
        try {
            const currentUser = authService.getCurrentUser();
            console.log("Current user:", currentUser);

            if (!currentUser || !currentUser.id) {
                setError('Vui lòng đăng nhập để xem danh sách địa chỉ');
                setLoading(false);
                return;
            }

            try {
                const response = await authService.getUserDeliveryAddresses(currentUser.id);
                console.log('API response:', response);

                let processedAddresses = [];

                if (response.data && response.data.addresses) {
                    processedAddresses = response.data.addresses.map(addr => ({
                        ...addr,
                        address: addr.address || addr.delivery_address,
                        delivery_address: addr.delivery_address || addr.address,
                        phone: addr.phone || addr.phone_number,
                        phone_number: addr.phone_number || addr.phone
                    }));
                } else if (response.data && Array.isArray(response.data)) {
                    processedAddresses = response.data.map(addr => ({
                        ...addr,
                        address: addr.address || addr.delivery_address,
                        delivery_address: addr.delivery_address || addr.address,
                        phone: addr.phone || addr.phone_number,
                        phone_number: addr.phone_number || addr.phone
                    }));
                }

                setDeliveryList(processedAddresses);

                // Cập nhật localStorage với cấu trúc đúng như hình 2
                const updatedUser = {
                    ...currentUser,
                    delivery_addresses: processedAddresses.map(addr => ({
                        id: getAddressId(addr),
                        fullname: addr.recipient_name,
                        phone: addr.phone || addr.phone_number,
                        address: addr.address || addr.delivery_address,
                        is_being_used: addr.is_being_used
                    }))
                };

                authService.setCurrentUser(updatedUser);
                console.log("Updated user in localStorage:", updatedUser);

            } catch (apiError) {
                console.error('API error:', apiError);
                // Mock data fallback nếu cần
                setDeliveryList([]);
            }

            setLoading(false);
        } catch (err) {
            console.error('Lỗi khi lấy danh sách địa chỉ:', err);
            setError('Không thể lấy danh sách địa chỉ. Vui lòng thử lại sau.');
            setLoading(false);
        }
    };

    // Lấy danh sách địa chỉ từ server khi component mount
    useEffect(() => {
        fetchDeliveryAddresses();
    }, []);

    const handleOpenNew = () => {
        setEditingInfo(null); // Thêm mới
        setModalOpen(true);
    };

    const handleEdit = (info) => {
        console.log("Editing info:", info);

        // Xác định tên trường đúng và lưu trữ đầy đủ thông tin trước
        setEditingInfo({
            id: getAddressId(info),
            fullname: info.recipient_name,
            phone: info.phone || info.phone_number,
            address: info.address || info.delivery_address,
            is_being_used: info.is_being_used
        });

        // Quan trọng: Đặt một timeout nhỏ để đảm bảo state được cập nhật trước khi mở modal
        setTimeout(() => {
            console.log("Opening modal...");
            setModalOpen(true);
        }, 0);
    };

    useEffect(() => {
        console.log("modalOpen changed to:", modalOpen);
    }, [modalOpen]);

    // Thêm useEffect để theo dõi sự thay đổi của modalOpen
    useEffect(() => {
        console.log("modalOpen changed to:", modalOpen);
        console.log("editingInfo is:", editingInfo);
    }, [modalOpen, editingInfo]);

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
            try {
                const response = await authService.deleteDeliveryAddress(id);

                if (response.data && response.data.success) {
                    // Xóa thành công, cập nhật UI
                    setDeliveryList(deliveryList.filter(item => getAddressId(item) !== id));
                } else {
                    // Xóa thất bại, hiển thị lỗi
                    setError(response.data.message || 'Không thể xóa địa chỉ.');
                }
            } catch (err) {
                console.error('Lỗi khi xóa địa chỉ:', err);
                setError('Không thể xóa địa chỉ. Vui lòng thử lại sau.');
            }
        }
    };

    // Sửa lại function fetchAndUpdateUserInfo
    // const fetchAndUpdateUserInfo = async () => {
    //     try {
    //         const currentUser = authService.getCurrentUser();

    //         if (currentUser?.id) {
    //             const userResponse = await authService.getLastestUser(currentUser.id);

    //             if (userResponse.data) {
    //                 // Đảm bảo cấu trúc delivery_addresses đúng như hình 2
    //                 const updatedUser = {
    //                     ...userResponse.data,
    //                     delivery_addresses: userResponse.data.delivery_addresses || []
    //                 };

    //                 // Cập nhật localStorage với cấu trúc đúng
    //                 authService.setCurrentUser(updatedUser);

    //                 console.log("Đã cập nhật thông tin user trong localStorage:", updatedUser);
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Lỗi khi fetch thông tin user:', error);

    //         // Không cần xử lý token vì localStorage không có
    //         if (error.response?.status === 401) {
    //             console.warn('Có thể cần đăng nhập lại');
    //         }
    //     }
    // };

    const handleSetDefault = async (id) => {
        try {
            const currentUser = authService.getCurrentUser();

            if (!currentUser) {
                alert('Vui lòng đăng nhập để thực hiện thao tác này');
                return;
            }

            const response = await authService.setDefaultDeliveryAddress(id);
            if (response.data.success) {
                // Cập nhật state local trước
                const updatedDeliveryList = deliveryList.map(item => ({
                    ...item,
                    is_being_used: getAddressId(item) === id ? 1 : 0
                }));

                setDeliveryList(updatedDeliveryList);

                // Cập nhật localStorage với cấu trúc đúng như hình 2
                const updatedUser = {
                    ...currentUser,
                    delivery_addresses: updatedDeliveryList.map(addr => ({
                        id: getAddressId(addr),
                        fullname: addr.recipient_name,
                        phone: addr.phone || addr.phone_number,
                        address: addr.address || addr.delivery_address,
                        is_being_used: addr.is_being_used
                    }))
                };

                // Lưu vào localStorage với cấu trúc đúng
                authService.setCurrentUser(updatedUser);

                // Gọi callback để thông báo cho component cha biết có thay đổi
                if (onChange) {
                    onChange();
                }

                alert('Đã cập nhật địa chỉ mặc định thành công!');
            } else {
                alert('Cập nhật địa chỉ mặc định thất bại!');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật địa chỉ mặc định:', error);

            if (error.response?.status === 401) {
                alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại để tiếp tục');
            } else {
                alert('Có lỗi xảy ra khi cập nhật địa chỉ mặc định!');
            }
        }
    };

    const handleSelect = (info) => {
        console.log("Selected info:", info); // Debug

        // Tạo object userInfo với cấu trúc đúng
        const userInfoData = {
            delivery_infor_id: info?.delivery_infor_id || info?.id,
            recipient_name: info?.recipient_name,
            phone: info?.phone || info?.phone_number,
            // Thêm các trường khác nếu cần
            fullname: info?.recipient_name // fallback
        };

        const addressData = info?.address || info?.delivery_address || '';

        console.log("Sending userInfoData:", userInfoData);
        console.log("Sending addressData:", addressData);

        // Gọi callback với dữ liệu đã chuẩn bị
        onSelect && onSelect(userInfoData, addressData);
        onClose && onClose();
    };

    const handleSave = async (userInfo, address) => {
        try {
            const currentUser = authService.getCurrentUser();

            if (!currentUser || !currentUser.id) {
                setError('Vui lòng đăng nhập để lưu địa chỉ');
                return;
            }

            console.log("Saving user info:", userInfo, "address:", address);

            if (editingInfo && editingInfo.id) {
                // Cập nhật địa chỉ hiện có
                await authService.updateDeliveryAddress(
                    editingInfo.id,
                    userInfo.fullname,
                    userInfo.phone,
                    address,
                    editingInfo.is_being_used === 1
                );

                // Cập nhật state local
                const updatedDeliveryList = deliveryList.map(item =>
                    getAddressId(item) === editingInfo.id
                        ? { ...item, recipient_name: userInfo.fullname, phone: userInfo.phone, address }
                        : item
                );

                setDeliveryList(updatedDeliveryList);

                // Cập nhật localStorage với cấu trúc đúng (KHÔNG cần token)
                const updatedUser = {
                    ...currentUser,
                    delivery_addresses: updatedDeliveryList.map(addr => ({
                        id: getAddressId(addr),
                        fullname: addr.recipient_name,
                        phone: addr.phone || addr.phone_number,
                        address: addr.address || addr.delivery_address,
                        is_being_used: addr.is_being_used
                    }))
                };

                authService.setCurrentUser(updatedUser);

            } else {
                // Tạo mới địa chỉ
                const deliveryData = {
                    customer_id: currentUser.id,
                    recipient_name: userInfo.fullname,
                    phone: userInfo.phone,
                    address: address
                };

                const response = await authService.createDelivery(deliveryData);
                console.log("Delivery created:", response);

                // Reload danh sách sau khi tạo mới
                await fetchDeliveryAddresses();
            }

            // Gọi callback để thông báo cho component cha
            if (onChange) {
                onChange();
            }

            setModalOpen(false);
        } catch (err) {
            console.error("Error saving delivery info:", err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin');
        }
    };

    const handleCreateDelivery = async (userInfo, address) => {
        try {
            const currentUser = authService.getCurrentUser();

            if (!currentUser || !currentUser.id) {
                setError('Vui lòng đăng nhập để tạo địa chỉ');
                return;
            }

            // Debug: Log dữ liệu trước khi xử lý
            console.log("Raw input data:", { userInfo, address });

            // Validate input data
            if (!userInfo.fullname || !userInfo.phone || !address) {
                setError('Vui lòng điền đầy đủ thông tin họ tên, số điện thoại và địa chỉ');
                return;
            }

            // Debug: Kiểm tra dữ liệu sau khi trim
            const trimmedData = {
                recipient_name: userInfo.fullname.trim(),
                phone: userInfo.phone.trim(),
                address: address.trim()
            };
            console.log("Trimmed data:", trimmedData);

            const deliveryData = {
                customer_id: currentUser.id,
                recipient_name: trimmedData.recipient_name,
                phone: trimmedData.phone,
                address: trimmedData.address
            };

            console.log("Final delivery data being sent:", deliveryData);
            console.log("Address length:", deliveryData.address.length);

            const response = await authService.createDelivery(deliveryData);
            console.log("Delivery created successfully:", response.data);

            // Reload delivery addresses after creating new one
            await fetchDeliveryAddresses();

            // Gọi callback để thông báo cho component cha
            if (onChange) {
                onChange();
            }

            setModalOpen(false);
            return response;
        } catch (error) {
            console.error("Error creating delivery:", error);

            // Xử lý lỗi chi tiết hơn
            let errorMessage = 'Có lỗi xảy ra khi tạo địa chỉ mới';

            if (error.response) {
                // Server trả về response với status code lỗi
                const { status, data } = error.response;

                switch (status) {
                    case 400:
                        errorMessage = data.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin';
                        break;
                    case 401:
                        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
                        break;
                    case 403:
                        errorMessage = 'Bạn không có quyền thực hiện thao tác này';
                        break;
                    case 500:
                        errorMessage = 'Lỗi server. Vui lòng thử lại sau';
                        break;
                    default:
                        errorMessage = data.message || errorMessage;
                }
            } else if (error.request) {
                // Request được gửi nhưng không nhận được response
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng';
            }

            setError(errorMessage);
            return null;
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center mb-4">
                <button
                    onClick={onClose}
                    className="mr-2 text-gray-600 hover:text-gray-800"
                >
                    <FaArrowLeft />
                </button>
                <h2 className="text-xl font-bold">Sổ địa chỉ</h2>
            </div>

            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    <div className="space-y-4 mb-6">
                        {deliveryList.length > 0 ? (
                            deliveryList.map((info, index) => {
                                const addressId = getAddressId(info);
                                const isOnlyDefault = info.is_being_used === 1 && deliveryList.length === 1;

                                return (
                                    <div
                                        key={addressId || index} // Sử dụng delivery_infor_id làm key
                                        className={`border rounded-lg p-4 transition-colors ${info.is_being_used === 1
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'hover:border-gray-400'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div
                                                className="flex-1 cursor-pointer"
                                                onClick={() => handleSelect(info)}
                                            >
                                                <div className="flex items-center">
                                                    <span className="font-medium">{info.recipient_name}</span>
                                                    {info.is_being_used === 1 && (
                                                        <span className="ml-2 text-xs text-white bg-blue-600 rounded-full px-2 py-0.5 flex items-center">
                                                            <FaCheckCircle className="mr-1" size={10} />
                                                            Mặc định
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-gray-600">{info.phone || info.phone_number}</div>
                                                <div className="text-gray-800 mt-2 flex items-start">
                                                    <FaMapMarkerAlt className="text-red-500 mr-1 mt-1 flex-shrink-0" />
                                                    <span>{info.address || info.delivery_address}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col space-y-2">
                                                <button
                                                    onClick={() => handleEdit(info)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                    title="Chỉnh sửa"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(addressId)}
                                                    className={`text-red-500 hover:text-red-700 ${isOnlyDefault ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={isOnlyDefault ? "Không thể xóa địa chỉ mặc định duy nhất" : "Xóa"}
                                                    disabled={isOnlyDefault}
                                                >
                                                    <FaTrashAlt />
                                                </button>
                                                {info.is_being_used !== 1 && (
                                                    <button
                                                        onClick={() => handleSetDefault(addressId)}
                                                        className="text-green-500 hover:text-green-700"
                                                        title="Đặt làm mặc định"
                                                    >
                                                        <FaCheckCircle />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ mới!
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleOpenNew}
                        className="w-full flex items-center justify-center p-3 border-2 border-dashed border-blue-500 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                    >
                        <FaPlus className="mr-2" />
                        Thêm địa chỉ mới
                    </button>
                </>
            )}

            <EditDeliveryModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={async (userInfo, address) => {
                    console.log("Saving data from modal:", userInfo, address);

                    try {
                        if (editingInfo) {
                            // Trường hợp chỉnh sửa
                            await handleSave(userInfo, address);
                        } else {
                            // Trường hợp thêm mới
                            const result = await handleCreateDelivery(userInfo, address);
                            if (!result) {
                                // Có lỗi xảy ra, không đóng modal
                                console.log("Create delivery failed, keeping modal open");
                                return;
                            }
                        }
                    } catch (error) {
                        console.error("Error in onSave:", error);
                        setError('Có lỗi xảy ra khi lưu thông tin');
                    }
                }}
                initialAddress={editingInfo?.address || ''}
                initialUserInfo={{
                    fullname: editingInfo?.fullname || '',
                    phone: editingInfo?.phone || ''
                }}
            />
        </div>
    );
}

export default DeliveryInfoList;
