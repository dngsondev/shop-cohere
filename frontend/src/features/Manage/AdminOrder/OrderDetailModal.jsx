import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    FaTimes,
    FaFileInvoiceDollar,
    FaUser,
    FaShoppingBag,
    FaCalendarAlt,
    FaCreditCard,
    FaMapMarkerAlt,
    FaPhone,
    FaEnvelope,
    FaCheckCircle,
    FaSpinner,
    FaExclamationTriangle,
    FaPrint,
    FaDollarSign,
    FaBoxOpen
} from 'react-icons/fa';
import adminService from '../../../services/adminService';

import { getFullImageUrl } from '../../../utils/imageUtils';

import styles from './OrderDetailModal.module.scss';



function formatPrice(price) {
    return Number(price || 0).toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND'
    });
}

function OrderDetailModal({ order, onClose }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (order?.order_id) {
            fetchOrderDetail();
        }
    }, [order]);

    // Ngăn scroll khi modal mở
    useEffect(() => {
        if (order) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [order]);

    // Đóng modal bằng ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching order detail for ID:', order.order_id);

            // Gọi API admin để lấy chi tiết đơn hàng
            const response = await adminService.getOrderById(order.order_id);

            console.log('📦 Order detail response:', response.data);

            if (response.data.success && response.data.order) {
                setItems(response.data.order || []);
            } else {
                console.warn('⚠️ No order detail data returned');
                setItems([]);
            }
        } catch (error) {
            console.error('❌ Error fetching order detail:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Hàm kiểm tra đơn hàng có tính vào doanh thu không
    const isValidRevenueOrder = (order) => {
        const isPaid = order.payment_status === 'Đã thanh toán' ||
            order.payment_status === 'Đã thanh toán với QR';
        const isValidStatus = order.order_status === 'Hoàn thành' ||
            order.order_status === 'Đã giao' ||
            order.order_status === 'Đang giao hàng' ||
            order.order_status === 'Đang giao';
        return isPaid && isValidStatus;
    };

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'Chờ xác nhận': 'pending',
            'Đã xác nhận': 'confirmed',
            'Đang giao': 'shipping',
            'Đang giao hàng': 'shipping',
            'Hoàn thành': 'completed',
            'Đã giao': 'completed',
            'Đã hủy': 'cancelled'
        };
        return statusMap[status] || 'pending';
    };

    const getPaymentBadgeClass = (status) => {
        const paymentMap = {
            'Chưa thanh toán': 'unpaid',
            'Đã thanh toán': 'paid',
            'Đã thanh toán với QR': 'qr'
        };
        return paymentMap[status] || 'unpaid';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!order) return null;

    const isRevenueOrder = isValidRevenueOrder(order);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 30000; // Phí ship cố định
    const total = parseFloat(order.total_price || 0);

    const modalContent = (
        <div className={styles.orderDetailModal} onClick={handleBackdropClick}>
            <div className={styles.orderDetailModal__content} onClick={(e) => e.stopPropagation()}>
                <div className={styles.orderDetailModal__header}>
                    <div className={styles.orderDetailModal__titleSection}>
                        <h2 className={styles.orderDetailModal__title}>
                            <FaFileInvoiceDollar className={styles.orderDetailModal__titleIcon} />
                            Chi tiết đơn hàng #{order.order_id}
                        </h2>
                        <p className={styles.orderDetailModal__subtitle}>
                            Tạo lúc: {formatDate(order.created_at)}
                        </p>
                        <div className={`${styles.orderDetailModal__revenueStatus} ${isRevenueOrder
                            ? styles['orderDetailModal__revenueStatus--confirmed']
                            : styles['orderDetailModal__revenueStatus--pending']
                            }`}>
                            {isRevenueOrder ? (
                                <>
                                    <FaCheckCircle className={styles.orderDetailModal__revenueStatusIcon} />
                                    Được tính vào doanh thu
                                </>
                            ) : (
                                <>
                                    <FaExclamationTriangle className={styles.orderDetailModal__revenueStatusIcon} />
                                    Chưa tính vào doanh thu
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        className={styles.orderDetailModal__closeBtn}
                        onClick={onClose}
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.orderDetailModal__body}>
                    {/* Thông tin đơn hàng */}
                    <div className={styles.orderDetailModal__section}>
                        <h3 className={styles.orderDetailModal__sectionTitle}>
                            <FaFileInvoiceDollar className={styles.orderDetailModal__sectionTitleIcon} />
                            Thông tin đơn hàng
                        </h3>
                        <div className={styles.orderDetailModal__infoGrid}>
                            <div className={styles.orderDetailModal__infoCard}>
                                <div className={styles.orderDetailModal__infoLabel}>Mã đơn hàng</div>
                                <div className={styles.orderDetailModal__infoValue}>#{order.order_id}</div>
                            </div>
                            <div className={styles.orderDetailModal__infoCard}>
                                <div className={styles.orderDetailModal__infoLabel}>Trạng thái đơn hàng</div>
                                <div className={`${styles.orderDetailModal__infoValue} ${styles['orderDetailModal__infoValue--status']} ${styles[`orderDetailModal__statusBadge--${getStatusBadgeClass(order.order_status)}`]}`}>
                                    {order.order_status || 'Chờ xác nhận'}
                                </div>
                            </div>
                            <div className={styles.orderDetailModal__infoCard}>
                                <div className={styles.orderDetailModal__infoLabel}>Trạng thái thanh toán</div>
                                <div className={`${styles.orderDetailModal__infoValue} ${styles['orderDetailModal__infoValue--status']} ${styles[`orderDetailModal__statusBadge--${getPaymentBadgeClass(order.payment_status)}`]}`}>
                                    {order.payment_status || 'Chưa thanh toán'}
                                </div>
                            </div>
                            <div className={styles.orderDetailModal__infoCard}>
                                <div className={styles.orderDetailModal__infoLabel}>Phương thức thanh toán</div>
                                <div className={styles.orderDetailModal__infoValue}>
                                    {order.payment_method || 'COD'}
                                </div>
                            </div>
                            <div className={styles.orderDetailModal__infoCard}>
                                <div className={styles.orderDetailModal__infoLabel}>Tổng giá trị</div>
                                <div className={`${styles.orderDetailModal__infoValue} ${styles['orderDetailModal__infoValue--price']} ${isRevenueOrder ? 'confirmed' : ''}`}>
                                    {formatPrice(order.total_price)}
                                </div>
                            </div>
                            <div className={styles.orderDetailModal__infoCard}>
                                <div className={styles.orderDetailModal__infoLabel}>Ngày tạo</div>
                                <div className={styles.orderDetailModal__infoValue}>
                                    {formatDate(order.created_at)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin khách hàng */}
                    <div className={styles.orderDetailModal__section}>
                        <h3 className={styles.orderDetailModal__sectionTitle}>
                            <FaUser className={styles.orderDetailModal__sectionTitleIcon} />
                            Thông tin khách hàng
                        </h3>
                        <div className={styles.orderDetailModal__infoGrid}>
                            <div className={styles.orderDetailModal__infoCard}>
                                <div className={styles.orderDetailModal__infoLabel}>Customer ID</div>
                                <div className={styles.orderDetailModal__infoValue}>{order.customer_id}</div>
                            </div>
                            <div className={styles.orderDetailModal__infoCard}>
                                <div className={styles.orderDetailModal__infoLabel}>Tên khách hàng</div>
                                <div className={styles.orderDetailModal__infoValue}>
                                    {order.customer_name || order.customer_username || 'N/A'}
                                </div>
                            </div>
                            {order.customer_email && (
                                <div className={styles.orderDetailModal__infoCard}>
                                    <div className={styles.orderDetailModal__infoLabel}>Email</div>
                                    <div className={styles.orderDetailModal__infoValue}>{order.customer_email}</div>
                                </div>
                            )}
                            {order.customer_phone && (
                                <div className={styles.orderDetailModal__infoCard}>
                                    <div className={styles.orderDetailModal__infoLabel}>Số điện thoại</div>
                                    <div className={styles.orderDetailModal__infoValue}>{order.customer_phone}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Danh sách sản phẩm */}
                    <div className={`${styles.orderDetailModal__section} ${styles['orderDetailModal__section--highlight']}`}>
                        <h3 className={styles.orderDetailModal__sectionTitle}>
                            <FaShoppingBag className={styles.orderDetailModal__sectionTitleIcon} />
                            Danh sách sản phẩm
                        </h3>

                        {loading ? (
                            <div className={styles.orderDetailModal__loading}>
                                <div className={styles.orderDetailModal__loadingSpinner}></div>
                                <div className={styles.orderDetailModal__loadingText}>Đang tải chi tiết sản phẩm...</div>
                            </div>
                        ) : items.length > 0 ? (
                            <div>
                                <table className={styles.orderDetailModal__productTable}>
                                    <thead className={styles.orderDetailModal__tableHeader}>
                                        <tr>
                                            <th className={styles.orderDetailModal__tableHeaderCell}>Ảnh</th>
                                            <th className={styles.orderDetailModal__tableHeaderCell}>Tên sản phẩm</th>
                                            <th className={styles.orderDetailModal__tableHeaderCell}>Màu</th>
                                            <th className={styles.orderDetailModal__tableHeaderCell}>Size</th>
                                            <th className={styles.orderDetailModal__tableHeaderCell}>SL</th>
                                            <th className={styles.orderDetailModal__tableHeaderCell}>Giá</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} className={styles.orderDetailModal__tableRow}>
                                                <td className={styles.orderDetailModal__tableCell}>
                                                    <img
                                                        src={getFullImageUrl(item.image_url) || '/placeholder-image.jpg'}
                                                        alt={item.product_name}
                                                        className={styles.orderDetailModal__productImage}
                                                        onError={(e) => {
                                                            e.target.src = '/placeholder-image.jpg';
                                                        }}
                                                    />
                                                </td>
                                                <td className={styles.orderDetailModal__tableCell}>
                                                    <div className={styles.orderDetailModal__productInfo}>
                                                        <div className={styles.orderDetailModal__productName}>
                                                            {item.product_name || 'N/A'}
                                                        </div>
                                                        <div className={styles.orderDetailModal__productId}>
                                                            ID: {item.product_id}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={styles.orderDetailModal__tableCell}>
                                                    <div className={styles.orderDetailModal__attributeTag}>
                                                        {item.color_name || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className={styles.orderDetailModal__tableCell}>
                                                    <div className={styles.orderDetailModal__attributeTag}>
                                                        {item.size_name || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className={styles.orderDetailModal__tableCell}>
                                                    <div className={styles.orderDetailModal__quantity}>
                                                        {item.quantity}
                                                    </div>
                                                </td>
                                                <td className={styles.orderDetailModal__tableCell}>
                                                    <div className={styles.orderDetailModal__price}>
                                                        {formatPrice(item.price * item.quantity)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Tổng kết đơn hàng */}
                                <div className={styles.orderDetailModal__totalSection}>
                                    <div className={styles.orderDetailModal__totalRow}>
                                        <span className={styles.orderDetailModal__totalLabel}>Tạm tính:</span>
                                        <span className={styles.orderDetailModal__totalValue}>{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className={styles.orderDetailModal__totalRow}>
                                        <span className={styles.orderDetailModal__totalLabel}>Phí vận chuyển:</span>
                                        <span className={styles.orderDetailModal__totalValue}>{formatPrice(shipping)}</span>
                                    </div>
                                    <div className={`${styles.orderDetailModal__totalRow} ${styles['orderDetailModal__totalRow--total']}`}>
                                        <span className={styles.orderDetailModal__totalLabel}>
                                            <FaDollarSign /> Tổng cộng:
                                        </span>
                                        <span className={`${styles.orderDetailModal__totalValue} ${styles['orderDetailModal__totalValue--total']}`}>
                                            {formatPrice(total)}
                                        </span>
                                    </div>
                                    {isRevenueOrder && (
                                        <div className={styles.orderDetailModal__totalRow}>
                                            <span className={styles.orderDetailModal__totalLabel} style={{ color: '#10b981' }}>
                                                <FaCheckCircle /> Doanh thu được ghi nhận:
                                            </span>
                                            <span className={styles.orderDetailModal__totalValue} style={{ color: '#10b981', fontWeight: 800 }}>
                                                {formatPrice(total)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.orderDetailModal__empty}>
                                <FaBoxOpen className={styles.orderDetailModal__emptyIcon} />
                                <h3>Không có sản phẩm</h3>
                                <p>Đơn hàng này không có sản phẩm nào.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.orderDetailModal__footer}>
                    <button
                        className={`${styles.orderDetailModal__btn} ${styles['orderDetailModal__btn--print']}`}
                        onClick={handlePrint}
                    >
                        <FaPrint />
                        In đơn hàng
                    </button>
                    <button
                        className={`${styles.orderDetailModal__btn} ${styles['orderDetailModal__btn--close']}`}
                        onClick={onClose}
                    >
                        <FaTimes />
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );

    // Sử dụng React Portal để render modal ở top level
    return createPortal(modalContent, document.body);
}

export default OrderDetailModal;