import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Auth } from '../../features/Auth';
import { ChatWindow } from '../../features/Chat';
import authService from '../../services/authService';
import { useUserProductProps } from '../../hooks/useUserProductProps';

import styles from './DefaultLayout.module.scss';

function DefaultLayout({ authConfig }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Debug render count
  const renderCount = useRef(0);
  const prevProps = useRef({});
  const prevState = useRef({});

  renderCount.current += 1;

  const [login, setLogin] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const { userId, productId } = useUserProductProps();

  // THÊM: Auto redirect admin từ homepage
  useEffect(() => {
    // Chỉ chạy khi ở trang chủ
    if (location.pathname === '/') {
      const currentUser = authService.getCurrentUser();
      const hasToken = authService.hasToken();

      // Kiểm tra xem có phải admin không (role = 0 hoặc 1)
      if (currentUser && hasToken && (currentUser.role === 0 || currentUser.role === 1)) {
        console.log('🔄 Admin detected, redirecting to admin panel...');
        navigate('/admin', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  // Debug state changes
  useEffect(() => {
    const currentState = { login, showChat, isChanging, userId, productId };

    // Only log changes after first render
    if (renderCount.current > 1) {
      console.log('🔍 State changes in DefaultLayout:', {
        login: { changed: login !== prevState.current.login, current: login, previous: prevState.current.login },
        showChat: { changed: showChat !== prevState.current.showChat, current: showChat, previous: prevState.current.showChat },
        isChanging: { changed: isChanging !== prevState.current.isChanging, current: isChanging, previous: prevState.current.isChanging },
        userId: { changed: userId !== prevState.current.userId, current: userId, previous: prevState.current.userId },
        productId: { changed: productId !== prevState.current.productId, current: productId, previous: prevState.current.productId }
      });
    }

    prevState.current = currentState;
  }, [login, showChat, isChanging, userId, productId]);

  // Debug props changes
  useEffect(() => {
    const currentProps = {
      authConfig: JSON.stringify(authConfig),
      locationPathname: location.pathname
    };

    if (renderCount.current > 1) {
      console.log('🔍 Props comparison:', {
        authConfig: {
          changed: currentProps.authConfig !== prevProps.current.authConfig,
          current: authConfig,
          previous: prevProps.current.authConfig
        },
        location: {
          changed: location.pathname !== prevProps.current.locationPathname,
          current: location.pathname,
          previous: prevProps.current.locationPathname
        }
      });
    }

    prevProps.current = currentProps;
  }, [authConfig, location.pathname]);

  return (
    <div className={styles.defaultLayout}>
      {/* Header */}
      <Header setLogin={setLogin} />

      {/* Nội dung chính */}
      <main className={styles.defaultLayoutMain}>
        <div className={styles.defaultLayoutContent}>
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      {login && (
        <Auth
          setLogin={setLogin}
          config={authConfig}
        />
      )}

      {/* Chat System - CHỈ CẦN DÒNG NÀY */}
      <ChatWindow
        showChat={showChat}
        setShowChat={setShowChat}
      />
    </div>
  );
}

export default DefaultLayout;
