export { default as Auth } from './Auth';
export { default as LoginForm } from './LoginForm';
export { default as RegisterForm } from './RegisterForm';
export { default as GoogleLoginButton } from './GoogleLoginButton';
export { default as ResetPassword } from './ResetPassword';

// // Trong hàm xử lý login success
// const handleLoginSuccess = (response) => {
//     const { user, token, redirectTo } = response.data;

//     // Lưu thông tin user
//     localStorage.setItem('user', JSON.stringify(user));

//     // Nếu có token (admin), lưu token
//     if (token) {
//         localStorage.setItem('token', token);
//         localStorage.setItem('admin_user', JSON.stringify(user));
//     }

//     // Điều hướng dựa trên redirectTo
//     if (redirectTo === '/admin') {
//         window.location.href = '/admin';
//     } else {
//         window.location.href = '/';
//     }

//     setLogin(false);
// };