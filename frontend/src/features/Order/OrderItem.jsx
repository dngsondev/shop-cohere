import React, { useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';

// Components
import OrderContent from './OrderContent';
import OrderModals from './OrderModals';

// Hooks
import { useOrderData } from './useOrderData';
import { useVoucherHandler } from '../../hooks/useHandleVoucher';
import { useToast } from '../../components/Toast/Toast';

// Services
import orderService from '../../services/orderService';
import cartService from '../../services/cartService';

import { refreshCartQuantity } from '../../utils/cartUtils';

Modal.setAppElement('#root');

function OrderItem() {
    const navigate = useNavigate();
    const customerData = localStorage.getItem("user");
    const customer = customerData ? JSON.parse(customerData) : null;

    // Custom hooks
    const { orderData, products, userInfo, setUserInfo, address, setAddress } = useOrderData();

    // States
    const [payments, setPayments] = useState([]);
    const [checkedPaymentMethod, setcheckedPaymentMethod] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [showAddressList, setShowAddressList] = useState(false);
    const [showVnpayPayment, setShowVnpayPayment] = useState(false);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [currentTempOrder, setCurrentTempOrder] = useState(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [orderNote, setOrderNote] = useState('');

    const { showToast } = useToast();

    // Voucher hook
    const {
        voucherInfo,
        isLoading,
        error,
        validateVoucher,
        calculateDiscount,
        clearVoucher,
        formatPrice
    } = useVoucherHandler('', products);

    // Load payment methods
    React.useEffect(() => {
        const loadPayments = async () => {
            try {
                console.log("🔍 Loading payment methods...");
                const response = await orderService.getPayments();

                console.log("📦 Raw API response:", response);
                console.log("📦 Response data:", response.data);

                // ⚠️ Kiểm tra cấu trúc response
                let paymentMethods = [];

                if (response.data?.success && Array.isArray(response.data.data)) {
                    // Trường hợp có wrapper { success: true, data: [...] }
                    paymentMethods = response.data.data;
                } else if (Array.isArray(response.data)) {
                    // Trường hợp trả về array trực tiếp
                    paymentMethods = response.data;
                } else {
                    console.warn("⚠️ Unexpected payment methods format:", response.data);
                    // Fallback to static data
                    paymentMethods = [
                        {
                            method_id: 1,
                            note: "Thanh toán khi nhận hàng",
                            provider: "COD"
                        },
                        {
                            method_id: 2,
                            note: "Cổng thanh toán VNPay",
                            provider: "VNPay"
                        }
                    ];
                }

                console.log("✅ Final payment methods:", paymentMethods);
                setPayments(paymentMethods);

            } catch (error) {
                console.error("❌ Error loading payments:", error);
                // Fallback to static data
                const fallbackPayments = [
                    {
                        method_id: 1,
                        note: "Thanh toán khi nhận hàng",
                        provider: "COD"
                    },
                    {
                        method_id: 2,
                        note: "Cổng thanh toán VNPay",
                        provider: "VNPay"
                    }
                ];
                setPayments(fallbackPayments);
            }
        };

        loadPayments();
    }, []);

    // Calculations
    const calculateProductPrice = (product, quantity) => {
        const price = parseFloat(product.final_price || 0);
        if (isNaN(price) || isNaN(quantity)) return 0;
        return price * quantity;
    };

    const calculateTotal = () => {
        if (!products?.length || !orderData?.items) return 0;
        return products.reduce((total, product, index) => {
            const item = orderData.items[index];
            if (!item) return total;
            return total + calculateProductPrice(product, item.quantity);
        }, 0);
    };

    const shippingFee = 35000;
    const total = calculateTotal();

    const {
        productDiscount,
        shippingDiscount,
        finalShipping,
        totalDiscount
    } = calculateDiscount(total, shippingFee);

    const finalTotal = total + finalShipping - productDiscount;

    // Event handlers
    const handleCheckVoucher = async () => {
        if (!voucherCode.trim()) {
            showToast("Vui lòng nhập mã giảm giá", "error");
            return;
        }
        await validateVoucher(voucherCode);
    };

    const handleClearVoucher = () => {
        clearVoucher();
        setVoucherCode('');
    };

    const handleSelectAddress = (userInfoData, addressData) => {
        setUserInfo({
            delivery_id: userInfoData?.delivery_infor_id || userInfoData?.id || null,
            recipient_name: userInfoData?.recipient_name || userInfoData?.fullname || '',
            phone: userInfoData?.phone || userInfoData?.phone_number || ''
        });
        setAddress(addressData || '');
        setShowAddressList(false);
    };

    const removeOrderedItemsFromCart = React.useCallback(async () => {
        try {
            const customerId = customer?.customer_id || customer?.id;
            if (customerId && products?.length > 0) {
                const cartIds = products
                    .map(product => product.cart_id)
                    .filter(id => id && id !== null && id !== undefined);

                if (cartIds.length > 0) {
                    await cartService.removeItemsFromCart(customerId, cartIds);
                }
            }
        } catch (error) {
            console.error('Error removing items from cart:', error);
        }
    }, [customer, products]);

    const handleOrder = async () => {
        if (!customer) {
            showToast("Vui lòng đăng nhập để đặt hàng!", "error");
            return;
        }

        if (!checkedPaymentMethod) {
            showToast("Vui lòng chọn phương thức thanh toán!", "error");
            return;
        }

        if (!userInfo.recipient_name || !userInfo.phone || !address) {
            showToast("Vui lòng điền đầy đủ thông tin giao hàng!", "error");
            return;
        }

        try {
            setIsCreatingOrder(true);

            const orderRequestData = {
                customer_id: customer.customer_id || customer.id,
                items: products.map((product, index) => {
                    const orderItem = orderData.items[index];
                    return {
                        productId: product.product_id,
                        variantId: product.variant_id,
                        quantity: orderItem?.quantity || product.quantity,
                        priceQuotation: calculateProductPrice(product, orderItem?.quantity || product.quantity)
                    };
                }),
                address: address.trim(),
                delivery_id: userInfo.delivery_id,
                payment_method: parseInt(checkedPaymentMethod),
                total_amount: finalTotal,
                note: orderNote.trim() || null,
                recipient_name: userInfo.recipient_name.trim(),
                phone: userInfo.phone.trim(),
                voucher_id: voucherInfo?.voucher_id || null
            };

            if (checkedPaymentMethod === '1') { // COD
                const response = await orderService.createOrder(orderRequestData);
                if (response.data.success) {
                    await removeOrderedItemsFromCart();
                    // Cập nhật lại số lượng giỏ hàng sau khi đặt hàng thành công
                    if (customer?.customer_id || customer?.id) {
                        await refreshCartQuantity(customer.customer_id || customer.id);
                    }
                    setModalIsOpen(false);
                    navigate('/profile/orders');
                } else {
                    throw new Error(response.data.message || 'Không thể tạo đơn hàng');
                }
            } else if (checkedPaymentMethod === '2') { // VNPAY
                // Tạo temp order trước
                const tempOrderResponse = await orderService.createTempOrder(orderRequestData);
                if (tempOrderResponse.data.success) {
                    const tempOrderId = tempOrderResponse.data.order_id;

                    // Tạo VNPAY payment URL
                    const vnpayOrderData = {
                        order_id: tempOrderId,
                        total_amount: finalTotal
                    };

                    console.log("Creating VNPAY payment URL for order:", vnpayOrderData);

                    const vnpayResponse = await orderService.createVnpayOrder(vnpayOrderData);

                    if (vnpayResponse.data && vnpayResponse.data.paymentUrl) {
                        console.log("VNPAY URL created:", vnpayResponse.data.paymentUrl);

                        // Lưu thông tin temp order để xử lý sau
                        const tempOrderData = {
                            order_id: tempOrderId,
                            total_amount: finalTotal,
                            customer_id: customer.customer_id || customer.id,
                            cart_ids: products
                                .map(p => p.cart_id)
                                .filter(id => id && id !== null && id !== undefined)
                        };

                        // Lưu vào sessionStorage để sử dụng trong callback
                        sessionStorage.setItem('tempOrderData', JSON.stringify(tempOrderData));

                        // Chuyển hướng đến VNPAY sandbox
                        window.location.href = vnpayResponse.data.paymentUrl;
                    } else {
                        throw new Error('Không nhận được URL thanh toán từ VNPAY');
                    }
                } else {
                    throw new Error(tempOrderResponse.data.message || 'Không thể tạo đơn hàng tạm thời');
                }
            }
        } catch (error) {
            console.error("Error processing order:", error);
            showToast(`Lỗi xử lý đơn hàng: ${error.response?.data?.message || error.message}`, "error");
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const handleVnpayPaymentSuccess = async (orderId) => {
        try {
            await orderService.confirmOrderAfterPayment(orderId, {
                customer_id: currentTempOrder.customer_id,
                cart_ids: currentTempOrder.cart_ids
            });
            setShowVnpayPayment(false);
            setCurrentTempOrder(null);
            navigate('/profile/orders');
        } catch (error) {
            console.error("Error confirming order after payment:", error);
            showToast("Thanh toán thành công nhưng có lỗi xử lý đơn hàng. Vui lòng liên hệ hỗ trợ.", "info");
            // alert("Thanh toán thành công nhưng có lỗi xử lý đơn hàng. Vui lòng liên hệ hỗ trợ.");
        }
    };

    const handlePaymentCancel = async () => {
        try {
            if (currentTempOrder?.order_id) {
                await orderService.cancelTempOrder(currentTempOrder.order_id);
            }
            setCurrentTempOrder(null);
        } catch (error) {
            console.error("Error canceling temp order:", error);
        }
    };

    if (!orderData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <OrderContent
                    orderData={orderData}
                    products={products}
                    customer={customer}
                    userInfo={userInfo}
                    address={address}
                    orderNote={orderNote}
                    setOrderNote={setOrderNote}
                    payments={payments}
                    checkedPaymentMethod={checkedPaymentMethod}
                    setcheckedPaymentMethod={setcheckedPaymentMethod}
                    voucherCode={voucherCode}
                    setVoucherCode={setVoucherCode}
                    voucherInfo={voucherInfo}
                    isLoading={isLoading}
                    error={error}
                    handleCheckVoucher={handleCheckVoucher}
                    handleClearVoucher={handleClearVoucher}
                    total={total}
                    shippingFee={shippingFee}
                    shippingDiscount={shippingDiscount}
                    finalShipping={finalShipping}
                    productDiscount={productDiscount}
                    totalDiscount={totalDiscount}
                    finalTotal={finalTotal}
                    formatPrice={formatPrice}
                    handleOrder={handleOrder}
                    isCreatingOrder={isCreatingOrder}
                    openAddressList={() => setShowAddressList(true)}
                />

                <OrderModals
                    modalIsOpen={modalIsOpen}
                    showAddressList={showAddressList}
                    showVnpayPayment={showVnpayPayment}
                    currentTempOrder={currentTempOrder}
                    userInfo={userInfo}
                    address={address}
                    onCloseModal={() => setModalIsOpen(false)}
                    onCloseAddressList={() => setShowAddressList(false)}
                    onCloseVnpayPayment={() => {
                        setShowVnpayPayment(false);
                        handlePaymentCancel();
                    }}
                    onSelectAddress={handleSelectAddress}
                    onVnpaySuccess={handleVnpayPaymentSuccess}
                />
            </div>
        </div>
    );
}

export default OrderItem;