import { useState } from "react";
import authService from "../../services/authService";
import styles from './Auth.module.scss';

function ForgotPasswordForm({ setShowForgot, setError }) {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showReset, setShowReset] = useState(false);

    // Thêm state cho OTP và mật khẩu mới
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [resetMsg, setResetMsg] = useState("");
    const [resetErr, setResetErr] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);
        try {
            const res = await authService.forgotPassword(email);
            setMessage(res.data.message);
            setShowReset(true);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể gửi email!");
        } finally {
            setLoading(false);
        }
    };

    // Xử lý xác nhận OTP và đặt lại mật khẩu
    const handleReset = async (e) => {
        e.preventDefault();
        setResetErr("");
        setResetMsg("");
        if (newPassword !== confirm) {
            setResetErr("Mật khẩu xác nhận không khớp");
            return;
        }
        if (otp.length !== 6) {
            setResetErr("Vui lòng nhập đủ 6 số OTP");
            return;
        }
        setLoading(true);
        try {
            const res = await authService.resetPassword(email, otp, newPassword);
            setResetMsg(res.data.message);
        } catch (err) {
            setResetErr(err.response?.data?.message || "Không thể đặt lại mật khẩu!");
        } finally {
            setLoading(false);
        }
    };

    if (showReset) {
        return (
            <form onSubmit={handleReset} className={styles.authForm}>
                <div className={styles.formGroup}>
                    <label>Nhập mã OTP (6 số gửi về email)</label>
                    <input
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={styles.formInput}
                        required
                        maxLength={6}
                        pattern="\d{6}"
                        inputMode="numeric"
                    />
                </div>
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
                {resetErr && <div className={styles.authError}>{resetErr}</div>}
                {resetMsg && <div className={styles.authError} style={{ color: "green" }}>{resetMsg}</div>}
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                    {loading ? "Đang đặt lại..." : "Xác nhận & Đặt lại mật khẩu"}
                </button>
                <button type="button" className={styles.btnPrimary} style={{ marginTop: 8 }} onClick={() => setShowForgot(false)}>
                    Quay lại đăng nhập
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.formGroup}>
                <label htmlFor="forgot-email" className={styles.formLabel}>
                    Nhập email để đặt lại mật khẩu
                </label>
                <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={styles.formInput}
                    required
                />
            </div>
            {message && <div className={styles.authError} style={{ color: "green" }}>{message}</div>}
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi email"}
            </button>
            <button type="button" className={styles.btnPrimary} style={{ marginTop: 8 }} onClick={() => setShowForgot(false)}>
                Quay lại đăng nhập
            </button>
        </form>
    );
}

export default ForgotPasswordForm;