import React, { useEffect, useState } from 'react';
import ProductService from '../../../services/productService';
import CollectionModal from './CollectionModal';
import CollectionTable from './CollectionTable';
import styles from '../Collections/CollectionManager.module.scss';

function CollectionManager() {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editCollection, setEditCollection] = useState(null);

    const fetchCollections = async () => {
        setLoading(true);
        try {
            // DÙNG API BANNER
            const res = await ProductService.getAllBanners();

            setCollections(res.data || []);
        } catch {
            setCollections([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const handleAdd = () => {
        setEditCollection(null);
        setModalOpen(true);
    };

    const handleEdit = (col) => {
        setEditCollection(col);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xóa bộ sưu tập này?')) return;
        try {
            await ProductService.deleteBanner(id);
            fetchCollections();
        } catch {
            alert('Không thể xóa bộ sưu tập');
        }
    };

    const handleSave = async (data) => {
        try {
            if (editCollection) {
                await ProductService.updateBanner(editCollection.collection_id, data);
            } else {
                await ProductService.createCollection(data);
            }
            setModalOpen(false);
            fetchCollections();
        } catch {
            alert('Không thể lưu bộ sưu tập');
        }
    };

    return (
        <div className={styles.wrapper}>
            <h2 className={styles.title}>Quản lý Bộ sưu tập</h2>
            <button className={styles.addBtn} onClick={handleAdd}>+ Thêm bộ sưu tập</button>
            <CollectionTable
                collections={collections}
                loading={loading}
                updateCollection={handleEdit}
                deleteCollection={handleDelete}
            />
            {modalOpen && (
                <CollectionModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    initial={editCollection}
                />
            )}
        </div>
    );
}

export default CollectionManager;