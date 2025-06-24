import { useState, useCallback } from 'react';
import productService from '../services/productService';

/**
 * Custom hook để xử lý logic voucher
 */
export const useVoucherHandler = (initialVoucherCode = '', products = []) => {
    const [voucherCode, setVoucherCode] = useState(initialVoucherCode);
    const [voucherInfo, setVoucherInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isValidated, setIsValidated] = useState(false);
    // const [voucherId, setVoucherId] = useState(null);

    /**
     * Định dạng giá tiền
     */
    const formatPrice = useCallback((price) => {
        if (price === undefined || price === null || isNaN(Number(price))) {
            return "0 ₫";
        }

        const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(numericPrice);
    }, []);

    /**
     * Phân loại voucher dựa trên data từ server
     */
    const classifyVoucherType = useCallback((voucherData) => {
        // Clone đối tượng để tránh mutate response trực tiếp
        const processedVoucher = { ...voucherData };
        console.log("Processing voucher data:", processedVoucher);

        // Xử lý voucher_type dựa trên database schema
        if (!processedVoucher.voucher_type) {
            // Kiểm tra voucher có voucher_percent = 100 (miễn phí 100%)
            if (processedVoucher.voucher_percent === 100) {
                processedVoucher.voucher_type = 'percent';
                processedVoucher.voucher_value = 100;
                console.log("Detected 100% discount voucher");
            }
            // Kiểm tra voucher phần trăm khác
            else if (processedVoucher.voucher_percent !== null && processedVoucher.voucher_percent !== undefined && processedVoucher.voucher_percent > 0) {
                processedVoucher.voucher_type = 'percent';
                processedVoucher.voucher_value = processedVoucher.voucher_percent;
            }
            // Kiểm tra voucher số tiền cố định
            else if (processedVoucher.specific_money !== null && processedVoucher.specific_money !== undefined && processedVoucher.specific_money > 0) {
                processedVoucher.voucher_type = 'fixed';
                processedVoucher.voucher_value = processedVoucher.specific_money;
            }
            // Kiểm tra voucher miễn phí vận chuyển
            else if (processedVoucher.shippingFee === 1 || processedVoucher.shippingFee === true) {
                processedVoucher.voucher_type = 'shipping';
                processedVoucher.voucher_value = 100;
            }
            // Fallback cho voucher FREE nếu không xác định được type
            else if (processedVoucher.voucher_code === 'FREE') {
                processedVoucher.voucher_type = 'percent';
                processedVoucher.voucher_percent = 100;
                processedVoucher.voucher_value = 100;
                console.log("Fallback: FREE voucher detected as 100% discount");
            }
            // Fallback cuối cùng
            else {
                console.warn("Cannot determine voucher type from data:", processedVoucher);
                processedVoucher.voucher_type = 'unknown';
            }
        }

        return processedVoucher;
    }, []);

    /**
     * Lọc danh sách sản phẩm phù hợp với voucher
     */
    const getApplicableProducts = useCallback((voucher, productList) => {
        if (!voucher || !productList || productList.length === 0) {
            return [];
        }

        // Nếu voucher không có điều kiện giới hạn sản phẩm/danh mục, áp dụng cho tất cả
        if (!voucher.product_id && !voucher.category_id) {
            return productList;
        }

        // Lọc sản phẩm theo điều kiện
        return productList.filter(product => {
            // Nếu voucher chỉ định product_id
            if (voucher.product_id) {
                return product.product_id === voucher.product_id;
            }

            // Nếu voucher chỉ định category_id
            if (voucher.category_id) {
                return product.category_id === voucher.category_id;
            }

            return true;
        });
    }, []);

    /**
     * Kiểm tra xem tất cả sản phẩm có phù hợp với voucher không
     */
    const isApplicableToProducts = useCallback((voucher) => {
        if (!voucher) return false;

        // Nếu không có product_id hoặc category_id thì áp dụng cho tất cả sản phẩm
        if (!voucher.product_id && !voucher.category_id) return true;

        // Nếu không có sản phẩm nào để kiểm tra
        if (!products || products.length === 0) return false;

        // Kiểm tra xem có sản phẩm nào không phù hợp với voucher không
        const hasInvalidProduct = products.some(product => {
            // Nếu voucher chỉ định product_id cụ thể
            if (voucher.product_id) {
                // Nếu product_id khác với voucher.product_id thì không hợp lệ
                return product.product_id !== voucher.product_id;
            }

            // Nếu voucher chỉ định category_id cụ thể
            if (voucher.category_id) {
                // Nếu category_id khác với voucher.category_id thì không hợp lệ
                return product.category_id !== voucher.category_id;
            }

            return false; // Sản phẩm hợp lệ nếu không có điều kiện nào được áp dụng
        });

        // Nếu có sản phẩm không hợp lệ, trả về false
        return !hasInvalidProduct;
    }, [products]);

    /**
     * Kiểm tra voucher từ API
     */
    const validateVoucher = useCallback(async (code) => {
        if (!code || code.trim() === '') {
            setError("Vui lòng nhập mã giảm giá");
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log("Checking voucher code:", code);
            const response = await productService.checkVoucher(code.trim());
            console.log("Voucher check response:", response.data);

            if (response.data && response.data.valid === true) {
                // Chuẩn hóa dữ liệu voucher
                const processedVoucher = classifyVoucherType(response.data);
                console.log("Processed voucher:", processedVoucher);

                // Kiểm tra xem có sản phẩm nào phù hợp với voucher không
                if (!isApplicableToProducts(processedVoucher)) {
                    setVoucherInfo(null);
                    setError("Voucher này không áp dụng cho sản phẩm trong giỏ hàng!");
                    setIsLoading(false);
                    setIsValidated(false);
                    return false;
                }

                setVoucherInfo(processedVoucher);
                setError(null);
                setIsValidated(true);
                setIsLoading(false);
                return true;
            } else {
                setVoucherInfo(null);
                setError(response.data?.message || "Mã giảm giá không hợp lệ!");
                setIsValidated(false);
            }
        } catch (error) {
            console.error("Error checking voucher:", error);
            setVoucherInfo(null);

            if (error.response) {
                // Server trả về lỗi
                setError(error.response.data?.message || "Mã giảm giá không hợp lệ!");
            } else if (error.request) {
                // Không thể kết nối server
                setError("Không thể kết nối đến server. Vui lòng thử lại!");
            } else {
                // Lỗi khác
                setError("Có lỗi xảy ra khi kiểm tra mã giảm giá");
            }
            setIsValidated(false);
        }

        setIsLoading(false);
        return false;
    }, [classifyVoucherType, isApplicableToProducts]);

    /**
     * Tính tổng giá trị của các sản phẩm được áp dụng voucher
     */
    const calculateApplicableSubtotal = useCallback((voucher, productList) => {
        if (!voucher || !productList || productList.length === 0) {
            return 0;
        }

        // Lấy các sản phẩm áp dụng được voucher
        const applicableProducts = getApplicableProducts(voucher, productList);

        // Tính tổng giá trị của các sản phẩm áp dụng được
        return applicableProducts.reduce((total, product) => {
            // Giả sử mỗi sản phẩm có price và quantity
            const productPrice = parseFloat(product.price || 0);
            const quantity = parseInt(product.quantity || 1, 10);
            return total + (productPrice * quantity);
        }, 0);
    }, [getApplicableProducts]);

    /**
     * Tính toán số tiền giảm giá dựa trên voucher và tổng tiền
     */
    const calculateDiscount = useCallback((subtotal, shipping = 0, productList = products) => {
        console.log("=== CALCULATE DISCOUNT DEBUG ===");
        console.log("Input params:", { subtotal, shipping, voucherInfo, productList: productList?.length });

        if (!voucherInfo || !voucherInfo.valid) {
            console.log("No valid voucher info");
            return {
                productDiscount: 0,
                shippingDiscount: 0,
                finalShipping: shipping,
                totalDiscount: 0,
                applicableSubtotal: subtotal
            };
        }

        // Kiểm tra nếu voucher không áp dụng cho sản phẩm hiện tại
        if (!isApplicableToProducts(voucherInfo)) {
            console.log("Voucher not applicable to products");
            return {
                productDiscount: 0,
                shippingDiscount: 0,
                finalShipping: shipping,
                totalDiscount: 0,
                applicableSubtotal: subtotal,
                error: "Voucher không áp dụng cho sản phẩm này"
            };
        }

        let productDiscount = 0;
        let shippingDiscount = 0;
        let finalShipping = shipping;

        // Tính tổng giá trị sản phẩm được áp dụng voucher
        const applicableSubtotal = calculateApplicableSubtotal(voucherInfo, productList);

        const voucherType = voucherInfo.voucher_type;

        console.log("Calculating discount for:", {
            type: voucherType,
            voucher_percent: voucherInfo.voucher_percent,
            specific_money: voucherInfo.specific_money,
            shippingFee: voucherInfo.shippingFee,
            applicableSubtotal,
            subtotal,
            shipping
        });

        switch (voucherType) {
            case 'percent': {
                const percentValue = parseFloat(voucherInfo.voucher_percent || 0);
                if (!isNaN(percentValue) && percentValue > 0) {
                    // Sử dụng subtotal thay vì applicableSubtotal để đảm bảo tính đúng
                    productDiscount = subtotal * (percentValue / 100);
                    console.log(`Percent discount: ${percentValue}% of ${subtotal} = ${productDiscount}`);
                }
                break;
            }

            case 'fixed': {
                const fixedValue = parseFloat(voucherInfo.specific_money || voucherInfo.voucher_value || 0);
                if (!isNaN(fixedValue) && fixedValue > 0) {
                    // Sử dụng subtotal thay vì applicableSubtotal
                    productDiscount = Math.min(subtotal, fixedValue);
                    console.log(`Fixed discount: min(${subtotal}, ${fixedValue}) = ${productDiscount}`);
                }
                break;
            }

            case 'shipping': {
                // Kiểm tra xem có phải là miễn phí vận chuyển 100% không
                if (voucherInfo.shippingFee === 1 || voucherInfo.shippingFee === true ||
                    voucherInfo.voucher_percent === 100) {
                    shippingDiscount = shipping;
                    finalShipping = 0;
                    console.log(`Free shipping: ${shipping} -> 0`);
                }
                break;
            }

            default: {
                console.warn("Unknown voucher type:", voucherType);

                // Fallback: kiểm tra dựa trên dữ liệu thô
                if (voucherInfo.voucher_percent === 100) {
                    // Nếu voucher_percent = 100, coi như giảm 100% sản phẩm
                    productDiscount = subtotal;
                    console.log(`Fallback: 100% product discount = ${productDiscount}`);
                } else if (voucherInfo.shippingFee === 1) {
                    // Nếu shippingFee = 1, coi như miễn phí vận chuyển
                    shippingDiscount = shipping;
                    finalShipping = 0;
                    console.log(`Fallback: Free shipping = ${shippingDiscount}`);
                }
                break;
            }
        }

        // Làm tròn giá trị giảm giá
        productDiscount = Math.floor(productDiscount);
        shippingDiscount = Math.floor(shippingDiscount);

        const totalDiscount = productDiscount + shippingDiscount;

        console.log("Final discount calculation:", {
            productDiscount,
            shippingDiscount,
            totalDiscount,
            finalShipping
        });

        return {
            productDiscount,
            shippingDiscount,
            finalShipping,
            totalDiscount,
            applicableSubtotal: subtotal
        };
    }, [voucherInfo, isApplicableToProducts, calculateApplicableSubtotal, products]);

    /**
     * Xóa voucher đã áp dụng
     */
    const clearVoucher = useCallback(() => {
        setVoucherCode('');
        setVoucherInfo(null);
        setError(null);
        setIsValidated(false);
    }, []);

    return {
        voucherCode,
        voucherInfo,
        isLoading,
        error,
        isValidated,
        setVoucherCode,
        validateVoucher,
        calculateDiscount,
        clearVoucher,
        formatPrice,
        isApplicableToProducts,
        getApplicableProducts
    };
};