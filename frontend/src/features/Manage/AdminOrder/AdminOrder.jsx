import React, { useState, useEffect } from "react";
import {
    FaSearch,
    FaFilter,
    FaDownload,
    FaSync,
    FaEye,
    FaSort,
    FaChartLine
} from "react-icons/fa";
import OrderTable from "./OrderTable";
import OrderStats from "./OrderStats";
// import OrderFilters from "./OrderFilters";
import adminService from "../../../services/adminService";
import styles from './AdminOrder.module.scss';

function AdminOrder() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        paymentStatus: 'all',
        dateFrom: '',
        dateTo: '',
        sortBy: 'created_at',
        sortOrder: 'desc'
    });
    // const [showFilters, setShowFilters] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            console.log('🔄 Fetching orders via adminService...');
            const res = await adminService.getAllOrders();

            if (res?.data?.orders) {
                setOrders(res.data.orders);
                setFilteredOrders(res.data.orders);
                console.log('✅ Orders loaded:', res.data.orders.length);
            } else {
                console.warn('⚠️ Unexpected response format:', res);
                setOrders([]);
                setFilteredOrders([]);
            }
        } catch (err) {
            console.error("❌ Error fetching orders:", err);
            setOrders([]);
            setFilteredOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter và search orders
    useEffect(() => {
        let filtered = [...orders];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.order_id.toString().includes(searchTerm) ||
                order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_username?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(order => order.order_status === filters.status);
        }

        // Payment status filter
        if (filters.paymentStatus !== 'all') {
            filtered = filtered.filter(order => order.payment_status === filters.paymentStatus);
        }

        // Date range filter
        if (filters.dateFrom) {
            filtered = filtered.filter(order =>
                new Date(order.created_at) >= new Date(filters.dateFrom)
            );
        }
        if (filters.dateTo) {
            filtered = filtered.filter(order =>
                new Date(order.created_at) <= new Date(filters.dateTo + ' 23:59:59')
            );
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue = a[filters.sortBy];
            let bValue = b[filters.sortBy];

            if (filters.sortBy === 'created_at') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else if (filters.sortBy === 'total_price') {
                aValue = parseFloat(aValue || 0);
                bValue = parseFloat(bValue || 0);
            }

            if (filters.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredOrders(filtered);
    }, [orders, searchTerm, filters]);

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

    // Tính toán doanh thu từ danh sách đã lọc
    const calculateRevenue = (orderList) => {
        const confirmedRevenue = orderList
            .filter(isValidRevenueOrder)
            .reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);

        const potentialRevenue = orderList
            .filter(order => order.order_status !== 'Đã hủy')
            .reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);

        return { confirmedRevenue, potentialRevenue };
    };

    const handleExportOrders = () => {
        const { confirmedRevenue, potentialRevenue } = calculateRevenue(filteredOrders);

        const csvContent = "data:text/csv;charset=utf-8,"
            + "=== BÁO CÁO ĐỜN HÀNG ===\n"
            + `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n`
            + `Tổng số đơn: ${filteredOrders.length}\n`
            + `Doanh thu xác nhận: ${confirmedRevenue.toLocaleString('vi-VN')} VND\n`
            + `Doanh thu tiềm năng: ${potentialRevenue.toLocaleString('vi-VN')} VND\n`
            + "\nCHI TIẾT ĐỜN HÀNG:\n"
            + "Mã ĐH,Khách hàng,Ngày đặt,Trạng thái,Thanh toán,Tổng tiền,Tính doanh thu\n"
            + filteredOrders.map(order => [
                order.order_id,
                `"${order.customer_name || order.customer_username || 'N/A'}"`,
                new Date(order.created_at).toLocaleDateString('vi-VN'),
                `"${order.order_status || 'N/A'}"`,
                `"${order.payment_status || 'N/A'}"`,
                parseFloat(order.total_price || 0).toLocaleString('vi-VN'),
                isValidRevenueOrder(order) ? 'Có' : 'Không'
            ].join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `orders_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Tính toán thống kê hiển thị
    const { confirmedRevenue, potentialRevenue } = calculateRevenue(filteredOrders);

    return (
        <div className={styles.adminOrder}>
            <div className={styles.adminOrder__header}>
                <div className={styles.adminOrder__title}>
                    <h1>Quản lý đơn hàng</h1>
                    <p>Quản lý và theo dõi tất cả đơn hàng của khách hàng</p>
                </div>

                <div className={styles.adminOrder__actions}>
                    {/* <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`${styles.adminOrder__btn} ${styles['adminOrder__btn--filter']}`}
                    >
                        <FaFilter />
                        Bộ lọc
                    </button> */}
                    {/* <button
                        onClick={handleExportOrders}
                        className={`${styles.adminOrder__btn} ${styles['adminOrder__btn--export']}`}
                    >
                        <FaDownload />
                        Xuất báo cáo
                    </button> */}
                    <button
                        onClick={fetchOrders}
                        className={`${styles.adminOrder__btn} ${styles['adminOrder__btn--refresh']}`}
                        disabled={loading}
                    >
                        <FaSync className={loading ? styles.spinning : ''} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Order Statistics */}
            <OrderStats orders={orders} />

            {/* Search and Filters */}
            <div className={styles.adminOrder__controls}>
                <div className={styles.adminOrder__search}>
                    <FaSearch className={styles.adminOrder__searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.adminOrder__searchInput}
                    />
                </div>

                <div className={styles.adminOrder__quickFilters}>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className={styles.adminOrder__select}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="Chờ xác nhận">Chờ xác nhận</option>
                        <option value="Đã xác nhận">Đã xác nhận</option>
                        <option value="Đang giao">Đang giao</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Đã hủy">Đã hủy</option>
                    </select>

                    <select
                        value={filters.paymentStatus}
                        onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                        className={styles.adminOrder__select}
                    >
                        <option value="all">Tất cả thanh toán</option>
                        <option value="Chưa thanh toán">Chưa thanh toán</option>
                        <option value="Đã thanh toán">Đã thanh toán</option>
                        <option value="Đã thanh toán với QR">Thanh toán QR</option>
                    </select>

                    <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                        className={styles.adminOrder__select}
                    >
                        <option value="created_at">Ngày tạo</option>
                        <option value="total_price">Giá trị</option>
                        <option value="order_status">Trạng thái</option>
                    </select>

                    <button
                        onClick={() => setFilters(prev => ({
                            ...prev,
                            sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                        }))}
                        className={`${styles.adminOrder__btn} ${styles['adminOrder__btn--sort']}`}
                    >
                        <FaSort />
                        {filters.sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            {/* {showFilters && (
                <OrderFilters
                    filters={filters}
                    setFilters={setFilters}
                    onClose={() => setShowFilters(false)}
                />
            )} */}

            {/* Results Summary với doanh thu chính xác */}
            <div className={styles.adminOrder__summary}>
                <div className={styles.adminOrder__summaryItem}>
                    <span>Hiển thị:</span>
                    <strong>{filteredOrders.length}</strong>
                    <span>/ {orders.length} đơn hàng</span>
                </div>
                <div className={styles.adminOrder__summaryItem}>
                    <span>Doanh thu xác nhận:</span>
                    <strong style={{ color: '#10b981' }}>
                        {confirmedRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </strong>
                </div>
                <div className={styles.adminOrder__summaryItem}>
                    <span>Doanh thu tiềm năng:</span>
                    <strong style={{ color: '#f59e0b' }}>
                        {potentialRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </strong>
                </div>
                <div className={styles.adminOrder__summaryItem}>
                    <FaChartLine style={{ color: '#6366f1' }} />
                    <span>Tỷ lệ xác nhận:</span>
                    <strong style={{ color: '#6366f1' }}>
                        {potentialRevenue > 0 ? ((confirmedRevenue / potentialRevenue) * 100).toFixed(1) : 0}%
                    </strong>
                </div>
            </div>

            {/* Order Table */}
            <div className={styles.adminOrder__table}>
                <OrderTable
                    orders={filteredOrders}
                    loading={loading}
                    onRefresh={fetchOrders}
                />
            </div>
        </div>
    );
}

export default AdminOrder;