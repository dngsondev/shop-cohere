import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import authService from "../../services/authService";
import styles from './Auth.module.scss';

function ResetPassword() {
    const [params] = useSearchParams();
    const email = params.get("email");
    const token = params.get("token");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        if (newPassword !== confirm) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }
        setLoading(true);
        try {
            const res = await authService.resetPassword(email, token, newPassword);
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể đặt lại mật khẩu!");
        } finally {
            setLoading(false);
        }
    };

    if (!email || !token) return <div>Link không hợp lệ hoặc đã hết hạn.</div>;

    return (
        <form onSubmit={handleReset} className={styles.authForm} style={{ maxWidth: 400, margin: "40px auto" }}>
            <h2>Đặt lại mật khẩu</h2>
            <div className={styles.formGroup}>
                <label>Mật khẩu mới</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className={styles.formInput}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label>Xác nhận mật khẩu mới</label>
                <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={styles.formInput}
                    required
                />
            </div>
            {error && <div className={styles.authError}>{error}</div>}
            {message && <div className={styles.authError} style={{ color: "green" }}>{message}</div>}
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </button>
        </form>
    );
}

export default ResetPassword;