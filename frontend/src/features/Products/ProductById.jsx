import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import productService from '../../services/productService';
import ProductInfo from "./ProductInfo";
import ProductDetail from "./ProductDetail";
import ProductReviews from "./ProductReviews";
import ProductRelated from "./ProductRelated";

function ProductById() {

    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [selected, setSelected] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);

    console.log("p:", product);


    useEffect(() => {
        if (!product?.category_id) return;
        console.log("Fetching related products for category ID:", product.category_id);

        const categoryId = product?.category_id;
        productService.getRelatedProducts(categoryId, id)
            .then(res => {
                setRelatedProducts(res.data);
                // console.log("Related products:", res.data);
            })
            .catch(err => {
                console.error("Error fetching related products:", err);
            });

        productService.getProductReviews(id)
            .then(res => {
                setReviews(res.data);
                console.log("Product reviews:", res.data);
            })
            .catch(err => {
                console.error("Error fetching product reviews:", err);
            });

    }, [product?.category_id, id]);

    useEffect(() => {
        productService.getProductById(id)
            .then(res => {
                setProduct(res.data);
                console.log("Product data:", res.data.product_id);
                sessionStorage.setItem('productId', res.data.product_id);
            })
            .catch(err => {
                console.error("Error fetching product:", err);
            });
    }, [id]);

    // const handleSelected = (index) => {
    //     setSelected(index);
    // };

    const variantsObj = product?.variants && typeof product.variants === "string"
        ? JSON.parse(product.variants)
        : product?.variants;

    const variantsArray = variantsObj && typeof variantsObj === "object"
        ? Object.values(variantsObj)
        : [];

    const colors = variantsArray.length
        ? Array.from(
            variantsArray.reduce((acc, v) => {
                const key = v.color_id;
                if (!acc.has(key)) {
                    acc.set(key, {
                        color_id: v.color_id,
                        color_name: v.color_name, // hoặc v.color nếu có
                        color_code: v.color, // hoặc v.color_code nếu có
                    });
                }
                return acc;
            }, new Map()).values()
        )
        : [];

    const sizes = variantsArray.length
        ? Array.from(
            variantsArray.reduce((acc, v) => {
                const key = v.size_id;
                if (!acc.has(key)) {
                    acc.set(key, {
                        size_id: v.size_id,
                        size_name: v.size, // hoặc v.size_name nếu có
                    });
                }
                return acc;
            }, new Map()).values()
        )
        : [];

    const renderTabContent = () => {
        switch (selected) {
            case 0:
                return (
                    <div className="w-full max-w-5xl mt-6 p-6 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4">Mô tả sản phẩm</h3>
                        <div className="text-gray-700" style={{ minHeight: '50px', display: 'block', color: '#374151' }}>
                            <ProductDetail description={product?.description} />
                        </div>
                    </div>
                );
            case 1:
                return <ProductReviews
                    reviews={reviews}
                    colors={colors}
                    sizes={sizes}
                    productId={id}
                    variants={variantsObj}
                />;
            default:
                return (
                    <div className="w-full max-w-5xl mt-6 p-6 bg-gray-50 rounded-lg">
                        <p style={{ color: '#374151' }}>Không có nội dung</p>
                    </div>
                );
        }
    };

    return (
        <div className="w-full min-h-screen px-0 sm:px-4 py-4 flex flex-col items-center bg-gray-50">
            {product && (
                <>
                    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-4xl mx-auto">
                        <ProductInfo product={product} />
                    </div>
                    {/* Tabs cho mô tả và đánh giá sản phẩm */}
                    <div className="w-full flex justify-center mt-6">
                        <div className="flex w-full max-w-md gap-2">
                            <button
                                className={`flex-1 text-base sm:text-lg px-2 py-2 border-2 rounded-lg font-semibold transition-all
                                ${selected === 0
                                        ? 'bg-blue-600 text-white border-blue-600 shadow'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700'}
                                `}
                                onClick={() => setSelected(0)}
                            >
                                MÔ TẢ SẢN PHẨM
                            </button>
                            <button
                                className={`flex-1 text-base sm:text-lg px-2 py-2 border-2 rounded-lg font-semibold transition-all
                                ${selected === 1
                                        ? 'bg-blue-600 text-white border-blue-600 shadow'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700'}
                                `}
                                onClick={() => setSelected(1)}
                            >
                                ĐÁNH GIÁ SẢN PHẨM
                            </button>
                        </div>
                    </div>
                    {/* Nội dung của tab được chọn */}
                    {renderTabContent()}
                    {/* Sản phẩm liên quan */}
                    <div className="w-full max-w-2xl sm:max-w-4xl md:max-w-5xl mt-6">
                        <ProductRelated relatedProducts={relatedProducts} />
                    </div>
                </>
            )}
        </div>
    );
}

export default ProductById;