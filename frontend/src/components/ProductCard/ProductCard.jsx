import React from "react";
import { Link } from "react-router-dom";
import { RatingStars } from "../";
import { getFullImageUrl } from "../../utils/imageUtils";
import "../../features/Products/ProductEffects.css";

function getDiscountedPrice(price, discount) {
    if (!price || !discount) return price;
    const priceNum = Number(price);
    const discountNum = Number(discount);
    return Math.round(priceNum * (1 - discountNum / 100));
}

function ProductCard({ product, to, isHot }) {
    const cardRef = React.useRef(null);

    // Hiệu ứng 3D khi hover
    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const center = rect.width / 2;
        const percent = (x - center) / center;
        card.style.boxShadow = `${-percent * 24}px 8px 32px 0 rgba(59,130,246,0.18)`;
        card.style.transform = `perspective(600px) rotateY(${percent * 8}deg) scale(1.04)`;
    };
    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (!card) return;
        card.style.boxShadow = "";
        card.style.transform = "";
    };

    // Hiệu ứng zoom ảnh theo vị trí chuột
    const imgRef = React.useRef(null);
    const handleImgMove = (e) => {
        const img = imgRef.current;
        if (!img) return;
        const rect = img.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
    };
    const handleImgLeave = () => {
        const img = imgRef.current;
        if (!img) return;
        img.style.transformOrigin = "center center";
    };

    const discountNum = Number(product.discount) || 0;
    const priceNum = Number(product.price) || 0;
    const finalPrice = getDiscountedPrice(priceNum, discountNum);

    // Cho phép truyền prop "to" để dùng cho Link, hoặc không truyền thì chỉ là div
    const Wrapper = to ? Link : "div";
    const wrapperProps = to ? { to } : {};

    // const ratingValue = Number(product.rating);

    return (
        <Wrapper
            {...wrapperProps}
            ref={cardRef}
            className="product-card bg-white rounded-xl border border-gray-200 overflow-hidden relative flex flex-col h-full transition-all shadow-sm hover:shadow-lg"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Ảnh sản phẩm + badge giảm giá */}
            <div className="relative flex-shrink-0">
                <div className="w-full aspect-square bg-gray-100 overflow-hidden rounded-t-xl">
                    {product.product_image_url || product.product_image ? (
                        <img
                            ref={imgRef}
                            src={
                                product.product_image_url
                                    ? getFullImageUrl(product.product_image_url)
                                    : getFullImageUrl(product.product_image)
                            }
                            alt={product.product_name}
                            className="product-img w-full h-full object-cover object-center transition-transform duration-300"
                            onMouseMove={handleImgMove}
                            onMouseLeave={handleImgLeave}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-gray-400">Hình ảnh không có</p>
                        </div>
                    )}
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                    {discountNum > 0 && discountNum < 100 && (
                        <span className="discount-badge bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow">
                            -{discountNum}%
                        </span>
                    )}
                    {isHot && (
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow animate-pulse">
                            HOT
                        </span>
                    )}
                </div>
            </div>
            {/* Thông tin sản phẩm */}
            <div className="p-4 flex-1 flex flex-col justify-between min-h-[120px]">
                <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2 leading-5 h-10 overflow-hidden">
                    {product.product_name}
                </h3>
                <div className="flex items-center justify-between mt-2 mb-1">
                    <span className={`font-extrabold text-lg text-green-600`}>
                        {finalPrice
                            ? finalPrice.toLocaleString() + " ₫"
                            : "Giá chưa cập nhật"}
                    </span>
                    <div className="flex items-center text-sm">
                        <RatingStars
                            rating={parseFloat(product.rating) || 0}
                        />
                    </div>
                </div>
            </div>
        </Wrapper>
    );
}

export default ProductCard;