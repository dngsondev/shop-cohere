import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import adminService from '../../../services/adminService';
import styles from './RevenueChart.module.scss';

function RevenueChart() {
    const [chartData, setChartData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        groupBy: 'day'
    });

    useEffect(() => {
        fetchRevenueData();
    }, [filters]);

    const fetchRevenueData = async () => {
        setLoading(true);
        try {
            const response = await adminService.getRevenueByDateRange(
                filters.startDate,
                filters.endDate,
                filters.groupBy
            );
            console.log('Revenue API response:', response.data); // Thêm dòng này

            if (response.data.success) {
                const { summary, chartData: rawData } = response.data.data;
                setSummary({
                    ...summary,
                    // Sửa lại average_order_value nếu cần
                    average_order_value: summary.completed_orders > 0
                        ? summary.confirmed_revenue / summary.completed_orders
                        : 0
                });

                const labels = rawData.map(item => {
                    const period = item.period;
                    switch (filters.groupBy) {
                        case 'day':
                            return new Date(period).toLocaleDateString('vi-VN');
                        case 'month':
                            return period;
                        case 'year':
                            return period.toString();
                        default:
                            return period;
                    }
                });

                const revenueData = rawData.map(item => item.confirmed_revenue || 0);
                const orderData = rawData.map(item => item.total_orders || 0);

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Doanh thu đã xác nhận (VND)',
                            data: revenueData,
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y',
                            borderWidth: 3,
                            pointBackgroundColor: 'rgb(59, 130, 246)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                        },
                        {
                            label: 'Số đơn hàng',
                            data: orderData,
                            borderColor: 'rgb(34, 197, 94)',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1',
                            borderWidth: 3,
                            pointBackgroundColor: 'rgb(34, 197, 94)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                        }
                    ]
                });
            }
        } catch (error) {
            console.error('❌ Error fetching revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Thời gian',
                    font: {
                        size: 14,
                        weight: '600'
                    }
                },
                grid: {
                    display: false
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Doanh thu (VND)',
                    font: {
                        size: 14,
                        weight: '600'
                    }
                },
                ticks: {
                    callback: function (value) {
                        return new Intl.NumberFormat('vi-VN').format(value);
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Số đơn hàng',
                    font: {
                        size: 14,
                        weight: '600'
                    }
                },
                grid: {
                    drawOnChartArea: false,
                }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 14,
                        weight: '600'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(59, 130, 246, 0.8)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        if (label.includes('Doanh thu')) {
                            return `${label}: ${formatCurrency(value)}`;
                        }
                        return `${label}: ${value}`;
                    }
                }
            }
        }
    };

    return (
        <div className={styles.revenueChart}>
            <div className={styles.revenueChart__header}>
                <h3 className={styles.revenueChart__headerTitle}>
                    📊 Thống kê doanh thu theo thời gian
                </h3>

                {/* Filters */}
                <div className={styles.revenueChart__filters}>
                    <div className={styles.revenueChart__filterGroup}>
                        <label className={styles.revenueChart__filterGroupLabel}>Từ ngày:</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            className={styles.revenueChart__filterGroupInput}
                        />
                    </div>
                    <div className={styles.revenueChart__filterGroup}>
                        <label className={styles.revenueChart__filterGroupLabel}>Đến ngày:</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            className={styles.revenueChart__filterGroupInput}
                        />
                    </div>
                    <div className={styles.revenueChart__filterGroup}>
                        <label className={styles.revenueChart__filterGroupLabel}>Nhóm theo:</label>
                        <select
                            value={filters.groupBy}
                            onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value }))}
                            className={styles.revenueChart__filterGroupInput}
                        >
                            <option value="day">Ngày</option>
                            <option value="week">Tuần</option>
                            <option value="month">Tháng</option>
                            <option value="year">Năm</option>
                        </select>
                    </div>
                </div>

                {/* Summary Stats */}
                {summary && (
                    <div className={styles.revenueChart__summary}>
                        <div className={`${styles.revenueChart__summaryCard} ${styles['revenueChart__summaryCard--blue']}`}>
                            <p className={styles.revenueChart__summaryCardLabel}>Tổng doanh thu</p>
                            <p className={`${styles.revenueChart__summaryCardValue} ${styles['revenueChart__summaryCardValue--blue']}`}>
                                {formatCurrency(summary.confirmed_revenue)}
                            </p>
                        </div>
                        <div className={`${styles.revenueChart__summaryCard} ${styles['revenueChart__summaryCard--green']}`}>
                            <p className={styles.revenueChart__summaryCardLabel}>Tổng đơn hàng</p>
                            <p className={`${styles.revenueChart__summaryCardValue} ${styles['revenueChart__summaryCardValue--green']}`}>
                                {summary.total_orders}
                            </p>
                        </div>
                        <div className={`${styles.revenueChart__summaryCard} ${styles['revenueChart__summaryCard--purple']}`}>
                            <p className={styles.revenueChart__summaryCardLabel}>Giá trị TB/đơn</p>
                            <p className={`${styles.revenueChart__summaryCardValue} ${styles['revenueChart__summaryCardValue--purple']}`}>
                                {formatCurrency(summary.average_order_value)}
                            </p>
                        </div>
                        <div className={`${styles.revenueChart__summaryCard} ${styles['revenueChart__summaryCard--orange']}`}>
                            <p className={styles.revenueChart__summaryCardLabel}>Đơn hoàn thành</p>
                            <p className={`${styles.revenueChart__summaryCardValue} ${styles['revenueChart__summaryCardValue--orange']}`}>
                                {summary.completed_orders}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className={styles.revenueChart__chartContainer}>
                {loading ? (
                    <div className={styles.revenueChart__loading}>
                        Đang tải dữ liệu...
                    </div>
                ) : chartData ? (
                    <Line data={chartData} options={chartOptions} />
                ) : (
                    <div className={styles.revenueChart__noData}>
                        Không có dữ liệu
                    </div>
                )}
            </div>

            {/* Top Products */}
            {/* 
<div className={styles.topProducts}>
    <h3 className={styles.topProducts__title}>🌟 Sản phẩm bán chạy nhất</h3>
    <div className={styles.topProducts__list}>
        {topProducts.length === 0 ? (
            <div className={styles.topProducts__noData}>Không có dữ liệu sản phẩm</div>
        ) : (
            topProducts.map((product, index) => (
                <div key={index} className={styles.topProducts__item}>
                    <div className={styles.topProducts__itemLeft}>
                        <div className={styles.topProducts__rank}>{index + 1}</div>
                        <img
                            src={product.image_url || '/placeholder.jpg'}
                            alt={product.product_name}
                            className={styles.topProducts__image}
                        />
                        <div className={styles.topProducts__info}>
                            <p className={styles.topProducts__name}>{product.product_name}</p>
                            <p className={styles.topProducts__id}>ID: {product.product_id}</p>
                        </div>
                    </div>
                    <div className={styles.topProducts__stats}>
                        <p className={styles.topProducts__price}>
                            {formatCurrency(product.final_price || product.price || 0)}
                        </p>
                        <p className={styles.topProducts__stock}>
                            Đã bán: {product.total_sold || 0}
                        </p>
                        <p className={styles.topProducts__stock}>
                            Tồn kho: {product.total_stock ?? 0}
                        </p>
                        <p className={styles.topProducts__rating}>
                            {Number(product.average_rating || 0) === 0
                                ? 'Không có đánh giá'
                                : `Đánh giá: ${Number(product.average_rating || 0).toFixed(1)} / 5 ⭐`}
                        </p>
                    </div>
                </div>
            ))
        )}
    </div>
</div>
*/}
        </div>
    );
}

export default RevenueChart;