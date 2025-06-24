import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import adminService from '../../../services/adminService';

// Hàm xuất báo cáo dashboard theo tháng
export async function exportDashboardReport(month, year, userName) {
    const statsResponse = await adminService.getDashboardStatsByMonth(month, year);
    const backendData = statsResponse?.data?.data || {};

    const topProductsResponse = await adminService.getTopProductsByMonth(month, year, 10);
    const topProducts = topProductsResponse?.data?.data || [];

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

    // Tổng quan tháng
    const overviewRows = [
        new TableRow({
            children: [
                centerCell("Tháng/Năm"),
                centerCell(`${month}/${year}`),
                centerCell("Tổng đơn hàng"),
                centerCell(formatNumber(backendData.total_orders || 0)),
            ],
        }),
        new TableRow({
            children: [
                centerCell("Khách hàng mới"),
                centerCell(formatNumber(backendData.new_customers || 0)),
                centerCell("Sản phẩm mới"),
                centerCell(formatNumber(backendData.new_products || 0)),
            ],
        }),
        new TableRow({
            children: [
                centerCell("Doanh thu tháng"),
                centerCell(formatCurrency(backendData.total_revenue || 0)),
                // centerCell("So với tháng trước"),
                // centerCell("0%"), // Nếu muốn so sánh, cần thêm truy vấn backend
            ],
        }),
    ];

    // Bảng top sản phẩm bán chạy
    const topProductRows = [
        new TableRow({
            children: [
                centerCell("STT"),
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
                            new TextRun({ text: `Người xuất hoá đơn: ${userName}`, bold: false, size: 28 }),
                        ],
                        spacing: { after: 100 },
                        alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Ngày xuất: ${now.toLocaleDateString('vi-VN')}`, size: 28 }),
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
                ],
            }
        ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `BaoCaoDashboard_Thang${month}_${year}.docx`);
}