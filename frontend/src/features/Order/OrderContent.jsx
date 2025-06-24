import React from 'react';
import { FaExchangeAlt, FaShoppingBag, FaUser, FaCreditCard, FaPercent, FaGift, FaShieldAlt } from "react-icons/fa";
import { getFullImageUrl } from '../../utils/imageUtils';

const OrderContent = ({
    orderData,
    products,
    customer,
    userInfo,
    address,
    orderNote,
    setOrderNote,
    payments,
    checkedPaymentMethod,
    setcheckedPaymentMethod,
    voucherCode,
    setVoucherCode,
    voucherInfo,
    isLoading,
    error,
    handleCheckVoucher,
    handleClearVoucher,
    total,
    shippingFee,
    shippingDiscount,
    finalShipping,
    productDiscount,
    totalDiscount,
    finalTotal,
    formatPrice,
    handleOrder,
    isCreatingOrder,
    openAddressList
}) => {
    return (
        <>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Xác nhận thanh toán</h1>
                <p className="text-gray-600">Kiểm tra lại thông tin đơn hàng trước khi thanh toán</p>
            </div>

            {orderData?.items?.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column - Products & User Info */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Products Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <FaShoppingBag className="mr-2 text-blue-600" />
                                    Sản phẩm đặt hàng ({products.length})
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {products.map((product, index) => (
                                    <div key={index} className="p-6 flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <img
                                                src={getFullImageUrl(product.image_url)}
                                                alt={product.product_name}
                                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {product.product_name}
                                            </h3>
                                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                                <span>Màu: {product.color_name}</span>
                                                <span>Size: {product.size_name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-gray-900">
                                                {formatPrice(product.final_price)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                x{orderData.items[index]?.quantity || 0}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* User Info Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <FaUser className="mr-2 text-blue-600" />
                                        Thông tin giao hàng
                                    </h2>
                                    <button
                                        onClick={openAddressList}
                                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        <FaExchangeAlt className="mr-1" />
                                        Thay đổi
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <span className="flex items-center">
                                                Tên người nhận
                                                <span className="text-red-500 ml-1">*</span>
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={userInfo?.recipient_name || customer?.fullname || ''}
                                            readOnly
                                            placeholder="Chưa có tên người nhận"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 placeholder-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <span className="flex items-center">
                                                Số điện thoại
                                                <span className="text-red-500 ml-1">*</span>
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={userInfo?.phone || customer?.phone || ''}
                                            readOnly
                                            placeholder="Chưa có số điện thoại"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 placeholder-gray-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center">
                                            Địa chỉ giao hàng
                                            <span className="text-red-500 ml-1">*</span>
                                        </span>
                                    </label>
                                    <textarea
                                        value={address || customer?.address || ''}
                                        readOnly
                                        rows={3}
                                        placeholder="Chưa có địa chỉ giao hàng"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 resize-none placeholder-gray-400"
                                    />
                                    {(!address && !customer?.address) && (
                                        <p className="text-red-500 text-xs mt-1">
                                            Vui lòng chọn địa chỉ giao hàng bằng cách nhấn "Thay đổi"
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ghi chú đơn hàng (tùy chọn)
                                    </label>
                                    <textarea
                                        value={orderNote}
                                        onChange={(e) => setOrderNote(e.target.value)}
                                        placeholder="Lời nhắn cho shop (màu sắc, size, yêu cầu đặc biệt...)"
                                        rows={3}
                                        maxLength={500}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-500">
                                            Ghi chú sẽ được gửi đến shop cùng đơn hàng
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {orderNote.length}/500
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Payment */}
                    <div className="space-y-6">
                        {/* Voucher Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <FaGift className="mr-2 text-green-600" />
                                    Mã giảm giá
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center space-x-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder="Nhập mã giảm giá"
                                            value={voucherCode}
                                            onChange={(e) => setVoucherCode(e.target.value)}
                                            disabled={isLoading}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleCheckVoucher();
                                                }
                                            }}
                                        />
                                        {voucherInfo && (
                                            <button
                                                onClick={handleClearVoucher}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                                                title="Xóa mã giảm giá"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleCheckVoucher}
                                        disabled={isLoading || !voucherCode.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                                    >
                                        {isLoading ? 'Đang xử lý...' : 'Áp dụng'}
                                    </button>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                {voucherInfo && !error && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                        <p className="text-green-700 text-sm font-medium">
                                            ✅ Áp dụng thành công: {voucherInfo.voucher_code}
                                        </p>
                                        <p className="text-green-600 text-xs mt-1">
                                            {voucherInfo.voucher_type === 'percent' && voucherInfo.voucher_percent === 100 && 'Miễn phí 100%'}
                                            {voucherInfo.voucher_type === 'percent' && voucherInfo.voucher_percent !== 100 && `Giảm ${voucherInfo.voucher_percent}%`}
                                            {voucherInfo.voucher_type === 'fixed' && `Giảm ${formatPrice(voucherInfo.specific_money)}`}
                                            {voucherInfo.voucher_type === 'shipping' && 'Miễn phí vận chuyển'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <FaCreditCard className="mr-2 text-purple-600" />
                                    Phương thức thanh toán
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {Array.isArray(payments) && payments.length > 0 ? (
                                    payments.map((payment) => (
                                        <label
                                            key={payment.method_id}
                                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value={payment.method_id}
                                                    checked={checkedPaymentMethod === payment.method_id.toString()}
                                                    onChange={(e) => setcheckedPaymentMethod(e.target.value)}
                                                    className="mr-3 text-blue-600"
                                                />
                                                <span className="font-medium text-gray-900">
                                                    {payment.provider || payment.note}
                                                </span>
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500">
                                        Đang tải phương thức thanh toán...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id="payment-summary">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <FaPercent className="mr-2 text-orange-600" />
                                    Chi tiết thanh toán
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-gray-700">
                                    <span>Tổng tiền hàng ({orderData?.items?.length} sản phẩm)</span>
                                    <span className="font-medium">{formatPrice(total)}</span>
                                </div>

                                <div className="flex justify-between text-gray-700">
                                    <span>Phí vận chuyển</span>
                                    {shippingDiscount > 0 ? (
                                        <div className="text-right">
                                            <span className="line-through text-gray-400 mr-2 text-sm">
                                                {formatPrice(shippingFee)}
                                            </span>
                                            <span className="font-medium">{formatPrice(finalShipping)}</span>
                                        </div>
                                    ) : (
                                        <span className="font-medium">{formatPrice(shippingFee)}</span>
                                    )}
                                </div>

                                {voucherInfo && productDiscount > 0 && (
                                    <div className="flex justify-between text-gray-700">
                                        <span className="flex items-center">
                                            <span>Voucher giảm giá</span>
                                            <span className="text-xs text-green-600 ml-2 bg-green-50 px-2 py-0.5 rounded">
                                                {voucherInfo.voucher_code}
                                            </span>
                                        </span>
                                        <span className="text-green-600 font-medium">
                                            -{formatPrice(productDiscount)}
                                        </span>
                                    </div>
                                )}

                                {voucherInfo && voucherInfo.voucher_type === 'shipping' && shippingDiscount > 0 && (
                                    <div className="flex justify-between text-gray-700">
                                        <span className="flex items-center">
                                            <span>Freeship</span>
                                            <span className="text-xs text-green-600 ml-2 bg-green-50 px-2 py-0.5 rounded">
                                                {voucherInfo.voucher_code}
                                            </span>
                                        </span>
                                        <span className="text-green-600 font-medium">
                                            -{formatPrice(shippingDiscount)}
                                        </span>
                                    </div>
                                )}

                                <hr className="border-gray-200" />

                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span className="text-gray-900">Tổng thanh toán</span>
                                    <span className="text-red-600 text-xl">
                                        {formatPrice(finalTotal)}
                                    </span>
                                </div>

                                {totalDiscount > 0 && (
                                    <div className="text-right text-sm text-green-600 bg-green-50 p-2 rounded">
                                        🎉 Bạn đã tiết kiệm {formatPrice(totalDiscount)}
                                    </div>
                                )}

                                <button
                                    onClick={handleOrder}
                                    disabled={isCreatingOrder || !checkedPaymentMethod}
                                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                                >
                                    {isCreatingOrder ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaShieldAlt />
                                            <span>Thanh toán an toàn</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-lg text-gray-500">Không có sản phẩm nào được chọn</p>
                </div>
            )}
        </>
    );
};

export default OrderContent;