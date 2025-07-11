import { format } from 'date-fns';

import styles from './CollectionManager.module.scss';

import { getFullImageUrl } from '../../../utils/imageUtils';


function CollectionTable({ collections, loading, updateCollection, deleteCollection }) {

    if (loading) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (!collections.length) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📚</div>
                <h3>Chưa có bộ sưu tập nào</h3>
                <p>Bạn có thể thêm bộ sưu tập mới bằng nút "Thêm bộ sưu tập"</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return 'N/A';
        }
    };

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tên bộ sưu tập</th>
                    <th>Ảnh</th>
                    <th>Mô tả</th>
                    <th>Sản phẩm</th> {/* Thêm cột này */}
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                {collections.map((collection) => (
                    <tr key={collection.collection_id}>
                        <td>{collection.collection_id}</td>
                        <td>{collection.collection_name}</td>
                        <td>
                            {collection.banner_url && (
                                <img
                                    src={getFullImageUrl(collection.banner_url)}
                                    alt={collection.collection_name}
                                    className={styles.previewImage}
                                />
                            )}
                        </td>
                        <td className={styles.descriptionCell}>
                            {collection.description || '—'}
                        </td>
                        <td>
                            {collection.products && collection.products.length > 0
                                ? collection.products.map(p => p.name || p.product_name || p.product_id).join(', ')
                                : '—'}
                        </td>
                        <td>{formatDate(collection.created_at)}</td>
                        <td>
                            <button className={styles.editBtn} onClick={() => updateCollection(collection)}>
                                Sửa
                            </button>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => {
                                    if (window.confirm('Bạn có chắc chắn muốn xóa bộ sưu tập này?')) {
                                        deleteCollection(collection.collection_id);
                                    }
                                }}
                            >
                                Xóa
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default CollectionTable;