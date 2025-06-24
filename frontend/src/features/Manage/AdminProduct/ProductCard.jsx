import { useState } from 'react';
import { FiEdit3, FiTrash2, FiMoreVertical, FiEye, FiTag, FiPackage } from 'react-icons/fi';
import { getFullImageUrl } from '../../../utils/imageUtils';
import { processQuillContentForDisplay } from '../../../utils/quillUtils';
import styles from './ProductCard.module.scss';

function ProductCard({ product, onEdit, onDelete, isSelected, onSelect }) {
    const [showMenu, setShowMenu] = useState(false);

    const finalPrice = product.price * (1 - product.discount / 100);
    const imageUrl = getFullImageUrl(product.variant_image_url);

    const handleEdit = () => {
        onEdit(product);
        setShowMenu(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.product_name}"?`)) {
            onDelete(product.product_id);
        }
        setShowMenu(false);
    };

    const getStatusBadge = () => {
        if (product.quantity > 20) {
            return { text: 'Còn hàng', variant: 'success' };
        } else if (product.quantity > 0) {
            return { text: 'Sắp hết', variant: 'warning' };
        } else {
            return { text: 'Hết hàng', variant: 'danger' };
        }
    };

    const status = getStatusBadge();

    return (
        <div className={`${styles.productCard} ${isSelected ? styles.selected : ''}`}>
            {/* Selection Checkbox */}
            <div className={styles.productCard__checkbox}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(e.target.checked)}
                    className={styles.productCard__checkboxInput}
                />
            </div>

            {/* Image */}
            <div className={styles.productCard__imageContainer}>
                <img
                    src={imageUrl}
                    alt={product.product_name}
                    className={styles.productCard__image}
                    onError={(e) => {
                        e.target.src = '/images/otherImages/no-image-placeholder.png';
                    }}
                />
                {product.discount > 0 && (
                    <div className={styles.productCard__discountBadge}>
                        -{product.discount}%
                    </div>
                )}
                <div className={`${styles.productCard__statusBadge} ${styles[`productCard__statusBadge--${status.variant}`]}`}>
                    {status.text}
                </div>
            </div>

            {/* Content */}
            <div className={styles.productCard__content}>
                <div className={styles.productCard__header}>
                    <h3 className={styles.productCard__title} title={product.product_name}>
                        {product.product_name}
                    </h3>

                    <div className={styles.productCard__actions}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={styles.productCard__menuBtn}
                        >
                            <FiMoreVertical />
                        </button>

                        {showMenu && (
                            <div className={styles.productCard__menu}>
                                <button onClick={() => window.open(`/product/${product.product_id}`, '_blank')}>
                                    <FiEye />
                                    Xem
                                </button>
                                <button onClick={handleEdit}>
                                    <FiEdit3 />
                                    Sửa
                                </button>
                                <button onClick={handleDelete} className={styles.danger}>
                                    <FiTrash2 />
                                    Xóa
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Meta Info */}
                <div className={styles.productCard__meta}>
                    <div className={styles.productCard__metaItem}>
                        <FiTag className={styles.productCard__metaIcon} />
                        <span>ID: {product.product_id}</span>
                    </div>
                    <div className={styles.productCard__metaItem}>
                        <FiPackage className={styles.productCard__metaIcon} />
                        <span>SL: {product.quantity}</span>
                    </div>
                </div>

                {/* Attributes */}
                <div className={styles.productCard__attributes}>
                    <div className={styles.productCard__attribute}>
                        <span className={styles.productCard__attributeLabel}>Size:</span>
                        <span className={styles.productCard__attributeValue}>{product.size_name || 'N/A'}</span>
                    </div>
                    <div className={styles.productCard__attribute}>
                        <span className={styles.productCard__attributeLabel}>Màu:</span>
                        <div className={styles.productCard__colorInfo}>
                            <div
                                className={styles.productCard__colorSwatch}
                                style={{ backgroundColor: product.color_code || '#CCCCCC' }}
                            />
                            <span>{product.color_name || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Price */}
                <div className={styles.productCard__pricing}>
                    <div className={styles.productCard__currentPrice}>
                        {finalPrice.toLocaleString()}₫
                    </div>
                    {product.discount > 0 && (
                        <div className={styles.productCard__originalPrice}>
                            {Number(product.price).toLocaleString()}₫
                        </div>
                    )}
                </div>

                {/* Description Preview */}
                {product.description && (
                    <div
                        className={styles.productCard__description}
                        dangerouslySetInnerHTML={{
                            __html: processQuillContentForDisplay(product.description).substring(0, 100) + '...'
                        }}
                    />
                )}
            </div>

            {/* Footer Actions */}
            <div className={styles.productCard__footer}>
                <button
                    onClick={handleEdit}
                    className={`${styles.productCard__btn} ${styles['productCard__btn--primary']}`}
                >
                    <FiEdit3 />
                    Chỉnh sửa
                </button>
                <button
                    onClick={handleDelete}
                    className={`${styles.productCard__btn} ${styles['productCard__btn--danger']}`}
                >
                    <FiTrash2 />
                    Xóa
                </button>
            </div>
        </div>
    );
}

export default ProductCard;