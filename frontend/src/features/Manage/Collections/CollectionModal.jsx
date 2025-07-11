import React, { useEffect, useState } from 'react';
// import { uploadImage } from '../../../services/uploadService';
import productService from '../../../services/productService'; // Sửa lại import
import styles from './CollectionManager.module.scss';

function CollectionModal({ open, onClose, onSave, initial }) {
    const [form, setForm] = useState({
        name: '',
        image_url: '',
        description: '',
        product_ids: []
    });
    const [products, setProducts] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [preview, setPreview] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // const data = await getAllInfoProducts();
                const res = await productService.getAllProducts();
                setProducts(res.data || []);
            } catch (error) {
                console.error("Không thể tải danh sách sản phẩm:", error);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (initial && open) {
            setForm({
                name: initial.collection_name || '',
                image_url: initial.banner_url || '',
                description: initial.description || '',
                product_ids: initial.product_ids || []
            });
        } else if (open) {
            setForm({
                name: '',
                image_url: '',
                description: '',
                product_ids: []
            });
        }
    }, [initial, open]);

    useEffect(() => {
        if (initial && initial.banner_url) {
            setPreview(initial.banner_url);
        }
    }, [initial]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(prev => ({
                ...prev,
                image_url: file // lưu file để upload
            }));
            setPreview(URL.createObjectURL(file)); // tạo url xem trước
        }
    };

    const handleProductChange = (e) => {
        const productId = Number(e.target.value);

        if (form.product_ids.includes(productId)) {
            setForm(prev => ({
                ...prev,
                product_ids: prev.product_ids.filter(id => id !== productId)
            }));
        } else {
            setForm(prev => ({
                ...prev,
                product_ids: [...prev.product_ids, productId]
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Nếu form.image_url là file mới (File object), upload lên backend trước
        let banner_url = form.image_url;
        if (form.image_url && typeof form.image_url !== 'string') {
            const formData = new FormData();
            formData.append('images', form.image_url);
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/upload/banners`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            banner_url = data.imageUrls[0];
        }
        onSave({
            collection_name: form.name,
            description: form.description,
            banner_url,
            product_ids: form.product_ids,
        });
        onClose();
    };

    const filteredProducts = search
        ? products.filter(p =>
            p.product_name.toLowerCase().includes(search.toLowerCase()) ||
            p.product_id.toString().includes(search)
        )
        : products;

    if (!open) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalTitle}>
                    {initial ? 'Sửa bộ sưu tập' : 'Thêm bộ sưu tập'}
                </div>
                <form onSubmit={handleSubmit} className={styles.formVertical}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Tên bộ sưu tập <span style={{ color: '#ff4d4f' }}>*</span></label>
                        <input
                            id="name"
                            name="name"
                            placeholder="Nhập tên bộ sưu tập"
                            value={form.name}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Ảnh bộ sưu tập <span style={{ color: '#ff4d4f' }}>*</span></label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={styles.input}
                        />
                        {uploading && <span style={{ color: '#1677ff', fontSize: 13, marginTop: 4, display: 'block' }}>Đang tải ảnh...</span>}
                        {preview && (
                            <img
                                src={preview}
                                alt="Ảnh bộ sưu tập"
                                style={{ maxWidth: 200, marginTop: 8 }}
                            />
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mô tả</label>
                        <textarea
                            name="description"
                            placeholder="Nhập mô tả"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Chọn sản phẩm</label>
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc ID sản phẩm..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        <div className={styles.productList}>
                            {filteredProducts.length === 0 && (
                                <div style={{ color: '#888', padding: 8, fontStyle: 'italic' }}>Không có sản phẩm phù hợp</div>
                            )}
                            {filteredProducts.map(p => (
                                <label key={p.product_id} className={styles.productItem}>
                                    <input
                                        type="checkbox"
                                        value={p.product_id}
                                        checked={form.product_ids.includes(p.product_id)}
                                        onChange={handleProductChange}
                                    />
                                    <span>{p.product_name} <span style={{ color: '#aaa', fontSize: 12 }}>#{p.product_id}</span></span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={onClose}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={uploading || !form.name || !form.image_url}
                        >
                            {initial ? 'Lưu' : 'Thêm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CollectionModal;