import React from "react";
import styles from "./ConfirmModal.module.scss";

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = "Đồng ý", cancelText = "Hủy" }) {
    if (!open) return null;
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
                <p className="mb-6">{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;