import { motion, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";
// import { Link } from "react-router-dom";

import productService from "../../services/productService";
import { ProductCard } from "../../components";

function OutstandingProduct() {
    const [topProducts, setTopProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, margin: "-100px" });

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                const res = await productService.getTopProducts();
                setTopProducts(res.data || []);
                const ids = (res.data || []).map(p => p.product_id);
                sessionStorage.setItem('hotProductIds', JSON.stringify(ids));
            } catch (e) {
                setTopProducts([]);
            }
        };
        fetchTopProducts();
    }, []);

    const groupSize = 3;
    const maxIndex = Math.ceil(topProducts.length / groupSize) - 1;

    const handleChangeGroup = (direction) => {
        if (direction === "next") {
            if (currentIndex < maxIndex) {
                setCurrentIndex(currentIndex + 1);
            }
        } else if (direction === "prev") {
            if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
            }
        }
    };

    const displayedProducts = topProducts.slice(currentIndex * groupSize, currentIndex * groupSize + groupSize);

    return (
        <div ref={ref} className="py-16 ">
            <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">Sản phẩm nổi bật</h1>

            <div className="relative px-10">
                {/* Nút trái */}
                {currentIndex > 0 && (
                    <motion.button
                        animate={{ x: [0, -8, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                        whileHover={{ scale: 1.1, boxShadow: "0 4px 24px rgba(59,130,246,0.15)" }}
                        onClick={() => handleChangeGroup("prev")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-sm hover:bg-blue-500 hover:text-white transition-all duration-300 w-10 h-10 flex items-center justify-center rounded-full z-10"
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M15 19l-7-7 7-7" />
                        </svg>
                    </motion.button>
                )}

                {/* Danh sách sản phẩm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {displayedProducts.map((product, index) => (
                        <motion.div
                            className="outstanding-card flex flex-col h-full bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-4"
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: index * 0.2, duration: 0.6 }}
                            key={product.product_id}
                        >
                            <ProductCard
                                product={product}
                                to={`/product/${product.product_id}`}
                                isHot={true}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Nút phải */}
                {currentIndex < maxIndex && (
                    <motion.button
                        animate={{ x: [0, 8, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                        whileHover={{ scale: 1.1, boxShadow: "0 4px 24px rgba(59,130,246,0.15)" }}
                        onClick={() => handleChangeGroup("next")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-sm hover:bg-blue-500 hover:text-white transition-all duration-300 w-10 h-10 flex items-center justify-center rounded-full z-10"
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 5l7 7-7 7" />
                        </svg>
                    </motion.button>
                )}
            </div>
        </div>
    );
}

export default OutstandingProduct;

