import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import adminService from '../../../services/adminService';

// Hàm xuất báo cáo dashboard theo tháng
export async function exportDashboardReport(month, year, userName) {
    const statsResponse = await adminService.getDashboardStatsByMonth(month, year);
    const backendData = statsResponse?.data?.data || {};

    const topProductsResponse = await adminService.getTopProductsByMonth(month, year, 10);
    const topProducts = topProductsResponse?.data?.data || [];

    // Giả sử bạn đã có biến dailyStats là mảng dữ liệu từng ngày trong tháng
    // dailyStats = [{ date: '2025-07-01', orders: 2, revenue: 100000, new_users: 1 }, ...]
    const dailyStatsResponse = await adminService.getDailyStatsByMonth(month, year);
    const dailyStats = dailyStatsResponse?.data?.data || [];
    console.log("Daily Stats:", dailyStats);


    // Format helper
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num);

    // Helper tạo cell căn giữa
    const centerCell = (text, opts = {}) =>
        new TableCell({
            ...opts,
            children: [
                new Paragraph({
                    children: [typeof text === 'string' ? new TextRun(text) : text],
                    alignment: AlignmentType.CENTER,
                }),
            ],
            verticalAlign: "center",
        });

    // Lấy đúng trường dữ liệu từ backend (theo tháng)
    const newCustomers = backendData.users_this_month || 0;
    const newProducts = backendData.products_this_month || 0;
    const totalOrders = backendData.orders_this_month || 0;
    const totalRevenue = backendData.revenue_this_month || 0;
    const revenueGrowth = backendData.revenue_growth ?? 0;

    // Tổng quan tháng
    const overviewRows = [
        new TableRow({
            children: [
                centerCell("Tháng/Năm"),
                centerCell(`${month}/${year}`),
                centerCell("Tổng đơn hàng"),
                centerCell(totalOrders.toString()),
            ],
        }),
        new TableRow({
            children: [
                centerCell("Khách hàng mới"),
                centerCell(formatNumber(newCustomers)),
                centerCell("Sản phẩm mới"),
                centerCell(formatNumber(newProducts)),
            ],
        }),
        new TableRow({
            children: [
                centerCell("Doanh thu tháng"),
                centerCell(formatCurrency(totalRevenue)),
                centerCell("So với tháng trước"),
                centerCell(
                    (revenueGrowth > 0 ? "+" : "") + revenueGrowth + " %"
                ),
            ],
        }),
    ];

    // Bảng top sản phẩm bán chạy
    const topProductRows = [
        new TableRow({
            children: [
                centerCell("STT"),
                centerCell("Mã sản phẩm"), // Thêm cột mã sản phẩm
                centerCell("Tên sản phẩm"),
                centerCell("Đã bán"),
                centerCell("Tồn kho"),
                centerCell("Giá bán"),
                centerCell("Đánh giá TB"),
            ],
        }),
        ...topProducts.map((p, idx) =>
            new TableRow({
                children: [
                    centerCell((idx + 1).toString()),
                    centerCell(p.product_id?.toString() || ""), // Hiển thị mã sản phẩm
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [new TextRun(p.product_name || p.name)],
                                alignment: AlignmentType.LEFT,
                            }),
                        ],
                        verticalAlign: "center",
                    }),
                    centerCell((p.total_sold || 0).toString()),
                    centerCell((p.total_stock ?? 0).toString()),
                    centerCell(formatCurrency(p.final_price || p.price || 0)),
                    centerCell(`${Number(p.average_rating || 0).toFixed(1)} sao`),
                ],
            })
        ),
    ];

    // Tạo bảng thống kê từng ngày
    const dailyRows = [
        new TableRow({
            children: [
                centerCell("Ngày"),
                centerCell("Đơn hàng"),
                centerCell("Khách mới"),
                centerCell("Doanh thu"),
                centerCell("Sản phẩm (mã SP)"), // Thêm cột này
            ],
        }),
        ...dailyStats.map(d =>
            new TableRow({
                children: [
                    centerCell(new Date(d.date).toLocaleDateString('vi-VN')),
                    centerCell(
                        d.orders
                            ? `${d.orders}${d.pending_orders && d.pending_orders > 0 ? ` (${d.pending_orders} đang chờ xử lý)` : ""}`
                            : "0"
                    ),
                    centerCell(d.new_users?.toString() || "0"),
                    centerCell(formatCurrency(d.revenue || 0)),
                    centerCell(
                        Array.isArray(d.product_ids) && d.product_ids.length > 0
                            ? d.product_ids
                                .map(pid =>
                                    d.pending_product_ids && d.pending_product_ids.includes(pid)
                                        ? `${pid}*`
                                        : pid
                                )
                                .join(", ")
                            : ""
                    ),
                ],
            })
        ),
    ];

    const now = new Date();
    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `BÁO CÁO HOẠT ĐỘNG THÁNG ${month}/${year}`,
                                bold: true,
                                size: 48,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Công ty: DNGSON", bold: false, size: 28 }),
                        ],
                        spacing: { after: 100 },
                        alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Người xuất báo cáo: ${userName}`, bold: false, size: 28 }),
                        ],
                        spacing: { after: 100 },
                        alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Ngày xuất báo cáo: ${now.toLocaleDateString('vi-VN')}`, size: 28 }),
                        ],
                        spacing: { after: 200 },
                        alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                        text: "I. Tổng quan tháng",
                        bold: true,
                        spacing: { after: 100 },
                        alignment: AlignmentType.LEFT,
                    }),
                    new Table({
                        rows: overviewRows,
                        width: { size: 100, type: "pct" },
                    }),
                    new Paragraph({
                        text: "II. Top sản phẩm bán chạy",
                        bold: true,
                        spacing: { before: 300, after: 100 },
                        alignment: AlignmentType.LEFT,
                    }),
                    new Table({
                        rows: topProductRows,
                        width: { size: 100, type: "pct" },
                    }),
                    new Paragraph({
                        text: "III. Thống kê từng ngày trong tháng",
                        bold: true,
                        spacing: { before: 300, after: 100 },
                        alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `*: Những sản phẩm đang được xử lí`, size: 18 }),
                        ],
                        spacing: { after: 200 },
                        alignment: AlignmentType.LEFT,
                    }),
                    new Table({
                        rows: dailyRows,
                        width: { size: 100, type: "pct" },
                    }),
                ],
            }
        ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `BaoCaoDashboard_Thang${month}_${year}.docx`);
}