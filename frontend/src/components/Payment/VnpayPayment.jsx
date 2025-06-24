import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { FaCreditCard, FaQrcode, FaTimesCircle, FaCopy } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';

function VnpayPayment({ currentOrder, orderService, onClose }) {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState('');
    const [paymentUrl, setPaymentUrl] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('redirect');
    const [qrData, setQrData] = useState('');
    const [bankInfo, setBankInfo] = useState({
        bankCode: '970415',
        bankName: 'NGAN HANG TMCP CONG THUONG VIET NAM',
        accountNo: '102877403203',
        accountName: 'DANH NGOC SON',
        amount: currentOrder?.total_amount || 0,
        description: `Thanh toan don hang ${currentOrder?.order_id}`
    });

    useEffect(() => {
        const createVnpayOrder = async () => {
            try {
                setLoading(true);

                // Debug dữ liệu đầu vào
                console.log("Current order data:", currentOrder);

                // Kiểm tra và chuẩn hóa dữ liệu
                if (!currentOrder) {
                    throw new Error('Không có thông tin đơn hàng');
                }

                // Tạo dữ liệu chuẩn cho VNPAY
                const vnpayOrderData = {
                    order_id: currentOrder.order_id || currentOrder.orderId,
                    total_amount: currentOrder.total_amount || currentOrder.totalAmount || currentOrder.finalTotal
                };

                console.log("Prepared VNPAY data:", vnpayOrderData);

                // Validate dữ liệu bắt buộc
                if (!vnpayOrderData.order_id) {
                    throw new Error('Thiếu mã đơn hàng (order_id)');
                }

                if (!vnpayOrderData.total_amount || vnpayOrderData.total_amount <= 0) {
                    throw new Error('Thiếu hoặc sai thông tin số tiền (total_amount)');
                }

                // Gọi API tạo đơn VNPAY
                const res = await orderService.createVnpayOrder(vnpayOrderData);

                if (res.data && res.data.paymentUrl) {
                    setPaymentUrl(res.data.paymentUrl);
                    setPaymentMethod('redirect');
                    console.log("VNPAY URL created successfully:", res.data.paymentUrl);
                } else {
                    throw new Error('Không nhận được URL thanh toán từ VNPAY');
                }
            } catch (err) {
                console.error("VNPay error details:", err);

                let errorMessage = 'Không thể kết nối VNPAY. ';

                if (err.response) {
                    // Lỗi từ server
                    errorMessage += `Server error: ${err.response.data?.message || err.response.statusText}`;
                } else if (err.request) {
                    // Lỗi network
                    errorMessage += 'Không thể kết nối đến server.';
                } else {
                    // Lỗi khác
                    errorMessage += err.message;
                }

                setErrMsg(errorMessage + ' Vui lòng thanh toán qua QR code.');
                setPaymentMethod('qr');
                generateQRData();
            } finally {
                setLoading(false);
            }
        };

        createVnpayOrder();
    }, [currentOrder, orderService]);

    // Tạo dữ liệu QR cho VietQR
    const generateQRData = () => {
        const qrString = `${bankInfo.bankCode}|${bankInfo.accountNo}|${bankInfo.accountName}|${bankInfo.amount}|${bankInfo.description}|${currentOrder.order_id || currentOrder.orderId}`;
        setQrData(qrString);
    };

    const handleRedirectPayment = () => {
        if (paymentUrl) {
            window.open(paymentUrl, '_blank');
        }
    };

    const handleSwitchToQR = () => {
        setPaymentMethod('qr');
        generateQRData();
    };

    const handleSwitchToRedirect = () => {
        setPaymentMethod('redirect');
    };

    const handleCopyInfo = (text) => {
        navigator.clipboard.writeText(text);
        alert('Đã copy thông tin!');
    };

    const handlePaid = () => {
        setModalOpen(false);
        navigate(`/order/vnpay-result?orderId=${currentOrder.order_id || currentOrder.orderId}&status=pending`);
    };

    const handleClose = () => {
        setModalOpen(false);
        if (onClose) onClose();
    };

    return (
        <Modal
            isOpen={modalOpen}
            onRequestClose={handleClose}
            style={{
                content: {
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '800px',
                    width: '95%',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    zIndex: 1000,
                    padding: 0,
                },
                overlay: {
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    zIndex: 999,
                },
            }}
        >
            <div className="relative">
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Thanh toán VNPAY</h2>
                    <button
                        className="text-white hover:text-red-200"
                        onClick={handleClose}
                    >
                        <FaTimesCircle size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Thông tin đơn hàng */}
                            <div className="border rounded-md mb-6">
                                <div className="p-4 border-b bg-gray-50">
                                    <p className="font-semibold">Thông tin đơn hàng</p>
                                </div>
                                <div className="p-4">
                                    <p><span className="text-gray-600">Mã đơn hàng:</span> #{currentOrder.order_id || currentOrder.orderId}</p>
                                    <p><span className="text-gray-600">Số tiền:</span> {(currentOrder.total_amount || currentOrder.totalAmount || currentOrder.finalTotal)?.toLocaleString()} đ</p>
                                </div>
                            </div>

                            {/* Chọn phương thức thanh toán */}
                            <div className="flex justify-center mb-6 space-x-4">
                                <button
                                    onClick={handleSwitchToRedirect}
                                    className={`flex items-center px-4 py-2 rounded-md transition-colors ${paymentMethod === 'redirect'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    disabled={!paymentUrl}
                                >
                                    <FaCreditCard className="mr-2" />
                                    Cổng VNPAY
                                </button>
                                <button
                                    onClick={handleSwitchToQR}
                                    className={`flex items-center px-4 py-2 rounded-md transition-colors ${paymentMethod === 'qr'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    <FaQrcode className="mr-2" />
                                    QR Code
                                </button>
                            </div>

                            {/* Hiển thị lỗi nếu có */}
                            {errMsg && (
                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md mb-4">
                                    {errMsg}
                                </div>
                            )}

                            {/* Nội dung thanh toán */}
                            {paymentMethod === 'redirect' && paymentUrl ? (
                                <div className="space-y-4">
                                    <div className="flex justify-center mb-4">
                                        <img
                                            src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR-1024x1024.png"
                                            alt="VNPAY Logo"
                                            className="h-16"
                                        />
                                    </div>

                                    <button
                                        onClick={handleRedirectPayment}
                                        className="w-full flex items-center justify-center bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        <FaCreditCard className="mr-2" />
                                        Thanh toán qua VNPAY
                                    </button>

                                    <p className="text-xs text-gray-500 text-center">
                                        Khi nhấn "Thanh toán qua VNPAY", bạn sẽ được chuyển đến cổng thanh toán an toàn
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* QR Code */}
                                        <div className="flex flex-col items-center">
                                            <h3 className="text-lg font-semibold mb-4">Quét mã QR để thanh toán</h3>
                                            <div className="bg-white p-4 rounded-lg shadow-md">
                                                {qrData && (
                                                    <QRCode
                                                        size={256}
                                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                        value={qrData}
                                                        viewBox={`0 0 256 256`}
                                                    />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2 text-center">
                                                Sử dụng app ngân hàng để quét mã QR
                                            </p>
                                        </div>

                                        {/* Thông tin chuyển khoản */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Thông tin chuyển khoản</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Ngân hàng</p>
                                                        <p className="font-medium">{bankInfo.bankName}</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Số tài khoản</p>
                                                        <p className="font-medium">{bankInfo.accountNo}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopyInfo(bankInfo.accountNo)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <FaCopy />
                                                    </button>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Tên tài khoản</p>
                                                        <p className="font-medium">{bankInfo.accountName}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopyInfo(bankInfo.accountName)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <FaCopy />
                                                    </button>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded border border-yellow-200">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Số tiền</p>
                                                        <p className="font-bold text-red-600">{bankInfo.amount.toLocaleString()} đ</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopyInfo(bankInfo.amount.toString())}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <FaCopy />
                                                    </button>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-600">Nội dung chuyển khoản</p>
                                                        <p className="font-medium break-all">{bankInfo.description}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopyInfo(bankInfo.description)}
                                                        className="text-blue-600 hover:text-blue-800 ml-2"
                                                    >
                                                        <FaCopy />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                                                <p className="text-sm text-red-700">
                                                    <strong>Lưu ý:</strong> Vui lòng chuyển khoản đúng số tiền và nội dung để đơn hàng được xử lý nhanh chóng.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nút hành động */}
                                    <div className="flex space-x-3 mt-6">
                                        <button
                                            onClick={handlePaid}
                                            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            Tôi đã chuyển khoản
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
                                        >
                                            Hủy giao dịch
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}

export default VnpayPayment;