import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { FaTimes, FaUser, FaUserPlus } from 'react-icons/fa';
import styles from './Auth.module.scss';

function Auth({ setLogin, config = {} }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  // Ngăn scroll body khi modal mở
  useEffect(() => {
    // Lưu overflow hiện tại
    const originalOverflow = document.body.style.overflow;

    // Ngăn scroll body
    document.body.style.overflow = 'hidden';

    // Cleanup khi component unmount
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close modal khi click outside
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setLogin(false);
    }
  };

  // Close modal khi nhấn Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setLogin(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [setLogin]);

  try {
    return (
      <div
        className={styles.authOverlay}
        onClick={handleOverlayClick}
      >
        <div className={styles.authContainer}>
          {/* Close Button */}
          <button
            className={styles.authCloseBtn}
            onClick={() => setLogin(false)}
            aria-label="Đóng"
          >
            <FaTimes />
          </button>

          {/* Header */}
          <div className={styles.authHeader}>
            <div className={styles.authLogo}>
              <div className={styles.logoIcon}>
                <span>D</span>
              </div>
              <h2>DNGSON</h2>
            </div>
            <p className={styles.authSubtitle}>
              {isLogin ? 'Chào mừng bạn trở lại!' : 'Tạo tài khoản mới'}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className={styles.authTabs}>
            <button
              className={`${styles.authTab} ${isLogin ? styles.active : ''}`}
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
            >
              <FaUser className={styles.tabIcon} />
              Đăng nhập
            </button>
            <button
              className={`${styles.authTab} ${!isLogin ? styles.active : ''}`}
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
            >
              <FaUserPlus className={styles.tabIcon} />
              Đăng ký
            </button>
          </div>

          {/* Content */}
          <div className={styles.authContent}>
            {error && (
              <div className={styles.authError}>
                <span>{error}</span>
              </div>
            )}

            <div className={styles.authFormContainer}>
              {isLogin ? (
                <LoginForm
                  setLogin={setLogin}
                  config={config}
                  setError={setError}
                />
              ) : (
                <RegisterForm
                  setError={setError}
                  error={error}
                  setLogin={setLogin}
                  setIsLogin={setIsLogin}
                  config={config}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={styles.authFooter}>
            <p>© 2024 DNGSON. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering Auth component:", error);
    return (
      <div className={styles.authOverlay} onClick={handleBackdropClick}>
        <div className={styles.authContainer}>
          <div className={styles.authError}>
            <p>Có lỗi xảy ra khi tải form đăng nhập. Vui lòng thử lại.</p>
            <button onClick={handleClose} className={styles.btnPrimary}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default Auth;
