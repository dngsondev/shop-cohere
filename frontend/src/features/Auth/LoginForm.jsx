import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaSpinner } from "react-icons/fa";
import authService from "../../services/authService";
import GoogleLoginButton from "./GoogleLoginButton";
import ForgotPasswordForm from "./ForgotPasswordForm";
import styles from './Auth.module.scss';

function LoginForm({ setLogin, config, setError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setError("");
    setLoading(true);

    // Validation
    if (!email.trim()) {
      setLocalError("Vui lòng nhập email hoặc tên đăng nhập");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setLocalError("Vui lòng nhập mật khẩu");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting login with:", { email });
      const response = await authService.login(email, password);
      console.log("Login response:", response.data);

      if (response.data.success) {
        const { user, token, redirectTo } = response.data;

        // Lưu thông tin user
        localStorage.setItem('user', JSON.stringify(user));

        // Nếu có token (admin), lưu token
        if (token) {
          localStorage.setItem('token', token);
        }

        setLogin(false);

        // Điều hướng dựa trên redirectTo từ server
        if (redirectTo === '/admin') {
          window.location.href = '/admin';
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.message || "Đăng nhập thất bại!";
      setLocalError(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginForm}>
      {showForgot ? (
        <ForgotPasswordForm setShowForgot={setShowForgot} setError={setError} />
      ) : (
        <form onSubmit={handleLoginSubmit} className={styles.authForm}>
          {/* Email or Username Field */}
          <div className={styles.formGroup}>
            <label htmlFor="login-identity" className={styles.formLabel}>
              Tên đăng nhập / Email
            </label>
            <div className={styles.inputWrapper}>
              <FaEnvelope className={styles.inputIcon} />
              <input
                id="login-identity"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email hoặc tên đăng nhập"
                className={`${styles.formInput} ${localError && !email ? styles.error : ''}`}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="login-password" className={styles.formLabel}>
              Mật khẩu
            </label>
            <div className={styles.inputWrapper}>
              <FaLock className={styles.inputIcon} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
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

          {/* Remember & Forgot */}
          <div className={styles.formOptions}>
            <button
              type="button"
              className={styles.forgotPassword}
              onClick={() => setShowForgot(true)}
            >
              Quên mật khẩu?
            </button>
          </div>

          {/* Error Message */}
          {/* {localError && (
            <div className={styles.authError}>
              <span>{localError}</span>
            </div>
          )} */}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`${styles.btnPrimary} ${loading ? styles.loading : ''}`}
          >
            {loading ? (
              <>
                <FaSpinner className={styles.spinner} />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
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
      )}
    </div>
  );
}

export default LoginForm;