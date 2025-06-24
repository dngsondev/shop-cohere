import React from 'react';
import { FaTimes, FaCalendarAlt } from 'react-icons/fa';
import styles from './OrderFilters.module.scss';

function OrderFilters({ filters, setFilters, onClose }) {
    const handleReset = () => {
        setFilters({
            status: 'all',
            paymentStatus: 'all',
            dateFrom: '',
            dateTo: '',
            sortBy: 'created_at',
            sortOrder: 'desc'
        });
    };

    return (
        <div className={styles.orderFilters}>
            <div className={styles.orderFilters__header}>
                <h3 className={styles.orderFilters__title}>
                    <FaCalendarAlt />
                    Bộ lọc nâng cao
                </h3>
                <button
                    onClick={onClose}
                    className={styles.orderFilters__close}
                >
                    <FaTimes />
                </button>
            </div>

            <div className={styles.orderFilters__content}>
                <div className={styles.orderFilters__group}>
                    <label className={styles.orderFilters__label}>Khoảng thời gian:</label>
                    <div className={styles.orderFilters__dateRange}>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            className={styles.orderFilters__input}
                        />
                        <span>đến</span>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                            className={styles.orderFilters__input}
                        />
                    </div>
                </div>

                <div className={styles.orderFilters__group}>
                    <label className={styles.orderFilters__label}>Trạng thái đơn hàng:</label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className={styles.orderFilters__select}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="Chờ xác nhận">Chờ xác nhận</option>
                        <option value="Đã xác nhận">Đã xác nhận</option>
                        <option value="Đang giao">Đang giao</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Đã hủy">Đã hủy</option>
                    </select>
                </div>

                <div className={styles.orderFilters__group}>
                    <label className={styles.orderFilters__label}>Trạng thái thanh toán:</label>
                    <select
                        value={filters.paymentStatus}
                        onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                        className={styles.orderFilters__select}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="Chưa thanh toán">Chưa thanh toán</option>
                        <option value="Đã thanh toán">Đã thanh toán</option>
                        <option value="Đã thanh toán với QR">Thanh toán QR</option>
                    </select>
                </div>

                <div className={styles.orderFilters__group}>
                    <label className={styles.orderFilters__label}>Sắp xếp theo:</label>
                    <div className={styles.orderFilters__sort}>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                            className={styles.orderFilters__select}
                        >
                            <option value="created_at">Ngày tạo</option>
                            <option value="total_price">Giá trị đơn hàng</option>
                            <option value="order_status">Trạng thái</option>
                            <option value="customer_name">Tên khách hàng</option>
                        </select>
                        <select
                            value={filters.sortOrder}
                            onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                            className={styles.orderFilters__select}
                        >
                            <option value="desc">Giảm dần</option>
                            <option value="asc">Tăng dần</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.orderFilters__actions}>
                <button
                    onClick={handleReset}
                    className={`${styles.orderFilters__btn} ${styles['orderFilters__btn--reset']}`}
                >
                    Đặt lại
                </button>
                <button
                    onClick={onClose}
                    className={`${styles.orderFilters__btn} ${styles['orderFilters__btn--apply']}`}
                >
                    Áp dụng
                </button>
            </div>
        </div>
    );
}

export default OrderFilters;