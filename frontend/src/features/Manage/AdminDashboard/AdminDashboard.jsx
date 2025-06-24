import React, { useState, useEffect } from 'react';
import {
    FaShoppingCart,
    FaUsers,
    FaBox,
    FaDollarSign,
    FaChartLine,
    FaHeart,
    FaStar,
    FaArrowUp,
    FaArrowDown,
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import adminService from '../../../services/adminService';
import productService from '../../../services/productService';
import RevenueChart from './RevenueChart';

import { getFullImageUrl } from '../../../utils/imageUtils';

import styles from './AdminDashboard.module.scss';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { exportDashboardReport } from './exportDashboardReport';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState({
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        totalReviews: 0,
        averageRating: 0,
        todayRevenue: 0,
        todayOrders: 0,
        newUsersToday: 0,
        revenueGrowth: 0
    });

    const [chartData, setChartData] = useState({
        revenueChart: null
    });

    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const statsResponse = await adminService.getDashboardStats();

            // ✅ DEBUG: Log toàn bộ response
            console.log('🔍 FULL API Response:', statsResponse);
            console.log('🔍 Response Status:', statsResponse.status);
            console.log('🔍 Response Data:', statsResponse.data);
            console.log('🔍 Response Data.data:', statsResponse.data?.data);

            if (statsResponse?.data?.data) {
                const backendData = statsResponse.data.data;

                // ✅ DEBUG: Log growth values với type
                console.log('📊 Backend Growth Values:', {
                    revenueGrowth: {
                        value: backendData.revenueGrowth,
                        type: typeof backendData.revenueGrowth
                    },
                    orderGrowth: {
                        value: backendData.orderGrowth,
                        type: typeof backendData.orderGrowth
                    },
                    userGrowth: {
                        value: backendData.userGrowth,
                        type: typeof backendData.userGrowth
                    },
                    productGrowth: {
                        value: backendData.productGrowth,
                        type: typeof backendData.productGrowth
                    }
                });

                const newDashboardData = {
                    totalOrders: parseInt(backendData.totalOrders) || 0,
                    totalUsers: parseInt(backendData.totalUsers) || 0,
                    totalProducts: parseInt(backendData.totalProducts) || 0,
                    totalRevenue: parseFloat(backendData.totalRevenue) || 0,
                    pendingOrders: parseInt(backendData.pendingOrders) || 0,
                    totalReviews: parseInt(backendData.totalReviews) || 0,
                    averageRating: parseFloat(backendData.averageRating) || 0,
                    todayRevenue: parseFloat(backendData.todayRevenue) || 0,
                    todayOrders: parseInt(backendData.todayOrders) || 0,
                    newUsersToday: parseInt(backendData.newUsersToday) || 0,
                    monthRevenue: parseFloat(backendData.monthRevenue) || 0,
                    // ✅ KIỂM TRA: Growth values
                    revenueGrowth: parseFloat(backendData.revenueGrowth) || 0,
                    orderGrowth: parseFloat(backendData.orderGrowth) || 0,
                    userGrowth: parseFloat(backendData.userGrowth) || 0,
                    productGrowth: parseFloat(backendData.productGrowth) || 0
                };

                // ✅ DEBUG: Log final dashboard data
                console.log('📊 Final Dashboard Data:', {
                    revenueGrowth: newDashboardData.revenueGrowth,
                    orderGrowth: newDashboardData.orderGrowth,
                    userGrowth: newDashboardData.userGrowth,
                    productGrowth: newDashboardData.productGrowth
                });

                setDashboardData(newDashboardData);
            } else {
                console.error('❌ No data received from API');
            }

            // Fetch orders for chart
            let orders = [];
            try {
                const ordersResponse = await adminService.getAllOrders();
                if (ordersResponse?.data?.orders) {
                    orders = Array.isArray(ordersResponse.data.orders) ? ordersResponse.data.orders : [];
                }
            } catch (error) {
                console.error('❌ Error fetching orders:', error);
                orders = [];
            }

            // Fetch products
            let products = [];
            try {
                const productsResponse = await adminService.getAllProducts();
                if (productsResponse?.data?.products) {
                    products = Array.isArray(productsResponse.data.products) ? productsResponse.data.products : [];
                }
            } catch (error) {
                console.error('❌ Error fetching products:', error);
                try {
                    const fallbackResponse = await productService.getAllInfoProducts();
                    if (fallbackResponse?.data && Array.isArray(fallbackResponse.data)) {
                        products = fallbackResponse.data;
                    }
                } catch (fallbackError) {
                    products = [];
                    console.error('❌ Error fetching fallback products:', fallbackError);
                }
            }

            // LẤY TOP PRODUCTS ĐÚNG API
            let topProductsArr = [];
            try {
                const topProductsResponse = await adminService.getTopProducts(8);
                console.log('🔍 Top Products Response:', topProductsResponse);

                if (topProductsResponse?.data?.data) {
                    topProductsArr = Array.isArray(topProductsResponse.data.data)
                        ? topProductsResponse.data.data
                        : [];
                }
            } catch (error) {
                console.error('❌ Error fetching top products:', error);
                topProductsArr = [];
            }
            setTopProducts(topProductsArr);

            prepareRevenueChart(orders);

        } catch (error) {
            console.error('❌ Dashboard Error:', error);
            setError('Không thể tải dữ liệu dashboard: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const prepareRevenueChart = (orders) => {
        if (!Array.isArray(orders)) return;

        const last7Days = [];
        const revenueData = [];

        const isValidRevenueOrder = (order) => {
            const isPaid = order.payment_status === 'Đã thanh toán' ||
                order.payment_status === 'Đã thanh toán với QR';
            const isValidStatus = order.order_status === 'Hoàn thành' ||
                order.order_status === 'Đã giao' ||
                order.order_status === 'Đang giao hàng';
            return isPaid && isValidStatus;
        };

        // ✅ Sửa cách tính toán ngày để tránh lỗi múi giờ
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0); // Reset về đầu ngày

            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);
            nextDate.setHours(0, 0, 0, 0); // Đầu ngày hôm sau

            // Format cho label
            last7Days.push(date.toLocaleDateString('vi-VN', {
                month: 'short',
                day: 'numeric'
            }));

            // ✅ So sánh chính xác thời gian thay vì dùng string
            const dayRevenue = orders
                .filter(order => {
                    if (!order.created_at) return false;

                    const orderDate = new Date(order.created_at);
                    const isValidRevenue = isValidRevenueOrder(order);

                    // So sánh thời gian chính xác
                    return orderDate >= date && orderDate < nextDate && isValidRevenue;
                })
                .reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);

            revenueData.push(dayRevenue);
        }

        // const revenueChart = {
        //     labels: last7Days,
        //     datasets: [
        //         {
        //             label: 'Doanh thu (VND)',
        //             data: revenueData,
        //             borderColor: 'rgb(59, 130, 246)',
        //             backgroundColor: 'rgba(59, 130, 246, 0.1)',
        //             tension: 0.4,
        //             fill: true,
        //             borderWidth: 3,
        //             pointBackgroundColor: 'rgb(59, 130, 246)',
        //             pointBorderColor: '#fff',
        //             pointBorderWidth: 2,
        //             pointRadius: 6,
        //         }
        //     ]
        // };

        // setChartData({ revenueChart });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    // Calculate trend percentages
    // const calculateTrend = (current, previous) => {
    //     if (!previous || previous === 0) return 0;
    //     return ((current - previous) / previous * 100).toFixed(1);
    // };

    const handleExportWord = () => {
        const userName = currentUser?.fullname || currentUser?.username || "Chưa đăng nhập";
        exportDashboardReport(selectedMonth, selectedYear, userName);
    };

    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loading__spinner}></div>
                <span className={styles.loading__text}>Đang tải dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.error}>
                <h3 className={styles.error__title}>Có lỗi xảy ra</h3>
                <p className={styles.error__message}>{error}</p>
                <button
                    onClick={() => {
                        setError(null);
                        fetchDashboardData();
                    }}
                    className={styles.error__button}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    // ✅ DEBUG: Log dashboardData trước khi tạo statsCards
    console.log('📊 Dashboard Data before statsCards:', dashboardData);

    const statsCards = [
        {
            label: 'Tổng đơn hàng',
            value: formatNumber(dashboardData.totalOrders),
            icon: FaShoppingCart,
            meta: `${dashboardData.pendingOrders} đang chờ xử lý`,
            metaType: 'warning',
            className: 'orders',
            trend: dashboardData.orderGrowth, // ✅ Kiểm tra giá trị này
            trendLabel: 'so với tháng trước'
        },
        {
            label: 'Tổng khách hàng',
            value: formatNumber(dashboardData.totalUsers),
            icon: FaUsers,
            meta: `${dashboardData.newUsersToday} mới hôm nay`,
            metaType: 'success',
            className: 'users',
            trend: dashboardData.userGrowth, // ✅ Kiểm tra giá trị này
            trendLabel: 'so với tháng trước'
        },
        {
            label: 'Tổng sản phẩm',
            value: formatNumber(dashboardData.totalProducts),
            icon: FaBox,
            meta: 'Đang bán',
            metaType: 'info',
            className: 'products',
            trend: dashboardData.productGrowth, // ✅ Kiểm tra giá trị này
            trendLabel: 'so với tháng trước'
        },
        {
            label: 'Doanh thu',
            value: formatCurrency(dashboardData.totalRevenue),
            icon: FaDollarSign,
            meta: `${formatCurrency(dashboardData.todayRevenue)} hôm nay`,
            metaType: 'success',
            className: 'revenue',
            trend: dashboardData.revenueGrowth, // ✅ Kiểm tra giá trị này
            trendLabel: 'so với tháng trước'
        }
    ];

    // ✅ DEBUG: Log statsCards
    console.log('📊 Stats Cards:', statsCards.map(card => ({
        label: card.label,
        trend: card.trend,
        trendType: typeof card.trend
    })));

    const additionalStats = [
        {
            label: 'Tổng đánh giá',
            value: formatNumber(dashboardData.totalReviews),
            icon: FaStar,
            className: 'reviews'
        },
        {
            label: 'Đánh giá trung bình',
            value: `${dashboardData.averageRating}/5`,
            icon: FaHeart,
            className: 'rating'
        }
    ];

    // const chartOptions = {
    //     responsive: true,
    //     maintainAspectRatio: false,
    //     plugins: {
    //         legend:
    //         {
    //             position: 'top',
    //             labels: {
    //                 usePointStyle: true,
    //                 padding: 20,
    //                 font: {
    //                     size: 14,
    //                     weight: '600'
    //                 }
    //             }
    //         },
    //         tooltip: {
    //             backgroundColor: 'rgba(0, 0, 0, 0.8)',
    //             titleColor: '#fff',
    //             bodyColor: '#fff',
    //             borderColor: 'rgba(59, 130, 246, 0.8)',
    //             borderWidth: 1,
    //             cornerRadius: 8,
    //             padding: 12
    //         }
    //     },
    //     scales: {
    //         x: {
    //             grid: {
    //                 display: false
    //             },
    //             ticks: {
    //                 font: {
    //                     weight: '600'
    //                 }
    //             }
    //         },
    //         y: {
    //             beginAtZero: true,
    //             grid: {
    //                 color: 'rgba(0, 0, 0, 0.05)'
    //             },
    //             ticks: {
    //                 callback: function (value) {
    //                     return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
    //                 },
    //                 font: {
    //                     weight: '600'
    //                 }
    //             }
    //         }
    //     },
    //     elements: {
    //         point: {
    //             hoverRadius: 8
    //         }
    //     }
    // };

    return (
        <div className={styles.dashboard}>
            <div className={styles.dashboard__header} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className={styles.dashboard__headerTitle} style={{ display: 'inline-block', marginRight: 24 }}>Dashboard Quản Trị</h1>
                    <span className={styles.dashboard__headerSubtitle}>
                        Tổng quan hoạt động của cửa hàng DNGSON
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                        style={{ padding: '0.4rem 0.7rem', borderRadius: 6, marginRight: 6 }}
                    >
                        {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        style={{ padding: '0.4rem 0.7rem', borderRadius: 6, marginRight: 12 }}
                    >
                        {[...Array(6)].map((_, i) => {
                            const year = now.getFullYear() - 2 + i;
                            return <option key={year} value={year}>{year}</option>;
                        })}
                    </select>
                    <button
                        onClick={handleExportWord}
                        style={{
                            padding: '0.5rem 1.25rem',
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Xuất báo cáo Word
                    </button>
                </div>
            </div>

            {/* Main Stats Cards */}
            <div className={styles.statsGrid}>
                {statsCards.map((stat, index) => (
                    <div key={index} className={`${styles.statCard} ${styles[`statCard--${stat.className}`]}`}>
                        <div className={styles.statCard__content}>
                            <div className={styles.statCard__info}>
                                <p className={styles.statCard__label}>{stat.label}</p>
                                <p className={styles.statCard__value}>{stat.value}</p>
                            </div>
                            <div className={styles.statCard__icon}>
                                <stat.icon />
                            </div>
                        </div>
                        <div className={styles.statCard__footer}>
                            <div className={`${styles.statCard__meta} ${styles[`statCard__meta--${stat.metaType}`]}`}>
                                {stat.meta}
                            </div>
                            {stat.trend !== undefined && (
                                <div className={`${styles.statCard__trend} ${stat.trend >= 0 ? styles['statCard__trend--up'] : styles['statCard__trend--down']}`}>
                                    {/* ✅ DEBUG: Log trend value */}
                                    {console.log(`🔍 Rendering trend for ${stat.label}:`, stat.trend, typeof stat.trend)}

                                    {stat.trend >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                                    <span>{Math.abs(stat.trend)}%</span>
                                    <small>{stat.trendLabel}</small>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Additional Stats */}
            <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                {additionalStats.map((stat, index) => (
                    <div key={index} className={`${styles.statCard} ${styles[`statCard--${stat.className}`]}`}>
                        <div className={styles.statCard__content}>
                            <div className={styles.statCard__info}>
                                <p className={styles.statCard__label}>{stat.label}</p>
                                <p className={styles.statCard__value}>{stat.value}</p>
                            </div>
                            <div className={styles.statCard__icon}>
                                <stat.icon />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Chart with Filters */}
            <RevenueChart />

            {/* Charts Section */}
            <div className={styles.chartsSection}>
                {/* 7-day Revenue Chart */}
                {/* <div className={styles.chartCard}>
                    <div className={styles.chartCard__header}>
                        <h3 className={styles.chartCard__title}>
                            <FaChartLine />
                            Doanh thu 7 ngày qua
                        </h3>
                    </div>
                    <div className={styles.chartCard__content}>
                        {chartData.revenueChart && (
                            <Line data={chartData.revenueChart} options={chartOptions} />
                        )}
                    </div>
                </div> */}
            </div>

            {/* Top Products - Đặt ngoài .chartsSection */}
            <div className={styles.topProductsCard}>
                <div className={styles.chartCard__header}>
                    <h3 className={styles.chartCard__title}>
                        <FaBox />
                        Sản phẩm hàng đầu
                    </h3>
                </div>
                <div className={styles.topProducts__list}>
                    {topProducts.map((product, index) => (
                        <div key={index} className={styles.topProducts__item}>
                            <div className={styles.topProducts__itemLeft}>
                                <div className={styles.topProducts__rank}>
                                    {index + 1}
                                </div>
                                <img
                                    src={getFullImageUrl(product.image_url) || getFullImageUrl(product.images?.[0]) || '/placeholder.jpg'}
                                    alt={product.product_name || product.name}
                                    className={styles.topProducts__image}
                                    onError={(e) => {
                                        e.target.src = '/placeholder.jpg';
                                    }}
                                />
                                <div className={styles.topProducts__info}>
                                    <p className={styles.topProducts__name}>
                                        {product.product_name || product.name}
                                    </p>
                                    <p className={styles.topProducts__id}>
                                        ID: {product.product_id || product.id}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.topProducts__stats}>
                                <p className={styles.topProducts__price}>
                                    {formatCurrency(product.final_price || product.price || product.variant_price || 0)}
                                    {product.discount > 0 && (
                                        <span className={styles.topProducts__oldPrice}>
                                            {formatCurrency(product.price)}
                                        </span>
                                    )}
                                </p>
                                <p className={styles.topProducts__stock}>
                                    Đã bán: {product.total_sold || 0}
                                </p>
                                <p className={styles.topProducts__stock}>
                                    Tồn kho: {product.total_stock ?? 0}
                                </p>
                                <p className={styles.topProducts__rating}>
                                    {Number(product.review_count || 0) === 0
                                        ? 'Không có đánh giá'
                                        : `Đánh giá: ${Number(product.average_rating || 0).toFixed(1)} / 5 ⭐`}
                                </p>
                            </div>
                        </div>
                    ))}
                    {topProducts.length === 0 && (
                        <div className={styles.topProducts__empty}>
                            <FaBox className={styles.topProducts__emptyIcon} />
                            <p>Không có sản phẩm nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;