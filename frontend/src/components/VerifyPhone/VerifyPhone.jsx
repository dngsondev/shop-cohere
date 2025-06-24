// src/components/PhoneAuth.jsx
import React, { useState } from "react";
import { auth, RecaptchaVerifier } from "../../config/firebase"; // Đảm bảo đường dẫn đúng đến firebase.js
import { signInWithPhoneNumber } from "firebase/auth";

const VerifyPhone = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier("recaptcha-container", {
        size: "invisible",
        callback: () => {
          handleSendOTP(); // gọi lại nếu thành công
        },
      }, auth);
    }
  };

  const handleSendOTP = () => {
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    const formattedPhone = phone.startsWith("+") ? phone : "+84" + phone.slice(1); // ví dụ +84901234567

    signInWithPhoneNumber(auth, formattedPhone, appVerifier)
      .then((result) => {
        setConfirmationResult(result);
        alert("Mã OTP đã được gửi!");
      })
      .catch((error) => {
        console.error("Lỗi gửi OTP:", error);
        alert("Không thể gửi OTP.");
      });
  };

  const handleVerifyOTP = () => {
    if (!confirmationResult) return;

    confirmationResult.confirm(otp)
      .then((result) => {
        setIsVerified(true);
        alert("Xác thực thành công!");
      })
      .catch((error) => {
        alert("Sai mã OTP!");
      });
  };

  return (
    <div>
      <h2>Xác thực số điện thoại</h2>
      {!isVerified ? (
        <>
          <input
            type="text"
            placeholder="Nhập số điện thoại (vd: 0901234567)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={handleSendOTP}>Gửi OTP</button>

          <div id="recaptcha-container"></div>

          <br /><br />

          <input
            type="text"
            placeholder="Nhập mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={handleVerifyOTP}>Xác minh OTP</button>
        </>
      ) : (
        <p style={{ color: "green" }}>Số điện thoại đã được xác minh ✅</p>
      )}
    </div>
  );
};

export default VerifyPhone;
