import { useState, useEffect } from 'react';
import { getFullImageUrl } from '../../../utils/imageUtils';
import { processQuillContentForDisplay } from '../../../utils/quillUtils';
import { getProductDisplayNames } from '../../../utils/productFormHelpers';
import { HiOutlineInformationCircle, HiOutlinePencil, HiOutlineTrash, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";

function ProductRow({ product, onEdit, onDelete }) {
    const [displayNames, setDisplayNames] = useState({
        brand_name: 'Loading...',
        category_name: 'Loading...',
        material_name: 'Loading...',
        size_name: 'Loading...',
        color_name: 'Loading...',
        target_name: 'Loading...'
    });

    const finalPrice = product.price * (1 - product.discount / 100);
    const imageUrl = getFullImageUrl(product.variant_image_url);

    useEffect(() => {
        const fetchDisplayNames = async () => {
            try {
                const names = await getProductDisplayNames(product);
                setDisplayNames(names);
            } catch (error) {
                console.error('Error fetching display names:', error);
                setDisplayNames({
                    brand_name: `Brand ${product.brand_id || 'N/A'}`,
                    category_name: `Category ${product.category_id || 'N/A'}`,
                    material_name: `Material ${product.material_id || 'N/A'}`,
                    size_name: `Size ${product.size_id || 'N/A'}`,
                    color_name: `Color ${product.color_id || 'N/A'}`,
                    target_name: `Target ${product.target_id || 'N/A'}`
                });
            }
        };

        fetchDisplayNames();
    }, [product]);

    const handleEditClick = () => {
        if (typeof onEdit === 'function') {
            onEdit(product);
        } else {
            console.error("❌ ProductRow - onEdit is not a function:", onEdit);
        }
    };

    const processedDescription = processQuillContentForDisplay(product.description);

    return (
        <tr className="border-b hover:bg-gray-50 transition duration-150 text-sm text-gray-800">
            <td className="px-4 py-3 text-center">
                <img
                    src={imageUrl}
                    alt={product.product_name}
                    className="w-24 h-24 object-cover rounded border mx-auto"
                />
            </td>

            <td className="px-4 py-3 text-center">{product.product_name}</td>
            <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                    ${product.quantity > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`
                }>
                    {product.quantity > 0 ? (
                        <>
                            <HiCheckCircle className="text-green-500 text-base" />
                            &nbsp;Còn hàng ({product.quantity})
                        </>
                    ) : (
                        <>
                            <HiExclamationCircle className="text-gray-400 text-base" />
                            &nbsp;Hết hàng
                        </>
                    )}
                </span>
            </td>
            <td className="px-4 py-3 text-center">{displayNames.brand_name}</td>
            <td className="px-4 py-3 text-center">{displayNames.category_name}</td>
            <td className="px-4 py-3 text-center">{displayNames.material_name}</td>
            <td className="px-4 py-3 text-center">{displayNames.size_name}</td>
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                    <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: product.color_code || '#CCCCCC' }}
                        title={product.color_code}
                    />
                    {displayNames.color_name}
                </div>
            </td>
            <td className="px-4 py-3 text-center">{displayNames.target_name}</td>
            <td className="px-4 py-3 text-gray-700 text-center">{Number(product.price).toLocaleString()}₫</td>
            <td className="px-4 py-3 text-gray-700 text-center">{product.discount}%</td>
            <td className="px-4 py-3 text-green-600 font-semibold text-center">{finalPrice.toLocaleString()}₫</td>
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-3">
                    {/* Mô tả ngắn gọn */}
                    <span
                        className="line-clamp-2 max-w-[220px] block text-sm text-gray-700 text-left"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                        title={product.description?.replace(/<[^>]+>/g, '')}
                    >
                        {product.description?.replace(/<[^>]+>/g, '').slice(0, 160)}
                        {product.description && product.description.replace(/<[^>]+>/g, '').length > 160 ? '...' : ''}
                    </span>
                    {/* Icon hiện đại với tooltip */}
                    <div className="relative group cursor-pointer">
                        <HiOutlineInformationCircle
                            className="text-blue-500 text-2xl transition-colors duration-200 group-hover:text-blue-700"
                            aria-label="Xem chi tiết mô tả"
                        />
                        <div
                            className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 p-4 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
                            style={{
                                minWidth: '200px',
                                width: 'fit-content',
                                maxWidth: '400px',
                                whiteSpace: 'pre-line'
                            }}
                        >
                            <div
                                className="prose prose-sm max-h-80 overflow-y-auto text-gray-800"
                                style={{ wordBreak: 'break-word' }}
                                dangerouslySetInnerHTML={{ __html: processedDescription }}
                            />
                        </div>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3 text-center">
                <button
                    onClick={handleEditClick}
                    className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg shadow transition duration-200 mr-2 justify-center mx-auto"
                >
                    <HiOutlinePencil className="text-lg" />
                </button>

                <button
                    onClick={() => onDelete(product.product_id)}
                    className="flex mt-1 items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow transition duration-200 justify-center mx-auto"
                >
                    <HiOutlineTrash className="text-lg" />
                </button>
            </td>
        </tr>
    );
}

export default ProductRow;
