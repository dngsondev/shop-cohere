import { getFullImageUrl } from '../../utils/imageUtils';

function ProductDetail({ description }) {
    if (!description) {
        return "Chưa có mô tả sản phẩm";
    }

    // Thay thế tất cả src của img với full URL
    let processedDescription = description.replace(
        /src="([^"]*?)"/g,
        (match, src) => `src="${getFullImageUrl(src)}"`
    );

    return (
        <div
            dangerouslySetInnerHTML={{ __html: processedDescription }}
            className="prose max-w-full bg-white border border-gray-100 rounded-xl p-4 text-gray-800"
            style={{
                padding: '10px'
            }}
        />
    );
}

export default ProductDetail;