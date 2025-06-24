import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { ConfigProvider, useConfig } from './contexts/ConfigContext'
import { ToastProvider } from './components/Toast/Toast.jsx'
import Modal from 'react-modal';

Modal.setAppElement('#root');

function Root() {
  return (
    <ConfigProvider>
      <ToastProvider>
        <AuthWrapper />
      </ToastProvider>
    </ConfigProvider>
  );
}

function AuthWrapper() {
  const { config, loading, error } = useConfig();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  }

  if (!config) {
    console.error("Config không có giá trị:", error);
    return <div className="flex justify-center items-center h-screen text-red-500">
      Lỗi khi tải cấu hình ứng dụng. Vui lòng làm mới trang.
    </div>;
  }

  return (
    <StrictMode>
      <GoogleOAuthProvider clientId={config.googleClientId}>
        <App authConfig={config} />
      </GoogleOAuthProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<Root />);
