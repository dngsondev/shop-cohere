import { useEffect, useState } from "react";
import { ProductCard } from "../../components";
import productService from "../../services/productService";

function ProductForYou() {
    const [products, setProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const groupSize = 3;
    // Lấy userId từ localStorage (nếu có đăng nhập)
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id;
    const maxIndex = Math.ceil(products.length / groupSize) - 1;

    useEffect(() => {

        const fetchProducts = async () => {
            try {
                console.log("User ID:", userId);
                const res = await productService.getProductsForYou(userId);
                console.log("Gợi ý cho bạn:", res); // Thêm dòng này
                setProducts(res.data || []);
            } catch (e) {
                setProducts([]);
            }
        };
        fetchProducts();
    }, [userId]);

    const handleChangeGroup = (direction) => {
        if (direction === "next" && currentIndex < maxIndex) {
            setCurrentIndex(currentIndex + 1);
        } else if (direction === "prev" && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const displayedProducts = products.slice(currentIndex * groupSize, currentIndex * groupSize + groupSize);

    return (
        <div className="py-12 relative">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Dành cho bạn</h2>
            <div className="relative px-10">
                {/* Nút trái */}
                {currentIndex > 0 && (
                    <button
                        onClick={() => handleChangeGroup("prev")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-sm hover:bg-blue-500 hover:text-white transition-all duration-300 w-10 h-10 flex items-center justify-center rounded-full z-10"
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {/* Danh sách sản phẩm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {displayedProducts.map(product => (
                        <ProductCard
                            key={product.product_id}
                            product={product}
                            to={`/product/${product.product_id}`}
                        />
                    ))}
                </div>

                {/* Nút phải */}
                {currentIndex < maxIndex && (
                    <button
                        onClick={() => handleChangeGroup("next")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-sm hover:bg-blue-500 hover:text-white transition-all duration-300 w-10 h-10 flex items-center justify-center rounded-full z-10"
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

export default ProductForYou;