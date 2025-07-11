import React, { useEffect, useState } from 'react';
import adminService from '../../../services/adminService';
import productService from '../../../services/productService';
import styles from './VoucherManager.module.scss';
import VoucherModal from './VoucherModal';

function VoucherManager() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editVoucher, setEditVoucher] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [collections, setCollections] = useState([]);

    useEffect(() => {
        fetchVouchers();
        // Lấy dữ liệu để map tên
        productService.getAllProducts().then(res => {
            console.log('products:', res.data?.products || res.data || []); // Xem dữ liệu thực tế

            setProducts(res.data?.products || res.data || []);
        });
        productService.getCategories().then(res => {
            const categories = res.data?.data || res.data || [];
            console.log('categories:', categories); // Xem dữ liệu thực tế
            setCategories(categories);
        });
        productService.getAllBanners?.().then(res => {
            setCollections(res.data?.data || res.data || []);
        });
    }, []);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const res = await adminService.getAllVouchers();
            setVouchers(res.data.vouchers || []);
        } catch (err) {
            console.error('Error fetching vouchers:', err);
            alert('Không thể tải danh sách voucher');
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xóa voucher này?')) return;
        try {
            await adminService.deleteVoucher(id);
            fetchVouchers();
        } catch {
            alert('Không thể xóa voucher');
        }
    };

    const handleAdd = () => {
        setEditVoucher(null);
        setModalOpen(true);
    };

    const handleEdit = (voucher) => {
        setEditVoucher({
            ...voucher,
            valid_from: voucher.valid_from?.slice(0, 10),
            valid_to: voucher.valid_to?.slice(0, 10)
        });
        setModalOpen(true);
    };

    const handleSave = async (data) => {
        try {
            if (editVoucher) {
                await adminService.updateVoucher(editVoucher.voucher_id, data);
            } else {
                await adminService.createVoucher(data);
            }
            setModalOpen(false);
            fetchVouchers();
        } catch {
            alert('Không thể lưu voucher');
        }
    };

    // Hàm lấy tên theo id
    const getProductName = (id) => products.find(p => p.product_id === Number(id))?.product_name || '';
    const getCategoryName = (id) => categories.find(c => c.id === Number(id))?.name || '';
    const getCollectionName = (id) => collections.find(col => col.collection_id === Number(id))?.collection_name || '';

    return (
        <div className={styles.wrapper}>
            <h2 className={styles.title}>Quản lý voucher</h2>
            <button className={styles.addBtn} onClick={handleAdd}>+ Thêm voucher</button>
            <VoucherModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                initial={editVoucher}
            />
            {loading ? (
                <div>Đang tải...</div>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Phần trăm</th>
                            <th>Tiền giảm</th>
                            <th>Miễn phí ship</th>
                            <th>Áp dụng cho</th>
                            <th>Ngày bắt đầu</th>
                            <th>Ngày kết thúc</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vouchers.map(v => (
                            <tr key={v.voucher_id}>
                                <td>{v.voucher_code}</td>
                                <td>{v.voucher_percent}</td>
                                <td>
                                    {v.specific_money
                                        ? Number(v.specific_money).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
                                        : ''}
                                </td>
                                <td>{v.shippingFee ? 'Có' : 'Không'}</td>
                                <td>
                                    {v.product_id
                                        ? getProductName(v.product_id)
                                        : v.category_id
                                            ? getCategoryName(v.category_id)
                                            : v.collection_id
                                                ? getCollectionName(v.collection_id)
                                                : 'Tất cả'}
                                </td>
                                <td>{new Date(v.valid_from).toLocaleDateString('vi-VN')}</td>
                                <td>{new Date(v.valid_to).toLocaleDateString('vi-VN')}</td>
                                <td>
                                    <button
                                        onClick={() => handleEdit(v)}
                                        className={styles.editBtn}
                                    >Sửa</button>
                                    <button
                                        onClick={() => handleDelete(v.voucher_id)}
                                        className={styles.deleteBtn}
                                    >Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default VoucherManager;