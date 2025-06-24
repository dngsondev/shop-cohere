import { useState, useEffect } from 'react';

export const useUserProductProps = () => {
    const [userId, setUserId] = useState(null);
    const [productId, setProductId] = useState(null);

    //console.log('🎣 useUserProductProps hook called');

    useEffect(() => {
        //console.log('👤 useUserProductProps: Loading user data');

        // Get user from localStorage
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const newUserId = user?.id || null;

            //console.log('👤 User data loaded:', { user, newUserId });
            setUserId(newUserId);
        } catch (error) {
            console.error('❌ Error loading user:', error);
        }

        // Get product from sessionStorage
        try {
            const productStr = sessionStorage.getItem('productId');
            const newProductId = productStr ? JSON.parse(productStr) : null;

            //console.log('📦 Product data loaded:', { productStr, newProductId });
            setProductId(newProductId);
        } catch (error) {
            console.error('❌ Error loading product:', error);
        }
    }, []);

    // Listen for storage changes
    useEffect(() => {
        //console.log('👂 Setting up storage listeners');

        const handleStorageChange = (e) => {
            //console.log('🔄 Storage change detected:', e.key, e.newValue);

            if (e.key === 'user') {
                try {
                    const user = e.newValue ? JSON.parse(e.newValue) : null;
                    const newUserId = user?.id || null;
                    //console.log('👤 User updated via storage:', newUserId);
                    setUserId(newUserId);
                } catch (error) {
                    console.error('❌ Error parsing user from storage:', error);
                }
            }

            if (e.key === 'productId') {
                try {
                    const newProductId = e.newValue ? JSON.parse(e.newValue) : null;
                    //console.log('📦 Product updated via storage:', newProductId);
                    setProductId(newProductId);
                } catch (error) {
                    console.error('❌ Error parsing product from storage:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            //console.log('🧹 Cleaning up storage listeners');
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    //console.log('🎣 useUserProductProps returning:', { userId, productId });

    return { userId, productId };
};
