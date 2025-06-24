import React from 'react';
import {
    FaShoppingCart,
    FaHourglassHalf,
    FaCheckCircle,
    FaTimes,
    FaDollarSign,
    FaCalendarDay,
    FaShippingFast,
    FaCreditCard,
    FaArrowUp,
    FaArrowDown
} from 'react-icons/fa';
import styles from './OrderStats.module.scss';

function OrderStats({ orders }) {
    // Hàm kiểm tra đơn hàng đã thanh toán và xác nhận (doanh thu thực tế)
    const isValidRevenueOrder = (order) => {
        const isPaid = order.payment_status === 'Đã thanh toán' || order.payment_status === 'Đã thanh toán với QR';
        const isValidStatus = [
            'Hoàn thành',
            'Đã giao',
            'Đang giao hàng',
            'Đang giao',
            'Đã xác nhận' // Nếu backend cũng tính trạng thái này
        ].includes(order.order_status);
        return isPaid && isValidStatus;
    };

    // Tính toán các thống kê
    const stats = {
        // Thống kê cơ bản
        total: orders.length,
        pending: orders.filter(o => o.order_status === 'Chờ xác nhận').length,
        confirmed: orders.filter(o => o.order_status === 'Đã xác nhận').length,
        shipping: orders.filter(o => o.order_status === 'Đang giao' || o.order_status === 'Đang giao hàng').length,
        completed: orders.filter(o => o.order_status === 'Hoàn thành' || o.order_status === 'Đã giao').length,
        cancelled: orders.filter(o => o.order_status === 'Đã hủy').length,

        // Thống kê thanh toán
        paid: orders.filter(o =>
            o.payment_status === 'Đã thanh toán'
        ).length,
        unpaid: orders.filter(o => o.payment_status === 'Chưa thanh toán').length,

        // Doanh thu thực tế (chỉ tính đơn đã thanh toán và đang/đã giao)
        confirmedRevenue: orders
            .filter(isValidRevenueOrder)
            .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0),

        // Doanh thu tiềm năng (tất cả đơn chưa hủy)
        potentialRevenue: orders
            .filter(o => o.order_status !== 'Đã hủy')
            .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0),

        // Đơn hàng hôm nay
        todayOrders: orders.filter(o => {
            const today = new Date().toDateString();
            return new Date(o.created_at).toDateString() === today;
        }).length,

        // Doanh thu hôm nay
        todayRevenue: orders
            .filter(o => {
                const today = new Date().toDateString();
                const orderDate = new Date(o.created_at).toDateString();
                return orderDate === today && isValidRevenueOrder(o);
            })
            .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)
    };

    // Tính phần trăm so với tổng
    const getPercentage = (value, total) => {
        return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const statsCards = [
        {
            title: 'Tổng đơn hàng',
            value: stats.total.toLocaleString(),
            icon: FaShoppingCart,
            color: 'blue',
            description: 'Tất cả đơn hàng',
            meta: `${stats.todayOrders} đơn hôm nay`
        },
        {
            title: 'Chờ xác nhận',
            value: stats.pending.toLocaleString(),
            icon: FaHourglassHalf,
            color: 'orange',
            description: 'Cần xử lý ngay',
            meta: `${getPercentage(stats.pending, stats.total)}% tổng đơn`,
            percentage: getPercentage(stats.pending, stats.total)
        },
        {
            title: 'Đang giao hàng',
            value: stats.shipping.toLocaleString(),
            icon: FaShippingFast,
            color: 'indigo',
            description: 'Đang trên đường giao',
            meta: `${getPercentage(stats.shipping, stats.total)}% tổng đơn`
        },
        {
            title: 'Hoàn thành',
            value: stats.completed.toLocaleString(),
            icon: FaCheckCircle,
            color: 'green',
            description: 'Giao thành công',
            meta: `${getPercentage(stats.completed, stats.total)}% tổng đơn`
        },
        {
            title: 'Đã thanh toán',
            value: stats.paid.toLocaleString(),
            icon: FaCreditCard,
            color: 'purple',
            description: 'Đơn đã thu tiền',
            meta: `${getPercentage(stats.paid, stats.total)}% tổng đơn`
        },
        {
            title: 'Đã hủy',
            value: stats.cancelled.toLocaleString(),
            icon: FaTimes,
            color: 'red',
            description: 'Đơn bị hủy',
            meta: `${getPercentage(stats.cancelled, stats.total)}% tổng đơn`
        },
        {
            title: 'Doanh thu xác nhận',
            value: formatCurrency(stats.confirmedRevenue),
            icon: FaDollarSign,
            color: 'green',
            description: 'Đã thu thực tế',
            meta: `${formatCurrency(stats.todayRevenue)} hôm nay`
        },
        {
            title: 'Doanh thu tiềm năng',
            value: formatCurrency(stats.potentialRevenue),
            icon: FaDollarSign,
            color: 'yellow',
            description: 'Tổng giá trị đơn chưa hủy',
            meta: `Chờ xác nhận: ${formatCurrency(stats.potentialRevenue - stats.confirmedRevenue)}`
        }
    ];

    return (
        <div className={styles.orderStats}>
            <div className={styles.orderStats__grid}>
                {statsCards.map((card, index) => (
                    <div key={index} className={`${styles.orderStats__card} ${styles[`orderStats__card--${card.color}`]}`}>
                        <div className={styles.orderStats__cardContent}>
                            <div className={styles.orderStats__cardInfo}>
                                <h3 className={styles.orderStats__cardTitle}>{card.title}</h3>
                                <p className={styles.orderStats__cardValue}>{card.value}</p>
                                <p className={styles.orderStats__cardDescription}>{card.description}</p>
                            </div>
                            <div className={styles.orderStats__cardIcon}>
                                <card.icon />
                            </div>
                        </div>
                        {card.meta && (
                            <div className={styles.orderStats__cardMeta}>
                                <span>{card.meta}</span>
                                {card.percentage && (
                                    <div className={`${styles.orderStats__cardPercentage} ${parseFloat(card.percentage) > 15
                                        ? styles['orderStats__cardPercentage--negative']
                                        : styles['orderStats__cardPercentage--positive']
                                        }`}>
                                        {parseFloat(card.percentage) > 15 ? <FaArrowUp /> : <FaArrowDown />}
                                        {card.percentage}%
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OrderStats;