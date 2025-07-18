import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";

import productService from "../../services/productService";
import { getFullImageUrl } from "../../utils/imageUtils";
import { useToast } from "../../components/Toast/Toast";

function ProductReviews({ reviews, colors, sizes, productId, variants }) {
    const { showToast } = useToast();

    const [reviewList, setReviewList] = useState(reviews?.data || []);
    useEffect(() => {
        setReviewList(reviews?.data || []);
    }, [reviews]);

    // Xử lý dữ liệu
    const totalReviews = reviewList.length;
    const avgRating = totalReviews
        ? (reviewList.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

    // Đếm số lượng từng loại sao
    const starCounts = [5, 4, 3, 2, 1].map(
        star => reviewList.filter(r => r.rating === star).length
    );

    // Lọc theo số sao
    const [filterStar, setFilterStar] = useState(null);
    const filteredReviews = filterStar
        ? reviewList.filter(r => r.rating === filterStar)
        : reviewList;

    // Phân trang
    const [page, setPage] = useState(1);
    const perPage = 3;
    const totalPages = Math.ceil(filteredReviews.length / perPage);
    const paginated = filteredReviews.slice((page - 1) * perPage, page * perPage);

    // Đổi ngày về định dạng dd-mm-yyyy
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN");
    };

    // State cho form đánh giá mới
    const [newRating, setNewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [selectedColor, setSelectedColor] = useState(colors[0]?.color_id || "");
    const [selectedSize, setSelectedSize] = useState(sizes[0]?.size_id || "");
    const [reviewMedia, setReviewMedia] = useState([]); // Lưu mảng file
    const [selectedVariantId, setSelectedVariantId] = useState(null);

    // Hàm tìm variant_id theo color_id và size_id
    const findVariantId = (colorId, sizeId) => {
        if (!variants) return null;
        // Nếu là mảng
        if (Array.isArray(variants)) {
            const found = variants.find(
                v => Number(v.color_id) === Number(colorId) && Number(v.size_id) === Number(sizeId)
            );
            return found ? Number(found.variant_id) : null;
        }
        // Nếu là object (phòng trường hợp dữ liệu khác)
        const found = Object.values(variants).find(
            v => Number(v.color_id) === Number(colorId) && Number(v.size_id) === Number(sizeId)
        );
        return found ? Number(found.variant_id) : null;
    };

    // Khi chọn màu hoặc size thì cập nhật variant_id
    const handleColorChange = (colorId) => {
        setSelectedColor(Number(colorId));
        const variantId = findVariantId(colorId, selectedSize);
        setSelectedVariantId(variantId ? Number(variantId) : null);
    };

    const handleSizeChange = (sizeId) => {
        setSelectedSize(Number(sizeId));
        const variantId = findVariantId(selectedColor, sizeId);
        setSelectedVariantId(variantId ? Number(variantId) : null);
    };

    console.log("Selected variant_id:", selectedVariantId);


    // Xử lý gửi đánh giá
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!newRating || !newComment.trim()) return;
        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("productId", productId);

            // Chỉ gửi variant_id nếu có giá trị hợp lệ
            // if (selectedVariantId && Number(selectedVariantId) > 0) {
            formData.append("variantId", selectedVariantId);
            console.log("Submitting review for variant_id:", selectedVariantId);

            // }

            const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : "";
            if (userId) formData.append("customerId", userId);
            formData.append("rating", newRating);
            formData.append("comment", newComment);
            reviewMedia.forEach(file => formData.append("media", file));

            await productService.createReview(productId, formData);

            // Sau khi gửi thành công, load lại danh sách đánh giá
            const res = await productService.getProductReviews(productId);
            setReviewList(res.data?.data || []);
            showToast("Đánh giá đã được gửi!", "success");

            // Reset form
            setNewRating(0);
            setHoverRating(0);
            setNewComment("");
            setReviewMedia([]);
            setSubmitting(false);
        } catch (error) {
            console.error("Error submitting review:", error);
            showToast("Đã có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại sau.", "error");
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (selectedColor && selectedSize && variants) {
            const variantId = findVariantId(selectedColor, selectedSize);
            setSelectedVariantId(variantId ? Number(variantId) : null);
        }
    }, [selectedColor, selectedSize, variants]);

    return (
        <div className="w-full max-w-5xl mt-6 p-6 rounded-lg" style={{ background: "#F5F5F5" }}>
            {/* Form viết đánh giá */}
            <form
                onSubmit={handleSubmitReview}
                className="mb-8 bg-white rounded-xl p-6 shadow-lg flex flex-col gap-4 border border-gray-200"
            >
                <div className="font-semibold text-xl mb-1 text-gray-800">Viết đánh giá của bạn</div>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <FaStar
                                size={32}
                                color={star <= (hoverRating || newRating) ? "#FFD600" : "#E0E0E0"}
                            />
                        </button>
                    ))}
                    <span className="ml-2 text-gray-600 text-lg">{newRating ? `${newRating}/5` : ""}</span>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <select
                            className="border rounded px-4 py-2 min-w-[120px] appearance-none focus:ring-2 focus:ring-yellow-400"
                            value={selectedColor}
                            onChange={e => handleColorChange(e.target.value)}
                        >
                            {colors.map((color) => (
                                <option
                                    key={color.color_id}
                                    value={color.color_id}
                                    style={color.color_code ? { background: color.color_code, color: "#fff" } : {}}
                                >
                                    {color.color_name}
                                </option>
                            ))}
                        </select>
                        {/* Hiển thị màu sắc bên cạnh */}
                        {colors.find(c => c.color_id === selectedColor) && (
                            <span
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-gray-300"
                                style={{
                                    background: colors.find(c => c.color_id === selectedColor)?.color_code || "#fff"
                                }}
                            ></span>
                        )}
                    </div>
                    <select
                        className="border rounded px-4 py-2 min-w-[80px] focus:ring-2 focus:ring-yellow-400"
                        value={selectedSize}
                        onChange={e => handleSizeChange(e.target.value)}
                    >
                        {sizes.map((size) => (
                            <option key={size.size_id} value={size.size_id}>
                                {size.size_name}
                            </option>
                        ))}
                    </select>
                </div>
                <textarea
                    className="border rounded p-3 w-full min-h-[70px] resize-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Chia sẻ cảm nhận về sản phẩm..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    maxLength={500}
                />
                <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-700">Ảnh hoặc video minh họa (tùy chọn):</label>
                    <div className="flex items-center gap-4 flex-wrap">
                        <label
                            htmlFor="review-media-upload"
                            className={`cursor-pointer flex items-center px-4 py-2 bg-gray-100 border border-dashed border-gray-400 rounded-lg hover:bg-yellow-50 transition
                                ${(Array.isArray(reviewMedia) && reviewMedia.length >= 5) ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`
                            }
                        >
                            <svg width="24" height="24" fill="none" className="mr-2"><path d="M12 16l4-5 4 5H4l4-5 4 5z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <span className="text-gray-600">Chọn ảnh/video</span>
                            <input
                                id="review-media-upload"
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                disabled={Array.isArray(reviewMedia) && reviewMedia.length >= 5}
                                onChange={e => {
                                    const files = Array.from(e.target.files);
                                    setReviewMedia(prev => {
                                        const total = prev.length + files.length;
                                        if (total > 5) {
                                            alert("Chỉ được chọn tối đa 5 file (ảnh hoặc video)!");
                                            return [...prev, ...files].slice(0, 5);
                                        }
                                        return [...prev, ...files];
                                    });
                                }}
                                className="hidden"
                            />
                        </label>
                        {reviewMedia.map((file, idx) => (
                            <div key={idx} className="relative">
                                {file.type.startsWith("image") ? (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt="Preview"
                                        className="w-24 h-24 object-cover rounded border"
                                    />
                                ) : (
                                    <video
                                        src={URL.createObjectURL(file)}
                                        controls
                                        className="w-24 h-24 object-cover rounded border"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => setReviewMedia(reviewMedia.filter((_, i) => i !== idx))}
                                    className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-red-100"
                                    title="Xóa file"
                                >
                                    <svg width="16" height="16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <span className="text-xs text-gray-400">
                        Chỉ nhận ảnh JPG, PNG hoặc video MP4, tối đa 10MB mỗi file, tối đa 5 file.
                    </span>
                </div>
                <button
                    type="submit"
                    className="self-end px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-lg shadow transition-all duration-150 disabled:opacity-60"
                    disabled={submitting || !newRating || !newComment.trim()}
                >
                    {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
            </form>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Tổng điểm và sao */}
                <div className="flex items-center gap-6">
                    <div className="text-4xl font-bold text-yellow-500">{avgRating}</div>
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <FaStar
                                key={i}
                                className="mx-0.5"
                                color={i < Math.round(avgRating) ? "#FFD600" : "#E0E0E0"}
                                size={32}
                            />
                        ))}
                    </div>
                    <div className="text-lg text-gray-700 font-semibold ml-2">
                        ({totalReviews} đánh giá)
                    </div>
                </div>
                {/* Sắp xếp */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center px-3 py-1 border rounded bg-white text-gray-700">
                        Sắp xếp
                        <svg width="18" height="18" fill="none" className="ml-1"><path d="M6 9l3 3 3-3" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    {/* Placeholder cho filter icon */}
                    <button className="flex items-center px-2 py-1 border rounded bg-white text-gray-700">
                        <svg width="18" height="18" fill="none"><circle cx="9" cy="9" r="8" stroke="#374151" strokeWidth="2" /></svg>
                    </button>
                </div>
            </div>
            {/* Bộ lọc sao */}
            <div className="flex flex-col md:flex-row gap-4 mt-6">
                <div className="flex flex-col gap-2">
                    <div className="font-semibold text-gray-800">Phân loại xếp hạng</div>
                    {[5, 4, 3, 2, 1].map((star, idx) => (
                        <label key={star} className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filterStar === star}
                                onChange={() => setFilterStar(filterStar === star ? null : star)}
                                className="mr-2"
                            />
                            {[...Array(star)].map((_, i) => (
                                <FaStar key={i} color="#FFD600" size={18} />
                            ))}
                            {[...Array(5 - star)].map((_, i) => (
                                <FaStar key={i} color="#E0E0E0" size={18} />
                            ))}
                            <span className="ml-2 text-gray-600">({starCounts[idx]})</span>
                        </label>
                    ))}
                </div>
                {/* Danh sách đánh giá */}
                <div className="flex-1 flex flex-col gap-4">
                    {paginated.length === 0 ? (
                        <div className="text-gray-500 mt-4">Chưa có đánh giá nào cho sản phẩm này.</div>
                    ) : (
                        paginated.map((r, idx) => {
                            const images = r.media?.filter(url => url.match(/\.(png|jpg|jpeg|gif|webp)$/i)) || [];
                            const anh = images.map(url => getFullImageUrl(url));
                            const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
                            const isOwnReview = user && r.customer_id === user.id;

                            return (
                                <div key={idx} className="bg-white rounded-xl p-5 shadow border border-gray-100 flex flex-col gap-2 relative group transition hover:shadow-lg">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar (chữ cái đầu tên) */}
                                        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-lg uppercase shadow">
                                            {r.customer_fullname ? r.customer_fullname[0] : "?"}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">{r.customer_fullname || "Ẩn danh"}</span>
                                                <span className="flex items-center">
                                                    {[...Array(r.rating)].map((_, i) => (
                                                        <FaStar key={i} color="#FFD600" size={16} />
                                                    ))}
                                                    {[...Array(5 - r.rating)].map((_, i) => (
                                                        <FaStar key={i} color="#E0E0E0" size={16} />
                                                    ))}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="px-2 py-0.5 rounded bg-gray-100 border text-xs font-medium">
                                            Loại: <span className="font-semibold text-gray-700">{r.color_name}</span> - <span className="font-semibold text-gray-700">{r.size_name}</span>
                                        </span>
                                    </div>
                                    <div className="text-base text-gray-800 mt-1 mb-1 whitespace-pre-line">{r.comment}</div>
                                    {/* Hiển thị ảnh/video nếu có */}
                                    {Array.isArray(r.media) && r.media.length > 0 && (() => {
                                        const videos = r.media.filter(url => url.match(/\.(mp4|webm|ogg)$/i));
                                        const images = r.media.filter(url => url.match(/\.(png|jpg|jpeg|gif|webp)$/i));
                                        return (
                                            <div className="flex gap-3 mt-2 flex-wrap">
                                                {videos.map((url, i) => (
                                                    <video
                                                        key={`video-${i}`}
                                                        src={getFullImageUrl(url)}
                                                        controls
                                                        className="w-32 h-32 object-cover rounded-lg border bg-black"
                                                    />
                                                ))}
                                                {images.map((url, i) => (
                                                    <img
                                                        key={`img-${i}`}
                                                        src={getFullImageUrl(url)}
                                                        alt="media"
                                                        className="w-32 h-32 object-cover rounded-lg border"
                                                    />
                                                ))}
                                            </div>
                                        )
                                    })()}
                                    {/* Nút xoá nếu là review của mình */}
                                    {isOwnReview && (
                                        <button
                                            className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition"
                                            onClick={async () => {
                                                if (window.confirm("Bạn chắc chắn muốn xóa đánh giá này?")) {
                                                    try {
                                                        const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
                                                        const res = await productService.deleteReview(r.review_id, user.id);
                                                        if (res.data && res.data.success) {
                                                            showToast("Đã xóa đánh giá!", "success");
                                                            window.location.reload();
                                                        } else {
                                                            showToast(res.data?.message || "Xóa thất bại!", "error");
                                                        }
                                                    } catch (error) {
                                                        showToast("Lỗi khi xóa đánh giá!", "error");
                                                        console.error("Error deleting review:", error);
                                                    }
                                                }
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    )}
                                    {/* Phản hồi shop */}
                                    {r.reply_content && (
                                        <div className="mt-3 bg-yellow-50 rounded p-3 text-gray-700 text-sm border-l-4 border-yellow-400">
                                            <span className="font-semibold text-yellow-700">Phản hồi từ DNGSON</span>
                                            <div>{r.reply_content}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    {/* Phân trang */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                                className="px-2 py-1 rounded border"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >{"<"}</button>
                            <span>{page} / {totalPages}</span>
                            <button
                                className="px-2 py-1 rounded border"
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                            >{">"}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductReviews;