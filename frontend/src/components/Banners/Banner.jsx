import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import productService from "../../services/productService";
import { getFullImageUrl } from "../../utils/imageUtils";
function Banner() {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    // console.log("Banner component rendered: ", banners);

    // console.log("Banner component rendered: ", getFullImageUrl(banners[0]?.banner_url));


    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await productService.getAllBanners(); // Sửa lại dòng này
                setBanners(response.data);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách banner:", error);
            }
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length > 0) {
            setCurrentIndex(0);
        }
    }, [banners]);

    // Thêm hiệu ứng tự động chuyển ảnh sau mỗi 3 giây
    useEffect(() => {
        if (banners.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, 3000);

        return () => clearInterval(interval);
    }, [banners, currentIndex]);

    return (
        <div className="relative w-full">
            {/* Hình ảnh Banner */}
            {banners.length > 0 && (
                <div className="w-full h-[650px] max-w-screen-xl mx-auto overflow-hidden flex items-center justify-center relative">
                    <div
                        className="flex transition-transform duration-700 ease-in-out"
                        style={{
                            width: "100%",
                            transform: `translateX(-${currentIndex * 100}%)`,
                        }}
                    >
                        {banners.map((banner, idx) => (
                            <img
                                key={banner.banner_id}
                                className="w-full h-[650px] object-contain flex-shrink-0 cursor-pointer"
                                style={{
                                    minWidth: "100%",
                                    maxWidth: "100%",
                                    transition: "filter 0.5s",
                                    filter: currentIndex === idx ? "brightness(1)" : "brightness(0.85)",
                                }}
                                src={getFullImageUrl(banner.banner_url)}
                                alt={`Banner ${idx + 1}`}
                                onClick={() => {
                                    if (banner.collection_id) {
                                        navigate(`/collections/${banner.collection_id}`);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Điều hướng slide */}
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-3 py-3">
                {banners.map((banner, index) => (
                    <button
                        key={banner.banner_id}
                        className={`w-8 h-2 rounded-full transition ${currentIndex === index ? "bg-blue-400" : "bg-gray-300"
                            }`}
                        onClick={() => setCurrentIndex(index)}
                    ></button>
                ))}
            </div>
        </div>
    );
}

export default Banner;
