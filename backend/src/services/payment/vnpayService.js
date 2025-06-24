import crypto from 'crypto';
import querystring from 'qs';
import vnpayConfig from '../../config/vnpayConfig.js';

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        // SỬA LỖI: str[key] thay vì obj[str[key]]
        sorted[str[key]] = encodeURIComponent(obj[decodeURIComponent(str[key])]).replace(/%20/g, "+");
    }
    return sorted;
}

export function createVnpayUrl(orderData) {
    console.log("🔥 CREATE: Starting createVnpayUrl");

    let date = new Date();
    const createDate = date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2) +
        ('0' + date.getSeconds()).slice(-2);

    const orderId = orderData.order_id || `${Date.now()}`;
    const amount = parseInt(orderData.total_amount);

    let orderInfo = `Thanh toan don hang #${orderId}`;
    let orderType = 'other';
    let locale = 'vn';
    let currCode = 'VND';

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId.toString(); // Đảm bảo string
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = orderType;
    vnp_Params['vnp_Amount'] = (amount * 100).toString(); // Đảm bảo string
    vnp_Params['vnp_ReturnUrl'] = `${vnpayConfig.vnp_ReturnUrl}?orderId=${orderId}`;
    vnp_Params['vnp_IpAddr'] = '127.0.0.1';
    vnp_Params['vnp_CreateDate'] = createDate;

    console.log("🔥 CREATE: Raw params:", vnp_Params);

    vnp_Params = sortObject(vnp_Params);
    console.log("🔥 CREATE: Sorted params:", vnp_Params);

    let signData = querystring.stringify(vnp_Params, { encode: false });
    console.log("🔥 CREATE: Sign data:", signData);

    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    console.log("🔥 CREATE: Generated signature:", signed);

    vnp_Params['vnp_SecureHash'] = signed;

    let paymentUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
    console.log("🔥 CREATE: Final URL:", paymentUrl);

    return paymentUrl;
}

export function verifyReturnUrl(vnpayParams) {
    console.log("🔥 VERIFY: Starting verification");
    console.log("🔥 VERIFY: Raw params:", vnpayParams);

    try {
        // Tạo bản sao để không thay đổi object gốc
        let vnpParamsCopy = { ...vnpayParams };

        // Xác thực chữ ký từ VNPay
        let secureHash = vnpParamsCopy['vnp_SecureHash'];

        // Xóa các params không cần thiết
        delete vnpParamsCopy['vnp_SecureHash'];
        delete vnpParamsCopy['vnp_SecureHashType'];
        delete vnpParamsCopy['orderId']; // Custom param của chúng ta

        console.log("🔥 VERIFY: Params after cleanup:", vnpParamsCopy);

        // Sort params giống như lúc tạo
        vnpParamsCopy = sortObject(vnpParamsCopy);
        console.log("🔥 VERIFY: Sorted params:", vnpParamsCopy);

        let signData = querystring.stringify(vnpParamsCopy, { encode: false });
        console.log("🔥 VERIFY: Sign data:", signData);

        let hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        console.log("🔥 VERIFY: Calculated hash:", signed);
        console.log("🔥 VERIFY: Received hash:  ", secureHash);
        console.log("🔥 VERIFY: Hashes match:", signed === secureHash);

        // Lấy thông tin cần thiết
        let orderId, responseCode;

        // Tìm kiếm trong params đã encoded
        for (let key in vnpParamsCopy) {
            if (key.includes('vnp_TxnRef')) {
                orderId = decodeURIComponent(vnpParamsCopy[key]);
            }
            if (key.includes('vnp_ResponseCode')) {
                responseCode = decodeURIComponent(vnpParamsCopy[key]);
            }
        }

        return {
            isValid: secureHash === signed,
            orderId: orderId || 'unknown',
            transactionStatus: responseCode || 'unknown'
        };

    } catch (error) {
        console.error("🔥 VERIFY: Error:", error);
        return {
            isValid: false,
            orderId: 'unknown',
            transactionStatus: 'unknown'
        };
    }
}