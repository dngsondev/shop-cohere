import axios from 'axios';

// const API_URL = 'http://localhost:5000/api';
const API_URL = import.meta.env.VITE_BACKEND_URL + '/api';

const botService = {
    // API cũ cho sendToCohere
    SendToBot: (input) => axios.post(API_URL + '/sendToCohere', { question: input }),

    // API mới cho sendMessage với context đầy đủ
    sendMessage: (data) => {
        return axios.post(API_URL + '/sendMessage', {
            message: data.message,
            userId: data.userId,
            productId: data.productId
        });
    },

    // API cho question suggestions
    getQuestionSuggestions: (infor) => axios.get(`${API_URL}/getQuestionSuggestions`, {
        params: infor,
    })
};

export default botService;