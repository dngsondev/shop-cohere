import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { FaGoogle } from 'react-icons/fa';
import authService from '../../services/authService';
import styles from './Auth.module.scss';

function GoogleLoginButton({ setError, setLogin, config }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");

    try {
      const response = await authService.loginWithGoogle(credentialResponse.credential);

      if (response.data.success) {
        const { user, token } = response.data;

        localStorage.setItem('user', JSON.stringify(user));
        if (token) {
          localStorage.setItem('token', token);
        }

        setLogin(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.response?.data?.message || 'Đăng nhập Google thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Đăng nhập Google thất bại!');
  };

  return (
    <div className={styles.googleLoginWrapper}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        render={(renderProps) => (
          <button
            type="button"
            onClick={renderProps.onClick}
            disabled={renderProps.disabled || loading}
            className={styles.btnGoogle}
          >
            <FaGoogle className={styles.googleIcon} />
            {loading ? 'Đang xử lý...' : 'Đăng nhập với Google'}
          </button>
        )}
      />
    </div>
  );
}

export default GoogleLoginButton;