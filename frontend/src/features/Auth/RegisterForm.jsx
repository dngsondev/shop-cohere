import { useState } from "react";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaSpinner, FaCheckCircle } from "react-icons/fa";
import authService from "../../services/authService";
import GoogleLoginButton from "./GoogleLoginButton";
import styles from './Auth.module.scss';

function RegisterForm({ setError, error, setLogin, setIsLogin, config }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setError("");
    setLoading(true);

    // Validation
    if (!username.trim()) {
      setLocalError("Vui lòng nhập tên người dùng");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setLocalError("Vui lòng nhập email");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setLocalError("Vui lòng nhập mật khẩu");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setLocalError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setLocalError("Vui lòng đồng ý với điều khoản dịch vụ");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.register(username, email, password);

      if (response.data.success) {
        setRegisterSuccess(true);
        setTimeout(() => {
          setIsLogin(true);
        }, 2000);
      }
    } catch (error) {
      console.error("Register error:", error);
      const errorMessage = error.response?.data?.message || "Đăng ký thất bại!";
      setLocalError(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (registerSuccess) {
    return (
      <div className={styles.registerSuccess}>
        <div className={styles.successIcon}>
          <FaCheckCircle />
        </div>
        <h3>Đăng ký thành công!</h3>
        <p>Tài khoản của bạn đã được tạo. Đang chuyển đến trang đăng nhập...</p>
      </div>
    );
  }

  return (
    <div className={styles.registerForm}>
      <form onSubmit={handleRegisterSubmit} className={styles.authForm}>
        {/* Username Field */}
        <div className={styles.formGroup}>
          <label htmlFor="register-username" className={styles.formLabel}>
            Tên người dùng
          </label>
          <div className={styles.inputWrapper}>
            <FaUser className={styles.inputIcon} />
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên người dùng"
              className={`${styles.formInput} ${localError && !username ? styles.error : ''}`}
              disabled={loading}
            />
          </div>
        </div>

        {/* Email Field */}
        <div className={styles.formGroup}>
          <label htmlFor="register-email" className={styles.formLabel}>
            Email
          </label>
          <div className={styles.inputWrapper}>
            <FaEnvelope className={styles.inputIcon} />
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              className={`${styles.formInput} ${localError && !email ? styles.error : ''}`}
              disabled={loading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className={styles.formGroup}>
          <label htmlFor="register-password" className={styles.formLabel}>
            Mật khẩu
          </label>
          <div className={styles.inputWrapper}>
            <FaLock className={styles.inputIcon} />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              className={`${styles.formInput} ${localError && !password ? styles.error : ''}`}
              disabled={loading}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className={styles.formGroup}>
          <label htmlFor="confirm-password" className={styles.formLabel}>
            Xác nhận mật khẩu
          </label>
          <div className={styles.inputWrapper}>
            <FaLock className={styles.inputIcon} />
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className={`${styles.formInput} ${localError && password !== confirmPassword ? styles.error : ''}`}
              disabled={loading}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Terms */}
        <div className={styles.formOptions}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
            Tôi đồng ý với <a href="#" className={styles.link}>Điều khoản dịch vụ</a> và <a href="#" className={styles.link}>Chính sách bảo mật</a>
          </label>
        </div>

        {/* Error Message */}
        {localError && (
          <div className={styles.authError}>
            <span>{localError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`${styles.btnPrimary} ${loading ? styles.loading : ''}`}
        >
          {loading ? (
            <>
              <FaSpinner className={styles.spinner} />
              Đang đăng ký...
            </>
          ) : (
            'Đăng ký'
          )}
        </button>

        {/* Divider */}
        <div className={styles.divider}>
          <span>Hoặc</span>
        </div>

        {/* Google Login */}
        {config && config.googleClientId && (
          <GoogleLoginButton
            setError={setError}
            setLogin={setLogin}
            config={config}
          />
        )}
      </form>
    </div>
  );
}

export default RegisterForm;