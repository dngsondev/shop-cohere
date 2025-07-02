import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // console.log("Đang lấy cấu hình từ API...");
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await axios.get(`${backendUrl}/api/config/auth-config`);
        // const response = await axios.get('http://localhost:5000/api/config/auth-config');
        // console.log("Cấu hình nhận được:", response.data);

        // Chỉ quan tâm đến googleClientId, không cần facebookAppId nữa
        if (!response.data?.googleClientId) {
          console.warn("Thiếu thông tin cấu hình từ API:", response.data);

          // Fallback chỉ cần Google Client ID
          setConfig({
            // googleClientId: "1041502436146-04p36jtgk484jtfo48gd8rjl8alpst3b.apps.googleusercontent.com"
            googleClientId: import.meta.env.googleClientId
          });
        } else {
          setConfig(response.data);
        }
      } catch (err) {
        console.error('Không thể lấy cấu hình:', err);
        setError(err);

        // Fallback khi có lỗi
        setConfig({
          googleClientId: import.meta.env.googleClientId
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const contextValue = {
    config,
    loading,
    error
  };

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}