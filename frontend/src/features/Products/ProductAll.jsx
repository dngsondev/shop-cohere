import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RatingStars, ProductCard } from "../../components";
import productService from "../../services/productService";
import { sortProducts } from "../../utils/sortProducts";
// import { getFullImageUrl } from "../../utils/imageUtils";
import "./ProductEffects.css";

// function getDiscountedPrice(price, discount) {
//     if (!price || !discount) return price;
//     const priceNum = Number(price);
//     const discountNum = Number(discount);
//     return Math.round(priceNum * (1 - discountNum / 100));
// }

function ProductImage({ src, alt }) {
    const imgRef = React.useRef(null);

    const handleMouseMove = (e) => {
        const img = imgRef.current;
        if (!img) return;
        const rect = img.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
    };

    const handleMouseLeave = () => {
        const img = imgRef.current;
        if (!img) return;
        img.style.transformOrigin = "center center";
    };

    return (
        <img
            ref={imgRef}
            src={src}
            alt={alt}
            className="product-img w-full h-full object-cover object-center transition-transform duration-300"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        />
    );
}

function ProductAll() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // ✅ State cho dropdown động
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [materials, setMaterials] = useState([]);

    // ✅ State lưu giá trị bộ lọc
    const [selectedCategory, setSelectedCategory] = useState("Tất cả");
    const [selectedBrand, setSelectedBrand] = useState("Tất cả");
    const [selectedPrice, setSelectedPrice] = useState("Tất cả");
    const [selectedMaterial, setSelectedMaterial] = useState("Tất cả");

    // State cho sản phẩm hot
    const [hotProductIds, setHotProductIds] = useState([]);
    const [filter, setFilter] = useState("popular");

    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;

        const fetchProducts = async () => {
            try {
                const response = await productService.getAllProducts();

                if (!isMounted) return;

                if (response && response.data) {
                    setProducts(response.data);
                    setFilteredProducts(response.data);

                    const allCategories = response.data.map(p => p.categories || "").filter(Boolean);
                    const uniqueCategories = ["Tất cả", ...new Set(allCategories)];
                    setCategories(uniqueCategories);

                    const allBrands = response.data.map(p => p.brands || "").filter(Boolean);
                    const uniqueBrands = ["Tất cả", ...new Set(allBrands)];
                    setBrands(uniqueBrands);

                    const allMaterials = response.data.map(p => p.materials || "").filter(Boolean);
                    const uniqueMaterials = ["Tất cả", ...new Set(allMaterials)];
                    setMaterials(uniqueMaterials);
                }
            } catch (error) {
                console.error("Error fetching products:", error);

                if (retryCount < 3 && isMounted) {
                    retryCount++;
                    console.log(`Retrying (${retryCount}/3)...`);
                    setTimeout(fetchProducts, 500);
                }
            }
        };

        fetchProducts();

        return () => {
            isMounted = false;
            console.log("ProductAll unmounted - cleaning up");
        };
    }, []);

    useEffect(() => {
        const hotIds = sessionStorage.getItem('hotProductIds');
        if (hotIds) {
            setHotProductIds(JSON.parse(hotIds));
        } else {
            productService.getTopProducts()
                .then(res => {
                    const ids = (res.data || []).map(p => p.product_id);
                    setHotProductIds(ids);
                    sessionStorage.setItem('hotProductIds', JSON.stringify(ids));
                })
                .catch(() => setHotProductIds([]));
        }
    }, []);

    // const formatPrice = (price) => {
    //     return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    // };

    useEffect(() => {
        const filtered = products.filter(product =>
            (selectedCategory === "Tất cả" || product.categories === selectedCategory) &&
            (selectedBrand === "Tất cả" || product.brands === selectedBrand) &&
            (selectedMaterial === "Tất cả" || product.materials === selectedMaterial) &&
            (selectedPrice === "Tất cả" || (
                selectedPrice === "Dưới 500k" && product.price < 500000 ||
                selectedPrice === "500k - 1 triệu" && product.price >= 500000 && product.price <= 1000000 ||
                selectedPrice === "Trên 1 triệu" && product.price > 1000000
            ))
        );

        setFilteredProducts(filtered);
        setCurrentPage(1);
    }, [selectedCategory, selectedBrand, selectedMaterial, selectedPrice, products]);

    // Sắp xếp sau khi lọc
    const sortedFilteredProducts = sortProducts(filteredProducts, filter);
    const totalPages = Math.ceil(sortedFilteredProducts.length / itemsPerPage);
    const currentProducts = sortedFilteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    return (
        <div className="w-full">
            {/* Navbar với Dropdown - Responsive */}
            <div className="w-full bg-white py-4 rounded-xl shadow mb-8 pt-2 border border-gray-100">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:justify-center md:gap-6 mb-4 px-1">
                    {/* Dropdown - Thể loại */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center min-w-0">
                        <label className="font-medium mr-1 mb-1 sm:mb-0 text-xs whitespace-nowrap text-gray-700">Thể loại:</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="select-animated pl-2 pr-6 py-1 rounded border border-gray-300 cursor-pointer focus:outline-none w-full sm:w-auto text-xs bg-gray-50"
                        >
                            {categories.map(category => <option key={category} value={category}>{category}</option>)}
                        </select>
                    </div>
                    {/* Dropdown - Thương hiệu */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center min-w-0">
                        <label className="font-medium mr-1 mb-1 sm:mb-0 text-xs whitespace-nowrap text-gray-700">Thương hiệu:</label>
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="select-animated pl-2 pr-6 py-1 rounded border border-gray-300 cursor-pointer focus:outline-none w-full sm:w-auto text-xs bg-gray-50"
                        >
                            {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                        </select>
                    </div>
                    {/* Dropdown - Giá */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center min-w-0">
                        <label className="font-medium mr-1 mb-1 sm:mb-0 text-xs whitespace-nowrap text-gray-700">Giá:</label>
                        <select
                            value={selectedPrice}
                            onChange={(e) => setSelectedPrice(e.target.value)}
                            className="select-animated pl-2 pr-6 py-1 rounded border border-gray-300 cursor-pointer focus:outline-none w-full sm:w-auto text-xs bg-gray-50"
                        >
                            <option value="Tất cả">Tất cả</option>
                            <option value="Dưới 500k">Dưới 500k</option>
                            <option value="500k - 1 triệu">500k - 1 triệu</option>
                            <option value="Trên 1 triệu">Trên 1 triệu</option>
                        </select>
                    </div>
                    {/* Dropdown - Chất liệu */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center min-w-0">
                        <label className="font-medium mr-1 mb-1 sm:mb-0 text-xs whitespace-nowrap text-gray-700">Chất liệu:</label>
                        <select
                            value={selectedMaterial}
                            onChange={(e) => setSelectedMaterial(e.target.value)}
                            className="select-animated pl-2 pr-6 py-1 rounded border border-gray-300 cursor-pointer focus:outline-none w-full sm:w-auto text-xs bg-gray-50"
                        >
                            {materials.map(material => <option key={material} value={material}>{material}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            {/* Tiêu đề */}
            <h1 className="my-10 text-3xl font-bold text-center cursor-pointer hover:text-blue-500 transition duration-300 tracking-wide drop-shadow-lg">
                Tất cả sản phẩm
            </h1>

            {/* Lọc theo mới nhất, Bán chạy, phổ biến */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setFilter("popular")}
                    className={`px-4 py-2 rounded font-semibold transition-all duration-200
                        ${filter === "popular" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-800 hover:bg-blue-100"}
                    `}
                >
                    Phổ Biến
                </button>
                <button
                    onClick={() => setFilter("newest")}
                    className={`px-4 py-2 rounded font-semibold transition-all duration-200
                        ${filter === "newest" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-800 hover:bg-blue-100"}
                    `}
                >
                    Mới Nhất
                </button>
                <button
                    onClick={() => setFilter("bestsell")}
                    className={`px-4 py-2 rounded font-semibold transition-all duration-200
                        ${filter === "bestsell" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-800 hover:bg-blue-100"}
                    `}
                >
                    Bán Chạy
                </button>
                <button
                    onClick={() => setFilter("price_asc")}
                    className={`px-4 py-2 rounded font-semibold transition-all duration-200
                        ${filter === "price_asc" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-800 hover:bg-blue-100"}
                    `}
                >
                    Giá thấp đến cao
                </button>
                <button
                    onClick={() => setFilter("price_desc")}
                    className={`px-4 py-2 rounded font-semibold transition-all duration-200
                        ${filter === "price_desc" ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-800 hover:bg-blue-100"}
                    `}
                >
                    Giá cao đến thấp
                </button>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {currentProducts.length > 0 ? currentProducts.map((product) => (
                    <div key={product.product_id} className="group h-full">
                        <Link to={`/product/${product.product_id}`} className="block h-full">
                            <ProductCard
                                product={product}
                                isHot={hotProductIds.includes(product.product_id)}
                            />
                        </Link>
                    </div>
                )) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-lg text-gray-500">Không có sản phẩm nào.</p>
                    </div>
                )}
            </div>
            {/* Phân trang */}
            {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center mt-8 space-x-4">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="text-lg font-medium text-gray-700">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProductAll;
