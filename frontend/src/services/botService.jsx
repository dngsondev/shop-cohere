import axios from 'axios';

// const API_URL = 'http://localhost:5000/api';
const API_URL = import.meta.env.VITE_BACKEND_URL + '/api';

const botService = {
    // API cũ cho sendToCohere
    SendToBot: (input) => axios.post(API_URL + '/sendToCohere', { question: input }),

    // API mới cho sendMessage với context đầy đủ
    sendMessage: (data) => {
        return axios.post(API_URL + '/sendMessage', {
            userId: data.userId,
            productId: data.productId,
            messages: data.messages,
            excludedProductIds: data.excludedProductIds || [] // THÊM DÒNG NÀY
        });
    },

    // API cho question suggestions
    getQuestionSuggestions: (infor) => axios.get(`${API_URL}/getQuestionSuggestions`, {
        params: { message: infor.message },
    }),

    // uploadCommandFile(formData) {
    //     return fetch('/admin/upload-command-file', {
    //         method: 'POST',
    //         body: formData,
    //     }).then(res => res.json());
    // }

    // API cho upload command file
    uploadCommandFile: (formData) => {
        return axios.post(API_URL + '/upload-command-file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    getCommandFiles: () => axios.get(API_URL + '/command-files'),
    deleteCommandFile: (filename) => axios.delete(API_URL + `/command-files/${filename}`)
};

export default botService;