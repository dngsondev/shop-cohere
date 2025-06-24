import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import productService from "../../services/productService";
import ProductCard from "../ProductCard/ProductCard";
import styles from './CollectionProducts.module.scss';

function CollectionProducts() {
    const { id } = useParams();
    const [products, setProducts] = useState([]);
    const [collectionName, setCollectionName] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await productService.getProductsByCollectionId(id);
                // Nếu backend trả về { collection_name, products }
                let items = Array.isArray(res.data.products) ? res.data.products : [];
                items = items.map(product => ({
                    ...product,
                    product_image: product.product_images
                        ? product.product_images.split(",")[0].trim()
                        : ""
                }));
                setProducts(items);
                setCollectionName(res.data.collection_name || "");
            } catch (error) {
                setProducts([]);
                setCollectionName("");
            }
        };
        fetchProducts();
    }, [id]);

    return (
        <div className={styles['collection-wrapper']}>
            <h2 className={styles['collection-title']}>
                Sản phẩm trong bộ sưu tập {collectionName && <span style={{ color: "#16a34a" }}>{collectionName}</span>}
            </h2>
            <div className={styles['product-grid']}>
                {products.map(product => (
                    <div className={styles['product-card']} key={product.product_id}>
                        <ProductCard product={product} to={`/product/${product.product_id}`} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CollectionProducts;