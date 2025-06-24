import { Link } from "react-router-dom";
import { ProductCard } from "../../components"; // Đảm bảo import đúng đường dẫn

function ProductRelated({ relatedProducts }) {
    const products = Array.isArray(relatedProducts)
        ? relatedProducts
        : relatedProducts?.data || [];

    if (products.length > 0) {
        return (
            <div className="w-full max-w-5xl mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100 shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Sản phẩm gợi ý</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.product_id || product.id}
                            product={product}
                            to={`/product/${product.product_id}`}
                            isHot={true}
                        />
                    ))}
                </div>
            </div>
        );
    }
    return (
        <div className="w-full max-w-5xl mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100 shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Sản phẩm gợi ý</h3>
            <p className="text-gray-700" style={{ minHeight: '50px', display: 'block', color: '#374151' }}>
                Chưa có sản phẩm gợi ý cho sản phẩm này.
            </p>
        </div>
    );
}

export default ProductRelated;