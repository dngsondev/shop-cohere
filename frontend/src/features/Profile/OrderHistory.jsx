import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { FaBox, FaClock, FaCheckCircle, FaTruck, FaTimesCircle, FaEye, FaStar, FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import { getFullImageUrl } from '../../utils/imageUtils';
import authService from '../../services/authService';

import { useToast } from "../../components/Toast/Toast";
import { ConfirmModal } from '../../components';



function OrderHistory() {

    const { showToast } = useToast();

    // State để quản lý đơn hàng, trạng thái tải, lỗi, trang hiện tại, số lượng đơn hàng trên mỗi trang
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(5);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [cancellingOrders, setCancellingOrders] = useState(new Set()); // Track đơn hàng đang hủy
    const [confirmModal, setConfirmModal] = useState({ open: false, orderId: null });


    const navigate = useNavigate();

    // Lấy danh sách đơn hàng từ API
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser?.id) {
                setError('Vui lòng đăng nhập để xem đơn hàng');
                return;
            }

            // Sử dụng authService thay vì fetch trực tiếp
            const response = await authService.getCustomerOrders(currentUser.id);
            const data = response.data;

            if (data.success) {
                setOrders(data.orders || []);
            } else {
                setError(data.message || 'Không thể tải danh sách đơn hàng');
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Có lỗi xảy ra khi tải đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Format giá tiền
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Format ngày tháng
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Lấy icon và màu sắc theo trạng thái đơn hàng
    const getOrderStatusInfo = (order) => {
        if (order.payment_status === 'Đã thanh toán với QR') {
            return {
                icon: <FaCheckCircle className="text-pink-500" />,
                color: 'text-pink-600 bg-pink-50 border-pink-200',
                text: 'Đã thanh toán QR'
            };
        }
        switch (order.order_status) {
            case 'Chờ xác nhận':
                return {
                    icon: <FaClock className="text-yellow-500" />,
                    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
                    text: 'Chờ xác nhận'
                };
            case 'Đã xác nhận':
                return {
                    icon: <FaCheckCircle className="text-blue-500" />,
                    color: 'text-blue-600 bg-blue-50 border-blue-200',
                    text: 'Đã xác nhận'
                };
            case 'Đang giao hàng':
                return {
                    icon: <FaTruck className="text-purple-500" />,
                    color: 'text-purple-600 bg-purple-50 border-purple-200',
                    text: 'Đang giao'
                };
            // case 'Đã giao hàng':
            case 'Hoàn thành':
                return {
                    icon: <FaCheckCircle className="text-green-500" />,
                    color: 'text-green-600 bg-green-50 border-green-200',
                    text: 'Hoàn thành'
                };
            case 'Đã hủy':
                return {
                    icon: <FaTimesCircle className="text-red-500" />,
                    color: 'text-red-600 bg-red-50 border-red-200',
                    text: 'Đã hủy'
                };
            default:
                return {
                    icon: <FaBox className="text-gray-500" />,
                    color: 'text-gray-600 bg-gray-50 border-gray-200',
                    text: order.order_status
                };
        }
    };

    // Lọc đơn hàng theo trạng thái
    const filteredOrders = orders.filter(order => {
        if (selectedStatus === 'all') return true;
        return order.order_status === selectedStatus;
    });

    // Phân trang
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    // Xử lý xem chi tiết đơn hàng
    // const handleViewDetails = (orderId) => {
    //     // Chuyển đến trang chi tiết đơn hàng
    //     window.open(`/order-detail/${orderId}`, '_blank');
    // };

    // Xử lý đánh giá sản phẩm
    const handleReviewProduct = (productId, variantId) => {
        // Chuyển đến trang đánh giá sản phẩm
        // window.open(`/product/${productId}?review=true&variant=${variantId}`, '_blank');
        navigate(`/product/${productId}?review=true&variant=${variantId}`, {
            state: { variantId }
        });
    };

    // Xử lý toggle chi tiết đơn hàng
    const handleToggleDetails = (orderId) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    // Xử lý hủy đơn hàng
    const handleCancelOrder = (orderId) => {
        setConfirmModal({ open: true, orderId });
    };

    // Khi xác nhận trong modal:
    const handleConfirmCancel = async () => {
        const orderId = confirmModal.orderId;
        setConfirmModal({ open: false, orderId: null });

        setCancellingOrders(prev => new Set(prev).add(orderId));
        try {
            const response = await authService.cancelOrder(orderId);
            if (response.data.success) {
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        order.order_id === orderId
                            ? { ...order, order_status: 'Đã hủy' }
                            : order
                    )
                );
                showToast("Hủy đơn hàng thành công!", "success");
            } else {
                showToast(response.data.message || 'Không thể hủy đơn hàng. Vui lòng thử lại!', "error");
            }
        } catch (error) {
            showToast('Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại!', "error");
        } finally {
            setCancellingOrders(prev => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center text-red-600">
                    <p>{error}</p>
                    <button
                        onClick={fetchOrders}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <FaBox className="mr-2 text-blue-600" />
                        Đơn hàng đã mua ({filteredOrders.length})
                    </h2>
                </div>

                {/* Filter tabs */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        {[
                            {
                                key: 'all',
                                label: 'Tất cả'
                            },
                            {
                                key: 'Chờ xác nhận',
                                label: 'Chờ xác nhận'
                            },
                            {
                                key: 'Đã xác nhận',
                                label: 'Đã xác nhận'
                            },
                            {
                                key: 'Đang giao hàng',
                                label: 'Đang giao'
                            },
                            {
                                key: 'Hoàn thành',
                                label: 'Hoàn thành'
                            },
                            {
                                key: 'Đã hủy',
                                label: 'Đã hủy'
                            },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setSelectedStatus(tab.key);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === tab.key
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders list */}
                <div className="p-6">
                    {currentOrders.length > 0 ? (
                        <div className="space-y-6">
                            {currentOrders.map((order) => {
                                const statusInfo = getOrderStatusInfo(order);
                                const isExpanded = expandedOrders.has(order.order_id);
                                const isCancelling = cancellingOrders.has(order.order_id);
                                const canCancel = order.order_status === 'Chờ xác nhận';
                                const canReview = order.order_status === 'Đã giao hàng' || order.order_status === 'Hoàn thành';

                                return (
                                    <div
                                        key={order.order_id}
                                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {/* Order header */}
                                        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                                            <div className="flex items-center space-x-4">
                                                <span className="text-sm text-gray-600">
                                                    Đơn hàng #{order.order_id}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {formatDate(order.created_at)}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                                    {statusInfo.icon}
                                                    <span className="ml-1">{statusInfo.text}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {/* Nút hủy đơn hàng */}
                                                {canCancel && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order.order_id)}
                                                        className="flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isCancelling ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600 mr-1"></div>
                                                                Đang hủy...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaTimes className="mr-1" />
                                                                Hủy đơn
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                {/* Nút chi tiết */}
                                                <button
                                                    onClick={() => handleToggleDetails(order.order_id)}
                                                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <FaChevronUp className="mr-1" />
                                                            Thu gọn
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaChevronDown className="mr-1" />
                                                            Chi tiết
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Order content - hiển thị sản phẩm và thông tin chi tiết */}
                                        <div className="p-4">
                                            {/* Sản phẩm trong đơn hàng */}
                                            {order.items && order.items.map((item, index) => (
                                                <div key={index} className="mb-4">
                                                    <div className="flex items-center space-x-4">
                                                        <img
                                                            src={getFullImageUrl(item.image_url)}
                                                            alt={item.product_name}
                                                            className="w-16 h-16 object-cover rounded-lg"
                                                        />
                                                        <div className="flex-1">
                                                            <h4 className="font-medium">{item.product_name}</h4>
                                                            <p className="text-sm text-gray-500">
                                                                {item.color_name} • {item.size_name} • SL: {item.quantity}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium">{formatPrice(item.price)}</p>
                                                        </div>
                                                    </div>
                                                    {/* Nút đánh giá riêng biệt */}
                                                    {canReview && (
                                                        <div className="mt-2 flex justify-end">
                                                            <button
                                                                onClick={() => handleReviewProduct(item.product_id, item.variant_id)}
                                                                className="flex items-center px-3 py-1 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 hover:text-orange-700 transition-colors"
                                                                title="Đánh giá sản phẩm này"
                                                            >
                                                                <FaStar className="mr-1" />
                                                                Đánh giá sản phẩm
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Tổng tiền */}
                                            <div className="border-t pt-4 mt-4">
                                                <div className="flex justify-between font-semibold">
                                                    <span>Tổng thanh toán:</span>
                                                    <span className="text-red-600">{formatPrice(order.total_price)}</span>
                                                </div>
                                            </div>

                                            {/* Chi tiết mở rộng */}
                                            {isExpanded && (
                                                <div className="mt-4 pt-4 border-t bg-gray-50 -mx-4 px-4 py-4">
                                                    <h4 className="font-medium mb-3">Thông tin chi tiết</h4>

                                                    {/* Thông báo về việc hủy đơn */}
                                                    {canCancel && (
                                                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                            <p className="text-xs text-yellow-800">
                                                                <span className="font-medium">Lưu ý:</span> Khi hủy đơn hàng, số lượng sản phẩm sẽ được hoàn trả về kho.
                                                                Bạn chỉ có thể hủy đơn hàng khi đơn hàng vẫn đang ở trạng thái "Chờ xác nhận".
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Thông báo về việc đánh giá */}
                                                    {canReview && (
                                                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                            <p className="text-xs text-orange-800">
                                                                <span className="font-medium">Đánh giá sản phẩm:</span> Hãy chia sẻ trải nghiệm của bạn về sản phẩm để giúp khách hàng khác có lựa chọn tốt hơn!
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Các thông tin khác */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p><span className="font-medium">Mã đơn hàng:</span> #{order.order_id}</p>
                                                            <p><span className="font-medium">Ngày đặt:</span> {formatDate(order.created_at)}</p>
                                                            <p><span className="font-medium">Trạng thái:</span> {order.order_status}</p>
                                                        </div>
                                                        <div>
                                                            {order.shipping_address && (
                                                                <p><span className="font-medium">Địa chỉ:</span> {order.shipping_address}</p>
                                                            )}
                                                            {order.note && (
                                                                <p><span className="font-medium">Ghi chú:</span> {order.note}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // Empty state
                        <div className="text-center py-12">
                            <FaBox className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Chưa có đơn hàng nào
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {selectedStatus === 'all'
                                    ? 'Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!'
                                    : `Không có đơn hàng nào ở trạng thái "${selectedStatus}"`
                                }
                            </p>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Trước
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
                                            ? 'text-white bg-blue-600 border border-blue-600'
                                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ConfirmModal
                open={confirmModal.open}
                title="Xác nhận hủy đơn hàng"
                message="Bạn có chắc chắn muốn hủy đơn hàng này?"
                onConfirm={handleConfirmCancel}
                onCancel={() => setConfirmModal({ open: false, orderId: null })}
                confirmText="Hủy đơn"
                cancelText="Đóng"
            />
        </>
    );
}

export default OrderHistory;