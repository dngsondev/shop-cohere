import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../../services/productService';

export const useOrderData = () => {
    const [orderData, setOrderData] = useState(null);
    const [products, setProducts] = useState([]);
    const [userInfo, setUserInfo] = useState({
        delivery_id: null,
        recipient_name: '',
        phone: ''
    });
    const [address, setAddress] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadOrderData = async () => {
            const data = sessionStorage.getItem("orderData");
            console.log("📦 Loading order data from sessionStorage:", data);

            if (!data) {
                navigate('/');
                return;
            }

            try {
                const parsedData = JSON.parse(data);
                console.log("📦 Raw sessionStorage data:", parsedData);

                // Validate order data structure
                if (!parsedData.customerId || !parsedData.items || !Array.isArray(parsedData.items)) {
                    console.error("❌ Invalid order data structure:", parsedData);
                    navigate('/cart');
                    return;
                }

                setOrderData(parsedData);

                // Load địa chỉ mặc định từ localStorage
                const customerData = localStorage.getItem("user");
                const customerInfo = customerData ? JSON.parse(customerData) : null;

                console.log("👤 Customer info:", customerInfo);

                if (customerInfo?.delivery_addresses) {
                    const defaultAddress = customerInfo.delivery_addresses.find(addr => addr.is_being_used === 1);

                    if (defaultAddress) {
                        setUserInfo({
                            delivery_id: defaultAddress.id || defaultAddress.delivery_infor_id,
                            recipient_name: defaultAddress.fullname || defaultAddress.recipient_name || customerInfo.fullname || '',
                            phone: defaultAddress.phone || defaultAddress.phone_number || customerInfo.phone || ''
                        });
                        setAddress(defaultAddress.address || defaultAddress.delivery_address || '');
                    } else {
                        // Fallback to first address or customer info
                        const firstAddress = customerInfo.delivery_addresses[0];
                        if (firstAddress) {
                            setUserInfo({
                                delivery_id: firstAddress.id || firstAddress.delivery_infor_id,
                                recipient_name: firstAddress.fullname || firstAddress.recipient_name || customerInfo.fullname || '',
                                phone: firstAddress.phone || firstAddress.phone_number || customerInfo.phone || ''
                            });
                            setAddress(firstAddress.address || firstAddress.delivery_address || '');
                        } else {
                            // Fallback to customer basic info
                            setUserInfo({
                                delivery_id: null,
                                recipient_name: customerInfo.fullname || customerInfo.customer_fullname || '',
                                phone: customerInfo.phone || ''
                            });
                            setAddress(customerInfo.address || '');
                        }
                    }
                } else {
                    // Fallback to customer basic info
                    setUserInfo({
                        delivery_id: null,
                        recipient_name: customerInfo?.fullname || customerInfo?.customer_fullname || '',
                        phone: customerInfo?.phone || ''
                    });
                    setAddress(customerInfo?.address || '');
                }

                // Load product data
                const fetchProductData = async () => {
                    if (parsedData?.items?.length > 0) {
                        try {
                            console.log("🔍 Loading products for items:", parsedData.items);

                            // Validate items trước khi gọi API
                            const validItems = parsedData.items.filter(item => {
                                if (!item.variantId) {
                                    console.error("❌ Item missing variantId:", item);
                                    return false;
                                }
                                return true;
                            });

                            if (validItems.length === 0) {
                                console.error("❌ No valid items found");
                                navigate('/cart');
                                return;
                            }

                            console.log("✅ Valid items to fetch:", validItems);

                            const productPromises = validItems.map(item => {
                                console.log(`🔍 Fetching product for variantId: ${item.variantId}`);
                                return productService.getProductbyVariantId(item.variantId);
                            });

                            const productResults = await Promise.all(productPromises);
                            console.log("✅ Products loaded successfully:", productResults);

                            // Kết hợp product data với thông tin từ orderData
                            const productData = productResults.map((response, index) => {
                                const orderItem = validItems[index];

                                if (!response.data) {
                                    console.error("❌ Empty product response for item:", orderItem);
                                    return null;
                                }

                                return {
                                    ...response.data,
                                    quantity: orderItem.quantity,
                                    cart_id: orderItem.cartId,
                                    product_id: response.data.product_id,
                                    variant_id: response.data.variant_id,
                                    final_price: response.data.final_price || response.data.price,
                                    product_name: response.data.product_name,
                                    color_name: response.data.color_name,
                                    size_name: response.data.size_name,
                                    image_url: response.data.image_url
                                };
                            }).filter(item => item !== null);

                            console.log("✅ Products loaded with cart_ids:", productData);
                            setProducts(productData);
                        } catch (error) {
                            console.error("❌ Lỗi khi tải dữ liệu sản phẩm:", error);
                            alert("Không thể tải thông tin sản phẩm. Vui lòng thử lại.");
                            navigate('/cart');
                        }
                    }
                };

                fetchProductData();
            } catch (error) {
                console.error("❌ Lỗi khi xử lý dữ liệu đơn hàng:", error);
                navigate('/cart');
            }
        };

        loadOrderData();
    }, [navigate]);

    return {
        orderData,
        products,
        userInfo,
        setUserInfo,
        address,
        setAddress
    };
};