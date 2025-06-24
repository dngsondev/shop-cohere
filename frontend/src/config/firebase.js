// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA1-V_redVI3-0k7VTk-VkCIF96C_Ayprk",
    authDomain: "shopquanaocohere.firebaseapp.com",
    projectId: "shopquanaocohere",
    storageBucket: "shopquanaocohere.firebasestorage.app",
    messagingSenderId: "892908208130",
    appId: "1:892908208130:web:73f33cc4633f9f673aa71b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, RecaptchaVerifier };
