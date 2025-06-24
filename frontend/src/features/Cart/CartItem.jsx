import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { RiDeleteBinFill, RiShoppingCartLine, RiErrorWarningLine } from "react-icons/ri";
import { FaCaretUp, FaCaretDown, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { IoCheckmark, IoClose, IoWarning } from "react-icons/io5";
import { MdShoppingCart, MdRemoveShoppingCart } from "react-icons/md";

import cartService from '../../services/cartService';
import { refreshCartQuantity } from '../../utils/cartUtils';
import { getFullImageUrl } from '../../utils/imageUtils';

function CartItem({ customerId }) {
    const [cart, setCart] = useState([]);
    const [checkedItem, setCheckedItem] = useState([]);
    const [intervalId, setIntervalId] = useState(null);
    const [cartSummary, setCartSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const fetchCart = async () => {
        setIsLoading(true);
        try {
            const response = await cartService.getCart(customerId);
            console.log("Cart API response:", response.data); // ✨ Debug log

            if (response.data.items) {
                setCart(response.data.items);
                setCartSummary(response.data.summary);
            } else {
                // ✨ Fallback: nếu backend chưa cập nhật, xử lý data cũ
                const cartData = Array.isArray(response.data) ? response.data : [];

                // ✨ Thêm stock_status mặc định nếu không có
                const processedCart = cartData.map(item => ({
                    ...item,
                    stock_status: item.stock_status || 'available' // Default to available
                }));

                setCart(processedCart);
                setCartSummary(null);
            }
        } catch (error) {
            console.error("Error fetching cart items:", error);
            // ✨ Set empty array thay vì để undefined
            setCart([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [customerId]);

    useEffect(() => {
        return () => {
            refreshCartQuantity(customerId);
        }
    }, [location.pathname, customerId]);

    const toggleCheck = (cartId) => {
        setCheckedItem(prev => {
            if (prev.includes(cartId)) {
                return prev.filter(id => id !== cartId);
            } else {
                return [...prev, cartId];
            }
        });
    }

    const toggleCheckAll = () => {
        const availableItems = cart.filter(canCheckoutItem);
        if (checkedItem.length === availableItems.length && availableItems.length > 0) {
            setCheckedItem([]);
        } else {
            const allAvailableCartIds = availableItems.map(item => item.cart_id);
            setCheckedItem(allAvailableCartIds);
        }
    }

    const handleDeleteCart = async (cartId) => {
        try {
            await cartService.deleteCart(cartId);
            setCart(prev => prev.filter(item => item.cart_id !== cartId));
            setCheckedItem(prev => prev.filter(id => id !== cartId));
            refreshCartQuantity(customerId);
        } catch (error) {
            console.error("Error deleting cart item:", error);
        }
    }

    const startChangingQuantity = (cartId, currentQuantity, direction) => {
        const handler = async () => {
            const newQuantity = direction === 'up' ? currentQuantity + 1 : currentQuantity - 1;
            if (newQuantity > 0) {
                await cartService.updateCart(cartId, newQuantity);
                setCart(prev => prev.map(item => item.cart_id === cartId ? { ...item, quantity: newQuantity } : item));
            }
            currentQuantity = newQuantity;
        };

        handler();
        const id = setInterval(handler, 200);
        setIntervalId(id);
    };

    const stopChangingQuantity = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    };

    const handleAutoAdjustCart = async (action) => {
        try {
            setIsLoading(true);
            const response = await cartService.adjustCart(customerId, action);
            if (response.data.success) {
                // Sử dụng toast thay vì alert
                showNotification(response.data.message, 'success');
                fetchCart();
                refreshCartQuantity(customerId);
            }
        } catch (error) {
            console.error("Error adjusting cart:", error);
            showNotification("Có lỗi xảy ra khi điều chỉnh giỏ hàng!", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm hiển thị notification (có thể thay bằng toast library)
    const showNotification = (message, type) => {
        // Tạm thời dùng alert, có thể thay bằng react-toastify
        alert(message);
    };

    const getItemStatusStyle = (item) => {
        switch (item.stock_status) {
            case 'out_of_stock':
                return 'bg-red-50 border-red-200 opacity-75';
            case 'insufficient_stock':
                return 'bg-yellow-50 border-yellow-200';
            default:
                return 'bg-white border-gray-200 hover:border-blue-300';
        }
    };

    const getItemStatusMessage = (item) => {
        switch (item.stock_status) {
            case 'out_of_stock':
                return { icon: <IoClose className="text-red-500" />, text: 'Sản phẩm đã hết hàng', color: 'text-red-600' };
            case 'insufficient_stock':
                return {
                    icon: <IoWarning className="text-yellow-500" />,
                    text: `Chỉ còn ${item.stock_quantity} sản phẩm (bạn đang chọn ${item.quantity})`,
                    color: 'text-yellow-600'
                };
            default:
                return null;
        }
    };

    const canCheckoutItem = (item) => {
        // ✨ Nếu không có stock_status, mặc định là có thể checkout
        return !item.stock_status || item.stock_status === 'available';
    };

    const getStatusBadge = (item) => {
        switch (item.stock_status) {
            case 'out_of_stock':
                return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        <IoClose size={12} />
                        Hết hàng
                    </div>
                );
            case 'insufficient_stock':
                return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        <IoWarning size={12} />
                        Không đủ hàng
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <IoCheckmark size={12} />
                        Có sẵn
                    </div>
                );
        }
    };

    const calculateTotal = () => {
        const availableCheckedItems = checkedItem.filter(cartId => {
            const item = cart.find(c => c.cart_id === cartId);
            return item && canCheckoutItem(item);
        });

        const total = cart
            .filter(item => availableCheckedItems.includes(item.cart_id) && canCheckoutItem(item))
            .reduce((sum, item) => sum + (item.price - (item.price * item.discount / 100)) * item.quantity, 0);

        return total;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MdShoppingCart className="text-3xl text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
                                <p className="text-sm text-gray-500">{cart.length} sản phẩm</p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        {cartSummary && (cartSummary.out_of_stock_items > 0 || cartSummary.insufficient_stock_items > 0) && (
                            <div className="flex gap-3">
                                {cartSummary.out_of_stock_items > 0 && (
                                    <button
                                        onClick={() => handleAutoAdjustCart('remove_out_of_stock')}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <MdRemoveShoppingCart size={16} />
                                        Xóa hết hàng ({cartSummary.out_of_stock_items})
                                    </button>
                                )}
                                {cartSummary.insufficient_stock_items > 0 && (
                                    <button
                                        onClick={() => handleAutoAdjustCart('adjust_quantity')}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <FaExclamationTriangle size={14} />
                                        Điều chỉnh SL ({cartSummary.insufficient_stock_items})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {cart.length > 0 ? (
                    <div className="space-y-4">
                        {cart.map(item => (
                            <div
                                key={item.cart_id}
                                className={`bg-white rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg ${getItemStatusStyle(item)}`}
                            >
                                <div className="flex items-center gap-6">
                                    {/* Checkbox */}
                                    <div
                                        onClick={() => canCheckoutItem(item) && toggleCheck(item.cart_id)}
                                        className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${canCheckoutItem(item) ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'
                                            } ${checkedItem.includes(item.cart_id) && canCheckoutItem(item)
                                                ? 'bg-blue-500 border-blue-500'
                                                : canCheckoutItem(item)
                                                    ? 'bg-white border-gray-300 hover:border-blue-400'
                                                    : 'bg-gray-100 border-gray-300'
                                            }`}
                                    >
                                        {checkedItem.includes(item.cart_id) && canCheckoutItem(item) && (
                                            <IoCheckmark className="text-white text-sm" />
                                        )}
                                    </div>

                                    {/* Product image */}
                                    <div className="relative">
                                        <img
                                            className={`w-24 h-24 rounded-xl object-cover shadow-md transition-all duration-300 ${item.stock_status === 'out_of_stock' ? 'grayscale' : ''
                                                }`}
                                            src={getFullImageUrl(item.image_url)}
                                            alt={item.product_name}
                                        />
                                        <div className="absolute -top-2 -right-2">
                                            {getStatusBadge(item)}
                                        </div>
                                    </div>

                                    {/* Product info - Expanded */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <h3 className={`text-lg font-semibold line-clamp-2 ${item.stock_status === 'out_of_stock' ? 'text-gray-500' : 'text-gray-900'
                                            }`}>
                                            {item.product_name}
                                        </h3>

                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                {item.color_name}
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                                Size: {item.size_name}
                                            </span>
                                        </div>

                                        {/* Status message */}
                                        {getItemStatusMessage(item) && (
                                            <div className={`flex items-center gap-2 text-sm font-medium ${getItemStatusMessage(item).color}`}>
                                                {getItemStatusMessage(item).icon}
                                                <span>{getItemStatusMessage(item).text}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Price Section - Redesigned */}
                                    <div className="text-right min-w-[120px]">
                                        <div className="space-y-1">
                                            <p className={`text-2xl font-bold ${item.stock_status === 'out_of_stock' ? 'text-gray-400' : 'text-gray-900'
                                                }`}>
                                                {formatPrice((item.price - (item.price * item.discount / 100)) * item.quantity)}
                                            </p>
                                            {item.discount > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-500 line-through">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </p>
                                                    <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                                                        -{item.discount}%
                                                    </span>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                {formatPrice(item.price - (item.price * item.discount / 100))}/sp
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quantity Controls - Redesigned */}
                                    <div className={`flex items-center bg-gray-50 rounded-xl border-2 border-gray-200 ${item.stock_status === 'out_of_stock' ? 'opacity-50 pointer-events-none' : 'hover:border-blue-300'
                                        }`}>
                                        <button
                                            className="w-10 h-10 rounded-l-xl bg-transparent hover:bg-blue-50 text-blue-600 hover:text-blue-700 flex items-center justify-center transition-all duration-200 border-r border-gray-200"
                                            onMouseDown={() => item.stock_status !== 'out_of_stock' && startChangingQuantity(item.cart_id, item.quantity, 'down')}
                                            onMouseUp={stopChangingQuantity}
                                            onMouseLeave={stopChangingQuantity}
                                            disabled={item.stock_status === 'out_of_stock' || item.quantity <= 1}
                                        >
                                            <FaCaretDown size={16} />
                                        </button>

                                        <div className="w-16 h-10 flex items-center justify-center bg-white border-r border-gray-200">
                                            <span className="text-lg font-semibold text-gray-900">
                                                {item.quantity}
                                            </span>
                                        </div>

                                        <button
                                            className="w-10 h-10 rounded-r-xl bg-transparent hover:bg-blue-50 text-blue-600 hover:text-blue-700 flex items-center justify-center transition-all duration-200"
                                            onMouseDown={() => item.stock_status !== 'out_of_stock' && startChangingQuantity(item.cart_id, item.quantity, 'up')}
                                            onMouseUp={stopChangingQuantity}
                                            onMouseLeave={stopChangingQuantity}
                                            disabled={item.stock_status === 'out_of_stock'}
                                        >
                                            <FaCaretUp size={16} />
                                        </button>
                                    </div>

                                    {/* Delete button - Redesigned */}
                                    <button
                                        onClick={() => handleDeleteCart(item.cart_id)}
                                        className="w-12 h-12 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all duration-200 border-2 border-red-200 hover:border-red-500 group"
                                        title="Xóa sản phẩm"
                                    >
                                        <RiDeleteBinFill size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <RiShoppingCartLine className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-500 mb-2">Giỏ hàng trống</h2>
                        <p className="text-gray-400 mb-6">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
                        >
                            Tiếp tục mua sắm
                        </button>
                    </div>
                )}
            </div>

            {/* Fixed bottom checkout bar */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-20">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    onClick={toggleCheckAll}
                                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${checkedItem.length === cart.filter(canCheckoutItem).length && cart.filter(canCheckoutItem).length > 0
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'bg-white border-gray-300 hover:border-blue-400'
                                        }`}
                                >
                                    {checkedItem.length === cart.filter(canCheckoutItem).length && cart.filter(canCheckoutItem).length > 0 && (
                                        <IoCheckmark className="text-white text-sm" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Chọn tất cả sản phẩm có thể mua ({cart.filter(canCheckoutItem).length})
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">
                                        Tổng: {formatPrice(calculateTotal())}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const availableCheckedItems = checkedItem.filter(cartId => {
                                        const item = cart.find(c => c.cart_id === cartId);
                                        return item && canCheckoutItem(item);
                                    });

                                    if (availableCheckedItems.length === 0) {
                                        showNotification("Vui lòng chọn sản phẩm có thể thanh toán!", 'warning');
                                        return;
                                    }

                                    const selectedItems = cart.filter(item =>
                                        availableCheckedItems.includes(item.cart_id) && canCheckoutItem(item)
                                    );

                                    const orderData = {
                                        customerId: customerId,
                                        items: selectedItems.map(item => ({
                                            cartId: item.cart_id,
                                            variantId: item.variant_id,
                                            productId: item.product_id,
                                            quantity: item.quantity,
                                            priceQuotation: item.price - (item.price * item.discount / 100),
                                        }))
                                    };
                                    sessionStorage.setItem("orderData", JSON.stringify(orderData));
                                    navigate("/order");
                                }}
                                disabled={checkedItem.filter(cartId => {
                                    const item = cart.find(c => c.cart_id === cartId);
                                    return item && canCheckoutItem(item);
                                }).length === 0}
                                className="bg-blue-500 text-white px-8 py-3 rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Thanh toán ({checkedItem.filter(cartId => {
                                    const item = cart.find(c => c.cart_id === cartId);
                                    return item && canCheckoutItem(item);
                                }).length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Đang xử lý...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartItem;