import React, { useState, useEffect } from 'react';
import styles from './VoucherManager.module.scss';
import productService from '../../../services/productService';

function VoucherModal({ open, onClose, onSave, initial }) {
    const [type, setType] = useState('');
    const [form, setForm] = useState({
        voucher_code: '',
        voucher_percent: '',
        specific_money: '',
        shippingFee: 0,
        valid_from: '',
        valid_to: ''
    });
    const [scope, setScope] = useState('all');
    const [scopeValue, setScopeValue] = useState('');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [collections, setCollections] = useState([]);

    useEffect(() => {
        if (open) {
            // Lấy sản phẩm
            productService.getAllProducts()
                .then(res => {
                    // Nếu trả về { data: { products: [...] } }
                    const products = res.data?.products || res.data || [];
                    setProducts(products);
                })
                .catch(() => setProducts([]));
            // Lấy loại sản phẩm
            productService.getCategories()
                .then(res => {
                    const categories = res.data?.data || res.data || [];
                    setCategories(categories);
                })
                .catch(() => setCategories([]));
            // Lấy bộ sưu tập
            productService.getAllBanners()
                .then(res => {
                    // console.log('Banners:', res.data);
                    const collections = res.data?.data || res.data || [];
                    setCollections(collections);
                })
                .catch(() => setCollections([]));
        }
    }, [open]);

    useEffect(() => {
        if (initial) {
            // Xác định loại voucher từ initial
            let detectedType = '';
            if (Number(initial.voucher_percent) > 0) detectedType = 'percent';
            else if (Number(initial.specific_money) > 0) detectedType = 'money';
            else if (Number(initial.shippingFee) === 1) detectedType = 'ship';
            setType(detectedType);

            // Xác định phạm vi từ initial
            let detectedScope = 'all';
            let detectedValue = '';
            if (initial.product_id) {
                detectedScope = 'product';
                detectedValue = initial.product_id;
            } else if (initial.category_id) {
                detectedScope = 'category';
                detectedValue = initial.category_id;
            } else if (initial.collection_id) {
                detectedScope = 'collection';
                detectedValue = initial.collection_id;
            }
            setScope(detectedScope);
            setScopeValue(detectedValue);

            setForm({
                voucher_code: initial.voucher_code || '',
                voucher_percent: initial.voucher_percent || '',
                specific_money: initial.specific_money || '',
                shippingFee: initial.shippingFee || 0,
                valid_from: initial.valid_from || '',
                valid_to: initial.valid_to || ''
            });
        } else {
            setType('');
            setScope('all');
            setScopeValue('');
            setForm({
                voucher_code: '',
                voucher_percent: '',
                specific_money: '',
                shippingFee: 0,
                valid_from: '',
                valid_to: ''
            });
        }
    }, [initial, open]);

    const handleChange = e => {
        const { name, value, type: inputType } = e.target;
        setForm(f => ({
            ...f,
            [name]: inputType === 'number' ? Number(value) : value
        }));
    };

    const handleTypeClick = val => {
        setType(val);
        setForm(f => ({
            ...f,
            voucher_percent: '',
            specific_money: '',
            shippingFee: val === 'ship' ? 1 : 0
        }));
    };

    const handleSubmit = e => {
        e.preventDefault();
        if (!type) {
            alert('Vui lòng chọn loại voucher!');
            return;
        }
        if (type === 'percent' && !form.voucher_percent) {
            alert('Nhập phần trăm giảm!');
            return;
        }
        if (type === 'money' && !form.specific_money) {
            alert('Nhập số tiền giảm!');
            return;
        }
        let scopeData = {};
        if (scope === 'product') scopeData.product_id = scopeValue;
        else if (scope === 'category') scopeData.category_id = scopeValue;
        else if (scope === 'collection') scopeData.collection_id = scopeValue;

        // Chuyển các giá trị rỗng hoặc không hợp lệ thành null
        const data = {
            ...form,
            voucher_percent: type === 'percent' ? Number(form.voucher_percent) || null : null,
            specific_money: type === 'money' ? Number(form.specific_money) || null : null,
            shippingFee: type === 'ship' ? 1 : 0,
            valid_from: form.valid_from || null,
            valid_to: form.valid_to || null,
            voucher_code: form.voucher_code || null,
            ...scopeData
        };

        // Nếu không chọn phạm vi thì các id phải là null
        if (scope !== 'product') data.product_id = null;
        if (scope !== 'category') data.category_id = null;
        if (scope !== 'collection') data.collection_id = null;

        onSave(data);
    };

    if (!open) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3>{initial ? 'Sửa voucher' : 'Thêm voucher'}</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        name="voucher_code"
                        value={form.voucher_code}
                        onChange={handleChange}
                        placeholder="Mã voucher"
                        required
                    />
                    <div className={styles.typeGroup}>
                        <button
                            type="button"
                            className={type === 'percent' ? styles.typeBtnActive : styles.typeBtn}
                            onClick={() => handleTypeClick('percent')}
                        >
                            Phần trăm (%)
                        </button>
                        <button
                            type="button"
                            className={type === 'money' ? styles.typeBtnActive : styles.typeBtn}
                            onClick={() => handleTypeClick('money')}
                        >
                            Giảm tiền cố định
                        </button>
                        <button
                            type="button"
                            className={type === 'ship' ? styles.typeBtnActive : styles.typeBtn}
                            onClick={() => handleTypeClick('ship')}
                        >
                            Miễn phí ship
                        </button>
                    </div>
                    {type === 'percent' && (
                        <input
                            name="voucher_percent"
                            type="number"
                            value={form.voucher_percent}
                            onChange={handleChange}
                            placeholder="Phần trăm giảm (%)"
                            min={1}
                            max={100}
                            required
                        />
                    )}
                    {type === 'money' && (
                        <input
                            name="specific_money"
                            type="number"
                            value={form.specific_money}
                            onChange={handleChange}
                            placeholder="Tiền giảm (VNĐ)"
                            min={1}
                            required
                        />
                    )}
                    <input
                        name="valid_from"
                        type="date"
                        value={form.valid_from}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="valid_to"
                        type="date"
                        value={form.valid_to}
                        onChange={handleChange}
                        required
                    />
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>Phạm vi áp dụng</label>
                        <select
                            value={scope}
                            onChange={e => {
                                setScope(e.target.value);
                                setScopeValue('');
                            }}
                            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #d1d5db', marginBottom: 8 }}
                        >
                            <option value="all">Tất cả sản phẩm</option>
                            <option value="product">Sản phẩm cụ thể</option>
                            <option value="category">Loại sản phẩm</option>
                            <option value="collection">Bộ sưu tập</option>
                        </select>
                        {scope !== 'all' && (
                            <>
                                {scope === 'product' && (
                                    <select
                                        value={scopeValue}
                                        onChange={e => setScopeValue(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #d1d5db' }}
                                    >
                                        <option value="">Chọn sản phẩm</option>
                                        {products.map(p => (
                                            <option key={p.product_id} value={p.product_id}>
                                                {p.product_name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {scope === 'category' && (
                                    <select
                                        value={scopeValue}
                                        onChange={e => setScopeValue(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #d1d5db' }}
                                    >
                                        <option value="">Chọn loại sản phẩm</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {scope === 'collection' && (
                                    <select
                                        value={scopeValue}
                                        onChange={e => setScopeValue(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #d1d5db' }}
                                    >
                                        <option value="">Chọn bộ sưu tập</option>
                                        {collections.map(col => (
                                            <option key={col.id} value={col.id}>
                                                {col.collection_name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </>
                        )}
                    </div>
                    <div className={styles.modalActions}>
                        <button type="submit">{initial ? 'Lưu' : 'Thêm'}</button>
                        <button type="button" onClick={onClose}>Huỷ</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default VoucherModal;