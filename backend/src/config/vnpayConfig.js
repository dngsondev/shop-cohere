import dotenv from 'dotenv';
dotenv.config();

// export default {
//     vnp_TmnCode: '0LRQI5LX',
//     vnp_HashSecret: 'VOBGTICKAG2C2V8FLE6BRL1MFFEHF0K2',
//     vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
//     vnp_ReturnUrl: 'http://localhost:5173/order/vnpay-result',
// };

function joinUrl(base, path) {
    if (base.endsWith('/')) base = base.slice(0, -1);
    if (!path.startsWith('/')) path = '/' + path;
    return base + path;
}

export default {
    vnp_TmnCode: process.env.VNP_TMNCODE,
    vnp_HashSecret: process.env.VNP_HASHSECRET,
    vnp_Url: process.env.VNP_URL,
    //vnp_ReturnUrl: process.env.FRONTEND_URL + 'order/vnpay-result',
    vnp_ReturnUrl: joinUrl(process.env.FRONTEND_URL, '/order/vnpay-result'),
};