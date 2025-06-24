import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import productService from "../../services/productService";
import { ProductCard } from "../../components";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const ProductSearch = () => {
    const query = useQuery();
    const searchTerm = query.get("q") || "";
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 8;

    useEffect(() => {
        if (!searchTerm) return;
        setLoading(true);
        setCurrentPage(1);
        productService
            .searchProducts(searchTerm)
            .then((res) => {
                setProducts(res.data || []);
            })
            .finally(() => setLoading(false));
    }, [searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(products.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const currentProducts = products.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                    Kết quả tìm kiếm
                </h1>
                <p className="text-lg text-gray-600">
                    cho từ khóa: <span className="text-blue-600 font-semibold">"{searchTerm}"</span>
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Đang tìm kiếm sản phẩm...</p>
                    </div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">😔</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Không tìm thấy sản phẩm
                    </h3>
                    <p className="text-gray-500 mb-6">
                        Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại chính tả
                    </p>
                </div>
            ) : (
                <>
                    {/* Grid sản phẩm - 4 cột cố định */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {currentProducts.map((product) => (
                            <ProductCard
                                key={product.product_id}
                                product={product}
                                to={`/product/${product.product_id}`}
                            />
                        ))}
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-8">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`pagination-btn px-3 py-2 rounded-lg transition-colors ${currentPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                                    }`}
                            >
                                ‹ Trước
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`pagination-btn px-3 py-2 rounded-lg transition-colors ${currentPage === i + 1
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`pagination-btn px-3 py-2 rounded-lg transition-colors ${currentPage === totalPages
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                                    }`}
                            >
                                Sau ›
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProductSearch;