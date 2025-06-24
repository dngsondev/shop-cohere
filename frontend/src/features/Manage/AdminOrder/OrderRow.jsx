import React, { useState } from "react";
import { FaEye, FaEdit, FaSpinner, FaCheckCircle, FaTimes } from "react-icons/fa";
import adminService from "../../../services/adminService";
import styles from './OrderRow.module.scss';

function OrderRow({ order, onViewDetail, onRefresh }) {
    const [updating, setUpdating] = useState(false);

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

    const getStatusBadge = (status) => {
        const statusMap = {
            'Chờ xác nhận': { class: 'pending', text: 'Chờ xác nhận' },
            'Đã xác nhận': { class: 'confirmed', text: 'Đã xác nhận' },
            'Đang giao': { class: 'shipping', text: 'Đang giao' },
            'Đang giao hàng': { class: 'shipping', text: 'Đang giao' },
            'Hoàn thành': { class: 'completed', text: 'Hoàn thành' },
            'Đã giao': { class: 'completed', text: 'Đã giao' },
            'Đã hủy': { class: 'cancelled', text: 'Đã hủy' }
        };

        const statusInfo = statusMap[status] || { class: 'pending', text: status };
        return (
            <span className={`${styles.orderRow__badge} ${styles[`orderRow__badge--${statusInfo.class}`]}`}>
                {statusInfo.text}
            </span>
        );
    };

    const getPaymentBadge = (status) => {
        const paymentMap = {
            'Chưa thanh toán': { class: 'unpaid', text: 'Chưa thanh toán' },
            'Đã thanh toán': { class: 'paid', text: 'Đã thanh toán' },
            'Đã thanh toán với QR': { class: 'qr', text: 'QR Pay' }
        };

        const paymentInfo = paymentMap[status] || { class: 'unpaid', text: status };
        return (
            <span className={`${styles.orderRow__badge} ${styles[`orderRow__badge--${paymentInfo.class}`]}`}>
                {paymentInfo.text}
            </span>
        );
    };

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        if (newStatus === order.order_status) return;

        setUpdating(true);
        try {
            await adminService.updateOrderStatus(order.order_id, newStatus);
            onRefresh();
        } catch (err) {
            console.error('❌ Error updating order status:', err);
            alert("Lỗi cập nhật trạng thái: " + (err.response?.data?.message || err.message));
        } finally {
            setUpdating(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
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

    // Kiểm tra đơn hàng có được tính vào doanh thu
    const isRevenueOrder = isValidRevenueOrder(order);

    return (
        <tr className={`${styles.orderRow} ${isRevenueOrder ? styles['orderRow--revenue'] : ''}`}>
            <td className={styles.orderRow__cell}>
                <div className={styles.orderRow__orderId}>
                    #{order.order_id}
                    {isRevenueOrder && (
                        <FaCheckCircle
                            className={styles.orderRow__revenueIcon}
                            title="Đơn hàng được tính vào doanh thu"
                        />
                    )}
                </div>
            </td>

            <td className={styles.orderRow__cell}>
                <div className={styles.orderRow__customerId}>
                    {order.customer_id}
                </div>
            </td>

            <td className={styles.orderRow__cell}>
                <div className={styles.orderRow__customerInfo}>
                    <div className={styles.orderRow__customerName}>
                        {order.customer_name || order.customer_username || 'N/A'}
                    </div>
                    {order.customer_email && (
                        <div className={styles.orderRow__customerEmail}>
                            {order.customer_email}
                        </div>
                    )}
                </div>
            </td>

            <td className={styles.orderRow__cell}>
                <div className={styles.orderRow__date}>
                    {formatDate(order.created_at)}
                </div>
            </td>

            <td className={styles.orderRow__cell}>
                <div className={styles.orderRow__statusContainer}>
                    {updating ? (
                        <div className={styles.orderRow__updating}>
                            <FaSpinner className={styles.orderRow__spinner} />
                            Đang cập nhật...
                        </div>
                    ) : (
                        <select
                            value={order.order_status || "Chờ xác nhận"}
                            onChange={handleStatusChange}
                            className={styles.orderRow__statusSelect}
                            disabled={updating}
                        >
                            <option value="Chờ xác nhận">Chờ xác nhận</option>
                            <option value="Đã xác nhận">Đã xác nhận</option>
                            <option value="Đang giao">Đang giao</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                            <option value="Đã hủy">Đã hủy</option>
                        </select>
                    )}
                </div>
            </td>

            <td className={styles.orderRow__cell}>
                {getPaymentBadge(order.payment_status)}
            </td>

            <td className={styles.orderRow__cell}>
                <div className={`${styles.orderRow__price} ${isRevenueOrder ? styles['orderRow__price--confirmed'] : ''}`}>
                    {formatCurrency(order.total_price)}
                    {isRevenueOrder && (
                        <div className={styles.orderRow__revenueLabel}>
                            Tính doanh thu
                        </div>
                    )}
                </div>
            </td>

            <td className={styles.orderRow__cell}>
                <div className={styles.orderRow__actions}>
                    <button
                        onClick={onViewDetail}
                        className={`${styles.orderRow__action} ${styles['orderRow__action--view']}`}
                        title="Xem chi tiết"
                    >
                        <FaEye />
                        <span>Chi tiết</span>
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default OrderRow;