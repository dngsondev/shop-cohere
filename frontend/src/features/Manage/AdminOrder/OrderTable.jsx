import React, { useState } from "react";
import { FaEye, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import OrderRow from "./OrderRow";
import OrderDetailModal from "./OrderDetailModal";
import styles from './OrderTable.module.scss';

function OrderTable({ orders, loading, onRefresh }) {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <FaSort className={styles.orderTable__sortIcon} />;
        }
        return sortConfig.direction === 'asc'
            ? <FaSortUp className={styles.orderTable__sortIcon} />
            : <FaSortDown className={styles.orderTable__sortIcon} />;
    };

    if (loading) {
        return (
            <div className={styles.orderTable__loading}>
                <div className={styles.orderTable__loadingSpinner}></div>
                <span>Đang tải danh sách đơn hàng...</span>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className={styles.orderTable__empty}>
                <div className={styles.orderTable__emptyIcon}>📦</div>
                <h3>Không có đơn hàng nào</h3>
                <p>Chưa có đơn hàng nào được tạo hoặc không có đơn hàng phù hợp với bộ lọc.</p>
            </div>
        );
    }

    return (
        <div className={styles.orderTable}>
            <div className={styles.orderTable__container}>
                <table className={styles.orderTable__table}>
                    <thead className={styles.orderTable__header}>
                        <tr>
                            <th
                                className={styles.orderTable__headerCell}
                                onClick={() => handleSort('order_id')}
                            >
                                <div className={styles.orderTable__headerContent}>
                                    Mã ĐH
                                    {getSortIcon('order_id')}
                                </div>
                            </th>
                            <th className={styles.orderTable__headerCell}>Customer ID</th>
                            <th
                                className={styles.orderTable__headerCell}
                                onClick={() => handleSort('customer_name')}
                            >
                                <div className={styles.orderTable__headerContent}>
                                    Khách hàng
                                    {getSortIcon('customer_name')}
                                </div>
                            </th>
                            <th
                                className={styles.orderTable__headerCell}
                                onClick={() => handleSort('created_at')}
                            >
                                <div className={styles.orderTable__headerContent}>
                                    Ngày đặt
                                    {getSortIcon('created_at')}
                                </div>
                            </th>
                            <th className={styles.orderTable__headerCell}>Trạng thái</th>
                            <th className={styles.orderTable__headerCell}>Thanh toán</th>
                            <th
                                className={styles.orderTable__headerCell}
                                onClick={() => handleSort('total_price')}
                            >
                                <div className={styles.orderTable__headerContent}>
                                    Tổng tiền
                                    {getSortIcon('total_price')}
                                </div>
                            </th>
                            <th className={styles.orderTable__headerCell}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody className={styles.orderTable__body}>
                        {orders.map((order) => (
                            <OrderRow
                                key={order.order_id}
                                order={order}
                                onViewDetail={() => setSelectedOrder(order)}
                                onRefresh={onRefresh}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onRefresh={onRefresh}
                />
            )}
        </div>
    );
}

export default OrderTable;