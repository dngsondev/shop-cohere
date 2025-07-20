import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaClock } from 'react-icons/fa';
import axios from 'axios';
import { refreshCartQuantity } from '../../utils/cartUtils'; // Thêm dòng này

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function VnpayResult() {
    const location = useLocation();
    const navigate = useNavigate();
    const [message, setMessage] = useState('Đang xác thực kết quả thanh toán...');
    const [status, setStatus] = useState('processing');
    const [orderId, setOrderId] = useState(null);

    // Lấy customerId từ localStorage (hoặc nơi bạn lưu)
    const customerId = JSON.parse(localStorage.getItem('customer'))?.customer_id;

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const orderId = params.get('orderId');
        const vnp_ResponseCode = params.get('vnp_ResponseCode');
        const statusParam = params.get('status');

        setOrderId(orderId);

        if (!orderId) {
            setMessage('Không tìm thấy mã đơn hàng.');
            setStatus('error');
            return;
        }

        if (vnp_ResponseCode === '00') {
            setStatus('success');
            setMessage('Thanh toán thành công! Đang xử lý đơn hàng...');
            handleVnpayCallback(orderId);
        } else if (vnp_ResponseCode && vnp_ResponseCode !== '00') {
            setStatus('failed');
            setMessage('Thanh toán không thành công hoặc đã bị hủy.');
            handlePaymentFailure(orderId);
        } else if (statusParam === 'pending') {
            setStatus('pending');
            setMessage('Đơn hàng đang chờ xác nhận thanh toán.');
        } else {
            checkOrderStatus(orderId);
        }
    }, [location.search]);

    const handleVnpayCallback = async (orderId) => {
        try {
            const tempOrderDataStr = sessionStorage.getItem('tempOrderData');
            let tempOrderData = null;
            if (tempOrderDataStr) {
                tempOrderData = JSON.parse(tempOrderDataStr);
            }

            const response = await axios.get(`${BACKEND_URL}/order/vnpay/callback${location.search}`);

            if (response.data.success) {
                setMessage('Thanh toán thành công! Đơn hàng đã được xác nhận.');
                sessionStorage.removeItem('tempOrderData');
                sessionStorage.removeItem("orderData");

                // Xóa sản phẩm khỏi giỏ hàng nếu có thông tin
                if (tempOrderData && tempOrderData.cart_ids && tempOrderData.cart_ids.length > 0) {
                    try {
                        await axios.post(`${BACKEND_URL}/cart/remove-items`, {
                            customer_id: tempOrderData.customer_id,
                            cart_ids: tempOrderData.cart_ids
                        });
                        // Cập nhật lại số lượng giỏ hàng
                        if (customerId) await refreshCartQuantity(customerId);
                    } catch (cartError) {
                        console.error("Error removing cart items:", cartError);
                    }
                } else {
                    // Nếu không có cart_ids vẫn refresh lại số lượng
                    if (customerId) await refreshCartQuantity(customerId);
                }
            } else {
                setStatus('error');
                setMessage('Có lỗi xảy ra khi xử lý thanh toán.');
            }
        } catch (error) {
            console.error("Error in VNPAY callback:", error);
            setStatus('error');
            setMessage('Có lỗi xảy ra khi xử lý thanh toán.');
        }
    };

    const handlePaymentFailure = async (orderId) => {
        await axios.post(`${BACKEND_URL}/order/cancel-temp/${orderId}`);
        sessionStorage.removeItem('tempOrderData');
    };

    const checkOrderStatus = async (orderId) => {
        const res = await axios.get(`${BACKEND_URL}/order/status/${orderId}`, {
            timeout: 10000
        });

        if (res.data?.success) {
            if (res.data.payment_status === 'Đã thanh toán') {
                setStatus('success');
                setMessage('Thanh toán thành công! Cảm ơn bạn đã mua hàng.');
                sessionStorage.removeItem("orderData");
                // Cập nhật lại số lượng giỏ hàng
                if (customerId) await refreshCartQuantity(customerId);
            } else if (res.data.order_status === 'Chờ xác nhận') {
                setStatus('pending');
                setMessage('Đơn hàng đang chờ xác nhận thanh toán.');
            } else {
                setStatus('processing');
                setMessage(`Đơn hàng đang được xử lý: ${res.data.order_status}`);
            }
        } else {
            setStatus('error');
            setMessage('Không thể xác định trạng thái đơn hàng.');
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'processing':
                return <FaSpinner className="mx-auto text-blue-500 animate-spin" style={{ fontSize: '64px' }} />;
            case 'success':
                return <FaCheckCircle className="mx-auto text-green-500" style={{ fontSize: '64px' }} />;
            case 'failed':
            case 'error':
                return <FaTimesCircle className="mx-auto text-red-500" style={{ fontSize: '64px' }} />;
            case 'pending':
                return <FaClock className="mx-auto text-yellow-500" style={{ fontSize: '64px' }} />;
            default:
                return <FaSpinner className="mx-auto text-blue-500 animate-spin" style={{ fontSize: '64px' }} />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'success':
                return 'text-green-600';
            case 'failed':
            case 'error':
                return 'text-red-600';
            case 'pending':
                return 'text-yellow-600';
            default:
                return 'text-blue-600';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                {getStatusIcon()}

                <h2 className={`mt-6 text-xl font-semibold ${getStatusColor()}`}>
                    {status === 'success' && 'Thanh toán thành công!'}
                    {status === 'failed' && 'Thanh toán thất bại'}
                    {status === 'error' && 'Có lỗi xảy ra'}
                    {status === 'pending' && 'Đang chờ xác nhận'}
                    {status === 'processing' && 'Đang xử lý'}
                </h2>

                <p className="mt-2 text-gray-600">{message}</p>

                {orderId && (
                    <p className="mt-2 text-sm text-gray-500">Mã đơn hàng: #{orderId}</p>
                )}

                {status === 'pending' && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-700">
                            💡 <strong>Lưu ý:</strong> Nếu bạn đã chuyển khoản, đơn hàng sẽ được xác nhận trong vòng 5-10 phút.
                            Bạn có thể kiểm tra lại trạng thái đơn hàng trong mục "Đơn hàng của tôi".
                        </p>
                    </div>
                )}

                <div className="mt-8 space-y-3">
                    <button
                        onClick={() => navigate('/profile/orders')}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    >
                        Xem đơn hàng của tôi
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                    >
                        Tiếp tục mua sắm
                    </button>

                    {status === 'pending' && (
                        <button
                            onClick={() => checkOrderStatus(orderId)}
                            className="w-full bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition-colors"
                        >
                            Kiểm tra lại trạng thái
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VnpayResult;