import { useState } from 'react';
import ProductRow from './ProductRow';

const ITEMS_PER_PAGE = 20; // Số sản phẩm mỗi trang

function ProductTable({ products, onEdit, onDelete, isLoading }) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const paginatedProducts = products.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleEditFromTable = (product) => {
        if (typeof onEdit === 'function') {
            onEdit(product);
        } else {
            console.error("❌ ProductTable - onEdit is not a function");
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto border border-gray-200">
            <table className="min-w-[1600px] w-full text-left table-auto">
                <thead className="bg-gray-100 text-sm font-semibold text-gray-600">
                    <tr>
                        <th className="px-4 py-3 min-w-[120px] text-center">Hình ảnh</th>
                        <th className="px-4 py-3 min-w-[180px] text-center">Tên sản phẩm</th>
                        <th className="px-4 py-3 text-center min-w-[140px]">Trạng thái</th>
                        <th className="px-4 py-3 min-w-[120px] text-center">Hãng</th>
                        <th className="px-4 py-3 min-w-[120px] text-center">Loại</th>
                        <th className="px-4 py-3 min-w-[120px] text-center">Chất liệu</th>
                        <th className="px-4 py-3 min-w-[120px] text-center">Kích thước</th>
                        <th className="px-4 py-3 min-w-[140px] text-center">Màu sắc</th>
                        <th className="px-4 py-3 min-w-[120px] text-center">Đối tượng</th>
                        <th className="px-4 py-3 min-w-[120px] text-center">Đơn giá</th>
                        <th className="px-4 py-3 min-w-[100px] text-center">Giảm giá</th>
                        <th className="px-4 py-3 min-w-[140px] text-center">Giá sau giảm</th>
                        <th className="px-4 py-3 text-center min-w-[250px]">Mô tả</th>
                        <th className="px-4 py-3 text-center min-w-[140px]">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedProducts.length === 0 ? (
                        <tr>
                            <td colSpan="14" className="text-center py-4 text-gray-400">
                                No products available.
                            </td>
                        </tr>
                    ) : (
                        paginatedProducts.map((product, index) => (
                            <ProductRow
                                key={`product-${product.product_id}-${product.variant_id || 'nv'}-${index}`}
                                product={product}
                                onEdit={handleEditFromTable}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </tbody>
            </table>
            {/* Pagination controls */}
            <div className="flex justify-center items-center py-6">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl shadow px-6 py-2">
                    <button
                        className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        &lt;
                    </button>
                    <span className="text-gray-700 font-medium">Trang</span>
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        value={currentPage}
                        onChange={e => setCurrentPage(Number(e.target.value))}
                    >
                        {Array.from({ length: totalPages }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {i + 1}
                            </option>
                        ))}
                    </select>
                    <span className="text-gray-700 font-medium">/ {totalPages}</span>
                    <button
                        className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductTable;