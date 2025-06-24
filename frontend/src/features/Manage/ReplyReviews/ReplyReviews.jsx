import { useEffect, useState } from "react";

import productService from "../../../services/productService"; // Import các dịch vụ cần thiết nếu có
import { getFullImageUrl } from "../../../utils/imageUtils";

const tabs = [
    { label: "Tất cả đánh giá", value: "all" },
    { label: "Chưa trả lời", value: "unreplied" },
    { label: "Đã trả lời", value: "replied" },
];

function ReplyReviews() {

    const [activeTab, setActiveTab] = useState("all");
    const [reviews, setReviews] = useState([]); // Dữ liệu đánh giá sẽ được lấy từ API hoặc dịch vụ
    const [replyingReviewId, setReplyingReviewId] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    console.log(reviews);
    useEffect(() => {
        // Giả lập lấy dữ liệu đánh giá từ dịch vụ
        const fetchReviews = async () => {
            try {
                const response = await productService.getAllReviews();
                setReviews(response.data.data); // Lấy đúng mảng data
            } catch (error) {
                console.error("Lỗi khi lấy đánh giá:", error);
            }
        };
        fetchReviews();
    }, []);

    // Placeholder dữ liệu đánh giá
    // const reviews = [
    //     // { id: 1, user: "Nguyễn Văn A", content: "Sản phẩm tốt!", replied: false },
    //     // { id: 2, user: "Trần Thị B", content: "Giao hàng nhanh.", replied: true },
    // ];

    // Lọc đánh giá theo tab
    const filteredReviews = reviews.filter((review) => {
        const isReplied = !!Number(review.replied); // Ép kiểu về boolean
        if (activeTab === "all") return true;
        if (activeTab === "unreplied") return !isReplied;
        if (activeTab === "replied") return isReplied;
        return true;
    });

    // Hàm xử lý gửi trả lời (giả lập)
    const handleSendReply = (reviewId) => {

        const user = JSON.parse(localStorage.getItem("user"));

        try {
            if (!replyContent.trim()) {
                alert("Nội dung trả lời không được để trống.");
                return;
            }

            console.log(`Đang gửi trả lời cho review ${reviewId}: ${replyContent}`);

            productService.replyReview(reviewId, { content: replyContent, user_id: user.id })
                .then(() => {
                    console.log(`Đã gửi trả lời cho review ${reviewId}: ${replyContent}`);
                })
                .catch((error) => {
                    console.error("Lỗi khi gửi trả lời:", error);
                });

        } catch (error) {
            console.error("Lỗi khi gửi trả lời:", error);
        }
        setReplyingReviewId(null);
        setReplyContent("");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <h1 className="text-2xl font-bold mb-6">Trả lời đánh giá</h1>
            <div className="flex space-x-4 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        className={`px-4 py-2 rounded ${activeTab === tab.value
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 border"
                            } transition`}
                        onClick={() => setActiveTab(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="w-full max-w-5xl bg-white rounded shadow p-6">
                {reviews.length === 0 ? (
                    <div className="text-center text-gray-500">
                        Hiện chưa có đánh giá nào.
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="text-center text-gray-500">
                        Không có đánh giá phù hợp với bộ lọc này.
                    </div>
                ) : (
                    <ul>
                        {filteredReviews.map((review) => {
                            const isReplied = !!Number(review.replied);
                            return (
                                <li key={review.review_id} className="border-b py-4">
                                    <div className="font-semibold">
                                        {review.customer_fullname} - {new Date(review.created_at).toLocaleString()}

                                    </div>

                                    <div className="text-sm text-gray-400">
                                        {review.product_name} <span className="px-3">|</span> Loại: {review.color_name} - {review.size_name}
                                    </div>
                                    <div>
                                        <span className="text-yellow-500">
                                            {"★".repeat(review.rating)}
                                            {"☆".repeat(5 - review.rating)}
                                        </span>
                                    </div>
                                    {/* <div>
                                        <span>Loại: {review.color_name} - {review.size_name}</span>
                                    </div> */}

                                    <div className="text-gray-700">{review.comment}</div>

                                    {review.media && review.media.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {review.media.map((mediaUrl, idx) =>
                                                mediaUrl.endsWith(".mp4") ? (
                                                    <video key={idx} src={getFullImageUrl(mediaUrl)} controls className="w-24 h-24 object-cover rounded" />
                                                ) : (
                                                    <img key={idx} src={getFullImageUrl(mediaUrl)} alt="media" className="w-24 h-24 object-cover rounded" />
                                                )
                                            )}
                                        </div>
                                    )}
                                    <div className="mt-2">
                                        {isReplied ? (
                                            <>
                                                <span className="text-green-600">Đã trả lời</span>
                                                {review.reply_content && (
                                                    <div className="bg-gray-100 rounded p-2 mt-2 text-sm text-gray-700">
                                                        <b>Phản hồi của quản trị viên:</b><br />
                                                        {review.reply_content}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="text-blue-600 hover:underline"
                                                    onClick={() => setReplyingReviewId(review.review_id)}
                                                >
                                                    Trả lời
                                                </button>
                                                {replyingReviewId === review.review_id && (
                                                    <div className="mt-2">
                                                        <textarea
                                                            className="w-full border rounded p-2"
                                                            rows={3}
                                                            placeholder="Nhập nội dung trả lời..."
                                                            value={replyContent}
                                                            onChange={e => setReplyContent(e.target.value)}
                                                        />
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                className="bg-blue-600 text-white px-4 py-1 rounded"
                                                                onClick={() => handleSendReply(review.review_id)}
                                                            >
                                                                Gửi
                                                            </button>
                                                            <button
                                                                className="text-gray-500"
                                                                onClick={() => setReplyingReviewId(null)}
                                                            >
                                                                Hủy
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ReplyReviews;