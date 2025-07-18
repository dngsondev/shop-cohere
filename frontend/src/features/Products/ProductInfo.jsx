import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HiMinus, HiPlus } from "react-icons/hi";
import { FaStar } from "react-icons/fa";

import cartService from "../../services/cartService";
import { refreshCartQuantity } from '../../utils/cartUtils';
import { getFullImageUrl } from "../../utils/imageUtils";

import { useToast } from "../../components/Toast/Toast";

function ProductInfo({ product }) {

    const { showToast } = useToast();

    // Xử lý variants: luôn trả về mảng các object variant
    let variantsList = [];
    if (product.variants) {
        if (typeof product.variants === "string") {
            try {
                const parsed = JSON.parse(product.variants);
                variantsList = Array.isArray(parsed)
                    ? parsed
                    : Object.values(parsed);
            } catch {
                variantsList = [];
            }
        } else if (Array.isArray(product.variants)) {
            variantsList = product.variants;
        } else if (typeof product.variants === "object") {
            variantsList = Object.values(product.variants);
        }
    }

    const [number, setNumber] = useState(1);
    const [color, setColor] = useState(null);
    const [size, setSize] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedVariantData, setSelectedVariantData] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [slideDirection, setSlideDirection] = useState(null);
    const [isSliding, setIsSliding] = useState(false);

    const handleImageClick = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    // Lấy danh sách màu và size duy nhất
    const uniqueColors = [...new Map(variantsList.map(v => [v.color, v])).values()];
    const uniqueSizes = [...new Map(variantsList.map(v => [v.size, v])).values()];

    // Hàm kiểm tra có thể chọn màu này không (dựa trên size đã chọn)
    const isColorAvailable = (colorToCheck) => {
        if (!size) return true;
        const availableVariant = variantsList.find(v =>
            v.color.trim().toLowerCase() === colorToCheck.trim().toLowerCase() &&
            v.size.trim().toLowerCase() === (size ? size.trim().toLowerCase() : "") &&
            v.quantity > 0
        );
        return !!availableVariant;
    };

    // Hàm kiểm tra có thể chọn size này không (dựa trên màu đã chọn)
    const isSizeAvailable = (sizeToCheck) => {
        if (!color) return true;
        const availableVariant = variantsList.find(v =>
            v.color.trim().toLowerCase() === (color ? color.trim().toLowerCase() : "") &&
            v.size.trim().toLowerCase() === sizeToCheck.trim().toLowerCase() &&
            v.quantity > 0
        );
        return !!availableVariant;
    };

    // Hàm lấy tổng số lượng theo màu
    const getColorTotalQuantity = (colorToCheck) => {
        return variantsList
            .filter(v => v.color.trim().toLowerCase() === colorToCheck.trim().toLowerCase())
            .reduce((total, v) => total + (v.quantity || 0), 0);
    };

    // Hàm lấy tổng số lượng theo size
    const getSizeTotalQuantity = (sizeToCheck) => {
        return variantsList
            .filter(v => v.size.trim().toLowerCase() === sizeToCheck.trim().toLowerCase())
            .reduce((total, v) => total + (v.quantity || 0), 0);
    };

    // Hàm chọn biến thể đúng theo color và size
    const handleSelectVariant = (selectedColor, selectedSize) => {
        setColor(selectedColor);
        setSize(selectedSize);

        const variantData = variantsList.find(
            v => v.color === selectedColor && v.size === selectedSize
        );

        setSelectedVariant(variantData ? variantData.variant_id : null);
        setSelectedVariantData(variantData || null);

        // Đổi ảnh và hiệu ứng như cũ
        if (variantData && variantData.image_url && selectedImage !== `/${variantData.image_url}`) {
            setSlideDirection("right");
            setIsSliding(true);
            setSelectedImage(`/${variantData.image_url}`);
            setTimeout(() => setIsSliding(false), 300);
        } else if (!variantData || !variantData.image_url) {
            setSelectedImage(`/${product.product_images.split(",")[0]}`);
        }
    };

    const [selectedImage, setSelectedImage] = useState(
        `/${product.product_images.split(",")[0]}`
    );

    useEffect(() => {
        if (product && product.product_images) {
            const initialImage = product.product_images.split(",")[0];
            setSelectedImage(`/${initialImage}`);
        }
    }, [product]);

    const [startIndex, setStartIndex] = useState(0);
    const visibleImages = 4;

    const allImages = [...new Set([
        ...product.product_images.split(","),
        ...variantsList.map(v => v.image_url).filter(url => url)
    ])];

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const handleMinus = () => {
        let num = Number(number);
        if (num > 1) setNumber(num - 1);
    };

    const handlePlus = () => {
        let num = Number(number);
        const maxQuantity = selectedVariantData ? selectedVariantData.quantity : 999;
        if (num < maxQuantity) {
            setNumber(num + 1);
        }
    };

    // Kiểm tra số lượng có hợp lệ không
    const isQuantityValid = () => {
        if (!selectedVariantData) return false;
        return number > 0 && number <= selectedVariantData.quantity;
    };

    // Kiểm tra có thể mua hàng không
    const canPurchase = () => {
        return selectedVariant && selectedVariantData && selectedVariantData.quantity > 0 && isQuantityValid();
    };

    const customerData = localStorage.getItem("user");
    const customer = customerData ? JSON.parse(customerData) : null;
    const customerId = customer ? customer.id : null;

    const handleAddToCart = (customerId, selectedVariant, quantity) => {
        try {
            if (!canPurchase()) {
                alert("Vui lòng chọn màu sắc, kích thước và số lượng hợp lệ!");
                return;
            }

            const variantId = selectedVariant;
            cartService.addToCart(customerId, product?.product_id, variantId, quantity)
                .then((response) => {
                    if (response.status === 200) {
                        refreshCartQuantity(customerId);
                        showToast("Đã thêm sản phẩm vào giỏ hàng!", "success");
                        // alert("Đã thêm sản phẩm vào giỏ hàng!");
                    } else {
                        showToast("Có lỗi xảy ra khi thêm vào giỏ hàng!", "error");
                    }
                })
                .catch(() => {
                    showToast("Có lỗi xảy ra khi thêm vào giỏ hàng!", "error");
                });
        } catch {
            showToast("Có lỗi xảy ra!", "error");
        }
    }

    const handleBuyNow = () => {
        if (!canPurchase()) {
            alert("Vui lòng chọn màu sắc, kích thước và số lượng hợp lệ!");
            return;
        }
        // Lưu thông tin đơn hàng tạm vào sessionStorage
        const orderData = {
            customerId: customerId,
            items: [
                {
                    productId: product.product_id,
                    variantId: selectedVariant,
                    quantity: number
                }
            ]
        };
        sessionStorage.setItem("orderData", JSON.stringify(orderData));
        window.location.href = "/order";
    };

    const discount = Number(product.discount) || 0;

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-3 sm:p-6 w-full mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Ảnh sản phẩm */}
                <div className="flex flex-col items-center w-full md:w-1/3">
                    <div className="w-full max-w-xs sm:max-w-sm md:max-w-[400px] h-[220px] sm:h-[300px] flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100">
                        <img
                            className={`product-main-img w-full h-full object-cover cursor-zoom-in rounded-xl 
        ${isSliding ? (slideDirection === "left" ? "slide-out-left" : "slide-out-right") : "slide-in"}
    `}
                            src={getFullImageUrl(selectedImage)}
                            alt="Sản phẩm"
                            onClick={handleImageClick}
                        />
                    </div>

                    {showModal && (
                        <div
                            className="image-modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
                            onClick={handleCloseModal}
                        >
                            <div
                                className="relative bg-white rounded-lg shadow-lg p-2"
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    className="absolute top-2 right-2 text-2xl text-gray-600 hover:text-red-500"
                                    onClick={handleCloseModal}
                                    aria-label="Đóng"
                                >
                                    ×
                                </button>
                                <img
                                    src={getFullImageUrl(selectedImage)}
                                    alt="Sản phẩm phóng to"
                                    className="max-w-[90vw] max-h-[80vh] rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Thanh ảnh thumbnail với điều hướng */}
                    <div className="relative mt-4 flex items-center">
                        {startIndex > 0 && (
                            <button className="absolute left-0 p-2 bg-gray-200 rounded-full shadow-md" onClick={() => {
                                setSlideDirection("left");
                                setIsSliding(true);
                                setStartIndex(startIndex - 1);
                                setTimeout(() => setIsSliding(false), 300);
                            }}>
                                <ChevronLeft size={20} />
                            </button>
                        )}

                        {allImages && allImages.length > 0 && (
                            <div className="flex gap-2 mx-8 overflow-hidden">
                                {allImages.slice(startIndex, startIndex + visibleImages).map((img, index) => (
                                    <img
                                        key={index}
                                        src={getFullImageUrl(img)}
                                        alt={`Thumbnail ${index}`}
                                        className={`product-thumb w-16 h-16 object-cover border-2 cursor-pointer rounded-md 
                                        ${selectedImage.includes(img) ? "border-blue-500" : "border-transparent"}`}
                                        onClick={() => setSelectedImage(`/${img}`)}
                                    />
                                ))}
                            </div>
                        )}

                        {startIndex + visibleImages < allImages.length && (
                            <button className="absolute right-0 p-2 bg-gray-200 rounded-full shadow-md" onClick={() => {
                                setSlideDirection("right");
                                setIsSliding(true);
                                setStartIndex(startIndex + 1);
                                setTimeout(() => setIsSliding(false), 300);
                            }}>
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Thông tin sản phẩm */}
                <div className="w-full md:w-2/3 p-2 sm:p-5 space-y-3.5">
                    {/* Tên sản phẩm */}
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">{product.product_name}</h1>
                    {/* Đánh giá */}
                    <p className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <FaStar
                                key={i}
                                color={i < Math.round(product.avg_rating || 0) ? "#FFD600" : "#E0E0E0"}
                                size={20}
                            />
                        ))}
                        <span className="ml-2 text-gray-700 text-base">
                            ({product.avg_rating || 0} sao)
                        </span>
                        <span className="ml-2 text-gray-700 text-base">|</span>
                        <span className="ml-2 text-gray-700 text-base">
                            {product.review_count || 0} đánh giá
                        </span>
                    </p>
                    {/* Giá */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="price-animated text-2xl font-bold text-green-600">
                            {discount > 0
                                ? `${formatPrice(product.price * (1 - discount / 100))} `
                                : `${formatPrice(product.price)} `
                            }
                        </span>
                        {discount > 0 && (
                            <>
                                <span className="line-through text-gray-400 text-lg">
                                    {formatPrice(product.price)}
                                </span>
                                <span className="discount-badge discount-badge-animated text-xs font-bold px-2 py-1 rounded bg-red-500 text-white ml-2 shadow">
                                    -{discount.toFixed(0)}%
                                </span>
                            </>
                        )}
                    </div>

                    {/* Chọn màu */}
                    <div className="flex items-center space-x-2.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-medium">Màu sắc:</span>
                        {uniqueColors.map((variant, index) => {
                            const isAvailable = isColorAvailable(variant.color);
                            const totalQuantity = getColorTotalQuantity(variant.color);

                            return (
                                <div key={index} className="relative">
                                    <button
                                        className={`cursor-pointer rounded-full w-8 h-8 border-2 transition-all relative ${color === variant.color
                                            ? "border-blue-500 shadow-md scale-110"
                                            : isAvailable
                                                ? "border-gray-300 hover:border-gray-400"
                                                : "border-gray-200 cursor-not-allowed"
                                            } ${!isAvailable ? "opacity-50" : ""}`}
                                        style={{
                                            backgroundColor: isAvailable ? variant.color : `${variant.color}80`
                                        }}
                                        onClick={() => {
                                            if (!isAvailable) return;

                                            if (variant.image_url) {
                                                setSelectedImage(`/${variant.image_url}`);
                                            }
                                            setColor(variant.color);
                                            handleSelectVariant(variant.color, size);
                                        }}
                                        disabled={!isAvailable}
                                        title={
                                            isAvailable
                                                ? `${variant.color_name} (${totalQuantity} sản phẩm)`
                                                : `${variant.color_name} (Hết hàng)`
                                        }
                                    />
                                    {!isAvailable && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-red-500 text-xs font-bold">✕</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Chọn size */}
                    <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-medium">Kích thước:</span>
                        <div className="flex space-x-2">
                            {uniqueSizes.map((variant, index) => {
                                const isAvailable = isSizeAvailable(variant.size);
                                const totalQuantity = getSizeTotalQuantity(variant.size);

                                return (
                                    <button
                                        key={index}
                                        className={`px-4 py-2 border rounded-lg transition-all relative ${size === variant.size
                                            ? "border-blue-500 bg-blue-50 text-blue-600"
                                            : isAvailable
                                                ? "border-gray-300 hover:border-black"
                                                : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                            } focus:outline-2 focus:outline-blue-400 focus:outline-offset-2`}
                                        onClick={() => {
                                            if (!isAvailable) return;

                                            setSize(variant.size);
                                            handleSelectVariant(color, variant.size);
                                        }}
                                        disabled={!isAvailable}
                                        title={
                                            isAvailable
                                                ? `Size ${variant.size} (${totalQuantity} sản phẩm)`
                                                : `Size ${variant.size} (Hết hàng)`
                                        }
                                    >
                                        {variant.size}
                                        {!isAvailable && (
                                            <span className="absolute -top-1 -right-1 text-red-500 text-xs">✕</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hiển thị số lượng còn lại */}
                    {selectedVariantData && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Số lượng còn lại:</span>
                                <span className={`text-sm font-bold ${selectedVariantData.quantity > 10
                                    ? "text-green-600"
                                    : selectedVariantData.quantity > 0
                                        ? "text-orange-600"
                                        : "text-red-600"
                                    }`}>
                                    {selectedVariantData.quantity > 0
                                        ? `${selectedVariantData.quantity} sản phẩm`
                                        : "Hết hàng"
                                    }
                                </span>
                            </div>
                            {selectedVariantData.quantity <= 10 && selectedVariantData.quantity > 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                    ⚠️ Chỉ còn lại ít sản phẩm!
                                </p>
                            )}
                        </div>
                    )}

                    {/* Chọn số lượng */}
                    {selectedVariantData && selectedVariantData.quantity > 0 && (
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium">Số lượng:</span>
                            <div className="flex w-28 items-center border border-gray-300 rounded-lg overflow-hidden">
                                <button
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                                    disabled={number <= 1}
                                    onClick={handleMinus}
                                >
                                    <HiMinus className="text-lg" />
                                </button>
                                <input
                                    className="w-12 text-center outline-none border-x border-gray-300"
                                    value={number}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        const maxQty = selectedVariantData ? selectedVariantData.quantity : 999;
                                        setNumber(Math.min(Math.max(val, 1), maxQty));
                                    }}
                                    type="number"
                                    min="1"
                                    max={selectedVariantData?.quantity || 999}
                                />
                                <button
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                                    disabled={number >= (selectedVariantData?.quantity || 999)}
                                    onClick={handlePlus}
                                >
                                    <HiPlus className="text-lg" />
                                </button>
                            </div>
                            {!isQuantityValid() && selectedVariantData && (
                                <span className="text-red-500 text-xs">
                                    Số lượng không hợp lệ!
                                </span>
                            )}
                        </div>
                    )}

                    {/* Nút mua hàng */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <button
                            onClick={() => handleAddToCart(customerId, selectedVariant, number)}
                            disabled={!canPurchase() || !customerId}
                            className={`btn-animated h-10 sm:h-12 px-4 sm:px-6 rounded transition-all text-sm sm:text-base ${canPurchase() && customerId
                                ? "bg-green-700 hover:bg-green-800 text-white cursor-pointer"
                                : "bg-gray-400 text-gray-200 cursor-not-allowed"
                                }`}
                        >
                            Thêm vào giỏ hàng
                        </button>
                        <button
                            onClick={handleBuyNow}
                            disabled={!canPurchase() || !customerId}
                            className={`btn-animated h-10 sm:h-12 px-4 sm:px-6 rounded transition-all text-sm sm:text-base ${canPurchase() && customerId
                                ? "bg-green-900 hover:bg-green-950 text-white cursor-pointer"
                                : "bg-gray-400 text-gray-200 cursor-not-allowed"
                                }`}
                        >
                            Mua ngay
                        </button>
                    </div>

                    {/* Thông báo trạng thái */}
                    {!selectedVariant && (
                        <div className="alert-animated px-4 py-2 rounded text-yellow-800 border border-yellow-300 mt-3">
                            Vui lòng chọn màu sắc và kích thước để xem số lượng còn lại
                        </div>
                    )}

                    {selectedVariantData && selectedVariantData.quantity === 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-800 text-sm font-medium">
                                ❌ Sản phẩm này hiện đã hết hàng
                            </p>
                        </div>
                    )}

                    {!customerId && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-blue-800 text-sm">
                                🔐 Vui lòng đăng nhập để có thể mua hàng
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductInfo;
