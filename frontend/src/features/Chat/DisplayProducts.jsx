import React from 'react';
import { Link } from "react-router-dom";
import { getFullImageUrl } from "../../utils/imageUtils"
import { FaStar, FaRegStar } from "react-icons/fa";
import styles from './DisplayProducts.module.scss';

function DisplayProducts({ products }) {
    // console.log("Display Products: ", products);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleProductClick = (productId) => {
        // Navigate to product detail page
        window.open(`/product/${productId}`, '_blank');
    };

    return (
        <div className={styles.productsList}>
            {Object.keys(products).map((key) => {
                const product = products[key];
                let finalPrice = product.price * (1 - product.discount / 100);

                return (
                    <div
                        key={key}
                        className={styles.productCard}
                        onClick={() => handleProductClick(product.product_id)}
                    >
                        <div className={styles.productImageWrapper}>
                            <img
                                src={getFullImageUrl(product.product_image_url) || '/default-product.jpg'}
                                alt={product.product_name}
                                className={styles.productImage}
                                onError={(e) => {
                                    e.target.src = '/default-product.jpg';
                                }}
                            />
                        </div>
                        <div className={styles.productInfo}>
                            <div className={styles.productName} title={product.product_name}>
                                {product.product_name}
                            </div>
                            <div className={styles.productPrice}>
                                <span className={styles.currentPrice}>
                                    {formatPrice(finalPrice)}
                                </span>
                                {product.discount > 0 && (
                                    <span className={styles.originalPrice}>
                                        {formatPrice(product.price)}
                                    </span>
                                )}
                                {product.discount > 0 && (
                                    <span className={styles.discountBadge}>
                                        -{product.discount}%
                                    </span>
                                )}
                            </div>
                            <div className={styles.productRating}>
                                {product.avg_rating ? (
                                    <>
                                        <div className={styles.stars}>
                                            {[...Array(5)].map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={`${styles.star} ${i < Math.floor(Number(product.avg_rating))
                                                        ? styles.filled
                                                        : styles.empty
                                                        }`}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <span className={styles.ratingNumber}>
                                            ({Number(product.avg_rating).toFixed(1)})
                                        </span>
                                    </>
                                ) : (
                                    <span className={styles.noRating}>Chưa có đánh giá</span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default DisplayProducts;
