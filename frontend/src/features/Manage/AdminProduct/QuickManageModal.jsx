import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import styles from "./QuickManageModal.module.scss";

// type: 'brand' | 'category' | 'color' | 'material' | 'size' | 'target'
const LABELS = {
    brand: "Thương hiệu",
    category: "Danh mục",
    color: "Màu sắc",
    material: "Chất liệu",
    size: "Kích thước",
    target: "Đối tượng"
};

function QuickManageModal({ type, isOpen, onClose, fetchApi, createApi, updateApi, deleteApi }) {
    const [items, setItems] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: "", code: "" });
    const [loading, setLoading] = useState(false);

    // Fetch data
    useEffect(() => {
        if (isOpen) fetchItems();
        // eslint-disable-next-line
    }, [isOpen]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetchApi();
            setItems(Array.isArray(res.data) ? res.data : res.data?.data || []);
            console.log(`Fetched ${type} items:`, res.data);
        } catch (e) {
            alert("Không thể tải dữ liệu");
            setItems([]);
        }
        setLoading(false);
    };

    const handleEdit = (item) => {
        setEditing(item);
        setForm({
            name: item[`${type}_name`] || "",
            code: item.color_code || ""
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xác nhận xoá?")) return;
        setLoading(true);
        try {
            await deleteApi(id);
            fetchItems();
        } catch {
            alert("Xoá thất bại");
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editing) {
                await updateApi(editing[`${type}_id`], form);
            } else {
                await createApi(form);
            }
            setEditing(null);
            setForm({ name: "", code: "" });
            fetchItems();
        } catch {
            alert("Lưu thất bại");
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>
                <h2>Quản lý {LABELS[type]}</h2>
                <form onSubmit={handleSubmit} style={{ margin: "1rem 0" }}>
                    <input
                        type="text"
                        placeholder={`Tên ${LABELS[type]}`}
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                    />
                    {type === "color" && (
                        <input
                            type="color"
                            value={form.code}
                            onChange={e => setForm({ ...form, code: e.target.value })}
                            style={{ width: 40, height: 40, marginLeft: 8 }}
                        />
                    )}
                    <button type="submit" className={styles.adminProduct__btn}>
                        {editing ? "Cập nhật" : "Thêm mới"}
                    </button>
                    {editing && (
                        <button type="button" className={styles.adminProduct__btn} onClick={() => { setEditing(null); setForm({ name: "", code: "" }); }}>
                            Huỷ
                        </button>
                    )}
                </form>
                {loading ? <p>Đang tải...</p> : (
                    <table style={{ width: "100%", background: "#fff" }}>
                        <thead>
                            <tr>
                                <th className={styles.textCenter}>ID</th>
                                <th className={styles.textCenter}>Tên</th>
                                {type === "color" && <th className={styles.textCenter}>Mã màu</th>}
                                <th className={styles.textCenter}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item[`${type}_id`]}>
                                    <td className={styles.textCenter}>{item[`${type}_id`]}</td>
                                    <td className={styles.textCenter}>{item[`${type}_name`]}</td>
                                    {type === "color" && (
                                        <td className={styles.textCenter}>
                                            <span style={{
                                                display: "inline-block",
                                                width: 24,
                                                height: 24,
                                                background: item.color_code,
                                                border: "1px solid #ccc"
                                            }} title={item.color_code}></span>
                                            <span style={{ marginLeft: 8 }}>{item.color_code}</span>
                                        </td>
                                    )}
                                    <td className={styles.textCenter}>
                                        <button
                                            className={styles.actionBtn}
                                            title="Sửa"
                                            onClick={() => handleEdit(item)}
                                            type="button"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                            title="Xoá"
                                            onClick={() => handleDelete(item[`${type}_id`])}
                                            type="button"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default QuickManageModal;